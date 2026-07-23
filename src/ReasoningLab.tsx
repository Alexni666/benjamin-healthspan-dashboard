import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  Download,
  FileText,
  ImagePlus,
  LayoutDashboard,
  LockKeyhole,
  Map,
  Play,
  RefreshCw,
  Sparkles,
  Users,
  WandSparkles,
} from 'lucide-react'

const storageKey = 'ai-reasoning-lab-demo:v1'
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
  constraints: string
}

type SavedLab = {
  step: number
  maxVisited: number
  inputs: Inputs
  selectedPlan: string
  confirmNote: string
  fixes: string[]
  playtestStarted: boolean
  secondTestDone: boolean
}

const defaultInputs: Inputs = {
  story: '雾岭山中的老旅馆重启前夜，档案被调换，第七把钥匙失踪。六名相关人物必须找回钥匙并识别调包者。',
  rules: '玩家可自由搜证、交换信息；每人有公开身份和个人任务；最终需要开启档案前室并完成投票。',
  people: '6',
  duration: '90 分钟',
  constraints: '室内固定场景；优先控制搭建与跟拍成本；核心机关必须具备人工应急释放。',
}

const stages = [
  ['01', '项目输入'],
  ['02', '理解确认'],
  ['03', '内容推导'],
  ['04', '场景方向'],
  ['05', '平面与视觉'],
  ['06', '版本确认'],
  ['07', '模拟试玩'],
  ['08', '首轮报告'],
  ['09', '修改与二测'],
  ['10', '最终结论'],
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

function loadSaved(): SavedLab {
  const fallback: SavedLab = {
    step: 0,
    maxVisited: 0,
    inputs: defaultInputs,
    selectedPlan: 'A',
    confirmNote: '',
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

  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(lab)), [lab])

  const updateLab = (patch: Partial<SavedLab>) => setLab(current => ({ ...current, ...patch }))
  const updateInput = (key: keyof Inputs, value: string) => setLab(current => ({ ...current, inputs: { ...current.inputs, [key]: value } }))
  const go = (nextStep: number) => setLab(current => ({ ...current, step: nextStep, maxVisited: Math.max(current.maxVisited, nextStep) }))
  const next = () => go(Math.min(lab.step + 1, stages.length - 1))
  const secondScore = Math.min(86, 68 + lab.fixes.length * 3)
  const readyForTabletop = lab.fixes.includes('rule') && lab.fixes.includes('route') && secondScore >= 80

  const aiPrompt = useMemo(() => `你是推理互动内容设计顾问。请根据以下资料输出：故事理解、剧情节点、角色任务、两条证据链、机关与隐藏空间、三套空间策略、规则/线索/角色/空间/节奏/执行风险。不要替代导演的最终判断。\n\n故事：${lab.inputs.story}\n规则：${lab.inputs.rules}\n人数：${lab.inputs.people}\n时长：${lab.inputs.duration}\n制作限制：${lab.inputs.constraints}`, [lab.inputs])

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(aiPrompt)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
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
      `第一轮成熟度：68`,
      `第二轮成熟度：${secondScore}`,
      `结论：${readyForTabletop ? '建议进入 6 人真人桌面试玩，不直接进入完整实景。' : '仍有关键问题未修复，暂不进入真人试玩。'}`,
      '',
      '已采纳修改：',
      ...fixes.filter(([id]) => lab.fixes.includes(id)).map(([, title, copy]) => `- ${title}：${copy}`),
      '',
      '仍需真人验证：23:17 谜题难度、隐藏角色平衡、听证时长、真实动线、机关手感与安全。',
      '',
      '说明：本报告由网页演示数据生成，本次未调用任何 API。',
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
        <StageHeading eyebrow="01 / PROJECT INPUT" title="讲清故事，不必先成为编剧" copy="只填写会真正改变方案的四项信息。剧情节点、角色任务、线索、机关和空间方向由系统在下一步提出。" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel><label className="lab-field-label"><FileText size={15} />故事详情</label><textarea value={lab.inputs.story} onChange={event => updateInput('story', event.target.value)} rows={5} /></Panel>
          <Panel><label className="lab-field-label"><LockKeyhole size={15} />游戏规则</label><textarea value={lab.inputs.rules} onChange={event => updateInput('rules', event.target.value)} rows={5} /></Panel>
          <Panel><label className="lab-field-label"><Users size={15} />人物数量</label><input value={lab.inputs.people} onChange={event => updateInput('people', event.target.value)} /><p className="lab-field-help">参与玩家数量；NPC 可在后续补充。</p></Panel>
          <Panel><label className="lab-field-label"><Clock3 size={15} />预计时长</label><input value={lab.inputs.duration} onChange={event => updateInput('duration', event.target.value)} /><p className="lab-field-help">用于推导阶段节奏与空间规模。</p></Panel>
          <Panel className="lg:col-span-2"><label className="lab-field-label"><Map size={15} />制作限制（可选）</label><textarea value={lab.inputs.constraints} onChange={event => updateInput('constraints', event.target.value)} rows={3} /></Panel>
        </div>
      </>
    )

    if (lab.step === 1) return (
      <>
        <StageHeading eyebrow="02 / UNDERSTANDING" title="先确认理解，再继续生成" copy="这一页只校正方向，不让简单入口重新变成长问卷。下方内容是演示样本，并未调用 API。" />
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['故事类型', '封闭空间 · 复古悬疑 · 合作搜证'],
            ['核心冲突', '六人需要找回第七把钥匙，同时识别断电期间的档案调包者。'],
            ['玩家任务', `在 ${lab.inputs.duration} 内形成钥匙、路线与动机三段证据链。`],
            ['高潮位置', '隐藏档案前室；开启后完成协议核验和真相投票。'],
          ].map(([label, value]) => <Panel key={label}><p className="text-[11px] tracking-[.16em] text-white/35">{label}</p><p className="mt-3 text-sm leading-6 text-white/85">{value}</p></Panel>)}
          <Panel className="md:col-span-2">
            <p className="text-sm font-semibold">系统默认假设</p>
            <div className="mt-4 flex flex-wrap gap-2">{['室内固定场景', '中等制作等级', '可局部搭建', '六人合作＋隐藏对抗', '雾夜冷暖对比'].map(tag => <span className="lab-tag" key={tag}>{tag}</span>)}</div>
            <textarea className="mt-5" rows={3} placeholder="如果理解有偏差，在这里写一句修改意见。" value={lab.confirmNote} onChange={event => updateLab({ confirmNote: event.target.value })} />
          </Panel>
        </div>
        <button type="button" className="lab-secondary-button mt-5" onClick={copyPrompt}><Clipboard size={15} />{copied ? '已复制，可粘贴到 ChatGPT' : '复制完整分析提示词'}</button>
      </>
    )

    if (lab.step === 2) return (
      <>
        <StageHeading eyebrow="03 / CONTENT REASONING" title="把故事转成可检查的内容骨架" copy="从剧情阶段、人物任务、证据链和空间事件四个维度形成统一版本，后续平面和试玩都引用这套结构。" />
        <Panel className="mb-4">
          <div className="flex items-center justify-between gap-4"><h2 className="text-sm font-semibold">90 分钟剧情节奏</h2><span className="lab-tag">6 个节点</span></div>
          <div className="lab-timeline mt-6">{['入场仪式', '自由搜证', '断电调包', '空间追踪', '钥匙机关', '集中推理'].map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></div>)}</div>
        </Panel>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['角色结构', '6 个公开身份、个人任务和行动权限；1 名受规则约束的调包者。', '角色参与'],
            ['证据系统', '钥匙标记＋老照片构成钥匙链；维修粉＋日志构成调包路线链。', '线索闭环'],
            ['机关与隐藏空间', '祖父钟 23:17 暗格、后勤隐藏通道、档案前室三段空间事件。', '异常恢复'],
            ['视觉与空间需求', '大堂、餐厅、图书室、客房走廊、钟厅、后勤区和隐藏前室。', '勘景任务'],
          ].map(([title, copy, tag]) => <Panel key={title}><span className="lab-tag">{tag}</span><h2 className="mt-5 text-base font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-white/55">{copy}</p></Panel>)}
        </div>
      </>
    )

    if (lab.step === 3) return (
      <>
        <StageHeading eyebrow="04 / SPACE STRATEGY" title="三套方向不是三张随机图片" copy="每套空间方案都有明确的制作取舍。先选策略，再生成平面与视觉，避免漂亮图片和实际玩法脱节。" />
        <div className="grid gap-4 xl:grid-cols-3">
          {plans.map(plan => <button type="button" className={`lab-plan-card ${lab.selectedPlan === plan.id ? 'lab-plan-card-selected' : ''}`} onClick={() => updateLab({ selectedPlan: plan.id })} key={plan.id}>
            <div className="lab-plan-sketch"><PlanSketch variant={plan.id} /></div>
            <div className="mt-5 flex items-start justify-between"><div><span className="text-xs text-[#efb876]">方案 {plan.id}</span><h2 className="mt-1 text-lg font-semibold">{plan.title}</h2></div>{lab.selectedPlan === plan.id && <CheckCircle2 className="text-[#8fd8df]" size={20} />}</div>
            <p className="mt-3 text-xs tracking-[.12em] text-white/35">{plan.meta}</p><p className="mt-3 text-sm leading-6 text-white/55">{plan.copy}</p>
          </button>)}
        </div>
      </>
    )

    if (lab.step === 4) return (
      <>
        <StageHeading eyebrow="05 / PLAN & VISUAL" title="三张平面图，三张重点区域效果图" copy="平面图负责连接、容量和动线；效果图负责材质、灯光、视觉焦点和机关遮挡。图片可由你手动替换，本轮不会调用生图 API。" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map(plan => <Panel className={lab.selectedPlan === plan.id ? 'ring-1 ring-[#efb876]/60' : ''} key={plan.id}><div className="aspect-[4/3] rounded-xl bg-[#070b0d] p-3"><PlanSketch variant={plan.id} /></div><div className="mt-4 flex items-center justify-between"><div><p className="text-sm font-semibold">{plan.id}｜{plan.title}</p><p className="mt-1 text-[11px] text-white/35">概念平面图</p></div><button type="button" className="lab-icon-button" onClick={() => updateLab({ selectedPlan: plan.id })}>{lab.selectedPlan === plan.id ? <Check size={15} /> : <Map size={15} />}</button></div></Panel>)}
          {['大堂与前台', '钟厅核心机关', '隐藏档案前室'].map((title, index) => <Panel key={title}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg, transparent, rgba(3,5,6,.72)), url(${uploads[index] || visualImages[index]})` }}><span className="absolute bottom-3 left-3 text-xs font-medium">{title}</span></div>
            <div className="mt-4 flex items-center justify-between"><div><p className="text-sm font-semibold">效果图 {index + 1}</p><p className="mt-1 text-[11px] text-white/35">概念视觉 · 可替换</p></div><label className="lab-icon-button cursor-pointer"><ImagePlus size={15} /><input type="file" accept="image/*" hidden onChange={event => { loadVisual(index, event.target.files?.[0]); event.target.value = '' }} /></label></div>
          </Panel>)}
        </div>
      </>
    )

    if (lab.step === 5) return (
      <>
        <StageHeading eyebrow="06 / FREEZE VERSION" title="确认同一版本，再进入试玩" copy="试玩不是评价一张孤立的图片，而是同时读取已确认的剧情、规则、房间连接、动线、线索和机关。" />
        <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <Panel><div className="flex items-center gap-3"><LockKeyhole size={19} className="text-[#efb876]" /><div><h2 className="font-semibold">方案 V1.0 即将冻结</h2><p className="mt-1 text-xs text-white/40">后续修改会生成 V1.1，保留前后对比。</p></div></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">{['故事理解与最终目标', '六名角色和个人任务', '两条证据链与三处机关', `${lab.selectedPlan}｜${plans.find(plan => plan.id === lab.selectedPlan)?.title}`, '六个剧情阶段', '制作限制与人员假设'].map(item => <div className="flex items-center gap-2 rounded-lg bg-white/[.035] px-3 py-3 text-xs text-white/65" key={item}><Check size={14} className="text-[#8fd8df]" />{item}</div>)}</div>
          </Panel>
          <Panel><p className="text-[11px] tracking-[.16em] text-white/35">试玩检查范围</p><div className="mt-4 space-y-3">{['规则链与异常恢复', '线索闭环与替代路径', '六类玩家关键路径', '空间拥堵与单点通路', '机关、人员、拍摄与安全'].map(item => <p className="flex items-center gap-2 text-sm text-white/70" key={item}><span className="h-1.5 w-1.5 rounded-full bg-[#efb876]" />{item}</p>)}</div></Panel>
        </div>
      </>
    )

    if (lab.step === 6) return (
      <>
        <StageHeading eyebrow="07 / SIMULATION" title="六类玩家从不同方向攻击同一套规则" copy="用极端行为暴露提前触发、规则误解、角色闲置、超时和控场风险。这里展示的是稳定演示样本。" />
        {!lab.playtestStarted ? <Panel className="grid min-h-[360px] place-items-center text-center"><div><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#efb876]/12 text-[#efb876]"><Play size={24} /></span><h2 className="mt-5 text-xl font-semibold">准备开始第一轮模拟试玩</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">系统将按六类玩家行为检查规则、线索、角色、空间、节奏与执行风险。</p><button type="button" className="lab-primary-button mt-6" onClick={() => updateLab({ playtestStarted: true })}><Play size={16} />开始模拟试玩</button></div></Panel> :
          <div className="grid gap-3">{players.map(([name, behavior, result], index) => <Panel className="grid items-center gap-4 sm:grid-cols-[120px_1fr_1fr_70px]" key={name}><strong className="text-sm">{name}</strong><p className="text-xs leading-5 text-white/45">{behavior}</p><p className="text-xs leading-5 text-white/70">{result}</p><span className={`lab-risk-pill ${index === 2 ? 'lab-risk-p0' : ''}`}>{index === 2 ? 'P0' : index === 0 || index === 4 ? 'P1' : '已检查'}</span></Panel>)}</div>}
      </>
    )

    if (lab.step === 7) return (
      <>
        <StageHeading eyebrow="08 / FIRST REPORT" title="第一轮成熟度 68：暂不进入实景" copy="真正需要看的不是总分，而是两个 P0 问题会让结局被越级触发或让整局锁死。" />
        <div className="grid gap-4 xl:grid-cols-[.75fr_1.25fr]">
          <Panel><div className="flex items-end gap-3"><strong className="text-7xl font-semibold tracking-[-.08em]">68</strong><span className="mb-2 text-xs text-white/35">/ 100</span></div><p className="mt-4 text-sm font-semibold text-[#f39b78]">不建议进入实景试玩</p><div className="mt-6 space-y-4">{scoreRows.map(([label, before]) => <ScoreBar label={String(label)} value={Number(before)} key={String(label)} />)}</div></Panel>
          <div className="grid gap-3">{risks.map(([level, title, copy]) => <Panel className="grid gap-3 sm:grid-cols-[48px_145px_1fr]" key={title}><span className={`lab-risk-pill ${level === 'P0' ? 'lab-risk-p0' : ''}`}>{level}</span><strong className="text-sm">{title}</strong><p className="text-xs leading-5 text-white/55">{copy}</p></Panel>)}</div>
        </div>
      </>
    )

    if (lab.step === 8) return (
      <>
        <StageHeading eyebrow="09 / REVISION & RETEST" title="逐项修改，再做第二轮试玩" copy="每采纳一项修改，都会进入 V1.1 的变更记录。选择关键修复后再运行二测，观察分数与门槛是否真正变化。" />
        <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
          <div className="grid gap-3">{fixes.map(([id, title, copy]) => {
            const active = lab.fixes.includes(id)
            return <button type="button" className={`lab-fix-card ${active ? 'lab-fix-card-active' : ''}`} onClick={() => updateLab({ fixes: active ? lab.fixes.filter(item => item !== id) : [...lab.fixes, id], secondTestDone: false })} key={id}><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/15">{active && <Check size={14} />}</span><span className="text-left"><strong className="text-sm">{title}</strong><small className="mt-1 block text-xs leading-5 text-white/45">{copy}</small></span></button>
          })}</div>
          <Panel className="h-fit xl:sticky xl:top-6"><p className="text-[11px] tracking-[.16em] text-white/35">实时版本比较</p><div className="mt-6 flex items-center justify-between"><div><strong className="text-4xl">68</strong><p className="mt-1 text-[11px] text-white/30">V1.0</p></div><ArrowRight className="text-white/25" /><div className="text-right"><strong className="text-4xl text-[#9ce2e8]">{secondScore}</strong><p className="mt-1 text-[11px] text-white/30">V1.1</p></div></div><div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/8"><span className="block h-full rounded-full bg-gradient-to-r from-[#d77751] to-[#77cbd3]" style={{ width: `${secondScore}%` }} /></div><p className="mt-5 text-xs leading-5 text-white/45">已采纳 {lab.fixes.length} / {fixes.length} 项。P0 问题必须全部清除，才能建议进入真人桌面试玩。</p><button type="button" className="lab-primary-button mt-6 w-full justify-center" disabled={lab.fixes.length === 0} onClick={() => updateLab({ secondTestDone: true })}><RefreshCw size={15} />运行第二轮试玩</button>{lab.secondTestDone && <p className="mt-4 flex items-center gap-2 text-xs text-[#9ce2e8]"><CheckCircle2 size={15} />二测完成，未发现新增 P0 风险。</p>}</Panel>
        </div>
      </>
    )

    return (
      <>
        <StageHeading eyebrow="10 / DECISION" title={readyForTabletop ? '建议进入 6 人真人桌面试玩' : '关键问题仍未清除'} copy="AI 只负责把可结构化问题提前暴露。真实情绪、机关手感、镜头效果和安全责任仍然必须由人验证。" />
        <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
          <Panel><p className="text-[11px] tracking-[.16em] text-white/35">版本成熟度</p><div className="mt-5 flex items-end gap-4"><strong className="text-7xl font-semibold tracking-[-.08em] text-[#9ce2e8]">{secondScore}</strong><span className="mb-2 text-sm text-white/25">V1.1</span></div><p className={`mt-5 text-sm font-semibold ${readyForTabletop ? 'text-[#9ce2e8]' : 'text-[#f39b78]'}`}>{readyForTabletop ? 'P0 已清除 · 进入桌面验证' : '仍有 P0 · 暂停推进'}</p><div className="mt-7 space-y-4">{scoreRows.map(([label, before, after]) => <ScoreBar label={String(label)} value={Number(before)} after={lab.fixes.length === fixes.length ? Number(after) : Math.min(Number(after), Number(before) + lab.fixes.length * 4)} key={String(label)} />)}</div></Panel>
          <div className="space-y-4">
            <Panel><div className="flex items-center gap-3"><Sparkles size={18} className="text-[#efb876]" /><h2 className="font-semibold">仍需真人验证的 5 件事</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{['23:17 谜题难度是否适中', '调包者隐藏目标是否平衡', '52 分钟听证是否过长', '真实单向动线是否自然', '机关手感、故障率与安全'].map(item => <p className="rounded-lg bg-white/[.035] px-3 py-3 text-xs leading-5 text-white/55" key={item}>{item}</p>)}</div></Panel>
            <Panel><div className="flex items-center justify-between gap-4"><div><p className="text-xs text-white/35">下一阶段门槛</p><p className="mt-2 text-sm font-semibold">{readyForTabletop ? '6 人真人桌面试玩，不直接进入完整实景' : '补齐关键修复，再次运行二测'}</p></div><CheckCircle2 className={readyForTabletop ? 'text-[#9ce2e8]' : 'text-white/20'} /></div></Panel>
            <div className="flex flex-wrap gap-3"><button type="button" className="lab-primary-button" onClick={exportReport}><Download size={15} />下载本次报告</button><button type="button" className="lab-secondary-button" onClick={reset}><RefreshCw size={15} />重新开始</button></div>
          </div>
        </div>
      </>
    )
  })()

  const canContinue = lab.step !== 6 || lab.playtestStarted
  const showNext = lab.step < stages.length - 1

  return (
    <main className="lab-shell min-h-[100svh] text-white">
      <video className="lab-background-video" src="/dna-background.mp4" autoPlay loop muted playsInline preload="auto" aria-hidden="true" />
      <div className="lab-background-wash" aria-hidden="true" />
      <div className="lab-background-grid" aria-hidden="true" />
      <aside className="lab-sidebar">
        <button type="button" className="lab-back-button" onClick={onBack}><ArrowLeft size={16} />返回实验场</button>
        <div className="mt-8"><p className="text-sm font-semibold">内容推理实验室</p><p className="mt-1 text-[10px] tracking-[.2em] text-white/50">AI REASONING LAB</p></div>
        <nav className="mt-8 grid grid-cols-5 gap-1 lg:grid-cols-1" aria-label="实验进度">
          {stages.map(([number, label], index) => <button type="button" disabled={index > lab.maxVisited} className={`lab-stage-button ${index === lab.step ? 'lab-stage-button-active' : ''}`} onClick={() => go(index)} key={number}><span>{number}</span><strong>{label}</strong>{index < lab.step && <Check size={13} />}</button>)}
        </nav>
        <div className="lab-demo-note mt-auto hidden rounded-xl p-3 text-[11px] leading-5 text-white/55 lg:block"><span className="mb-2 inline-flex items-center gap-1.5 text-[#aee9ee]"><WandSparkles size={13} />演示模式</span><br />API 已保留但未调用。页面使用预置样本和本地计算。</div>
      </aside>

      <section className="lab-workspace">
        <header className="lab-topbar"><div className="flex items-center gap-2 text-[11px] text-white/55"><LayoutDashboard size={14} /><span>实验控制台</span><span>/</span><span className="text-white/85">{stages[lab.step][1]}</span></div><span className="inline-flex items-center gap-1.5 rounded-full border border-[#8fd8df]/30 bg-[#8fd8df]/10 px-3 py-1.5 text-[10px] text-[#b5eef2]"><span className="h-1.5 w-1.5 rounded-full bg-[#8fd8df]" />API 未调用</span></header>
        <div className="lab-content">{content}</div>
        <footer className="lab-footer">
          <button type="button" className="lab-secondary-button" disabled={lab.step === 0} onClick={() => go(Math.max(0, lab.step - 1))}><ArrowLeft size={15} />上一步</button>
          {showNext && <button type="button" className="lab-primary-button" disabled={!canContinue || (lab.step === 8 && !lab.secondTestDone)} onClick={next}>{lab.step === 0 ? '生成内容骨架' : lab.step === 5 ? '开始模拟试玩' : lab.step === 8 ? '查看最终结论' : '确认并继续'}<ArrowRight size={15} /></button>}
        </footer>
      </section>
    </main>
  )
}
