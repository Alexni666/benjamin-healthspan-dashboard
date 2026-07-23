import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  Download,
  FileText,
  ImagePlus,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  Eye,
  EyeOff,
  Play,
  PlugZap,
  Route,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Users,
  WandSparkles,
  X,
} from 'lucide-react'

const storageKey = 'ai-reasoning-lab-demo:v2'
const visualImages = [
  'https://polo-pecan-73837341.figma.site/_assets/v11/94903fdf21e145cd4ba873c15fc03251c0600ee5.png',
  'https://polo-pecan-73837341.figma.site/_assets/v11/0c38fdb8a933b0da384a5a3f8b0d9986bb919838.png',
  'https://polo-pecan-73837341.figma.site/_assets/v11/d8d9bd498347ea96ca4d675a624c8d90e06786e7.png',
]

type Inputs = {
  story: string
  rules: string
  people: string
  duration: string
}

type SavedLab = {
  step: number
  maxVisited: number
  inputs: Inputs
  selectedPlan: string
  writerNote: string
  executionConstraints: string
  reviewedInsights: string[]
  revisionDrafts: Record<string, string>
  fixes: string[]
  playtestStarted: boolean
  secondTestDone: boolean
}

const defaultInputs: Inputs = {
  story: '雾岭山中的老旅馆重启前夜，档案被调换，第七把钥匙失踪。六名相关人物必须找回钥匙并识别调包者。',
  rules: '玩家可自由搜证、交换信息；每人有公开身份和个人任务；最终需要开启档案前室并完成投票。',
  people: '6',
  duration: '90 分钟',
}

const stages = [
  ['01', '创作基线'],
  ['02', '故事理解'],
  ['03', '内容推演'],
  ['04', '空间与视觉'],
  ['05', '模拟与迭代'],
  ['06', '决策报告'],
]

const plans = [
  { id: 'A', title: '集中控制型', meta: '拍摄与执行优先', copy: '以大堂为中枢，六个功能区围绕核心动线展开。控场、跟拍和人员调度更稳定。' },
  { id: 'B', title: '探索强化型', meta: '沉浸与搜证优先', copy: '采用长廊与分层空间，增加隐藏区域和探索距离，换取更强的发现感。' },
  { id: 'C', title: '低改造成本型', meta: '现成场地优先', copy: '复用客房、餐厅、会议室与后勤通道，降低搭建成本和勘景难度。' },
]

const players = [
  ['强推理型', '尝试合并信息并提前触发结局', '发现钟厅谜题可能被提前观察'],
  ['完成主义型', '逐项搜索，不愿跳过低价值道具', '中段可能出现 17 分钟连续搜证'],
  ['钻漏洞型', '只满足字面条件就要求开门', '成功绕过“4 条线索”的模糊门槛'],
  ['规则误解型', '把个人任务当成公共前置条件', '错误操作缺少恢复提示'],
  ['被动跟随型', '等待队友决定，较少主动共享', '2 个角色前 30 分钟参与不足'],
  ['综艺效果型', '频繁表达、质疑和绕行', '主门拥堵放大跟拍与控场压力'],
]

const risks = [
  ['P0', '档案开启规则', '“4 条关键线索”未定义类别，结局可被越级触发。'],
  ['P0', '隐藏通道死路', '断路器卡是唯一触发，遗漏后整局无法推进。'],
  ['P1', '角色前段闲置', '两名角色的有效任务启动过晚。'],
  ['P1', '图书室门口拥堵', '1.2 米主门承受六人和跟拍反复进出。'],
  ['P1', '祖父钟机关暴露', '餐厅视线可以提前看到暗格缝隙。'],
  ['P1', '执行人员不足', '两名工作人员无法兼顾控场、复位、NPC 与安全。'],
]

const fixes = [
  ['rule', '重写开门条件', '第七把钥匙＋路线证据＋动机证据，三类条件必须同时成立。'],
  ['route', '增加备用通路', '50 分钟仍未开启时由维修 NPC 释放日志，并开放第二通路。'],
  ['role', '前置角色任务', '10 分钟开放照片比对，25 分钟开放钟表校准。'],
  ['flow', '调整图书室动线', '新增餐厅侧门，形成主门进、侧门出的单向循环。'],
  ['prop', '隐藏核心机关', '钟体旋转 15 度并增加内衬，只有正确时间才显示暗格。'],
  ['crew', '补齐执行配置', '配置 6 名核心执行、3 个固定机位与 2 组跟拍。'],
]

const scoreRows = [
  ['规则完整性', 58, 88],
  ['线索闭环', 70, 90],
  ['角色参与', 62, 84],
  ['空间动线', 60, 85],
  ['节奏体验', 66, 84],
  ['执行可行', 64, 86],
  ['拍摄安全', 70, 84],
]

const insights = [
  ['premise', '核心命题', '一场围绕“谁有权保管真相”展开的封闭空间悬疑。失踪的钥匙既是行动目标，也是档案归属权的象征。', '来源：故事详情第 1 段＋最终投票规则', '高'],
  ['conflict', '主冲突结构', '公开目标是找回第七把钥匙；隐藏冲突是六人对档案真实性和调包者动机的不同判断。', '来源：故事目标＋角色规则', '高'],
  ['world', '世界与规则边界', '旅馆在重启前夜处于封闭管理状态，玩家可以自由搜证，但结局必须通过证据组合与集体投票触发。', '来源：游戏规则；封闭范围需编剧确认', '中'],
  ['characters', '人物关系动力', '六个角色需要同时具备公开身份、私人动机和不对称信息，避免所有人只围绕同一把钥匙行动。', '来源：人物数量＋个人任务规则', '中'],
  ['timeline', '戏剧时间线', '故事需要在 90 分钟内完成进入、分散搜证、断电事件、路线重建、档案开启和集中判断六个阶段。', '来源：预计时长＋结局条件', '中'],
  ['experience', '体验目标', '让玩家先形成不同解释，再通过空间行动和证据交换逐步收束，而不是依赖主持人一次性揭晓。', 'AI推断；需要编剧确认创作意图', '待确认'],
]

const fixWeights: Record<string, number> = {
  rule: 6,
  route: 5,
  role: 3,
  flow: 3,
  prop: 2,
  crew: 2,
}

const fixImpacts: Record<string, Record<string, number>> = {
  rule: { 规则完整性: 24, 线索闭环: 5 },
  route: { 线索闭环: 12, 节奏体验: 4 },
  role: { 角色参与: 16, 节奏体验: 4 },
  flow: { 空间动线: 17, 拍摄安全: 5 },
  prop: { 规则完整性: 4, 线索闭环: 3 },
  crew: { 执行可行: 18, 拍摄安全: 9 },
}

const defaultRevisionDrafts = Object.fromEntries(fixes.map(([id, , copy]) => [id, copy]))

function loadSaved(): SavedLab {
  const fallback: SavedLab = {
    step: 0,
    maxVisited: 0,
    inputs: defaultInputs,
    selectedPlan: 'A',
    writerNote: '',
    executionConstraints: '',
    reviewedInsights: [],
    revisionDrafts: defaultRevisionDrafts,
    fixes: [],
    playtestStarted: false,
    secondTestDone: false,
  }
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}') as Partial<SavedLab>
    return {
      ...fallback,
      ...stored,
      inputs: { ...defaultInputs, ...(stored.inputs || {}) },
      revisionDrafts: { ...defaultRevisionDrafts, ...(stored.revisionDrafts || {}) },
      step: Math.min(Math.max(stored.step || 0, 0), stages.length - 1),
      maxVisited: Math.min(Math.max(stored.maxVisited || 0, 0), stages.length - 1),
    }
  } catch {
    return fallback
  }
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`lab-panel ${className}`}>{children}</section>
}

function StageHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <header className="lab-stage-heading mb-7 max-w-3xl">
      <p className="mb-2 text-[11px] font-semibold tracking-[.22em] text-[#f2ca94]">{eyebrow}</p>
      <h1 className="text-2xl font-semibold tracking-[-.03em] text-white sm:text-3xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">{copy}</p>
    </header>
  )
}

function PlanSketch({ variant }: { variant: string }) {
  const rooms = variant === 'A'
    ? [[35, 35, 130, 80], [5, 5, 68, 23], [92, 5, 68, 23], [5, 122, 68, 23], [92, 122, 68, 23]]
    : variant === 'B'
      ? [[8, 18, 55, 45], [70, 18, 55, 45], [132, 18, 35, 110], [70, 83, 55, 45], [8, 83, 55, 45]]
      : [[8, 10, 72, 55], [90, 10, 72, 55], [8, 78, 72, 55], [90, 78, 72, 55]]
  return (
    <svg viewBox="0 0 175 155" className="h-full w-full" role="img" aria-label={`${variant} 方案平面示意`}>
      <rect x="1" y="1" width="173" height="153" rx="8" fill="rgba(3,8,11,.5)" stroke="rgba(255,255,255,.12)" />
      {rooms.map(([x, y, w, h], index) => <rect key={index} x={x} y={y} width={w} height={h} rx="3" fill={index === 0 ? 'rgba(239,184,118,.24)' : 'rgba(119,209,220,.11)'} stroke={index === 0 ? '#efb876' : 'rgba(141,221,230,.55)'} strokeWidth="1.2" />)}
      <path d={variant === 'A' ? 'M87 35V16M87 115v27M35 75H15M165 75h-35' : variant === 'B' ? 'M63 41h7M125 41h7M63 105h7M125 105h7' : 'M80 37h10M80 105h10M45 65v13M126 65v13'} stroke="#f5d3a4" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx={variant === 'A' ? 100 : 148} cy={variant === 'A' ? 74 : 111} r="5" fill="#ef7e51" />
      <circle cx={variant === 'C' ? 46 : 55} cy={variant === 'C' ? 105 : 45} r="4" fill="#87d5df" />
    </svg>
  )
}

function ScoreBar({ label, value, after }: { label: string; value: number; after?: number }) {
  return (
    <div className="grid grid-cols-[88px_1fr_34px] items-center gap-3 text-xs">
      <span className="text-white/70">{label}</span>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-white/8">
        <span className="absolute inset-y-0 left-0 rounded-full bg-[#d77751]" style={{ width: `${value}%` }} />
        {after !== undefined && <span className="absolute inset-y-0 left-0 rounded-full bg-[#74c6cf]" style={{ width: `${after}%` }} />}
      </div>
      <strong className={after !== undefined ? 'text-[#9ce2e8]' : 'text-white/75'}>{after ?? value}</strong>
    </div>
  )
}

export default function ReasoningLab({ onBack }: { onBack: () => void }) {
  const [lab, setLab] = useState<SavedLab>(loadSaved)
  const [uploads, setUploads] = useState<Record<number, string>>({})
  const [copied, setCopied] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [deepSeekModel, setDeepSeekModel] = useState('deepseek-v4-pro')
  const [connection, setConnection] = useState<{ state: 'idle' | 'testing' | 'connected' | 'error'; message: string }>({ state: 'idle', message: '尚未验证连接' })

  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(lab)), [lab])

  const updateLab = (patch: Partial<SavedLab>) => setLab(current => ({ ...current, ...patch }))
  const updateInput = (key: keyof Inputs, value: string) => setLab(current => ({ ...current, inputs: { ...current.inputs, [key]: value } }))
  const go = (nextStep: number) => setLab(current => ({ ...current, step: nextStep, maxVisited: Math.max(current.maxVisited, nextStep) }))
  const next = () => go(Math.min(lab.step + 1, stages.length - 1))
  const simulatedScore = Math.min(89, 68 + lab.fixes.reduce((total, id) => total + (fixWeights[id] || 0), 0))
  const secondScore = lab.secondTestDone ? simulatedScore : 68
  const readyForTabletop = lab.secondTestDone && lab.fixes.includes('rule') && lab.fixes.includes('route') && secondScore >= 79

  const aiPrompt = useMemo(() => `你是编剧部门的内容推理顾问。请根据以下资料输出：核心命题、世界规则、主冲突、人物关系与信息差、故事时间线、待确认问题、剧情节点、角色任务、证据链和异常恢复。所有推断必须注明依据和置信度，不替代编剧的最终判断。\n\n故事：${lab.inputs.story}\n规则：${lab.inputs.rules}\n人数：${lab.inputs.people}\n时长：${lab.inputs.duration}\n编剧补充：${lab.writerNote}`, [lab.inputs, lab.writerNote])

  const toggleInsight = (id: string) => updateLab({ reviewedInsights: lab.reviewedInsights.includes(id) ? lab.reviewedInsights.filter(item => item !== id) : [...lab.reviewedInsights, id] })
  const updateRevision = (id: string, value: string) => updateLab({ revisionDrafts: { ...lab.revisionDrafts, [id]: value }, secondTestDone: false })
  const toggleFix = (id: string) => updateLab({ fixes: lab.fixes.includes(id) ? lab.fixes.filter(item => item !== id) : [...lab.fixes, id], secondTestDone: false })
  const dimensionAfter = (label: string, before: number, target: number) => {
    if (!lab.secondTestDone) return before
    const increase = lab.fixes.reduce((total, id) => total + (fixImpacts[id]?.[label] || 0), 0)
    return Math.min(target, before + increase)
  }

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(aiPrompt)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const testDeepSeekConnection = async () => {
    if (!apiKey.trim()) {
      setConnection({ state: 'error', message: '请先填写 DeepSeek API Key。' })
      return
    }
    setConnection({ state: 'testing', message: '正在验证连接…' })
    try {
      const response = await fetch('/api/deepseek/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })
      const result = await response.json() as { ok?: boolean; message?: string }
      if (!response.ok || !result.ok) throw new Error(result.message || '连接验证失败')
      setConnection({ state: 'connected', message: `${deepSeekModel === 'deepseek-v4-pro' ? 'V4 Pro' : 'V4 Flash'} 连接验证成功` })
    } catch (error) {
      setConnection({ state: 'error', message: error instanceof Error ? error.message : '连接验证失败，请检查密钥。' })
    }
  }

  const loadVisual = (index: number, file?: File) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      window.alert('请选择小于 5MB 的图片。')
      return
    }
    setUploads(current => ({ ...current, [index]: URL.createObjectURL(file) }))
  }

  const exportReport = () => {
    const report = [
      'AI 内容推理实验室｜概念验证报告',
      '',
      `故事：${lab.inputs.story}`,
      `规则：${lab.inputs.rules}`,
      `人数：${lab.inputs.people}`,
      `时长：${lab.inputs.duration}`,
      `采用方案：${lab.selectedPlan} ${plans.find(plan => plan.id === lab.selectedPlan)?.title}`,
      '',
      `创作基线版本：V1.0`,
      `验证后版本：${lab.secondTestDone ? 'V1.1' : '尚未运行二次验证'}`,
      `首轮结构成熟度：68`,
      `验证后成熟度：${secondScore}`,
      `结论：${readyForTabletop ? '建议进入 6 人真人桌面试玩，不直接进入完整实景。' : '仍有关键问题未修复，暂不进入真人试玩。'}`,
      '',
      '已纳入 V1.1 的编剧与执行修改：',
      ...fixes.filter(([id]) => lab.fixes.includes(id)).map(([id, title]) => `- ${title}：${lab.revisionDrafts[id]}`),
      '',
      '仍需真人验证：23:17 谜题难度、隐藏角色平衡、听证时长、真实动线、机关手感与安全。',
      '',
      '说明：本报告当前由网页演示规则生成；DeepSeek 仅提供连接验证，尚未自动分析本项目。',
    ].join('\n')
    const url = URL.createObjectURL(new Blob([report], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = '内容推理实验报告.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    if (!window.confirm('确定重新开始吗？当前实验记录会被清除。')) return
    localStorage.removeItem(storageKey)
    setLab(loadSaved())
    setUploads({})
  }

  const content = (() => {
    if (lab.step === 0) return (
      <>
        <StageHeading eyebrow="01 / CREATIVE BASELINE" title="建立创作基线" copy="导入故事、互动规则与体验规模，作为编剧部门和后续推演共同引用的起始版本。制作与场地限制将在空间阶段补充。" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel><label className="lab-field-label"><FileText size={15} />故事详情</label><textarea value={lab.inputs.story} onChange={event => updateInput('story', event.target.value)} rows={5} /></Panel>
          <Panel><label className="lab-field-label"><LockKeyhole size={15} />游戏规则</label><textarea value={lab.inputs.rules} onChange={event => updateInput('rules', event.target.value)} rows={5} /></Panel>
          <Panel><label className="lab-field-label"><Users size={15} />人物数量</label><input value={lab.inputs.people} onChange={event => updateInput('people', event.target.value)} /><p className="lab-field-help">用于推导角色关系、信息差和参与度。</p></Panel>
          <Panel><label className="lab-field-label"><Clock3 size={15} />预计时长</label><input value={lab.inputs.duration} onChange={event => updateInput('duration', event.target.value)} /><p className="lab-field-help">用于建立剧情阶段、线索释放和高潮时点。</p></Panel>
        </div>
      </>
    )

    if (lab.step === 1) return (
      <>
        <StageHeading eyebrow="02 / STORY ALIGNMENT" title="故事理解与创作对齐" copy="AI将故事拆成命题、冲突、世界规则、人物动力、时间线和体验目标。每条推断都显示依据与置信度，由编剧确认或修正。" />
        <div className="grid gap-4 xl:grid-cols-2">
          {insights.map(([id, title, copy, evidence, confidence]) => {
            const reviewed = lab.reviewedInsights.includes(id)
            return <Panel className="lab-insight-card" key={id}>
              <div className="flex items-start justify-between gap-4"><div><span className="lab-tag">置信度 {confidence}</span><h2 className="mt-4 text-base font-semibold">{title}</h2></div><button type="button" className={`lab-review-button ${reviewed ? 'lab-review-button-active' : ''}`} onClick={() => toggleInsight(id)}>{reviewed ? <Check size={13} /> : <BrainCircuit size={13} />}{reviewed ? '编剧已确认' : '待编剧确认'}</button></div>
              <p className="mt-3 text-sm leading-6 text-white/75">{copy}</p>
              <p className="mt-4 border-t border-white/8 pt-3 text-[11px] leading-5 text-white/40">{evidence}</p>
            </Panel>
          })}
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
          <Panel><div className="flex items-center gap-2"><AlertTriangle size={16} className="text-[#efb876]" /><h2 className="text-sm font-semibold">待确认问题</h2></div><div className="mt-4 space-y-3">{['档案调包发生在断电之前还是之后？', '调包者的行为是个人动机，还是受旅馆规则强制？', '投票失败后是否允许重新搜证或进入另一结局？'].map((item, index) => <div className="lab-question-row" key={item}><span>{String(index + 1).padStart(2, '0')}</span><p>{item}</p></div>)}</div></Panel>
          <Panel><label className="lab-field-label"><FileText size={15} />编剧修正与补充</label><textarea rows={6} placeholder="修正AI理解、补充创作意图，或明确不允许改变的设定。" value={lab.writerNote} onChange={event => updateLab({ writerNote: event.target.value })} /><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-white/40">已确认 {lab.reviewedInsights.length} / {insights.length} 项</p><button type="button" className="lab-secondary-button" onClick={copyPrompt}><Clipboard size={15} />{copied ? '已复制' : '复制完整分析提示词'}</button></div></Panel>
        </div>
      </>
    )

    if (lab.step === 2) return (
      <>
        <StageHeading eyebrow="03 / CONTENT REASONING" title="内容推理与体验设计" copy="把故事理解转成可编辑的剧情节点、人物任务、信息差、证据链、机关触发和失败恢复。编剧可以继续补充方向，而不是只接收AI结论。" />
        <Panel className="mb-4">
          <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] tracking-[.16em] text-white/40">STORY BEAT MAP</p><h2 className="mt-1 text-sm font-semibold">{lab.inputs.duration} 剧情节点</h2></div><span className="lab-tag">6 个可编辑节点</span></div>
          <div className="lab-timeline mt-6">{['入场仪式', '自由搜证', '断电调包', '空间追踪', '钥匙机关', '集中推理'].map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></div>)}</div>
        </Panel>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['人物关系与信息差', '6 个公开身份分别拥有私人动机、独占信息和行动权限；调包者不能成为唯一掌握真相的人。', '角色结构'],
            ['证据链与验证逻辑', '钥匙标记＋老照片形成身份链；维修粉＋值班日志形成路线链；两条链在档案前室交叉验证。', '线索闭环'],
            ['机关触发与异常恢复', '祖父钟 23:17 暗格、后勤隐藏通道、档案前室三段空间事件；每个单点机关都需要备用触发。', '规则系统'],
            ['分支、误导与结局条件', '错误指认不会立即失败，而是开放补充搜证；档案开启需要钥匙、路线、动机三类条件同时成立。', '分支结构'],
          ].map(([title, copy, tag]) => <Panel key={title}><span className="lab-tag">{tag}</span><h2 className="mt-5 text-base font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-white/55">{copy}</p></Panel>)}
        </div>
        <Panel className="mt-4"><label className="lab-field-label"><BrainCircuit size={15} />编剧主导意见</label><textarea rows={3} placeholder="例如：保留调包者的道德灰度，不允许系统把结局改成单一抓凶。" value={lab.writerNote} onChange={event => updateLab({ writerNote: event.target.value })} /></Panel>
      </>
    )

    if (lab.step === 3) return (
      <>
        <StageHeading eyebrow="04 / SPACE & VISUAL" title="空间策略、平面与视觉" copy="先选择一个空间策略，再围绕同一版本生成三张平面图和三张场景效果图。多层或复杂场地可继续增加楼层与重点区域。" />
        <div className="mb-4 flex items-center justify-between gap-4"><div><p className="text-[10px] tracking-[.16em] text-white/40">SPACE STRATEGY</p><h2 className="mt-1 text-sm font-semibold">选择内容与空间的组织方式</h2></div><span className="lab-tag">选择 1 个方向</span></div>
        <div className="grid gap-4 xl:grid-cols-3">
          {plans.map(plan => <button type="button" className={`lab-plan-card ${lab.selectedPlan === plan.id ? 'lab-plan-card-selected' : ''}`} onClick={() => updateLab({ selectedPlan: plan.id })} key={plan.id}>
            <div className="lab-plan-sketch"><PlanSketch variant={plan.id} /></div>
            <div className="mt-5 flex items-start justify-between"><div><span className="text-xs text-[#efb876]">方案 {plan.id}</span><h2 className="mt-1 text-lg font-semibold">{plan.title}</h2></div>{lab.selectedPlan === plan.id && <CheckCircle2 className="text-[#8fd8df]" size={20} />}</div>
            <p className="mt-3 text-xs tracking-[.12em] text-white/35">{plan.meta}</p><p className="mt-3 text-sm leading-6 text-white/55">{plan.copy}</p>
          </button>)}
        </div>
        <Panel className="mt-4"><label className="lab-field-label"><Layers3 size={15} />执行边界（此阶段可选）</label><textarea rows={2} placeholder="已知场地层数、面积、预算等级、不可改造区域、消防或机关限制。" value={lab.executionConstraints} onChange={event => updateLab({ executionConstraints: event.target.value })} /><p className="lab-field-help">没有确定条件时可以留空，不影响前面的故事与内容推演。</p></Panel>

        <div className="mb-4 mt-8 flex items-center justify-between gap-4"><div><p className="text-[10px] tracking-[.16em] text-white/40">SELECTED DIRECTION · V1.0</p><h2 className="mt-1 text-sm font-semibold">{plans.find(plan => plan.id === lab.selectedPlan)?.title}｜三张平面图</h2></div><span className="lab-tag">同一空间版本</span></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            ['总体空间关系图', '入口、公共区、搜证区、高潮区与后勤区的连接关系'],
            ['主要楼层平面图', '房间尺度、玩家路线、工作人员路线与楼层连接'],
            ['关键区域详图', '钟厅机关、隐藏通道与档案前室的触发和安全范围'],
          ].map(([title, copy], index) => <Panel key={title}><div className="aspect-[4/3] rounded-xl bg-[#070b0d] p-3"><PlanSketch variant={['A', 'B', 'C'][index]} /></div><div className="mt-4 flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-[11px] leading-5 text-white/40">{copy}</p></div><span className="lab-tag">{String(index + 1).padStart(2, '0')}</span></div></Panel>)}
        </div>

        <div className="mb-4 mt-8"><p className="text-[10px] tracking-[.16em] text-white/40">SCENE VISUALS</p><h2 className="mt-1 text-sm font-semibold">基于内容和平面图生成的场景效果示意</h2></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {['大堂与信息交换区', '钟厅核心机关区', '隐藏档案前室'].map((title, index) => <Panel key={title}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg, transparent, rgba(3,5,6,.72)), url(${uploads[index] || visualImages[index]})` }}><span className="absolute bottom-3 left-3 text-xs font-medium">{title}</span></div>
            <div className="mt-4 flex items-center justify-between"><div><p className="text-sm font-semibold">效果示意 {index + 1}</p><p className="mt-1 text-[11px] text-white/35">与 V1.0 平面版本关联 · 可替换</p></div><label className="lab-icon-button cursor-pointer"><ImagePlus size={15} /><input type="file" accept="image/*" hidden onChange={event => { loadVisual(index, event.target.files?.[0]); event.target.value = '' }} /></label></div>
          </Panel>)}
        </div>
      </>
    )

    if (lab.step === 4) return (
      <>
        <StageHeading eyebrow="05 / VALIDATION LOOP" title="模拟验证与版本迭代" copy="模拟是可选验证工具，不再独立占用多个步骤。系统先保存 V1.0，再检查规则、角色、线索、节奏和空间；编剧修改实际方案后，才会重新验证并生成 V1.1。" />
        {!lab.playtestStarted ? <Panel className="lab-simulation-entry">
          <div><span className="lab-simulation-icon"><Play size={22} /></span><p className="mt-5 text-[10px] tracking-[.16em] text-white/40">OPTIONAL VALIDATION</p><h2 className="mt-2 text-xl font-semibold">运行一次模拟验证</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/55">可同时运行快速逻辑检查、六类玩家行为和空间动线检查。跳过模拟也能查看初步结论，但报告会明确标记验证覆盖不足。</p><div className="mt-5 flex flex-wrap gap-2">{['规则与异常恢复', '六类玩家行为', '角色参与平衡', '线索闭环', '空间拥堵', '执行与安全'].map(item => <span className="lab-tag" key={item}>{item}</span>)}</div></div>
          <div className="mt-6 flex flex-wrap gap-3"><button type="button" className="lab-primary-button" onClick={() => updateLab({ playtestStarted: true })}><Play size={15} />运行模拟验证</button><button type="button" className="lab-secondary-button" onClick={() => go(5)}>跳过，查看初步结论</button></div>
        </Panel> : <>
          <div className="lab-metric-grid">
            {[['68', '结构成熟度', '首轮基线'], ['78%', '证据覆盖', '已检查 32 项'], ['2', 'P0 阻断', '必须处理'], ['6', '玩家类型', '行为路径覆盖']].map(([value, label, note], index) => <Panel className="lab-metric-card" key={label}><span>{label}</span><strong className={index === 2 ? 'text-[#ffab8d]' : ''}>{value}</strong><small>{note}</small></Panel>)}
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
            <Panel><div className="flex items-center gap-2"><Activity size={16} className="text-[#9ce2e8]" /><h2 className="text-sm font-semibold">七维结构检查</h2></div><div className="mt-6 space-y-4">{scoreRows.map(([label, before]) => <ScoreBar label={String(label)} value={Number(before)} key={String(label)} />)}</div></Panel>
            <Panel><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] tracking-[.16em] text-white/40">PLAYER PATHS</p><h2 className="mt-1 text-sm font-semibold">六类玩家行为结果</h2></div><span className="lab-tag">演示样本</span></div><div className="lab-player-grid mt-5">{players.map(([name, , result], index) => <div key={name}><div className="flex items-center justify-between gap-2"><strong>{name}</strong><span className={`lab-risk-pill ${index === 2 ? 'lab-risk-p0' : ''}`}>{index === 2 ? 'P0' : index === 0 || index === 4 ? 'P1' : '通过'}</span></div><p>{result}</p></div>)}</div></Panel>
          </div>
          <Panel className="mt-4"><div className="flex items-center gap-2"><AlertTriangle size={16} className="text-[#efb876]" /><h2 className="text-sm font-semibold">风险、触发条件与证据</h2></div><div className="mt-5 grid gap-3 xl:grid-cols-2">{risks.map(([level, title, copy]) => <div className="lab-risk-row" key={title}><span className={`lab-risk-pill ${level === 'P0' ? 'lab-risk-p0' : ''}`}>{level}</span><div><strong>{title}</strong><p>{copy}</p><small>证据：规则路径模拟＋空间触发检查</small></div></div>)}</div></Panel>
          <div className="mt-8 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
            <div><div className="mb-4"><p className="text-[10px] tracking-[.16em] text-white/40">WRITER REVISION</p><h2 className="mt-1 text-sm font-semibold">编辑真实修改内容，再纳入 V1.1</h2></div><div className="grid gap-3">{fixes.map(([id, title]) => {
              const active = lab.fixes.includes(id)
              return <section className={`lab-revision-card ${active ? 'lab-revision-card-active' : ''}`} key={id}><div className="flex items-center justify-between gap-4"><div><span className="lab-tag">{id === 'rule' || id === 'route' || id === 'role' ? '编剧部门' : '执行辅助'}</span><h3 className="mt-2 text-sm font-semibold">{title}</h3></div><button type="button" className={`lab-review-button ${active ? 'lab-review-button-active' : ''}`} onClick={() => toggleFix(id)}>{active ? <Check size={13} /> : <ArrowRight size={13} />}{active ? '已纳入 V1.1' : '纳入修改'}</button></div><textarea rows={2} value={lab.revisionDrafts[id]} onChange={event => updateRevision(id, event.target.value)} /></section>
            })}</div></div>
            <Panel className="h-fit xl:sticky xl:top-6"><p className="text-[10px] tracking-[.16em] text-white/40">VERSION EVIDENCE</p><div className="mt-5 flex items-center justify-between"><div><strong className="text-4xl">68</strong><p className="mt-1 text-[11px] text-white/35">V1.0 基线</p></div><ArrowRight className="text-white/25" /><div className="text-right"><strong className="text-4xl text-[#9ce2e8]">{lab.secondTestDone ? secondScore : '—'}</strong><p className="mt-1 text-[11px] text-white/35">V1.1 验证后</p></div></div><p className="mt-6 text-xs leading-5 text-white/55">已编辑并纳入 {lab.fixes.length} 项。分数不会因勾选直接变化，只有重新运行验证后才更新。</p><button type="button" className="lab-primary-button mt-6 w-full justify-center" disabled={lab.fixes.length === 0} onClick={() => updateLab({ secondTestDone: true })}><RefreshCw size={15} />重新运行受影响检查</button>{lab.secondTestDone && <div className="mt-4 rounded-lg bg-[#8fd8df]/8 p-3 text-xs leading-5 text-[#b5eef2]"><CheckCircle2 className="mr-2 inline" size={14} />已重跑 {lab.fixes.length + 3} 条受影响路径，结果已写入 V1.1。</div>}</Panel>
          </div>
        </>}
      </>
    )

    if (lab.step === 5) return (
      <>
        <StageHeading eyebrow="06 / DECISION BOARD" title={readyForTabletop ? '进入真人桌面验证' : lab.playtestStarted ? '完成关键修改后再推进' : '初步审查完成，验证覆盖不足'} copy="决策看板同时展示版本差异、结构质量、证据覆盖、剩余风险和真人验证任务。AI给出推进依据，但不替代编剧判断与执行安全责任。" />
        <div className="lab-metric-grid">
          {[[String(secondScore), lab.secondTestDone ? 'V1.1 成熟度' : 'V1.0 成熟度', lab.secondTestDone ? `较基线 +${secondScore - 68}` : '尚未二次验证'], [lab.playtestStarted ? lab.secondTestDone ? '91%' : '78%' : '46%', '证据覆盖率', lab.playtestStarted ? '含模拟路径' : '仅结构审查'], [readyForTabletop ? '0' : lab.fixes.includes('rule') && lab.fixes.includes('route') ? '待复测' : '2', '剩余 P0', readyForTabletop ? '已清除' : '阻断推进'], [String(lab.reviewedInsights.length), '编剧确认项', `共 ${insights.length} 项`]].map(([value, label, note], index) => <Panel className="lab-metric-card" key={label}><span>{label}</span><strong className={index === 2 && !readyForTabletop ? 'text-[#ffab8d]' : ''}>{value}</strong><small>{note}</small></Panel>)}
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[.78fr_1.22fr]">
          <Panel><div className="flex items-center gap-2"><Activity size={16} className="text-[#9ce2e8]" /><h2 className="text-sm font-semibold">结构质量与验证结果</h2></div><div className="mt-6 space-y-4">{scoreRows.map(([label, before, target]) => <ScoreBar label={String(label)} value={Number(before)} after={lab.secondTestDone ? dimensionAfter(String(label), Number(before), Number(target)) : undefined} key={String(label)} />)}</div><p className="mt-6 text-[11px] leading-5 text-white/40">每项结果由规则检查、模拟路径和编剧确认共同构成；点击式修改不会直接提高分数。</p></Panel>
          <div className="space-y-4">
            <Panel><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] tracking-[.16em] text-white/40">VERSION DIFFERENCE</p><h2 className="mt-1 text-sm font-semibold">V1.0 → V1.1 修改证据</h2></div><span className="lab-tag">{lab.fixes.length} 项变更</span></div>{lab.fixes.length > 0 ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{fixes.filter(([id]) => lab.fixes.includes(id)).map(([id, title]) => <div className="lab-version-change" key={id}><CheckCircle2 size={15} /><div><strong>{title}</strong><p>{lab.revisionDrafts[id]}</p></div></div>)}</div> : <p className="mt-5 text-sm text-white/45">尚未形成 V1.1。返回“模拟与迭代”编辑修改内容并重新验证。</p>}</Panel>
            <Panel><div className="flex items-center gap-2"><Route size={16} className="text-[#efb876]" /><h2 className="text-sm font-semibold">仍需真人验证</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{['23:17 谜题难度是否适中', '调包者隐藏目标是否平衡', '集中判断阶段是否过长', '真实楼层动线是否自然', '机关手感、故障率与安全', '现场演员对异常情况的恢复能力'].map(item => <div className="lab-human-check" key={item}><span /><p>{item}</p></div>)}</div></Panel>
            <Panel className={readyForTabletop ? 'ring-1 ring-[#8fd8df]/50' : 'ring-1 ring-[#ef8b66]/35'}><div className="flex items-center justify-between gap-5"><div><p className="text-[10px] tracking-[.16em] text-white/40">NEXT GATE</p><p className="mt-2 text-base font-semibold">{readyForTabletop ? `${lab.inputs.people} 人真人桌面试玩，不直接进入完整实景` : lab.playtestStarted ? '返回版本迭代，处理 P0 并重新验证' : '建议先运行模拟验证，提高报告可信度'}</p></div><CheckCircle2 className={readyForTabletop ? 'text-[#9ce2e8]' : 'text-[#ef8b66]'} /></div></Panel>
            <div className="flex flex-wrap gap-3"><button type="button" className="lab-primary-button" onClick={exportReport}><Download size={15} />下载决策报告</button><button type="button" className="lab-secondary-button" onClick={reset}><RefreshCw size={15} />重新开始</button></div>
          </div>
        </div>
      </>
    )

    return null
  })()

  const showNext = lab.step < stages.length - 1
  const nextLabels = ['分析故事', '进入内容推演', '生成空间与视觉', '进入模拟与迭代', '查看决策报告']

  return (
    <main className="lab-shell min-h-[100svh] text-white">
      <video className="lab-background-video" src="/dna-background.mp4" autoPlay loop muted playsInline preload="auto" aria-hidden="true" />
      <div className="lab-background-wash" aria-hidden="true" />
      <div className="lab-background-grid" aria-hidden="true" />
      <aside className="lab-sidebar">
        <button type="button" className="lab-back-button" onClick={onBack}><ArrowLeft size={16} />返回实验场</button>
        <div className="mt-8 flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">内容推理实验室</p><p className="mt-1 text-[10px] tracking-[.2em] text-white/50">AI REASONING LAB</p></div><button type="button" className="lab-settings-icon" aria-label="打开模型设置" onClick={() => setSettingsOpen(true)}><Settings2 size={15} /></button></div>
        <nav className="mt-8 grid grid-cols-3 gap-1 sm:grid-cols-6 lg:grid-cols-1" aria-label="实验进度">
          {stages.map(([number, label], index) => <button type="button" disabled={index > lab.maxVisited} className={`lab-stage-button ${index === lab.step ? 'lab-stage-button-active' : ''}`} onClick={() => go(index)} key={number}><span>{number}</span><strong>{label}</strong>{index < lab.step && <Check size={13} />}</button>)}
        </nav>
        <div className="lab-demo-note mt-auto hidden rounded-xl p-3 text-[11px] leading-5 text-white/55 lg:block"><span className="mb-2 inline-flex items-center gap-1.5 text-[#aee9ee]"><WandSparkles size={13} />演示模式</span><br />API 已保留但未调用。页面使用预置样本和本地计算。</div>
      </aside>

      <section className="lab-workspace">
        <header className="lab-topbar"><div className="flex items-center gap-2 text-[11px] text-white/55"><LayoutDashboard size={14} /><span>实验控制台</span><span>/</span><span className="text-white/85">{stages[lab.step][1]}</span></div><div className="flex items-center gap-2"><span className={`lab-connection-badge ${connection.state === 'connected' ? 'lab-connection-badge-active' : ''}`}><span />{connection.state === 'connected' ? 'DeepSeek 已验证' : '模型未连接'}</span><button type="button" className="lab-model-button" onClick={() => setSettingsOpen(true)}><Settings2 size={13} />模型设置</button></div></header>
        <div className="lab-content">{content}</div>
        <footer className="lab-footer">
          <button type="button" className="lab-secondary-button" disabled={lab.step === 0} onClick={() => go(Math.max(0, lab.step - 1))}><ArrowLeft size={15} />上一步</button>
          {showNext && <button type="button" className="lab-primary-button" onClick={next}>{nextLabels[lab.step]}<ArrowRight size={15} /></button>}
        </footer>
      </section>

      {settingsOpen && (
        <div className="lab-settings-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSettingsOpen(false) }}>
          <section className="lab-settings-panel" role="dialog" aria-modal="true" aria-labelledby="model-settings-title">
            <div className="lab-settings-header">
              <div><p className="lab-settings-kicker">REASONING ENGINE</p><h2 id="model-settings-title">模型设置</h2><p>优先接入 DeepSeek，用于后续故事理解与内容推演。</p></div>
              <button type="button" aria-label="关闭模型设置" onClick={() => setSettingsOpen(false)}><X size={18} /></button>
            </div>

            <div className="lab-provider-card">
              <div className="lab-provider-mark">DS</div>
              <div><strong>DeepSeek</strong><span>首选推理服务 · OpenAI 兼容接口</span></div>
              <span className="lab-provider-status">优先</span>
            </div>

            <label className="lab-settings-field">
              <span>模型</span>
              <select value={deepSeekModel} onChange={event => { setDeepSeekModel(event.target.value); setConnection({ state: 'idle', message: '模型已更改，请重新验证。' }) }}>
                <option value="deepseek-v4-pro">DeepSeek V4 Pro｜深度推演</option>
                <option value="deepseek-v4-flash">DeepSeek V4 Flash｜快速分析</option>
              </select>
            </label>

            <label className="lab-settings-field">
              <span>API Key</span>
              <div className="lab-secret-input">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={event => { setApiKey(event.target.value); setConnection({ state: 'idle', message: '尚未验证连接' }) }}
                  placeholder="输入 DeepSeek API Key"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="button" aria-label={showApiKey ? '隐藏密钥' : '显示密钥'} onClick={() => setShowApiKey(value => !value)}>{showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </label>

            <div className="lab-security-note"><ShieldCheck size={16} /><p><strong>仅用于当前会话</strong><br />密钥不会写入网页源码或浏览器长期存储，刷新页面后自动清除。</p></div>

            <div className={`lab-connection-result lab-connection-${connection.state}`}>
              <span className="lab-connection-dot" />
              <p>{connection.message}</p>
            </div>

            <button type="button" className="lab-primary-button w-full justify-center" disabled={connection.state === 'testing'} onClick={testDeepSeekConnection}><PlugZap size={15} />{connection.state === 'testing' ? '正在验证…' : '测试 DeepSeek 连接'}</button>
          </section>
        </div>
      )}
    </main>
  )
}
