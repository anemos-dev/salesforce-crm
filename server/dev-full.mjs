import { spawn } from 'node:child_process'

const children = [
  spawn('node', ['server/crm-api.mjs'], { stdio: 'inherit' }),
  spawn('npm', ['run', 'dev:app', '--', '--host', '127.0.0.1'], { stdio: 'inherit' }),
]

for (const child of children) {
  child.on('exit', (code) => {
    if (code && code !== 0) process.exitCode = code
    for (const other of children) {
      if (other !== child && !other.killed) other.kill('SIGTERM')
    }
  })
}

process.on('SIGINT', () => {
  for (const child of children) child.kill('SIGINT')
})

process.on('SIGTERM', () => {
  for (const child of children) child.kill('SIGTERM')
})
