import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Contact,
  Download,
  FileText,
  Gauge,
  Headphones,
  LineChart,
  Megaphone,
  MoreHorizontal,
  PanelLeft,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Users,
  Zap,
} from 'lucide-react'
import './App.css'

const STORAGE_KEY = 'asteria-crm-workspace-v2'
const SESSION_KEY = 'asteria-crm-session-v1'
const API_ENDPOINT = '/api/workspace'
const SESSION_ENDPOINT = '/api/session'
const demoUsers = [
  { id: 'u-admin', name: '管理者', role: 'admin', pin: '0000' },
  { id: 'u-sales', name: '営業マネージャー', role: 'sales_manager', pin: '1111' },
  { id: 'u-support', name: 'サポート担当', role: 'support_agent', pin: '2222' },
  { id: 'u-viewer', name: '閲覧者', role: 'viewer', pin: '3333' },
]

const navItems = [
  { label: 'ダッシュボード', icon: Gauge, title: '顧客と売上の統合ワークスペース', description: '検索、商談更新、ケース対応、活動記録、CSV出力まで1画面で回せます。' },
  { label: 'リード', icon: Users, title: 'リード管理', description: '獲得元、スコア、担当、次アクションを確認して営業へ引き渡します。' },
  { label: '取引先', icon: Building2, title: '取引先管理', description: '顧客の健全性、契約更新、未解決ケース、担当状況を横断して確認します。' },
  { label: '商談', icon: CircleDollarSign, title: '商談管理', description: 'パイプライン、確度、リスク、完了予定日を更新して売上見込みを管理します。' },
  { label: 'ケース', icon: Headphones, title: 'ケース管理', description: 'SLA、優先度、対応状況を見ながら問い合わせ対応を進めます。' },
  { label: 'キャンペーン', icon: Megaphone, title: 'キャンペーン管理', description: '施策別のリード数、転換率、費用、営業渡し数を確認します。' },
  { label: 'レポート', icon: LineChart, title: 'レポート', description: '売上、商談、サポート、マーケティングのKPIを経営向けに整理します。' },
  { label: 'Agentforce', icon: Bot, title: 'Agentforce', description: 'CRMデータをもとに、今日の優先アクションとリスクを提示します。' },
]

const initialState = {
  _meta: {
    version: 1,
    updatedAt: '2026-06-12T00:00:00+09:00',
  },
  selectedAccountId: 'acct-1',
  selectedStage: 'すべて',
  selectedCampaign: 'camp-1',
  auditLog: [
    { time: '12:30', text: '夏期ウェビナーの参加者リストを更新', type: 'campaign' },
    { time: '11:05', text: 'ケース C-1842 を請求チームへエスカレーション', type: 'case' },
    { time: '10:15', text: 'Agentforceが高リスク商談を3件検出', type: 'ai' },
    { time: '09:40', text: '森田が東都ロジスティクスへ提案書を送付', type: 'opportunity' },
  ],
  accounts: [
    {
      id: 'acct-1',
      name: '東都ロジスティクス',
      initials: 'TL',
      industry: '物流',
      owner: '森田',
      revenue: '¥42.0B',
      employees: '1,250名',
      health: 86,
      nps: 48,
      renewal: '2026年9月',
      order: '¥4.2M',
      website: 'https://toto-logi.example.jp',
    },
    {
      id: 'acct-2',
      name: '南青山リテール',
      initials: 'MR',
      industry: '小売',
      owner: '安藤',
      revenue: '¥18.4B',
      employees: '720名',
      health: 78,
      nps: 41,
      renewal: '2026年7月',
      order: '¥2.8M',
      website: 'https://minamiaoyama.example.jp',
    },
    {
      id: 'acct-3',
      name: '北辰メディカル',
      initials: 'HM',
      industry: '医療',
      owner: '佐伯',
      revenue: '¥31.8B',
      employees: '980名',
      health: 64,
      nps: 31,
      renewal: '2026年11月',
      order: '¥3.1M',
      website: 'https://hokushin.example.jp',
    },
  ],
  opportunities: [
    { id: 'opp-1', accountId: 'acct-1', company: '東都ロジスティクス', owner: '森田', stage: '提案', amount: 18.6, close: '2026-06-24', risk: '中', probability: 65 },
    { id: 'opp-2', accountId: 'acct-2', company: '南青山リテール', owner: '安藤', stage: '契約', amount: 12.2, close: '2026-06-28', risk: '低', probability: 85 },
    { id: 'opp-3', accountId: 'acct-3', company: '北辰メディカル', owner: '佐伯', stage: '稟議', amount: 9.4, close: '2026-07-03', risk: '高', probability: 45 },
    { id: 'opp-4', accountId: 'acct-1', company: '東都ロジスティクス', owner: '中村', stage: '要件確認', amount: 7.8, close: '2026-07-08', risk: '中', probability: 35 },
    { id: 'opp-5', accountId: 'acct-2', company: '南青山リテール', owner: '森田', stage: '提案', amount: 6.1, close: '2026-07-12', risk: '低', probability: 60 },
  ],
  cases: [
    { id: 'C-1842', accountId: 'acct-2', subject: '請求書PDFが開けない', owner: '請求チーム', priority: '高', status: '新規', slaMinutes: 80 },
    { id: 'C-1841', accountId: 'acct-1', subject: '配送ステータス連携の遅延', owner: '連携サポート', priority: '中', status: '対応中', slaMinutes: 185 },
    { id: 'C-1839', accountId: 'acct-3', subject: '管理者権限の追加依頼', owner: '管理者支援', priority: '低', status: '解決済み', slaMinutes: 390 },
  ],
  campaigns: [
    { id: 'camp-1', name: '夏期ウェビナー', channel: 'ウェビナー', leads: 842, conversion: 21, cost: 1.8 },
    { id: 'camp-2', name: '既存顧客アップセル', channel: 'メール', leads: 318, conversion: 34, cost: 0.9 },
    { id: 'camp-3', name: '展示会フォロー', channel: 'イベント', leads: 496, conversion: 16, cost: 2.4 },
  ],
}

const stages = ['新規', '要件確認', '提案', '稟議', '契約']
const statusOptions = ['新規', '対応中', '保留', '解決済み']
const priorityOptions = ['高', '中', '低']
const leadRows = [
  { name: '山口 拓也', company: '東都ロジスティクス', source: '夏期ウェビナー', score: 92, owner: '森田', status: '営業渡し' },
  { name: '伊藤 玲奈', company: '南青山リテール', source: '既存顧客アップセル', score: 84, owner: '安藤', status: '育成中' },
  { name: '小林 健', company: '北辰メディカル', source: '展示会フォロー', score: 76, owner: '佐伯', status: '要確認' },
]

function App() {
  const [data, setData] = useState(() => loadWorkspace())
  const [session, setSession] = useState(() => loadSession())
  const [activeView, setActiveView] = useState('ダッシュボード')
  const [query, setQuery] = useState('')
  const [note, setNote] = useState('')
  const [notice, setNotice] = useState('')
  const [saveState, setSaveState] = useState('保存済み')
  const [apiState, setApiState] = useState('接続確認中')
  const [serverVersion, setServerVersion] = useState(() => data._meta?.version ?? null)
  const dataRef = useRef(data)
  const restoreInput = useRef(null)
  const canEdit = session ? ['admin', 'sales_manager', 'support_agent'].includes(session.user.role) : false

  useEffect(() => {
    dataRef.current = data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    let cancelled = false
    async function loadServerWorkspace() {
      if (!session) {
        setApiState('未ログイン')
        setNotice('ログインすると共有データを読み込めます。')
        return
      }
      try {
        const workspace = await fetchWorkspace(session.token)
        if (cancelled) return
        applyServerWorkspace(workspace)
        setApiState(canEdit ? '共有保存' : '閲覧のみ')
        setNotice('共有データを読み込みました。')
      } catch {
        if (cancelled) return
        setApiState('ローカル保存')
        setNotice('APIに接続できないため、この端末内に保存します。')
      }
    }
    loadServerWorkspace()
    return () => {
      cancelled = true
    }
  }, [session, canEdit])

  const selectedAccount = data.accounts.find((item) => item.id === data.selectedAccountId) ?? data.accounts[0]
  const campaign = data.campaigns.find((item) => item.id === data.selectedCampaign) ?? data.campaigns[0]

  const filteredOpportunities = useMemo(() => {
    return data.opportunities.filter((item) => {
      const matchesStage = data.selectedStage === 'すべて' || item.stage === data.selectedStage
      const matchesSearch = matchesQuery(query, [item.company, item.owner, item.stage, item.risk])
      return matchesStage && matchesSearch
    })
  }, [data.opportunities, data.selectedStage, query])

  const filteredCases = useMemo(() => {
    return data.cases.filter((item) => {
      const account = data.accounts.find((candidate) => candidate.id === item.accountId)
      return matchesQuery(query, [item.id, item.subject, item.owner, item.priority, item.status, account?.name])
    })
  }, [data.accounts, data.cases, query])

  const pipeline = useMemo(() => {
    return stages.map((stage) => {
      const amount = data.opportunities
        .filter((item) => item.stage === stage)
        .reduce((sum, item) => sum + item.amount, 0)
      const max = Math.max(...stages.map((candidate) =>
        data.opportunities.filter((item) => item.stage === candidate).reduce((sum, item) => sum + item.amount, 0),
      ))
      return { stage, amount, value: max ? Math.max(8, Math.round((amount / max) * 100)) : 8 }
    })
  }, [data.opportunities])

  const openCasesForAccount = data.cases.filter((item) => item.accountId === selectedAccount.id && item.status !== '解決済み').length
  const forecast = data.opportunities.reduce((sum, item) => sum + item.amount * item.probability / 100, 0)
  const weightedPipeline = data.opportunities.reduce((sum, item) => sum + item.amount, 0)
  const resolvedRate = Math.round((data.cases.filter((item) => item.status === '解決済み').length / data.cases.length) * 100)
  const mqlRate = Math.round(data.campaigns.reduce((sum, item) => sum + item.conversion, 0) / data.campaigns.length * 10) / 10
  const viewMeta = navItems.find((item) => item.label === activeView) ?? navItems[0]

  function patchData(updater) {
    if (!canEdit) {
      setApiState(session ? '閲覧のみ' : '未ログイン')
      setSaveState('保存不可')
      setNotice('このユーザーには変更権限がありません。')
      return
    }
    setSaveState('保存中')
    const next = typeof updater === 'function' ? updater(dataRef.current) : updater
    const normalized = normalizeWorkspace({
      ...next,
      auditLog: next.auditLog.slice(0, 12),
    })
    dataRef.current = normalized
    setData(normalized)
    persistWorkspace(normalized)
  }

  async function persistWorkspace(workspace) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace))
    if (!session) {
      setApiState('未ログイン')
      setSaveState('端末内に保存')
      return
    }
    try {
      const result = await saveWorkspace(workspace, session.token, serverVersion)
      applyServerWorkspace(result.workspace)
      setApiState('共有保存')
      setSaveState('保存済み')
    } catch (error) {
      if (error.status === 403) {
        setApiState('閲覧のみ')
        setSaveState('保存不可')
        setNotice('このユーザーには共有データへの書き込み権限がありません。')
      } else if (error.status === 409) {
        setApiState('再読込必要')
        setSaveState('競合')
        setServerVersion(error.currentVersion ?? null)
        setNotice('他のユーザーが先に共有データを更新しました。再読み込みしてから保存してください。')
      } else {
        setApiState('ローカル保存')
        setSaveState('端末内に保存')
      }
    }
  }

  function applyServerWorkspace(workspace) {
    const normalized = normalizeWorkspace(workspace)
    dataRef.current = normalized
    setData(normalized)
    setServerVersion(normalized._meta.version)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  }

  async function reloadWorkspace() {
    if (!session) return
    setSaveState('読込中')
    try {
      const workspace = await fetchWorkspace(session.token)
      applyServerWorkspace(workspace)
      setApiState(canEdit ? '共有保存' : '閲覧のみ')
      setSaveState('保存済み')
      setNotice('最新の共有データを再読み込みしました。')
    } catch {
      setApiState('ローカル保存')
      setSaveState('読込失敗')
      setNotice('共有データの再読み込みに失敗しました。APIの起動状態を確認してください。')
    }
  }

  async function login(userId, pin) {
    const nextSession = await createSession(userId, pin)
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    setNotice(`${nextSession.user.name} としてログインしました。`)
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
    setApiState('未ログイン')
    setNotice('')
  }

  function addLog(text, type = 'manual') {
    const time = new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit' }).format(new Date())
    return { time, text, type }
  }

  function updateOpportunity(id, field, value) {
    patchData((current) => {
      const target = current.opportunities.find((item) => item.id === id)
      return {
        ...current,
        opportunities: current.opportunities.map((item) =>
          item.id === id ? { ...item, [field]: field === 'probability' ? Number(value) : value } : item,
        ),
        auditLog: [addLog(`${target.company} の${field === 'stage' ? 'ステージ' : '確度'}を更新`, 'opportunity'), ...current.auditLog],
      }
    })
  }

  function updateCase(id, field, value) {
    patchData((current) => ({
      ...current,
      cases: current.cases.map((item) => item.id === id ? { ...item, [field]: value } : item),
      auditLog: [addLog(`${id} の${field === 'status' ? 'ステータス' : '優先度'}を${value}へ更新`, 'case'), ...current.auditLog],
    }))
  }

  function addActivityNote(event) {
    event.preventDefault()
    const cleanNote = note.trim()
    if (!cleanNote) return
    patchData((current) => ({
      ...current,
      auditLog: [addLog(`${selectedAccount.name}: ${cleanNote}`, 'manual'), ...current.auditLog],
    }))
    setNote('')
  }

  function exportCsv() {
    const rows = [
      ['取引先', '担当', 'ステージ', '金額(百万円)', '確度', '完了予定', 'リスク'],
      ...filteredOpportunities.map((item) => [item.company, item.owner, item.stage, item.amount, `${item.probability}%`, item.close, item.risk]),
    ]
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `opportunities-${localDateStamp()}.csv`
    link.click()
    URL.revokeObjectURL(url)
    patchData((current) => ({
      ...current,
      auditLog: [addLog('重点商談のCSVを出力', 'report'), ...current.auditLog],
    }))
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `asteria-crm-backup-${localDateStamp()}.json`
    link.click()
    URL.revokeObjectURL(url)
    setNotice('バックアップJSONを出力しました。')
  }

  async function restoreBackup(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      if (!isValidWorkspace(parsed)) throw new Error('Invalid workspace shape')
      patchData({
        ...parsed,
        auditLog: [addLog('バックアップJSONからデータを復元', 'admin'), ...parsed.auditLog],
      })
      setNotice('バックアップから復元しました。')
    } catch {
      setNotice('復元に失敗しました。Asteria CRMのバックアップJSONを選択してください。')
    } finally {
      event.target.value = ''
    }
  }

  function resetWorkspace() {
    patchData({
      ...initialState,
      auditLog: [addLog('サンプルデータへリセット', 'admin'), ...initialState.auditLog],
    })
    setQuery('')
    setNote('')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="メインナビゲーション">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>Asteria CRM</strong>
            <span>Customer 360</span>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              className={activeView === label ? 'nav-item active' : 'nav-item'}
              type="button"
              key={label}
              onClick={() => setActiveView(label)}
              aria-current={activeView === label ? 'page' : undefined}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <ShieldCheck size={17} />
          <div>
            <strong>権限プロファイル</strong>
            <span>{session ? roleLabel(session.user.role) : '未ログイン'}</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <button className="icon-button" type="button" aria-label="サイドバー">
            <PanelLeft size={18} />
          </button>
          <label className="searchbox">
            <Search size={17} />
            <input
              type="search"
              placeholder="顧客、商談、ケース、担当者を検索"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button className="date-button" type="button">
            <CalendarDays size={16} />
            今四半期
            <ChevronDown size={15} />
          </button>
          <span className="save-state"><Save size={14} />{saveState}</span>
          <span className={apiState === '共有保存' ? 'save-state shared' : 'save-state local'}>{apiState}</span>
          <button className="date-button admin-action" type="button" onClick={exportBackup}>
            <Download size={16} />
            バックアップ
          </button>
          <button className="date-button admin-action" type="button" onClick={() => restoreInput.current?.click()}>
            <Upload size={16} />
            復元
          </button>
          <input ref={restoreInput} className="visually-hidden" type="file" accept="application/json,.json" onChange={restoreBackup} />
          <button className="icon-button" type="button" aria-label="通知">
            <Bell size={18} />
          </button>
          <button className="user-button" type="button" onClick={logout} aria-label="ログアウト">
            <span className="avatar">{session?.user.name.slice(0, 2) ?? '未'}</span>
            <span>{session?.user.name ?? '未ログイン'}</span>
          </button>
        </header>

        {!session && <LoginPanel onLogin={login} />}

        <section className="page-heading">
          <div>
            <h1>{viewMeta.title}</h1>
            <p>{viewMeta.description}</p>
          </div>
          <div className="heading-actions">
            <button className="secondary-button" type="button" onClick={exportCsv}>
              <Download size={17} />
              CSV出力
            </button>
            <button className="primary-button" type="button" onClick={() => setQuery('高')}>
              <Sparkles size={17} />
              高リスク抽出
            </button>
          </div>
        </section>
        {notice && (
          <div className="notice-bar">
            <span>{notice}</span>
            {session && (
              <button className="text-button" type="button" onClick={reloadWorkspace}>
                <RefreshCw size={15} />
                共有データを再読込
              </button>
            )}
          </div>
        )}

        {session && activeView === 'ダッシュボード' ? (
          <>
            <AccountStrip data={data} selectedAccount={selectedAccount} patchData={patchData} />
            <KpiStrip
              forecast={forecast}
              weightedPipeline={weightedPipeline}
              opportunities={data.opportunities}
              filteredOpportunities={filteredOpportunities}
              resolvedRate={resolvedRate}
              cases={data.cases}
              mqlRate={mqlRate}
              campaigns={data.campaigns}
            />
            <section className="dashboard-grid">
          <article className="panel pipeline-panel">
            <PanelHeader title="パイプライン" detail="商談ステージ別の見込み金額" icon={TrendingUp} />
            <div className="stage-tabs" role="tablist" aria-label="商談ステージ">
              {['すべて', ...stages].map((stage) => (
                <button
                  className={data.selectedStage === stage ? 'stage-tab active' : 'stage-tab'}
                  type="button"
                  key={stage}
                  onClick={() => patchData((current) => ({ ...current, selectedStage: stage }))}
                >
                  {stage}
                </button>
              ))}
            </div>
            <div className="bar-chart">
              {pipeline.map((item) => (
                <button
                  className={data.selectedStage === item.stage ? 'bar-row selected' : 'bar-row'}
                  type="button"
                  key={item.stage}
                  onClick={() => patchData((current) => ({ ...current, selectedStage: item.stage }))}
                >
                  <span>{item.stage}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${item.value}%` }} />
                  </div>
                  <strong>¥{item.amount.toFixed(1)}M</strong>
                </button>
              ))}
            </div>
          </article>

          <article className="panel customer-panel">
            <PanelHeader title="Customer 360" detail={selectedAccount.name} icon={Contact} />
            <div className="customer-card">
              <div className="company-badge">{selectedAccount.initials}</div>
              <div>
                <h2>{selectedAccount.name}</h2>
                <p>{selectedAccount.industry} / 担当 {selectedAccount.owner} / 契約更新 {selectedAccount.renewal}</p>
              </div>
            </div>
            <dl className="customer-facts">
              <div><dt>健全性</dt><dd className={selectedAccount.health >= 75 ? 'good' : 'warn'}>{selectedAccount.health}</dd></div>
              <div><dt>未解決ケース</dt><dd>{openCasesForAccount}</dd></div>
              <div><dt>直近注文</dt><dd>{selectedAccount.order}</dd></div>
              <div><dt>NPS</dt><dd>{selectedAccount.nps}</dd></div>
            </dl>
            <dl className="profile-list">
              <div><dt>年商</dt><dd>{selectedAccount.revenue}</dd></div>
              <div><dt>従業員数</dt><dd>{selectedAccount.employees}</dd></div>
              <div><dt>Webサイト</dt><dd>{selectedAccount.website}</dd></div>
            </dl>
            <form className="note-form" onSubmit={addActivityNote}>
              <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="活動メモを追加" />
              <button type="submit" aria-label="活動メモを追加"><Plus size={16} /></button>
            </form>
          </article>

          <article className="panel table-panel">
            <PanelHeader title="重点商談" detail={`${filteredOpportunities.length}件を表示中`} icon={Target} />
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>取引先</th>
                    <th>担当</th>
                    <th>ステージ</th>
                    <th>金額</th>
                    <th>確度</th>
                    <th>予定</th>
                    <th>リスク</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.map((item) => (
                    <tr key={item.id}>
                      <td>{item.company}</td>
                      <td>{item.owner}</td>
                      <td>
                        <select value={item.stage} onChange={(event) => updateOpportunity(item.id, 'stage', event.target.value)} aria-label={`${item.company}のステージ`}>
                          {stages.map((stage) => <option key={stage}>{stage}</option>)}
                        </select>
                      </td>
                      <td>¥{item.amount.toFixed(1)}M</td>
                      <td>
                        <input
                          className="probability-input"
                          type="number"
                          min="0"
                          max="100"
                          value={item.probability}
                          onChange={(event) => updateOpportunity(item.id, 'probability', event.target.value)}
                          aria-label={`${item.company}の確度`}
                        />%
                      </td>
                      <td>{formatDate(item.close)}</td>
                      <td><span className={`risk ${riskClass(item.risk)}`}>{item.risk}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOpportunities.length === 0 && <p className="empty-state">検索条件に一致する商談はありません。</p>}
            </div>
          </article>

          <article className="panel cases-panel">
            <PanelHeader title="ケースキュー" detail="SLA優先順" icon={Headphones} />
            <div className="case-list">
              {filteredCases.map((item) => {
                const account = data.accounts.find((candidate) => candidate.id === item.accountId)
                const resolved = item.status === '解決済み'
                return (
                  <div className={resolved ? 'case-row resolved' : 'case-row'} key={item.id}>
                    <CheckCircle2 size={18} />
                    <div>
                      <strong>{item.subject}</strong>
                      <span>{item.id} / {account?.name} / {item.owner}</span>
                    </div>
                    <select value={item.priority} onChange={(event) => updateCase(item.id, 'priority', event.target.value)} aria-label={`${item.id}の優先度`}>
                      {priorityOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                    <select value={item.status} onChange={(event) => updateCase(item.id, 'status', event.target.value)} aria-label={`${item.id}のステータス`}>
                      {statusOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                    <time>{formatSla(item.slaMinutes)}</time>
                  </div>
                )
              })}
            </div>
          </article>

          <article className="panel campaign-panel">
            <PanelHeader title="キャンペーン実績" detail="リード獲得から営業渡しまで" icon={Megaphone} />
            <div className="campaign-tabs">
              {data.campaigns.map((item) => (
                <button
                  className={data.selectedCampaign === item.id ? 'campaign-tab active' : 'campaign-tab'}
                  type="button"
                  key={item.id}
                  onClick={() => patchData((current) => ({ ...current, selectedCampaign: item.id }))}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <div className="campaign-meter">
              <div style={{ '--value': `${campaign.conversion}%` }}>
                <span>{campaign.conversion}%</span>
              </div>
              <dl>
                <div><dt>チャネル</dt><dd>{campaign.channel}</dd></div>
                <div><dt>リード</dt><dd>{campaign.leads}</dd></div>
                <div><dt>費用</dt><dd>¥{campaign.cost.toFixed(1)}M</dd></div>
                <div><dt>営業渡し</dt><dd>{Math.round(campaign.leads * campaign.conversion / 100)}</dd></div>
              </dl>
            </div>
          </article>

          <article className="panel ai-panel">
            <PanelHeader title="Agentforce" detail="AI推奨アクション" icon={Zap} />
            <ol className="action-list">
              {buildActions(data, selectedAccount).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>

          <article className="panel activity-panel">
            <PanelHeader title="監査ログ/活動履歴" detail="ローカル保存" icon={Clock3} />
            <div className="activity-feed">
              {data.auditLog.map((item, index) => (
                <p key={`${item.time}-${item.text}-${index}`}><time>{item.time}</time>{item.text}</p>
              ))}
            </div>
            <button className="text-button" type="button" onClick={resetWorkspace}>
              <FileText size={15} />
              サンプルデータへ戻す
            </button>
          </article>
            </section>
          </>
        ) : session ? (
          <SectionView
            activeView={activeView}
            data={data}
            selectedAccount={selectedAccount}
            filteredOpportunities={filteredOpportunities}
            filteredCases={filteredCases}
            pipeline={pipeline}
            campaign={campaign}
            query={query}
            openCasesForAccount={openCasesForAccount}
            patchData={patchData}
            updateOpportunity={updateOpportunity}
            updateCase={updateCase}
            addLog={addLog}
            addActivityNote={addActivityNote}
            note={note}
            setNote={setNote}
            resetWorkspace={resetWorkspace}
            canEdit={canEdit}
          />
        ) : null}
      </main>
    </div>
  )
}

function LoginPanel({ onLogin }) {
  const [userId, setUserId] = useState('u-sales')
  const [pin, setPin] = useState('1111')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    try {
      await onLogin(userId, pin)
      setError('')
    } catch {
      setError('ログインできません。ユーザーとPINを確認してください。')
    }
  }

  return (
    <section className="login-shell" aria-label="ログイン">
      <article className="panel login-panel">
        <PanelHeader title="ログイン" detail="社内利用者を選択" icon={ShieldCheck} />
        <form className="create-form login-form" onSubmit={submit}>
          <label>ユーザー
            <select value={userId} onChange={(event) => setUserId(event.target.value)}>
              <option value="u-admin">管理者 / PIN 0000</option>
              <option value="u-sales">営業マネージャー / PIN 1111</option>
              <option value="u-support">サポート担当 / PIN 2222</option>
              <option value="u-viewer">閲覧者 / PIN 3333</option>
            </select>
          </label>
          <label>PIN
            <input value={pin} onChange={(event) => setPin(event.target.value)} inputMode="numeric" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button compact" type="submit"><ShieldCheck size={16} />ログイン</button>
        </form>
      </article>
    </section>
  )
}

function AccountStrip({ data, selectedAccount, patchData }) {
  return (
    <section className="account-strip" aria-label="取引先切替">
      {data.accounts.map((account) => (
        <button
          className={account.id === selectedAccount.id ? 'account-pill active' : 'account-pill'}
          type="button"
          key={account.id}
          onClick={() => patchData((current) => ({ ...current, selectedAccountId: account.id }))}
        >
          <span>{account.initials}</span>
          <strong>{account.name}</strong>
          <em>健全性 {account.health}</em>
        </button>
      ))}
    </section>
  )
}

function KpiStrip({ forecast, weightedPipeline, opportunities, filteredOpportunities, resolvedRate, cases, mqlRate, campaigns }) {
  return (
    <section className="kpi-grid" aria-label="主要KPI">
      <Metric label="加重売上見込み" value={`¥${forecast.toFixed(1)}M`} delta={`総額 ¥${weightedPipeline.toFixed(1)}M`} tone="info" />
      <Metric label="進行中商談" value={String(opportunities.length)} delta={`${filteredOpportunities.length}件を表示`} tone="info" />
      <Metric label="ケース解決率" value={`${resolvedRate}%`} delta={`${cases.length}件中`} tone={resolvedRate >= 70 ? 'good' : 'warn'} />
      <Metric label="MQL転換率" value={`${mqlRate}%`} delta={`${campaigns.length}施策平均`} tone="good" />
    </section>
  )
}

function SectionView({
  activeView,
  data,
  selectedAccount,
  filteredOpportunities,
  filteredCases,
  pipeline,
  campaign,
  openCasesForAccount,
  patchData,
  updateOpportunity,
  updateCase,
  addLog,
  addActivityNote,
  note,
  setNote,
  resetWorkspace,
}) {
  if (activeView === 'リード') {
    return (
      <section className="workspace-view">
        <div className="view-grid two-columns">
          <article className="panel wide-panel">
            <PanelHeader title="リード一覧" detail={`${leadRows.length}件`} icon={Users} />
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>氏名</th><th>会社</th><th>獲得元</th><th>スコア</th><th>担当</th><th>状態</th></tr>
                </thead>
                <tbody>
                  {leadRows.map((lead) => (
                    <tr key={lead.name}>
                      <td>{lead.name}</td>
                      <td>{lead.company}</td>
                      <td>{lead.source}</td>
                      <td>{lead.score}</td>
                      <td>{lead.owner}</td>
                      <td><span className="status info">{lead.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
          <article className="panel">
            <PanelHeader title="優先リード" detail="スコア順" icon={Target} />
            <ol className="action-list">
              {leadRows.sort((a, b) => b.score - a.score).map((lead) => (
                <li key={lead.name}>{lead.company} / {lead.name}: スコア {lead.score}</li>
              ))}
            </ol>
          </article>
        </div>
      </section>
    )
  }

  if (activeView === '取引先') {
    return (
      <section className="workspace-view">
        <AccountStrip data={data} selectedAccount={selectedAccount} patchData={patchData} />
        <div className="view-grid two-columns">
          <article className="panel wide-panel">
            <PanelHeader title="取引先一覧" detail={`${data.accounts.length}社`} icon={Building2} />
            <div className="record-list">
              {data.accounts.map((account) => (
                <button
                  className={account.id === selectedAccount.id ? 'record-row active' : 'record-row'}
                  type="button"
                  key={account.id}
                  onClick={() => patchData((current) => ({ ...current, selectedAccountId: account.id }))}
                >
                  <span className="company-badge">{account.initials}</span>
                  <strong>{account.name}</strong>
                  <em>{account.industry}</em>
                  <span>担当 {account.owner}</span>
                  <span>健全性 {account.health}</span>
                  <span>更新 {account.renewal}</span>
                </button>
              ))}
            </div>
          </article>
          <CustomerPanel selectedAccount={selectedAccount} openCasesForAccount={openCasesForAccount} addActivityNote={addActivityNote} note={note} setNote={setNote} />
        </div>
      </section>
    )
  }

  if (activeView === '商談') {
    return (
      <section className="workspace-view">
        <div className="view-grid">
          <OpportunityCreatePanel data={data} patchData={patchData} addLog={addLog} />
          <PipelinePanel data={data} pipeline={pipeline} patchData={patchData} />
          <OpportunitiesPanel opportunities={filteredOpportunities} updateOpportunity={updateOpportunity} />
        </div>
      </section>
    )
  }

  if (activeView === 'ケース') {
    return (
      <section className="workspace-view">
        <div className="view-grid two-columns">
          <CasesPanel data={data} cases={filteredCases} updateCase={updateCase} />
          <div className="side-stack">
            <CaseCreatePanel data={data} patchData={patchData} addLog={addLog} />
            <article className="panel">
              <PanelHeader title="SLAサマリー" detail="対応優先度" icon={Clock3} />
              <dl className="customer-facts stacked">
                <div><dt>高優先度</dt><dd className="high">{data.cases.filter((item) => item.priority === '高').length}</dd></div>
                <div><dt>未解決</dt><dd>{data.cases.filter((item) => item.status !== '解決済み').length}</dd></div>
                <div><dt>平均SLA</dt><dd>{Math.round(data.cases.reduce((sum, item) => sum + item.slaMinutes, 0) / data.cases.length)}分</dd></div>
              </dl>
            </article>
          </div>
        </div>
      </section>
    )
  }

  if (activeView === 'キャンペーン') {
    return (
      <section className="workspace-view">
        <div className="view-grid two-columns">
          <CampaignPanel data={data} campaign={campaign} patchData={patchData} />
          <article className="panel">
            <PanelHeader title="施策別パフォーマンス" detail="営業渡し数" icon={Megaphone} />
            <div className="record-list">
              {data.campaigns.map((item) => (
                <div className="record-row static" key={item.id}>
                  <strong>{item.name}</strong>
                  <em>{item.channel}</em>
                  <span>{item.leads}リード</span>
                  <span>転換率 {item.conversion}%</span>
                  <span>営業渡し {Math.round(item.leads * item.conversion / 100)}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    )
  }

  if (activeView === 'レポート') {
    return (
      <section className="workspace-view">
        <div className="report-grid">
          <Metric label="商談総額" value={`¥${data.opportunities.reduce((sum, item) => sum + item.amount, 0).toFixed(1)}M`} delta="全パイプライン" tone="info" />
          <Metric label="高リスク商談" value={String(data.opportunities.filter((item) => item.risk === '高').length)} delta="要確認" tone="warn" />
          <Metric label="未解決ケース" value={String(data.cases.filter((item) => item.status !== '解決済み').length)} delta="SLA監視" tone="warn" />
          <Metric label="キャンペーン費用" value={`¥${data.campaigns.reduce((sum, item) => sum + item.cost, 0).toFixed(1)}M`} delta="今四半期" tone="info" />
        </div>
        <article className="panel">
          <PanelHeader title="経営サマリー" detail="自動集計" icon={LineChart} />
          <ol className="action-list">
            <li>提案ステージの商談金額が最大です。受注予定日の近い案件からレビューしてください。</li>
            <li>ケース解決済み比率は改善余地があります。高優先度ケースの担当者確認が必要です。</li>
            <li>既存顧客アップセルの転換率が最も高く、追加投資候補です。</li>
          </ol>
        </article>
      </section>
    )
  }

  return (
    <section className="workspace-view">
      <div className="view-grid two-columns">
        <article className="panel">
          <PanelHeader title="Agentforce 推奨アクション" detail="CRMデータから生成" icon={Zap} />
          <ol className="action-list">
            {buildActions(data, selectedAccount).map((item) => <li key={item}>{item}</li>)}
          </ol>
        </article>
        <article className="panel">
          <PanelHeader title="監査ログ/活動履歴" detail="最新12件" icon={Clock3} />
          <div className="activity-feed">
            {data.auditLog.map((item, index) => (
              <p key={`${item.time}-${item.text}-${index}`}><time>{item.time}</time>{item.text}</p>
            ))}
          </div>
          <button className="text-button" type="button" onClick={resetWorkspace}>
            <FileText size={15} />
            サンプルデータへ戻す
          </button>
        </article>
      </div>
    </section>
  )
}

function OpportunityCreatePanel({ data, patchData, addLog }) {
  const [form, setForm] = useState({
    accountId: data.accounts[0]?.id ?? '',
    owner: '森田',
    stage: '新規',
    amount: '5.0',
    probability: '30',
    close: localDateStamp(),
    risk: '中',
  })
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()
    const account = data.accounts.find((item) => item.id === form.accountId)
    const amount = Number(form.amount)
    const probability = Number(form.probability)
    if (!account || !form.owner.trim() || !Number.isFinite(amount) || amount <= 0 || probability < 0 || probability > 100 || !form.close) {
      setError('取引先、担当、金額、確度、完了予定日を正しく入力してください。')
      return
    }
    const opportunity = {
      id: `opp-${Date.now()}`,
      accountId: account.id,
      company: account.name,
      owner: form.owner.trim(),
      stage: form.stage,
      amount,
      close: form.close,
      risk: form.risk,
      probability,
    }
    patchData((current) => ({
      ...current,
      opportunities: [opportunity, ...current.opportunities],
      auditLog: [addLog(`${account.name} の新規商談を作成`, 'opportunity'), ...current.auditLog],
    }))
    setError('')
    setForm((current) => ({ ...current, amount: '5.0', probability: '30', stage: '新規' }))
  }

  return (
    <article className="panel">
      <PanelHeader title="新規商談" detail="必須項目チェック付き" icon={Plus} />
      <form className="create-form" onSubmit={submit}>
        <label>取引先
          <select value={form.accountId} onChange={(event) => setForm({ ...form, accountId: event.target.value })}>
            {data.accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}
          </select>
        </label>
        <label>担当
          <input value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} />
        </label>
        <label>ステージ
          <select value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value })}>
            {stages.map((stage) => <option key={stage}>{stage}</option>)}
          </select>
        </label>
        <label>金額(百万円)
          <input type="number" min="0.1" step="0.1" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
        </label>
        <label>確度(%)
          <input type="number" min="0" max="100" value={form.probability} onChange={(event) => setForm({ ...form, probability: event.target.value })} />
        </label>
        <label>予定日
          <input type="date" value={form.close} onChange={(event) => setForm({ ...form, close: event.target.value })} />
        </label>
        <label>リスク
          <select value={form.risk} onChange={(event) => setForm({ ...form, risk: event.target.value })}>
            {priorityOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button compact" type="submit"><Plus size={16} />商談を作成</button>
      </form>
    </article>
  )
}

function CaseCreatePanel({ data, patchData, addLog }) {
  const [form, setForm] = useState({
    accountId: data.accounts[0]?.id ?? '',
    subject: '',
    owner: 'サポートチーム',
    priority: '中',
    slaMinutes: '240',
  })
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()
    const account = data.accounts.find((item) => item.id === form.accountId)
    const slaMinutes = Number(form.slaMinutes)
    if (!account || !form.subject.trim() || !form.owner.trim() || !Number.isFinite(slaMinutes) || slaMinutes <= 0) {
      setError('取引先、件名、担当、SLAを正しく入力してください。')
      return
    }
    const caseRecord = {
      id: `C-${Date.now().toString().slice(-5)}`,
      accountId: account.id,
      subject: form.subject.trim(),
      owner: form.owner.trim(),
      priority: form.priority,
      status: '新規',
      slaMinutes,
    }
    patchData((current) => ({
      ...current,
      cases: [caseRecord, ...current.cases],
      auditLog: [addLog(`${caseRecord.id} ${caseRecord.subject} を作成`, 'case'), ...current.auditLog],
    }))
    setError('')
    setForm((current) => ({ ...current, subject: '', slaMinutes: '240' }))
  }

  return (
    <article className="panel">
      <PanelHeader title="新規ケース" detail="SLA登録" icon={Plus} />
      <form className="create-form" onSubmit={submit}>
        <label>取引先
          <select value={form.accountId} onChange={(event) => setForm({ ...form, accountId: event.target.value })}>
            {data.accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}
          </select>
        </label>
        <label>件名
          <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="問い合わせ内容" />
        </label>
        <label>担当
          <input value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} />
        </label>
        <label>優先度
          <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
            {priorityOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>SLA(分)
          <input type="number" min="1" value={form.slaMinutes} onChange={(event) => setForm({ ...form, slaMinutes: event.target.value })} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button compact" type="submit"><Plus size={16} />ケースを作成</button>
      </form>
    </article>
  )
}

function PipelinePanel({ data, pipeline, patchData }) {
  return (
    <article className="panel">
      <PanelHeader title="パイプライン" detail="商談ステージ別の見込み金額" icon={TrendingUp} />
      <div className="stage-tabs" role="tablist" aria-label="商談ステージ">
        {['すべて', ...stages].map((stage) => (
          <button
            className={data.selectedStage === stage ? 'stage-tab active' : 'stage-tab'}
            type="button"
            key={stage}
            onClick={() => patchData((current) => ({ ...current, selectedStage: stage }))}
          >
            {stage}
          </button>
        ))}
      </div>
      <div className="bar-chart">
        {pipeline.map((item) => (
          <button
            className={data.selectedStage === item.stage ? 'bar-row selected' : 'bar-row'}
            type="button"
            key={item.stage}
            onClick={() => patchData((current) => ({ ...current, selectedStage: item.stage }))}
          >
            <span>{item.stage}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${item.value}%` }} />
            </div>
            <strong>¥{item.amount.toFixed(1)}M</strong>
          </button>
        ))}
      </div>
    </article>
  )
}

function CustomerPanel({ selectedAccount, openCasesForAccount, addActivityNote, note, setNote }) {
  return (
    <article className="panel">
      <PanelHeader title="Customer 360" detail={selectedAccount.name} icon={Contact} />
      <div className="customer-card">
        <div className="company-badge">{selectedAccount.initials}</div>
        <div>
          <h2>{selectedAccount.name}</h2>
          <p>{selectedAccount.industry} / 担当 {selectedAccount.owner} / 契約更新 {selectedAccount.renewal}</p>
        </div>
      </div>
      <dl className="customer-facts">
        <div><dt>健全性</dt><dd className={selectedAccount.health >= 75 ? 'good' : 'warn'}>{selectedAccount.health}</dd></div>
        <div><dt>未解決ケース</dt><dd>{openCasesForAccount}</dd></div>
        <div><dt>直近注文</dt><dd>{selectedAccount.order}</dd></div>
        <div><dt>NPS</dt><dd>{selectedAccount.nps}</dd></div>
      </dl>
      <dl className="profile-list">
        <div><dt>年商</dt><dd>{selectedAccount.revenue}</dd></div>
        <div><dt>従業員数</dt><dd>{selectedAccount.employees}</dd></div>
        <div><dt>Webサイト</dt><dd>{selectedAccount.website}</dd></div>
      </dl>
      <form className="note-form" onSubmit={addActivityNote}>
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="活動メモを追加" />
        <button type="submit" aria-label="活動メモを追加"><Plus size={16} /></button>
      </form>
    </article>
  )
}

function OpportunitiesPanel({ opportunities, updateOpportunity }) {
  return (
    <article className="panel wide-panel">
      <PanelHeader title="重点商談" detail={`${opportunities.length}件を表示中`} icon={Target} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>取引先</th><th>担当</th><th>ステージ</th><th>金額</th><th>確度</th><th>予定</th><th>リスク</th></tr>
          </thead>
          <tbody>
            {opportunities.map((item) => (
              <tr key={item.id}>
                <td>{item.company}</td>
                <td>{item.owner}</td>
                <td>
                  <select value={item.stage} onChange={(event) => updateOpportunity(item.id, 'stage', event.target.value)} aria-label={`${item.company}のステージ`}>
                    {stages.map((stage) => <option key={stage}>{stage}</option>)}
                  </select>
                </td>
                <td>¥{item.amount.toFixed(1)}M</td>
                <td>
                  <input className="probability-input" type="number" min="0" max="100" value={item.probability} onChange={(event) => updateOpportunity(item.id, 'probability', event.target.value)} aria-label={`${item.company}の確度`} />%
                </td>
                <td>{formatDate(item.close)}</td>
                <td><span className={`risk ${riskClass(item.risk)}`}>{item.risk}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {opportunities.length === 0 && <p className="empty-state">検索条件に一致する商談はありません。</p>}
      </div>
    </article>
  )
}

function CasesPanel({ data, cases, updateCase }) {
  return (
    <article className="panel wide-panel">
      <PanelHeader title="ケースキュー" detail="SLA優先順" icon={Headphones} />
      <div className="case-list">
        {cases.map((item) => {
          const account = data.accounts.find((candidate) => candidate.id === item.accountId)
          const resolved = item.status === '解決済み'
          return (
            <div className={resolved ? 'case-row resolved' : 'case-row'} key={item.id}>
              <CheckCircle2 size={18} />
              <div>
                <strong>{item.subject}</strong>
                <span>{item.id} / {account?.name} / {item.owner}</span>
              </div>
              <select value={item.priority} onChange={(event) => updateCase(item.id, 'priority', event.target.value)} aria-label={`${item.id}の優先度`}>
                {priorityOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
              <select value={item.status} onChange={(event) => updateCase(item.id, 'status', event.target.value)} aria-label={`${item.id}のステータス`}>
                {statusOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
              <time>{formatSla(item.slaMinutes)}</time>
            </div>
          )
        })}
      </div>
    </article>
  )
}

function CampaignPanel({ data, campaign, patchData }) {
  return (
    <article className="panel wide-panel">
      <PanelHeader title="キャンペーン実績" detail="リード獲得から営業渡しまで" icon={Megaphone} />
      <div className="campaign-tabs">
        {data.campaigns.map((item) => (
          <button
            className={data.selectedCampaign === item.id ? 'campaign-tab active' : 'campaign-tab'}
            type="button"
            key={item.id}
            onClick={() => patchData((current) => ({ ...current, selectedCampaign: item.id }))}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="campaign-meter">
        <div style={{ '--value': `${campaign.conversion}%` }}>
          <span>{campaign.conversion}%</span>
        </div>
        <dl>
          <div><dt>チャネル</dt><dd>{campaign.channel}</dd></div>
          <div><dt>リード</dt><dd>{campaign.leads}</dd></div>
          <div><dt>費用</dt><dd>¥{campaign.cost.toFixed(1)}M</dd></div>
          <div><dt>営業渡し</dt><dd>{Math.round(campaign.leads * campaign.conversion / 100)}</dd></div>
        </dl>
      </div>
    </article>
  )
}

function Metric({ label, value, delta, tone }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <em className={tone}>{delta}</em>
    </article>
  )
}

function PanelHeader({ title, detail, icon: Icon }) {
  return (
    <div className="panel-header">
      <div>
        <Icon size={18} />
        <h2>{title}</h2>
      </div>
      <span>{detail}</span>
      <button className="icon-button small" type="button" aria-label={`${title}の操作`}>
        <MoreHorizontal size={17} />
      </button>
    </div>
  )
}

function loadWorkspace() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : initialState
    return isValidWorkspace(parsed) ? normalizeWorkspace(parsed) : initialState
  } catch {
    return initialState
  }
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

function loadSession() {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    const session = stored ? JSON.parse(stored) : null
    return session?.token && session?.user ? session : null
  } catch {
    return null
  }
}

async function createSession(userId, pin) {
  try {
    const response = await fetch(SESSION_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, pin }),
    })
    if (!response.ok) throw new Error(`Login failed: ${response.status}`)
    return response.json()
  } catch {
    const demoUser = demoUsers.find((user) => user.id === userId && user.pin === pin)
    if (!demoUser) throw new Error('Login failed')
    return {
      token: `demo-${demoUser.id}`,
      user: { id: demoUser.id, name: demoUser.name, role: demoUser.role },
    }
  }
}

async function fetchWorkspace(token) {
  const response = await fetch(API_ENDPOINT, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) throw new Error(`Workspace load failed: ${response.status}`)
  const workspace = await response.json()
  if (!isValidWorkspace(workspace)) throw new Error('Workspace response is invalid')
  return normalizeWorkspace(workspace)
}

async function saveWorkspace(workspace, token, version) {
  const response = await fetch(API_ENDPOINT, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      'x-workspace-version': String(version ?? workspace._meta?.version ?? 0),
    },
    body: JSON.stringify(workspace),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(`Workspace save failed: ${response.status}`)
    error.status = response.status
    error.currentVersion = payload.currentVersion
    throw error
  }
  return {
    ...payload,
    workspace: normalizeWorkspace(payload.workspace),
  }
}

function roleLabel(role) {
  return {
    admin: '管理者',
    sales_manager: '営業マネージャー',
    support_agent: 'サポート担当',
    viewer: '閲覧者',
  }[role] ?? role
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

function matchesQuery(query, values) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return values.filter(Boolean).some((value) => String(value).toLowerCase().includes(normalized))
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(new Date(value))
}

function formatSla(minutes) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `${hours}h ${String(rest).padStart(2, '0')}m`
}

function localDateStamp() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function riskClass(value) {
  if (value === '高') return 'high'
  if (value === '中') return 'medium'
  return 'low'
}

function buildActions(data, selectedAccount) {
  const highRisk = data.opportunities.filter((item) => item.risk === '高')
  const urgentCase = data.cases.find((item) => item.priority === '高' && item.status !== '解決済み')
  const bestCampaign = [...data.campaigns].sort((a, b) => b.conversion - a.conversion)[0]
  return [
    highRisk.length
      ? `${highRisk[0].company} の高リスク商談を確認し、決裁者との確認MTGを設定`
      : `${selectedAccount.name} の更新契約に向けた次回接点を登録`,
    urgentCase
      ? `${urgentCase.id} はSLA残時間が短いため、${urgentCase.owner}へ即時エスカレーション`
      : '未解決ケースのSLA違反リスクは低い状態です',
    `${bestCampaign.name} の高スコアリードを営業担当へ自動割当`,
  ]
}

export default App
