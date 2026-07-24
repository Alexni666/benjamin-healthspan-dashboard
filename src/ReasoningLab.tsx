import { useEffect, useState, type ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  FileUp,
  ImagePlus,
  Layers3,
  LockKeyhole,
  Eye,
  EyeOff,
  PlugZap,
  Route,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'

const storageKey = 'ai-reasoning-lab-demo:v4'
const spaceDirectionImages: Record<string, string> = {
  A: '/images/reasoning-lab/space-direction-a.jpg',
  B: '/images/reasoning-lab/space-direction-b.jpg',
}
const spaceStructureImages = [
  '/images/reasoning-lab/space-structure-overview.jpg',
  '/images/reasoning-lab/space-structure-floor-plan.jpg',
  '/images/reasoning-lab/space-structure-key-area.jpg',
]
const visualImages = [
  '/images/reasoning-lab/scene-information-exchange.jpg',
  '/images/reasoning-lab/scene-core-mechanism.jpg',
  '/images/reasoning-lab/scene-climax-archive.jpg',
]

type CharacterInput = {
  name: string
  profile: string
}

type Inputs = {
  story: string
  rules: string
  people: string
  duration: string
  characters: CharacterInput[]
}

type AnalysisInsight = {
  id: string
  title: string
  content: string
  evidence: string
  confidence: '高' | '中' | '待确认'
}

type V1Draft = {
  title: string
  logline: string
  beats: string[]
  roleDesign: string
  clueChain: string
  mechanics: string
  recovery: string
  spaceDirections: Array<{ id: string; title: string; meta: string; copy: string }>
}

type SimulationFinding = {
  id: string
  level: 'P0' | 'P1' | '观察'
  time: string
  actor: string
  event: string
  impact: string
  evidence: string
  suggestion: string
}

type PlayerRun = {
  type: string
  behavior: string
  result: string
  status: '阻断' | '风险' | '通过'
}

type SimulationResult = {
  verdict: string
  headline: string
  score: number
  scoreReason: string
  pathCount: number
  checks: number
  coverage: number
  blockers: number
  findings: SimulationFinding[]
  playerRuns: PlayerRun[]
  timeline: Array<{ time: string; event: string; outcome: string }>
}

type RetestDimension = {
  label: string
  score: number
  evidence: string
}

type RetestRoute = {
  findingId: string
  title: string
  status: '已解决' | '仍存在' | '新增风险'
  evidence: string
}

type SecondTestResult = {
  score: number
  verdict: string
  summary: string
  rerunPaths: number
  remainingBlockers: number
  newRisks: string[]
  dimensions: RetestDimension[]
  routes: RetestRoute[]
  humanChecks: string[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

type AnalysisResult = {
  summary: string
  insights: AnalysisInsight[]
  questions: string[]
  v1?: V1Draft
  simulation?: SimulationResult
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

type SavedLab = {
  step: number
  maxVisited: number
  inputs: Inputs
  selectedPlan: string
  confirmedPlan: string
  writerNote: string
  executionConstraints: string
  revisionDrafts: Record<string, string>
  fixes: string[]
  secondTestDone: boolean
  analysis?: AnalysisResult
  secondTest?: SecondTestResult
}

const defaultInputs: Inputs = {
  story: '雾岭山中的老旅馆重启前夜，档案被调换，第七把钥匙失踪。六名相关人物必须找回钥匙并识别调包者。',
  rules: '玩家可自由搜证、交换信息；每人有公开身份和个人任务；最终需要开启档案前室并完成投票。',
  people: '6',
  duration: '90 分钟',
  characters: [
    { name: '旅馆经理', profile: '负责重启筹备，掌握公共区域权限，希望档案问题不要影响开业。' },
    { name: '档案管理员', profile: '熟悉档案编号和保管规则，知道部分记录曾被人为修改。' },
    { name: '维修师', profile: '可以进入后勤区域，了解断电和隐藏通道的真实情况。' },
    { name: '调查记者', profile: '持续追查旅馆旧案，希望获得可以公开的关键证据。' },
    { name: '投资人代表', profile: '关心项目能否正常推进，对档案内容有自己的利益判断。' },
    { name: '失踪员工家属', profile: '希望确认亲属经历，不信任旅馆现有的官方说法。' },
  ],
}

const stages = [
  ['01', '创作输入'],
  ['02', '首轮试玩'],
  ['03', '诊断拆解'],
  ['04', '编剧修改'],
  ['05', '二轮结果'],
]

const plans = [
  { id: 'A', title: '集中控制型', meta: '拍摄与执行优先', copy: '以大堂为中枢，六个功能区围绕核心动线展开。控场、跟拍和人员调度更稳定。' },
  { id: 'B', title: '探索强化型', meta: '沉浸与搜证优先', copy: '采用长廊与分层空间，增加隐藏区域和探索距离，换取更强的发现感。' },
]
const compactPlayerCopy: Record<string, { behavior: string; result: string }> = {
  速推型: { behavior: '快速搜索公开区域，优先拼齐主线。', result: '推进较快，但容易遗漏互动线索。' },
  沉浸型: { behavior: '深度扮演角色，重视剧情互动。', result: '氛围良好，但线索共享速度较慢。' },
}

const demoV1: V1Draft = {
  title: '雾岭旅馆 · 第七把钥匙',
  logline: '六名相关人物在旅馆重启前夜寻找失踪钥匙，通过交换不对称信息、重建调包路线并完成最终投票，决定谁有权保管被隐藏的档案。',
  beats: ['进入旅馆', '分散搜证', '断电调包', '路线重建', '钥匙机关', '集中判断'],
  roleDesign: '六个公开身份分别拥有私人动机、独占信息和行动权限；任何单一角色都不能独自掌握完整真相，必须通过交换与验证形成共同判断。',
  clueChain: '钥匙标记与老照片构成身份链，维修粉与值班日志构成路线链；两条证据链在档案前室交叉验证，并共同决定结局是否成立。',
  mechanics: '自由搜证、限时信息交换、个人任务和集体投票构成核心循环；关键机关不能只依赖单一线索，结局需要钥匙、路线与动机三类条件同时成立。',
  recovery: '错误指认后开放补充搜证；核心机关遗漏时由环境提示或 NPC 释放备用线索；超时仍未形成证据闭环时开放第二通路。',
  spaceDirections: plans,
}

const demoSimulation: SimulationResult = {
  verdict: '修改两项阻断问题后，再进入真人试玩',
  headline: '故事主线可以跑通，但结局条件和唯一通路会让部分玩家提前结束或完全卡住。',
  score: 68,
  scoreReason: '主线具备完整起承转合，但结局条件、异常恢复和部分角色的前段参与仍会影响实际完成度。',
  pathCount: 36,
  checks: 32,
  coverage: 86,
  blockers: 2,
  findings: [
    { id: 'ending', level: 'P0', time: '32 分钟', actor: '钻漏洞型玩家', event: '只收集四条字面上符合要求的线索，就要求开启档案前室并进入投票。', impact: '绕过人物动机与路线证据，结局可能提前约 28 分钟发生。', evidence: '触发依据：游戏规则中的“4条关键线索”没有限定证据类别。', suggestion: '把开门条件改为“第七把钥匙＋路线证据＋动机证据”，三类条件必须同时成立。' },
    { id: 'dead-end', level: 'P0', time: '49 分钟', actor: '完成主义型玩家', event: '没有找到断路器卡，隐藏通道始终无法开启，之后的搜索不能产生新进展。', impact: '唯一推进路径失效，整局进入不可恢复的停滞。', evidence: '触发依据：断路器卡是通道唯一条件，规则中没有备用释放方式。', suggestion: '增加超时恢复：50分钟仍未开启时释放维修日志，并开放第二条进入路径。' },
    { id: 'idle-role', level: 'P1', time: '0–27 分钟', actor: '两名信息较少的角色', event: '前段只能跟随其他人搜证，没有独立任务，也没有必须由本人完成的行为。', impact: '参与度明显偏低，后续突然承担关键判断时缺乏行为积累。', evidence: '角色任务首次有效触发时间晚于首个集中交换节点。', suggestion: '把照片比对和钟表校准前置，让两名角色在前10分钟获得必须由本人完成的任务。' },
    { id: 'congestion', level: 'P1', time: '18–36 分钟', actor: '六名玩家与跟拍人员', event: '三次信息交换都集中在图书室主门，搜索和表达互相打断。', impact: '主线节奏被空间拥堵拖慢，现场收声与跟拍难度上升。', evidence: '空间需求推演中，主门同时承载进入、离开和围观三种行为。', suggestion: '给图书室增加侧向离开路径，形成主门进入、侧门离开的单向循环。' },
    { id: 'exposed-prop', level: 'P1', time: '14 分钟', actor: '强推理型玩家', event: '从餐厅视角提前看到祖父钟暗格缝隙，在相关时间线索出现前开始拆解机关。', impact: '机关失去逐步发现过程，后续两条线索价值下降。', evidence: '视觉路径与机关朝向重叠，缺少遮挡和分阶段开放。', suggestion: '调整钟体朝向并增加内衬，只有完成正确时间校准后才显示暗格边缘。' },
    { id: 'misread-rule', level: '观察', time: '41 分钟', actor: '规则误解型玩家', event: '把个人任务理解成全队必须完成的公共前置条件，并阻止其他人继续投票。', impact: '产生约 8 分钟无效争论，但现有规则没有明确纠错入口。', evidence: '个人任务与公共结局条件使用了相近措辞。', suggestion: '把个人任务与公共结局条件分栏说明，并增加一次不暴露答案的主持纠错提示。' },
  ],
  playerRuns: [
    { type: '强推理型', behavior: '合并信息并提前检查机关', result: '在第14分钟发现钟体异常，提前暴露核心机关。', status: '风险' },
    { type: '完成主义型', behavior: '逐项搜索所有道具', result: '遗漏断路器卡后，在第49分钟进入不可恢复停滞。', status: '阻断' },
    { type: '钻漏洞型', behavior: '只满足规则字面条件', result: '用四条同类线索绕过验证，在第32分钟触发结局。', status: '阻断' },
    { type: '规则误解型', behavior: '把个人任务当成公共条件', result: '造成8分钟争论，之后在主持提示下恢复。', status: '风险' },
    { type: '被动跟随型', behavior: '等待队友决定并较少共享', result: '两名角色前27分钟没有形成有效行动。', status: '风险' },
    { type: '综艺效果型', behavior: '高频表达、质疑与绕行', result: '放大图书室门口拥堵，但没有阻断主线。', status: '通过' },
  ],
  timeline: [
    { time: '00–12', event: '进入与身份确认', outcome: '六名角色完成公开信息交换，主目标被理解。' },
    { time: '13–27', event: '第一轮分散搜证', outcome: '两名角色缺少独立任务，核心机关被提前观察。' },
    { time: '28–42', event: '线索交换与路线重建', outcome: '钻漏洞路径提前满足模糊的结局条件。' },
    { time: '43–58', event: '隐藏通道与档案前室', outcome: '遗漏唯一道具的路径出现不可恢复停滞。' },
    { time: '59–90', event: '集中判断与投票', outcome: '可运行路径能够完成结局，但动机证据参与度不足。' },
  ],
}

const scoreRows = [
  ['规则完整性', 58, 88],
  ['线索闭环', 70, 90],
  ['角色参与', 62, 84],
  ['空间动线', 60, 85],
  ['节奏体验', 66, 84],
  ['执行可行', 64, 86],
  ['拍摄安全', 70, 84],
]

const demoInsights: AnalysisInsight[] = [
  { id: 'premise', title: '核心命题', content: '一场围绕“谁有权保管真相”展开的封闭空间悬疑。失踪的钥匙既是行动目标，也是档案归属权的象征。', evidence: '来源：故事详情第 1 段＋最终投票规则', confidence: '高' },
  { id: 'conflict', title: '主冲突结构', content: '公开目标是找回第七把钥匙；隐藏冲突是六人对档案真实性和调包者动机的不同判断。', evidence: '来源：故事目标＋角色规则', confidence: '高' },
  { id: 'world', title: '世界与规则边界', content: '旅馆在重启前夜处于封闭管理状态，玩家可以自由搜证，但结局必须通过证据组合与集体投票触发。', evidence: '来源：游戏规则；封闭范围需编剧确认', confidence: '中' },
  { id: 'characters', title: '人物关系动力', content: '六个角色需要同时具备公开身份、私人动机和不对称信息，避免所有人只围绕同一把钥匙行动。', evidence: '来源：人物数量＋个人任务规则', confidence: '中' },
  { id: 'timeline', title: '戏剧时间线', content: '故事需要在 90 分钟内完成进入、分散搜证、断电事件、路线重建、档案开启和集中判断六个阶段。', evidence: '来源：预计时长＋结局条件', confidence: '中' },
  { id: 'experience', title: '体验目标', content: '让玩家先形成不同解释，再通过空间行动和证据交换逐步收束，而不是依赖主持人一次性揭晓。', evidence: 'AI推断；需要编剧确认创作意图', confidence: '待确认' },
]

const demoQuestions = [
  '档案调包发生在断电之前还是之后？',
  '调包者的行为是个人动机，还是受旅馆规则强制？',
  '投票失败后是否允许重新搜证或进入另一结局？',
]

const analysisSteps = [
  ['故事结构建模', '识别事件、目标、转折和结局条件'],
  ['角色动力推导', '建立人物目标、秘密、权限与信息差'],
  ['规则线索建图', '连接触发条件、证据链和恢复路径'],
  ['多类玩家模拟', '运行不同策略与理解方式的行为路径'],
  ['空间行动推演', '检查聚集、绕行、机关暴露和执行压力'],
  ['风险诊断汇总', '记录卡关、绕规则与节奏异常的具体事件'],
]

const analysisMetrics = ['6 个剧情阶段', '6 个角色目标', '12 条规则关系', '36 条玩家路径', '2 类空间策略', '6 项风险事件']
const secondAnalysisSteps = [
  ['载入修改版本', '比对 V1.0 问题与 V1.1 编剧修改'],
  ['重建受影响规则', '更新触发条件、证据链和恢复路径'],
  ['复跑相关路线', '重跑受影响玩家路径与相邻替代路径'],
  ['核验问题变化', '判断首轮问题是解决、仍存在或转移'],
  ['检查新增风险', '识别修改后出现的新卡关和节奏问题'],
  ['形成二轮结论', '独立计算评分并输出下一步验证建议'],
]
const secondAnalysisMetrics = ['V1.1 修改已载入', '规则关系已更新', '受影响路径已复跑', '首轮问题已对照', '新增风险已检查', '二轮结果已形成']

const defaultRevisionDrafts = Object.fromEntries(demoSimulation.findings.map(finding => [finding.id, finding.suggestion]))

function loadSaved(): SavedLab {
  const fallback: SavedLab = {
    step: 0,
    maxVisited: 0,
    inputs: defaultInputs,
    selectedPlan: 'A',
    confirmedPlan: '',
    writerNote: '',
    executionConstraints: '',
    revisionDrafts: defaultRevisionDrafts,
    fixes: [],
    secondTestDone: false,
  }
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}') as Partial<SavedLab>
    return {
      ...fallback,
      ...stored,
      inputs: {
        ...defaultInputs,
        ...(stored.inputs || {}),
        characters: stored.inputs?.characters?.length ? stored.inputs.characters : defaultInputs.characters,
      },
      revisionDrafts: { ...defaultRevisionDrafts, ...(stored.revisionDrafts || {}) },
      secondTestDone: Boolean(stored.secondTestDone && stored.secondTest),
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

function StageHeading({ eyebrow, title, copy, singleLine = false }: { eyebrow: string; title: string; copy: string; singleLine?: boolean }) {
  return (
    <header className={`lab-stage-heading mb-7 ${singleLine ? 'lab-stage-heading-single' : ''}`}>
      <p className="mb-2 text-[11px] font-semibold tracking-[.22em] text-[#f2ca94]">{eyebrow}</p>
      <h1 className="text-2xl font-semibold tracking-[-.03em] text-white sm:text-3xl">{title}</h1>
      <p className="lab-stage-copy mt-3 text-sm leading-6 text-white/70">{copy}</p>
    </header>
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
  const [v1Tab, setV1Tab] = useState<'content' | 'space' | 'basis'>('content')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [deepSeekModel, setDeepSeekModel] = useState('deepseek-v4-pro')
  const [storyFileName, setStoryFileName] = useState('')
  const [storyFileLoading, setStoryFileLoading] = useState(false)
  const [connection, setConnection] = useState<{ state: 'idle' | 'testing' | 'connected' | 'error'; message: string }>({ state: 'idle', message: '尚未验证连接' })
  const [analysisRun, setAnalysisRun] = useState<{ state: 'idle' | 'running' | 'error'; step: number; message: string; mode: 'first' | 'second' }>({ state: 'idle', step: 0, message: '', mode: 'first' })

  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(lab)), [lab])
  useEffect(() => {
    let cancelled = false
    fetch('/api/deepseek/status')
      .then(response => response.json())
      .then((result: { configured?: boolean }) => {
        if (!cancelled && result.configured) setConnection({ state: 'connected', message: '密钥已安全保存，本设备 30 天内有效。' })
      })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [])

  const updateLab = (patch: Partial<SavedLab>) => setLab(current => ({ ...current, ...patch }))
  const updateInput = (key: 'story' | 'rules' | 'duration', value: string) => setLab(current => ({ ...current, inputs: { ...current.inputs, [key]: value } }))
  const updatePeople = (value: string) => {
    const count = Math.min(20, Math.max(1, Number.parseInt(value, 10) || 1))
    setLab(current => {
      const characters = [...current.inputs.characters]
      while (characters.length < count) characters.push({ name: `角色 ${characters.length + 1}`, profile: '' })
      return { ...current, inputs: { ...current.inputs, people: String(count), characters: characters.slice(0, count) } }
    })
  }
  const updateCharacter = (index: number, key: keyof CharacterInput, value: string) => setLab(current => ({
    ...current,
    inputs: {
      ...current.inputs,
      characters: current.inputs.characters.map((character, characterIndex) => characterIndex === index ? { ...character, [key]: value } : character),
    },
  }))
  const importStoryFile = async (file?: File) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      window.alert('请选择小于 10MB 的文档。')
      return
    }
    setStoryFileLoading(true)
    try {
      const extension = file.name.split('.').pop()?.toLowerCase()
      const text = extension === 'docx'
        ? (await (await import('mammoth')).extractRawText({ arrayBuffer: await file.arrayBuffer() })).value
        : await file.text()
      if (!text.trim()) throw new Error('文档中没有识别到可用文字。')
      updateInput('story', text.trim())
      setStoryFileName(file.name)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '文档读取失败，请换一个文件重试。')
    } finally {
      setStoryFileLoading(false)
    }
  }
  const go = (nextStep: number) => setLab(current => ({ ...current, step: nextStep, maxVisited: Math.max(current.maxVisited, nextStep) }))
  const next = () => go(Math.min(lab.step + 1, stages.length - 1))
  const scrollToResult = (targetId: string) => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const activeInsights = lab.analysis?.insights?.length ? lab.analysis.insights : demoInsights
  const activeQuestions = lab.analysis?.questions?.length ? lab.analysis.questions : demoQuestions
  const activeV1 = lab.analysis?.v1 || demoV1
  const activeSimulation = lab.analysis?.simulation || demoSimulation
  const activePlans = activeV1.spaceDirections.length === 2 ? activeV1.spaceDirections : plans
  const blockerFindings = activeSimulation.findings.filter(finding => finding.level === 'P0')
  const firstScore = activeSimulation.score || 68
  const firstRating = firstScore >= 85 ? '接近真人验证' : firstScore >= 70 ? '基本可运行' : firstScore >= 55 ? '可运行，需修复' : '结构尚未闭合'
  const secondScore = lab.secondTest?.score ?? firstScore
  const remainingBlockers = lab.secondTest?.remainingBlockers ?? blockerFindings.length
  const readyForTabletop = Boolean(lab.secondTestDone && lab.secondTest && remainingBlockers === 0 && secondScore >= 79)
  const updateRevision = (id: string, value: string) => updateLab({ revisionDrafts: { ...lab.revisionDrafts, [id]: value }, secondTestDone: false, secondTest: undefined })
  const toggleFix = (id: string) => updateLab({ fixes: lab.fixes.includes(id) ? lab.fixes.filter(item => item !== id) : [...lab.fixes, id], secondTestDone: false, secondTest: undefined })
  const dimensionAfter = (label: string, before: number) => lab.secondTest?.dimensions.find(item => item.label === label)?.score ?? before

  const saveDeepSeekConnection = async () => {
    if (!apiKey.trim()) {
      setConnection({ state: 'error', message: '请先填写 DeepSeek API Key。' })
      return
    }
    setConnection({ state: 'testing', message: '正在验证并安全保存…' })
    try {
      const response = await fetch('/api/deepseek/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })
      const result = await response.json() as { ok?: boolean; message?: string }
      if (!response.ok || !result.ok) throw new Error(result.message || '连接验证失败')
      setApiKey('')
      setShowApiKey(false)
      setConnection({ state: 'connected', message: '密钥已安全保存，本设备 30 天内有效。' })
    } catch (error) {
      setConnection({ state: 'error', message: error instanceof Error ? error.message : '连接验证失败，请检查密钥。' })
    }
  }

  const clearDeepSeekConnection = async () => {
    await fetch('/api/deepseek/clear', { method: 'POST' }).catch(() => undefined)
    setApiKey('')
    setShowApiKey(false)
    setConnection({ state: 'idle', message: '已清除保存的 DeepSeek 密钥。' })
  }

  const runDeepSeekAnalysis = async () => {
    if (connection.state !== 'connected') {
      setConnection(current => ({ ...current, message: '请先保存 DeepSeek 密钥，再启动真实分析。' }))
      setSettingsOpen(true)
      return
    }
    if (!lab.inputs.story.trim()) {
      setAnalysisRun({ state: 'error', step: 0, message: '请先填写故事详情。', mode: 'first' })
      return
    }

    const startedAt = Date.now()
    setAnalysisRun({ state: 'running', step: 0, message: '正在建立首轮模拟任务…', mode: 'first' })
    const progressTimer = window.setInterval(() => {
      setAnalysisRun(current => current.state === 'running'
        ? { ...current, step: Math.min(current.step + 1, analysisSteps.length - 2) }
        : current)
    }, 1100)

    try {
      const response = await fetch('/api/deepseek/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: deepSeekModel, inputs: lab.inputs, writerNote: lab.writerNote }),
      })
      const result = await response.json() as { ok?: boolean; message?: string; analysis?: AnalysisResult; usage?: AnalysisResult['usage'] }
      if (!response.ok || !result.ok || !result.analysis) throw new Error(result.message || '分析没有完成，请重试。')

      const remaining = Math.max(0, 2800 - (Date.now() - startedAt))
      if (remaining) await new Promise(resolve => window.setTimeout(resolve, remaining))
      window.clearInterval(progressTimer)
      setAnalysisRun({ state: 'running', step: analysisSteps.length - 1, message: '分析完成，正在写入结果…', mode: 'first' })
      updateLab({
        analysis: { ...result.analysis, usage: result.usage },
        selectedPlan: 'A',
        confirmedPlan: '',
        revisionDrafts: Object.fromEntries(result.analysis.simulation?.findings.map(finding => [finding.id, finding.suggestion]) || []),
        fixes: [],
        secondTestDone: false,
        secondTest: undefined,
      })
      window.setTimeout(() => {
        setAnalysisRun({ state: 'idle', step: 0, message: '', mode: 'first' })
        go(1)
      }, 650)
    } catch (error) {
      window.clearInterval(progressTimer)
      const message = error instanceof Error ? error.message : '分析没有完成，请稍后重试。'
      if (message.includes('密钥')) setConnection({ state: 'idle', message: '保存的密钥已失效，请重新设置。' })
      setAnalysisRun({ state: 'error', step: 0, message, mode: 'first' })
    }
  }

  const runSecondPlaytest = async () => {
    if (connection.state !== 'connected') {
      setConnection(current => ({ ...current, message: '请先保存 DeepSeek 密钥，再启动二轮复算。' }))
      setSettingsOpen(true)
      return
    }
    if (lab.fixes.length === 0) return

    const startedAt = Date.now()
    setAnalysisRun({ state: 'running', step: 0, message: '正在载入 V1.1 修改内容…', mode: 'second' })
    const progressTimer = window.setInterval(() => {
      setAnalysisRun(current => current.state === 'running' && current.mode === 'second'
        ? { ...current, step: Math.min(current.step + 1, secondAnalysisSteps.length - 2) }
        : current)
    }, 1100)

    try {
      const revisions = activeSimulation.findings
        .filter(finding => lab.fixes.includes(finding.id))
        .map(finding => ({
          findingId: finding.id,
          event: finding.event,
          impact: finding.impact,
          originalSuggestion: finding.suggestion,
          revision: lab.revisionDrafts[finding.id] || finding.suggestion,
        }))
      const response = await fetch('/api/deepseek/retest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: deepSeekModel,
          inputs: lab.inputs,
          writerNote: lab.writerNote,
          executionConstraints: lab.executionConstraints,
          firstSimulation: activeSimulation,
          revisions,
        }),
      })
      const result = await response.json() as { ok?: boolean; message?: string; result?: SecondTestResult; usage?: SecondTestResult['usage'] }
      if (!response.ok || !result.ok || !result.result) throw new Error(result.message || '二轮复算没有完成，请重试。')

      const remaining = Math.max(0, 2800 - (Date.now() - startedAt))
      if (remaining) await new Promise(resolve => window.setTimeout(resolve, remaining))
      window.clearInterval(progressTimer)
      setAnalysisRun({ state: 'running', step: secondAnalysisSteps.length - 1, message: '二轮复算完成，正在写入 V1.1…', mode: 'second' })
      updateLab({ secondTest: { ...result.result, usage: result.usage }, secondTestDone: true })
      window.setTimeout(() => {
        setAnalysisRun({ state: 'idle', step: 0, message: '', mode: 'second' })
        go(4)
      }, 650)
    } catch (error) {
      window.clearInterval(progressTimer)
      const message = error instanceof Error ? error.message : '二轮复算没有完成，请稍后重试。'
      if (message.includes('密钥')) setConnection({ state: 'idle', message: '保存的密钥已失效，请重新设置。' })
      setAnalysisRun({ state: 'error', step: 0, message, mode: 'second' })
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
      '角色：',
      ...lab.inputs.characters.map((character, index) => `${index + 1}. ${character.name}：${character.profile || '未补充'}`),
      '',
      `首轮结论：${activeSimulation.verdict}`,
      `模拟规模：${activeSimulation.pathCount} 条行为路径，${activeSimulation.checks} 项结构检查`,
      `资料覆盖：${activeSimulation.coverage}%`,
      `阻断事件：${activeSimulation.blockers}`,
      '',
      '首轮具体反馈：',
      ...activeSimulation.findings.map(finding => `- [${finding.level}] ${finding.time}｜${finding.actor}：${finding.event} 影响：${finding.impact}`),
      '',
      `采用方案：${lab.confirmedPlan ? `${lab.confirmedPlan} ${activePlans.find(plan => plan.id === lab.confirmedPlan)?.title}` : '尚未确认空间方向'}`,
      '',
      `创作基线版本：V1.0`,
      `验证后版本：${lab.secondTestDone ? 'V1.1' : '尚未运行二次验证'}`,
      `验证后成熟度：${secondScore}`,
      ...(lab.secondTest ? [
        `二轮复跑路线：${lab.secondTest.rerunPaths}`,
        `二轮模型结论：${lab.secondTest.verdict}`,
        `二轮结果摘要：${lab.secondTest.summary}`,
        ...lab.secondTest.routes.map(route => `- [${route.status}] ${route.title}：${route.evidence}`),
      ] : []),
      `二轮结论：${readyForTabletop ? `建议进入 ${lab.inputs.people} 人真人桌面试玩，不直接进入完整实景。` : '仍有关键问题未修复，暂不进入真人试玩。'}`,
      '',
      '已纳入 V1.1 的编剧与执行修改：',
      ...activeSimulation.findings.filter(finding => lab.fixes.includes(finding.id)).map(finding => `- ${finding.actor}｜${finding.event}：${lab.revisionDrafts[finding.id]}`),
      '',
      '仍需真人验证：23:17 谜题难度、隐藏角色平衡、听证时长、真实动线、机关手感与安全。',
      '',
      `说明：首轮行为结果和诊断依据${lab.analysis ? '来自本轮模型分析' : '当前使用演示样本'}；${lab.secondTest ? '二轮评分来自模型对 V1.1 的独立复算' : '尚未形成二轮模型复算结果'}，仍需编剧、导演与真人试玩验证。`,
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
        <StageHeading eyebrow="01 / CREATIVE INPUT" title="导入创作版本" copy="填写故事、规则、时长和角色信息，点击开始试玩即可进入 AI 分析。" singleLine />

        <div className="lab-input-top-grid">
          <Panel>
            <div className="lab-field-header">
              <label className="lab-field-label"><FileText size={15} />故事详情</label>
              <label className="lab-file-button"><FileUp size={14} />{storyFileLoading ? '正在读取' : '上传文档'}<input type="file" accept=".txt,.md,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden disabled={storyFileLoading} onChange={event => { void importStoryFile(event.target.files?.[0]); event.target.value = '' }} /></label>
            </div>
            <textarea value={lab.inputs.story} onChange={event => updateInput('story', event.target.value)} rows={5} placeholder="故事梗概或完整故事文档。" />
            {storyFileName && <p className="lab-file-status">已导入：{storyFileName}</p>}
          </Panel>
          <Panel><div className="lab-field-header"><label className="lab-field-label"><LockKeyhole size={15} />游戏规则</label></div><textarea value={lab.inputs.rules} onChange={event => updateInput('rules', event.target.value)} rows={5} placeholder="行动方式、信息交换和结局条件。" /></Panel>
        </div>

        <div className="lab-input-bottom-grid mt-4">
          <Panel className="lab-role-strip">
            <div className="lab-role-meta">
              <div className="lab-role-strip-title"><Users size={15} /><strong>角色设定</strong></div>
              <label className="lab-role-count"><span>人数</span><input type="number" min="1" max="20" value={lab.inputs.people} onChange={event => updatePeople(event.target.value)} /></label>
            </div>
            <div className="lab-role-track">
              {lab.inputs.characters.map((character, index) => (
                <div className="lab-role-item" key={index}>
                  <span>角色 {index + 1}</span>
                  <input value={character.name} onChange={event => updateCharacter(index, 'name', event.target.value)} placeholder="名称" />
                  <textarea rows={2} value={character.profile} onChange={event => updateCharacter(index, 'profile', event.target.value)} placeholder="基本情况" />
                </div>
              ))}
            </div>
          </Panel>
          <Panel className="lab-duration-panel"><label className="lab-field-label"><Clock3 size={15} />预计时长</label><input value={lab.inputs.duration} onChange={event => updateInput('duration', event.target.value)} placeholder="90分钟" /></Panel>
        </div>
      </>
    )

    if (lab.step === 1) return (
      <>
        <StageHeading eyebrow="02 / FIRST PLAYTEST" title="首轮模拟试玩结果" copy="先看模拟中真实发生的事件，再决定是否展开内容、空间和推演依据。这里不替编剧评价作品，只呈现可复查的行为结果。" />
        <Panel className="lab-result-hero">
          <div>
            <div className="lab-result-status"><span /><strong>首轮模拟完成</strong></div>
            <h2>{activeSimulation.verdict}</h2>
            <p>{activeSimulation.headline}</p>
            <small className="lab-result-score-reason">{activeSimulation.scoreReason || '当前显示的是首轮分析基线；重新运行分析后，会生成本轮评分依据。'}</small>
          </div>
          <div className="lab-result-score">
            <span>首轮综合评分</span>
            <div><strong>{firstScore}</strong><small>/ 100</small></div>
            <b>{firstRating}</b>
          </div>
        </Panel>

        <div className="lab-result-nav-grid mt-4">
          <button type="button" className="lab-result-link-card" onClick={() => scrollToResult('playtest-findings')}><span className="lab-result-link-head"><Route size={15} /><span>关键事件</span></span><strong>{activeSimulation.findings.length}<small>项</small></strong><p>查看发生时间、玩家行为和实际影响</p><b>查看事件 <ArrowRight size={13} /></b></button>
          <button type="button" className="lab-result-link-card lab-result-link-card-alert" onClick={() => scrollToResult(blockerFindings.length > 0 ? 'playtest-blockers' : 'playtest-findings')}><span className="lab-result-link-head"><AlertTriangle size={15} /><span>必须先修</span></span><strong>{blockerFindings.length}<small>项</small></strong><p>直达会造成卡关或提前结束的问题</p><b>定位问题 <ArrowRight size={13} /></b></button>
          <button type="button" className="lab-result-link-card" onClick={() => scrollToResult('playtest-timeline')}><span className="lab-result-link-head"><Clock3 size={15} /><span>时间线</span></span><strong>{activeSimulation.timeline.length}<small>个节点</small></strong><p>查看问题具体发生在试玩的哪个阶段</p><b>查看时间线 <ArrowRight size={13} /></b></button>
          <button type="button" className="lab-result-link-card" onClick={() => scrollToResult('playtest-players')}><span className="lab-result-link-head"><Users size={15} /><span>玩家表现</span></span><strong>{activeSimulation.playerRuns.length}<small>类</small></strong><p>逐类查看行为选择、结果与阻断状态</p><b>查看玩家结果 <ArrowRight size={13} /></b></button>
        </div>

        <div id="playtest-findings" className="lab-result-anchor">
          <div className="lab-section-title mt-8"><div><p>CONCRETE EVENTS</p><h2>首轮中实际发生的关键事件</h2></div><span>{activeSimulation.findings.length} 项反馈</span></div>
          <Panel className="lab-findings-panel">
            {activeSimulation.findings.map((finding, index) => (
              <article id={finding.id === blockerFindings[0]?.id ? 'playtest-blockers' : undefined} className="lab-finding-row" key={finding.id}>
                <div className="lab-finding-order">{String(index + 1).padStart(2, '0')}</div>
                <div className="lab-finding-meta"><span className={`lab-risk-pill ${finding.level === 'P0' ? 'lab-risk-p0' : ''}`}>{finding.level}</span><strong>{finding.time}</strong><small>{finding.actor}</small></div>
                <div className="lab-finding-event"><strong>{finding.event}</strong><p>{finding.impact}</p><small>{finding.evidence}</small></div>
              </article>
            ))}
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[.82fr_1.18fr]">
          <div id="playtest-timeline" className="lab-result-anchor"><Panel>
              <div className="lab-section-title"><div><p>RUN TIMELINE</p><h2>{lab.inputs.duration} 模拟时间线</h2></div></div>
              <div className="lab-run-timeline">
                {activeSimulation.timeline.map(item => <div key={`${item.time}-${item.event}`}><span>{item.time}</span><strong>{item.event}</strong><p>{item.outcome}</p></div>)}
              </div>
            </Panel></div>
          <div id="playtest-players" className="lab-result-anchor"><Panel>
              <div className="lab-section-title"><div><p>PLAYER PATHS</p><h2>玩家行为结果</h2></div><span>逐类可复查</span></div>
              <div className="lab-player-grid mt-5">
                {activeSimulation.playerRuns.map(player => {
                  const copy = compactPlayerCopy[player.type] || player
                  return <div key={player.type}><div className="flex items-center justify-between gap-2"><strong>{player.type}</strong><span className={`lab-risk-pill ${player.status === '阻断' ? 'lab-risk-p0' : ''}`}>{player.status}</span></div><small>{copy.behavior}</small><p>{copy.result}</p></div>
                })}
              </div>
            </Panel></div>
        </div>

        <div className="lab-result-note"><ShieldCheck size={15} /><p>本页记录的是 AI 结构模拟中发生的现象，不等同于真人体验结论。下一步可以查看每项现象背后的内容、空间和规则依据。</p></div>
      </>
    )

    if (lab.step === 2) return (
      <>
        <StageHeading eyebrow="03 / DIAGNOSIS" title="结果背后的诊断拆解" copy="AI只重建推演模型并解释首轮现象，不会自动改写原稿。普通导演可以先看结论，编剧可继续深入内容结构、空间影响和推演依据。" />
        <Panel className="lab-v1-hero mb-4">
          <div>
            <div className="flex items-center gap-2"><BrainCircuit size={16} /><span>首轮推演模型 · {lab.analysis ? '已生成' : '演示方案'}</span></div>
            <h2>{activeV1.title}</h2>
            <p>{activeV1.logline}</p>
          </div>
          <div className="lab-v1-hero-meta"><strong>{lab.inputs.people}</strong><span>角色</span><strong>{lab.inputs.duration}</strong><span>时长</span></div>
        </Panel>

        <div className="lab-v1-tabs" role="tablist" aria-label="诊断拆解内容">
          {([['content', '内容结构'], ['space', '空间影响'], ['basis', '推演依据']] as const).map(([id, label]) => <button type="button" role="tab" aria-selected={v1Tab === id} className={v1Tab === id ? 'is-active' : ''} onClick={() => setV1Tab(id)} key={id}>{label}</button>)}
        </div>

        {v1Tab === 'content' && <>
          <Panel className="mb-4">
            <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] tracking-[.16em] text-white/40">RECONSTRUCTED STORY MODEL</p><h2 className="mt-1 text-sm font-semibold">AI从原稿重建的体验结构</h2></div><span className="lab-tag">只用于推演</span></div>
            <div className="lab-timeline mt-6">{activeV1.beats.map((item, index) => <div key={`${index}-${item}`}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></div>)}</div>
          </Panel>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['人物目标与信息差', activeV1.roleDesign, '角色关系'],
              ['证据链与结局条件', activeV1.clueChain, '规则连接'],
              ['机关触发与核心玩法', activeV1.mechanics, '行为路径'],
              ['卡关与异常恢复', activeV1.recovery, '恢复机制'],
            ].map(([title, copy, tag]) => <Panel key={title}><span className="lab-tag">{tag}</span><h2 className="mt-5 text-base font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-white/55">{copy}</p></Panel>)}
          </div>
        </>}

        {v1Tab === 'space' && <>
          <div className="mb-4 flex items-center justify-between gap-4"><div><p className="text-[10px] tracking-[.16em] text-white/40">SPACE DIRECTION</p><h2 className="mt-1 text-sm font-semibold">由首轮行为问题带出的两套空间方向</h2></div><span className="lab-tag">当前选择 {lab.selectedPlan}</span></div>
          <div className="grid gap-4 xl:grid-cols-2">
            {activePlans.map(plan => <button type="button" className={`lab-plan-card ${lab.selectedPlan === plan.id ? 'lab-plan-card-selected' : ''}`} onClick={() => updateLab({ selectedPlan: plan.id, confirmedPlan: lab.confirmedPlan === plan.id ? lab.confirmedPlan : '' })} key={plan.id}>
              <div className="lab-plan-sketch"><img src={spaceDirectionImages[plan.id] || spaceDirectionImages.A} alt={`${plan.title}空间方向示意`} loading="lazy" /></div>
              <div className="mt-5 flex items-start justify-between"><div><span className="text-xs text-[#efb876]">方案 {plan.id}</span><h2 className="mt-1 text-lg font-semibold">{plan.title}</h2></div>{lab.selectedPlan === plan.id && <CheckCircle2 className="text-[#8fd8df]" size={20} />}</div>
              <p className="mt-3 text-xs tracking-[.12em] text-white/35">{plan.meta}</p><p className="mt-3 text-sm leading-6 text-white/55">{plan.copy}</p>
            </button>)}
          </div>
          <div className="lab-space-confirm mt-4">
            <div><span>当前方向</span><strong>{lab.selectedPlan} · {activePlans.find(plan => plan.id === lab.selectedPlan)?.title}</strong><p>确认后再生成空间草案，避免一次产生无效方案。</p></div>
            <button type="button" className="lab-primary-button" onClick={() => updateLab({ confirmedPlan: lab.selectedPlan })}>{lab.confirmedPlan === lab.selectedPlan ? <><Check size={15} />已确认</> : <><Layers3 size={15} />确认并生成</>}</button>
          </div>
          {lab.confirmedPlan === lab.selectedPlan && <>
            <div className="mb-4 mt-8 flex items-center justify-between gap-4"><div><p className="text-[10px] tracking-[.16em] text-white/40">SELECTED DIRECTION</p><h2 className="mt-1 text-sm font-semibold">{activePlans.find(plan => plan.id === lab.selectedPlan)?.title}｜空间结构草案</h2></div><span className="lab-tag">当前为推演草案，不是施工图</span></div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                ['总体空间关系图', '入口、公共区、搜证区、高潮区与后勤区的连接关系'],
                ['主要楼层平面图', '房间尺度、玩家路线、工作人员路线与楼层连接'],
                ['关键区域详图', '核心机关、隐藏通道与高潮区域的触发和安全范围'],
              ].map(([title, copy], index) => <Panel key={title}><div className="lab-plan-preview"><img src={spaceStructureImages[index]} alt={title} loading="lazy" /></div><div className="mt-4 flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-[11px] leading-5 text-white/40">{copy}</p></div><span className="lab-tag">{String(index + 1).padStart(2, '0')}</span></div></Panel>)}
            </div>
            <div className="mb-4 mt-8"><p className="text-[10px] tracking-[.16em] text-white/40">SCENE VISUALS</p><h2 className="mt-1 text-sm font-semibold">空间效果图与人工替换</h2></div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {['信息交换区', '核心机关区', '高潮与结局区'].map((title, index) => <Panel key={title}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg, transparent, rgba(3,5,6,.72)), url(${uploads[index] || visualImages[index]})` }}><span className="lab-scene-label absolute bottom-3 left-3 text-xs font-medium">{title}</span></div>
                <div className="mt-4 flex items-center justify-between"><div><p className="text-sm font-semibold">效果示意 {index + 1}</p><p className="mt-1 text-[11px] text-white/35">AI 空间效果图 · 可手动替换</p></div><label className="lab-icon-button cursor-pointer"><ImagePlus size={15} /><input type="file" accept="image/*" hidden onChange={event => { loadVisual(index, event.target.files?.[0]); event.target.value = '' }} /></label></div>
              </Panel>)}
            </div>
          </>}
        </>}

        {v1Tab === 'basis' && <>
          <Panel className="lab-analysis-summary mb-4">
            <div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-3xl"><div className="flex items-center gap-2"><BrainCircuit size={16} /><span>首轮推演依据</span></div><p>{lab.analysis?.summary || '当前为演示数据。运行真实分析后，这里会展示与输入材料对应的推演依据。'}</p></div>{lab.analysis?.usage && <div className="lab-analysis-usage"><strong>{lab.analysis.usage.total_tokens.toLocaleString()}</strong><span>本轮 Token</span></div>}</div>
          </Panel>
          <div className="grid gap-4 xl:grid-cols-2">
            {activeInsights.map(insight => <Panel className="lab-insight-card" key={insight.id}><div className="flex items-start justify-between gap-4"><h2 className="text-base font-semibold">{insight.title}</h2><span className="lab-tag">置信度 {insight.confidence}</span></div><p className="mt-3 text-sm leading-6 text-white/75">{insight.content}</p><p className="mt-4 border-t border-white/8 pt-3 text-[11px] leading-5 text-white/40">{insight.evidence}</p></Panel>)}
          </div>
          <Panel className="mt-4"><div className="flex items-center gap-2"><AlertTriangle size={16} className="text-[#efb876]" /><h2 className="text-sm font-semibold">需要编剧判断、AI不能代替决定的问题</h2></div><div className="mt-4 grid gap-3 md:grid-cols-2">{activeQuestions.map((item, index) => <div className="lab-question-row" key={`${index}-${item}`}><span>{String(index + 1).padStart(2, '0')}</span><p>{item}</p></div>)}</div></Panel>
        </>}
      </>
    )

    if (lab.step === 3) return (
      <>
        <StageHeading eyebrow="04 / WRITER REVISION" title="编剧修改与二次试玩" copy="围绕首轮发生的具体事件修改原始版本。AI建议只作参考，是否修改、怎样修改仍由编剧决定。" />
        <Panel className="lab-revision-brief mb-5">
          <div className="lab-revision-brief-heading">
            <div><span>REVISION BRIEF</span><h2>本轮修改边界</h2></div>
            <p>编剧意图优先，执行限制只约束落地方式。</p>
          </div>
          <div className="lab-revision-brief-fields">
            <div className="lab-revision-field"><label className="lab-field-label"><BrainCircuit size={15} />编剧总方向</label><textarea rows={3} placeholder="例如：保留调包者的道德灰度，不允许系统把结局改成单一抓凶。" value={lab.writerNote} onChange={event => updateLab({ writerNote: event.target.value, secondTestDone: false, secondTest: undefined })} /></div>
            <div className="lab-revision-field"><label className="lab-field-label"><Layers3 size={15} />执行与场地边界</label><textarea rows={3} placeholder="场地层数、面积、预算等级、不可改造区域、消防或机关限制。" value={lab.executionConstraints} onChange={event => updateLab({ executionConstraints: event.target.value, secondTestDone: false, secondTest: undefined })} /></div>
          </div>
        </Panel>
        <div className="lab-revision-section-title">
          <div><p>WRITER REVISION</p><h2>针对首轮具体事件编辑修改内容</h2></div>
          <span>{activeSimulation.findings.length} 项待审</span>
        </div>
        <div className="lab-revision-workspace">
          <div className="lab-revision-grid">{activeSimulation.findings.map((finding, index) => {
            const active = lab.fixes.includes(finding.id)
            return <section className={`lab-revision-card ${active ? 'lab-revision-card-active' : ''}`} key={finding.id}>
              <div className="lab-revision-card-header">
                <span className="lab-revision-index">{String(index + 1).padStart(2, '0')}</span>
                <div className="flex flex-wrap items-center gap-2"><span className={`lab-risk-pill ${finding.level === 'P0' ? 'lab-risk-p0' : ''}`}>{finding.level}</span><small>{finding.time} · {finding.actor}</small></div>
              </div>
              <h3>{finding.event}</h3>
              <div className="lab-revision-impact"><span>模拟影响</span><p>{finding.impact}</p></div>
              <label className="lab-revision-suggestion"><span>编剧修改</span><small>AI建议仅作为起点，可以直接改写</small></label>
              <textarea rows={3} value={lab.revisionDrafts[finding.id] || finding.suggestion} onChange={event => updateRevision(finding.id, event.target.value)} />
              <div className="lab-revision-card-footer"><span>{active ? '将进入 V1.1 二次验证' : '当前不改变原始版本'}</span><button type="button" className={`lab-review-button ${active ? 'lab-review-button-active' : ''}`} onClick={() => toggleFix(finding.id)}>{active ? <Check size={13} /> : <ArrowRight size={13} />}{active ? '已纳入 V1.1' : '纳入修改'}</button></div>
            </section>
          })}</div>
          <Panel className="lab-revision-summary"><p className="text-[10px] tracking-[.16em] text-white/40">VERSION EVIDENCE</p><div className="lab-revision-score"><div><strong>{firstScore}</strong><p>V1.0 基线</p></div><ArrowRight /><div><strong>{lab.secondTestDone ? secondScore : '—'}</strong><p>V1.1 模型复算</p></div></div><div className="lab-revision-progress"><span style={{ width: `${Math.min(100, lab.fixes.length / Math.max(1, activeSimulation.findings.length) * 100)}%` }} /></div><p className="lab-revision-summary-copy">已纳入 <strong>{lab.fixes.length}</strong> / {activeSimulation.findings.length} 项。模型会重新读取原始规则与修改稿，只复跑受影响路线，并检查新增风险。</p><button type="button" className="lab-primary-button w-full justify-center" disabled={lab.fixes.length === 0 || analysisRun.state === 'running'} onClick={() => void runSecondPlaytest()}><RefreshCw size={15} />{connection.state === 'connected' ? '启动 AI 二轮复算' : '连接模型后复算'}</button>{lab.secondTestDone && lab.secondTest && <div className="lab-revision-complete"><CheckCircle2 size={14} />模型已复跑 {lab.secondTest.rerunPaths} 条受影响路线，结果已写入 V1.1。</div>}</Panel>
        </div>
      </>
    )

    if (lab.step === 4) return (
      <>
        <StageHeading eyebrow="05 / SECOND PLAYTEST" title={lab.secondTest?.verdict || (readyForTabletop ? '二轮模拟通过，进入真人验证' : '二轮仍有阻断问题')} copy={lab.secondTest?.summary || '对比编剧修改前后的行为变化、问题消除情况和新增风险。AI提供推进依据，但不替代编剧和导演的最终判断。'} />
        <div className="lab-metric-grid">
          {[[String(secondScore), 'V1.1 综合评分', `${secondScore >= firstScore ? '较首轮 +' : '较首轮 '}${secondScore - firstScore}`], [String(lab.secondTest?.rerunPaths || 0), '模型复跑路线', '受影响与相邻替代路径'], [String(remainingBlockers), '剩余阻断', remainingBlockers === 0 ? '本轮未发现 P0' : '仍会影响推进'], [String(lab.secondTest?.newRisks.length || 0), '新增风险', '由修改引起的新问题']].map(([value, label, note], index) => <Panel className="lab-metric-card" key={label}><span>{label}</span><strong className={index >= 2 && Number(value) > 0 ? 'text-[#b45937]' : ''}>{value}</strong><small>{note}</small></Panel>)}
        </div>
        <div className="mt-4 grid items-start gap-4 xl:grid-cols-[.78fr_1.22fr]">
          <Panel className="lab-quality-panel">
            <div className="lab-quality-header"><div className="flex items-center gap-2"><Activity size={16} /><h2>结构质量与验证结果</h2></div><span>模型复算</span></div>
            <div className="lab-quality-score-summary"><div><span>首轮</span><strong>{firstScore}</strong></div><ArrowRight /><div><span>二轮</span><strong>{secondScore}</strong></div><b>{secondScore - firstScore >= 0 ? '+' : ''}{secondScore - firstScore}</b></div>
            <div className="mt-5 space-y-4">{scoreRows.map(([label, before]) => <ScoreBar label={String(label)} value={Number(before)} after={dimensionAfter(String(label), Number(before))} key={String(label)} />)}</div>
            <div className="lab-validation-summary-grid">
              <div><strong>{lab.secondTest?.rerunPaths || 0}</strong><span>复跑路线</span></div>
              <div><strong>{lab.secondTest?.routes.filter(route => route.status === '已解决').length || 0}</strong><span>已解决</span></div>
              <div><strong>{remainingBlockers + (lab.secondTest?.newRisks.length || 0)}</strong><span>仍需处理</span></div>
            </div>
            <p className="lab-quality-note">{lab.secondTest?.summary || '每项结果由模型对修改后规则和受影响路线重新计算，点击式修改不会直接提高分数。'}</p>
          </Panel>
          <div className="space-y-4">
            <Panel><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] tracking-[.16em] text-white/40">MODEL RETEST EVIDENCE</p><h2 className="mt-1 text-sm font-semibold">V1.0 → V1.1 模型复测证据</h2></div><span className="lab-tag">{lab.secondTest?.routes.length || 0} 条结果</span></div>{lab.secondTest?.routes.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{lab.secondTest.routes.map(route => <div className={`lab-version-change lab-retest-route lab-retest-${route.status}`} key={`${route.findingId}-${route.title}`}><CheckCircle2 size={15} /><div><span>{route.status}</span><strong>{route.title}</strong><p>{route.evidence}</p></div></div>)}</div> : <p className="mt-5 text-sm text-white/45">尚未形成 V1.1 模型复测证据。返回“编剧修改”启动二轮复算。</p>}</Panel>
            <Panel><div className="flex items-center gap-2"><Route size={16} className="text-[#a6633d]" /><h2 className="text-sm font-semibold">仍需真人验证</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{(lab.secondTest?.humanChecks.length ? lab.secondTest.humanChecks : ['谜题难度是否适中', '隐藏目标是否平衡', '真实动线是否自然', '机关手感、故障率与安全']).map(item => <div className="lab-human-check" key={item}><span /><p>{item}</p></div>)}</div></Panel>
            <Panel className={readyForTabletop ? 'ring-1 ring-[#8fd8df]/50' : 'ring-1 ring-[#ef8b66]/35'}><div className="flex items-center justify-between gap-5"><div><p className="text-[10px] tracking-[.16em] text-white/40">NEXT GATE</p><p className="mt-2 text-base font-semibold">{readyForTabletop ? `${lab.inputs.people} 人真人桌面试玩，不直接进入完整实景` : '返回编剧修改，处理 P0 并重新运行二次模拟'}</p></div><CheckCircle2 className={readyForTabletop ? 'text-[#9ce2e8]' : 'text-[#ef8b66]'} /></div></Panel>
            <div className="flex flex-wrap gap-3"><button type="button" className="lab-primary-button" onClick={exportReport}><Download size={15} />下载决策报告</button><button type="button" className="lab-secondary-button" onClick={reset}><RefreshCw size={15} />重新开始</button></div>
          </div>
        </div>
      </>
    )

    return null
  })()

  const showNext = lab.step < stages.length - 1
  const nextLabels = [
    connection.state === 'connected' ? '开始 AI 试玩' : '连接模型后试玩',
    '查看诊断拆解',
    '进入编剧修改',
    lab.secondTestDone ? '查看二轮结果' : '完成二次试玩后继续',
  ]
  const handleNext = () => {
    if (lab.step === 0) {
      void runDeepSeekAnalysis()
      return
    }
    next()
  }
  const nextDisabled = analysisRun.state === 'running' || (lab.step === 3 && !lab.secondTestDone)
  const activeRunSteps = analysisRun.mode === 'second' ? secondAnalysisSteps : analysisSteps
  const activeRunMetrics = analysisRun.mode === 'second' ? secondAnalysisMetrics : analysisMetrics

  return (
    <main className="lab-shell min-h-[100svh] text-white">
      <div className="lab-background-wash" aria-hidden="true" />
      <div className="lab-background-grid" aria-hidden="true" />
      <aside className="lab-sidebar">
        <button type="button" className="lab-back-button" onClick={onBack}><ArrowLeft size={16} />返回实验场</button>
        <div className="mt-8 flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">内容推理实验室</p><p className="mt-1 text-[10px] tracking-[.2em] text-white/50">AI REASONING LAB</p><span className={`lab-sidebar-model ${connection.state === 'connected' ? 'is-connected' : ''}`}><span />{connection.state === 'connected' ? 'DeepSeek 已保存' : '模型未连接'}</span></div><button type="button" className="lab-settings-icon" aria-label="打开模型设置" onClick={() => setSettingsOpen(true)}><Settings2 size={15} /></button></div>
        <nav className="mt-8 grid grid-cols-3 gap-1 sm:grid-cols-5 lg:grid-cols-1" aria-label="实验进度">
          {stages.map(([number, label], index) => <button type="button" disabled={index > lab.maxVisited} className={`lab-stage-button ${index === lab.step ? 'lab-stage-button-active' : ''}`} onClick={() => go(index)} key={number}><span>{number}</span><strong>{label}</strong>{index < lab.step && <Check size={13} />}</button>)}
        </nav>
      </aside>

      <section className="lab-workspace">
        <div className="lab-content">{content}</div>
        <footer className="lab-footer">
          <button type="button" className="lab-secondary-button" disabled={lab.step === 0} onClick={() => go(Math.max(0, lab.step - 1))}><ArrowLeft size={15} />上一步</button>
          {showNext && <button type="button" className="lab-primary-button" disabled={nextDisabled} onClick={handleNext}>{nextLabels[lab.step]}<ArrowRight size={15} /></button>}
        </footer>
      </section>

      {settingsOpen && (
        <div className="lab-settings-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSettingsOpen(false) }}>
          <section className="lab-settings-panel" role="dialog" aria-modal="true" aria-labelledby="model-settings-title">
            <div className="lab-settings-header">
              <div><p className="lab-settings-kicker">REASONING ENGINE</p><h2 id="model-settings-title">模型设置</h2><p>优先接入 DeepSeek，用于首轮行为模拟、风险诊断和推演依据。</p></div>
              <button type="button" aria-label="关闭模型设置" onClick={() => setSettingsOpen(false)}><X size={18} /></button>
            </div>

            <div className="lab-provider-card">
              <div className="lab-provider-mark">DS</div>
              <div><strong>DeepSeek</strong><span>首选推理服务 · OpenAI 兼容接口</span></div>
              <span className="lab-provider-status">优先</span>
            </div>

            <label className="lab-settings-field">
              <span>模型</span>
              <select value={deepSeekModel} onChange={event => setDeepSeekModel(event.target.value)}>
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
                  onChange={event => {
                    setApiKey(event.target.value)
                    if (connection.state !== 'connected') setConnection({ state: 'idle', message: '尚未保存连接' })
                  }}
                  placeholder={connection.state === 'connected' ? '已安全保存；如需更换请重新输入' : '输入 DeepSeek API Key'}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="button" aria-label={showApiKey ? '隐藏密钥' : '显示密钥'} onClick={() => setShowApiKey(value => !value)}>{showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </label>

            <div className="lab-security-note"><ShieldCheck size={16} /><p><strong>服务器加密保存 30 天</strong><br />密钥不会写入网页源码或可被脚本读取的浏览器存储，仅本设备持有安全凭证。</p></div>

            <div className={`lab-connection-result lab-connection-${connection.state}`}>
              <span className="lab-connection-dot" />
              <p>{connection.message}</p>
            </div>

            <div className="lab-settings-actions">
              <button type="button" className="lab-primary-button justify-center" disabled={connection.state === 'testing'} onClick={saveDeepSeekConnection}><PlugZap size={15} />{connection.state === 'testing' ? '正在保存…' : '验证并安全保存'}</button>
              {connection.state === 'connected' && <button type="button" className="lab-secondary-button justify-center" onClick={clearDeepSeekConnection}>清除已保存配置</button>}
            </div>
          </section>
        </div>
      )}

      {analysisRun.state !== 'idle' && (
        <div className="lab-analysis-overlay" role="presentation">
          <section className="lab-analysis-panel" role="dialog" aria-modal="true" aria-labelledby="analysis-progress-title">
            {analysisRun.state === 'running' ? (
              <>
                <div className="lab-analysis-dashboard-header">
                  <div className="lab-analysis-orbit" aria-hidden="true"><BrainCircuit size={24} /></div>
                  <div><p className="lab-settings-kicker">AI SIMULATION ENGINE</p><h2 id="analysis-progress-title">{analysisRun.mode === 'second' ? 'AI 二轮复算正在运行' : 'AI 首轮模拟正在运行'}</h2><p className="lab-analysis-message">{analysisRun.message || (analysisRun.mode === 'second' ? '正在把 V1.1 修改重新写入行为模型。' : '正在把创作材料转换为可运行的结构模型。')}</p></div>
                  <div className="lab-analysis-progress-number"><strong>{Math.round(((analysisRun.step + 1) / activeRunSteps.length) * 100)}%</strong><span>分析进度</span></div>
                </div>
                <div className="lab-analysis-progress-track"><span style={{ width: `${((analysisRun.step + 1) / activeRunSteps.length) * 100}%` }} /></div>
                <div className="lab-engine-grid">
                  {activeRunSteps.map(([title, copy], index) => {
                    const EngineIcon = [FileText, Users, LockKeyhole, BrainCircuit, Route, AlertTriangle][index]
                    const state = index < analysisRun.step ? 'is-complete' : index === analysisRun.step ? 'is-active' : ''
                    return (
                      <div className={`lab-engine-card ${state}`} key={title}>
                        <div className="lab-engine-icon"><EngineIcon size={17} /></div>
                        <div><span>{String(index + 1).padStart(2, '0')}</span><strong>{title}</strong><p>{copy}</p></div>
                        <small>{index < analysisRun.step ? activeRunMetrics[index] : index === analysisRun.step ? '正在计算…' : '等待前序数据'}</small>
                      </div>
                    )
                  })}
                </div>
                <div className="lab-analysis-footnote"><Activity size={14} /><span>这里只展示任务阶段和统计结果，不展示模型内部思维过程。</span></div>
              </>
            ) : (
              <div className="lab-analysis-error">
                <AlertTriangle size={28} />
                <p className="lab-settings-kicker">ANALYSIS PAUSED</p>
                <h2 id="analysis-progress-title">本轮分析没有完成</h2>
                <p>{analysisRun.message}</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button type="button" className="lab-primary-button" onClick={() => void (analysisRun.mode === 'second' ? runSecondPlaytest() : runDeepSeekAnalysis())}>{analysisRun.mode === 'second' ? '重新复算' : '重新分析'}</button>
                  <button type="button" className="lab-secondary-button" onClick={() => setAnalysisRun({ state: 'idle', step: 0, message: '', mode: analysisRun.mode })}>返回修改</button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
