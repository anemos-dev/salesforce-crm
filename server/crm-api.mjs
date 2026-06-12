import { createServer } from 'node:http'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = resolve(rootDir, 'data/workspace.json')
const backupDir = resolve(rootDir, 'data/backups')
const port = Number(process.env.CRM_API_PORT ?? 8787)
let writeQueue = Promise.resolve()

const users = [
  { id: 'u-admin', name: '管理者', role: 'admin', pin: '0000', token: 'token-admin' },
  { id: 'u-sales', name: '営業マネージャー', role: 'sales_manager', pin: '1111', token: 'token-sales' },
  { id: 'u-support', name: 'サポート担当', role: 'support_agent', pin: '2222', token: 'token-support' },
  { id: 'u-viewer', name: '閲覧者', role: 'viewer', pin: '3333', token: 'token-viewer' },
]

const server = createServer(async (request, response) => {
  try {
    applyCors(response)
    if (request.method === 'OPTIONS') {
      response.writeHead(204)
      response.end()
      return
    }

    const url = new URL(request.url, `http://${request.headers.host}`)
    if (url.pathname === '/api/health' && request.method === 'GET') {
      sendJson(response, 200, { ok: true, storage: dataPath })
      return
    }

    if (url.pathname === '/api/session' && request.method === 'POST') {
      const credentials = await readJsonBody(request)
      const user = users.find((item) => item.id === credentials.userId && item.pin === credentials.pin)
      if (!user) {
        sendJson(response, 401, { error: 'Invalid credentials' })
        return
      }
      sendJson(response, 200, { token: user.token, user: publicUser(user) })
      return
    }

    if (url.pathname === '/api/workspace' && request.method === 'GET') {
      const user = authenticate(request)
      if (!user) {
        sendJson(response, 401, { error: 'Authentication required' })
        return
      }
      const workspace = await readWorkspace()
      sendJson(response, 200, workspace, versionHeaders(workspace))
      return
    }

    if (url.pathname === '/api/workspace' && request.method === 'PUT') {
      const user = authenticate(request)
      if (!user) {
        sendJson(response, 401, { error: 'Authentication required' })
        return
      }
      if (!canWrite(user)) {
        sendJson(response, 403, { error: 'Write permission denied' })
        return
      }
      const workspace = await readJsonBody(request)
      if (!isValidWorkspace(workspace)) {
        sendJson(response, 422, { error: 'Invalid workspace payload' })
        return
      }
      const result = await enqueueWrite(workspace, request.headers['x-workspace-version'])
      sendJson(response, 200, {
        ok: true,
        workspace: result.workspace,
        savedAt: result.workspace._meta.updatedAt,
        savedBy: publicUser(user),
      }, versionHeaders(result.workspace))
      return
    }

    sendJson(response, 404, { error: 'Not found' })
  } catch (error) {
    if (error.status === 409) {
      sendJson(response, 409, { error: error.message, currentVersion: error.currentVersion })
      return
    }
    console.error(error)
    sendJson(response, error.status ?? 500, { error: error.message })
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Asteria CRM API listening on http://127.0.0.1:${port}`)
})

async function readWorkspace() {
  const raw = await readFile(dataPath, 'utf8')
  const workspace = normalizeWorkspace(JSON.parse(raw))
  if (!isValidWorkspace(workspace)) {
    throw new Error('Stored workspace is invalid')
  }
  return workspace
}

async function writeWorkspace(workspace) {
  await mkdir(dirname(dataPath), { recursive: true })
  await mkdir(backupDir, { recursive: true })
  const previous = await readFile(dataPath, 'utf8').catch(() => '')
  if (previous) {
    const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
    await writeFile(resolve(backupDir, `workspace-${stamp}.json`), previous)
  }
  const tmpPath = `${dataPath}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tmpPath, `${JSON.stringify(workspace, null, 2)}\n`)
  await rename(tmpPath, dataPath)
}

async function enqueueWrite(workspace, expectedVersion) {
  const write = writeQueue.then(async () => {
    const current = await readWorkspace()
    const currentVersion = current._meta.version
    if (Number(expectedVersion) !== currentVersion) {
      const error = new Error('Workspace version conflict')
      error.status = 409
      error.currentVersion = currentVersion
      throw error
    }
    const nextWorkspace = normalizeWorkspace({
      ...workspace,
      _meta: {
        version: currentVersion + 1,
        updatedAt: new Date().toISOString(),
      },
    })
    await writeWorkspace(nextWorkspace)
    return { workspace: nextWorkspace }
  })
  writeQueue = write.catch(() => {})
  return write
}

function normalizeWorkspace(workspace) {
  return {
    ...workspace,
    _meta: {
      version: Number.isInteger(workspace?._meta?.version) ? workspace._meta.version : 1,
      updatedAt: typeof workspace?._meta?.updatedAt === 'string' ? workspace._meta.updatedAt : new Date().toISOString(),
    },
  }
}

function isValidWorkspace(value) {
  return Boolean(
    value &&
    Array.isArray(value.accounts) &&
    Array.isArray(value.opportunities) &&
    Array.isArray(value.cases) &&
    Array.isArray(value.campaigns) &&
    Array.isArray(value.auditLog) &&
    typeof value.selectedAccountId === 'string' &&
    typeof value.selectedStage === 'string' &&
    typeof value.selectedCampaign === 'string',
  )
}

function authenticate(request) {
  const header = request.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : request.headers['x-crm-token']
  return users.find((user) => user.token === token)
}

function canWrite(user) {
  return ['admin', 'sales_manager', 'support_agent'].includes(user.role)
}

function publicUser(user) {
  return { id: user.id, name: user.name, role: user.role }
}

async function readJsonBody(request) {
  let body = ''
  for await (const chunk of request) {
    body += chunk
    if (body.length > 2_000_000) throw new Error('Payload too large')
  }
  return JSON.parse(body)
}

function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  })
  response.end(JSON.stringify(payload))
}

function versionHeaders(workspace) {
  return {
    etag: `"workspace-${workspace._meta.version}"`,
    'x-workspace-version': String(workspace._meta.version),
  }
}

function applyCors(response) {
  response.setHeader('access-control-allow-origin', 'http://127.0.0.1:5173')
  response.setHeader('access-control-allow-methods', 'GET,POST,PUT,OPTIONS')
  response.setHeader('access-control-allow-headers', 'content-type,authorization,x-crm-token,x-workspace-version')
  response.setHeader('access-control-expose-headers', 'etag,x-workspace-version')
}
