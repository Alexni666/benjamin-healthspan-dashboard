import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowRight, Check, ChevronDown, ChevronUp, Download, Eye, EyeOff, GripVertical, HelpCircle, Pencil, RotateCcw } from 'lucide-react'

const backgroundVideo = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_044635_8daabe05-1a5c-491c-920f-4b0bd8f04812.mp4'
const legacyLogo = 'https://polo-pecan-73837341.figma.site/_assets/v11/f73360d8fc2d33f2b5a4bfb1fa4935fca355946f.svg'
const defaultLogo = ''
const defaultAvatar = 'https://polo-pecan-73837341.figma.site/_assets/v11/745de561b3ebfa8634a3483efc95f21feedd96c9.png'
const ageTexture = 'https://polo-pecan-73837341.figma.site/_assets/v11/d8d9bd498347ea96ca4d675a624c8d90e06786e7.png'
const insightsImage = 'https://polo-pecan-73837341.figma.site/_assets/v11/94903fdf21e145cd4ba873c15fc03251c0600ee5.png'
const planImage = 'https://polo-pecan-73837341.figma.site/_assets/v11/0c38fdb8a933b0da384a5a3f8b0d9986bb919838.png'
const storageKey = 'healthspan-simple-editor:v1'

type Direction = 'up' | 'down' | 'left' | 'right' | 'scale'
type CardId = 'activities' | 'insights' | 'snapshot' | 'plan'
type RegionId = 'side' | 'ageBottom' | 'pageBottom'
type CardWidth = 'half' | 'full'
type CardPlacement = { region: RegionId; width: CardWidth }

type Copy = {
  brandName: string
  brandEnglish: string
  name: string
  helpTitle: string
  help: string
  ageLabel: string
  metric: string
  ageBadge: string
  activitiesTitle: string
  activitiesMeta: string
  activitiesBody: string
  insightsTitle: string
  insightsMeta: string
  insightsBody: string
  snapshotTitle: string
  snapshotMeta: string
  snapshotBody: string
  planTitle: string
  planMeta: string
  planBody: string
}

type EditorData = {
  contentVersion: number
  copy: Copy
  logo: string
  avatar: string
  order: CardId[]
  hidden: CardId[]
  layout: Record<CardId, CardPlacement>
}

const defaultCopy: Copy = {
  brandName: 'AI内容试验场',
  brandEnglish: 'AI CONTENT LAB',
  name: '内容创新实验控制台',
  helpTitle: '核心说明',
  help: '让尚未成形的内容想法，先经过AI生成、模拟、测试和修改，再决定是否投入真人、场景与制作成本。',
  ageLabel: '正在孵化的实验方向',
  metric: '03',
  ageBadge: '从内容创意到可验证方案',
  activitiesTitle: 'AI推理内容实验室',
  activitiesMeta: '已开放',
  activitiesBody: '从故事出发，生成剧情节点、人物任务、线索机关、场景布局，并进行多类型玩家模拟试玩。',
  insightsTitle: 'AI游戏机制实验室',
  insightsMeta: '规划中',
  insightsBody: '生成和检查游戏机制，模拟不同玩家行为，提前发现规则漏洞、节奏失衡和执行风险。',
  snapshotTitle: 'AI美食互动实验',
  snapshotMeta: '概念验证',
  snapshotBody: '探索用户挑战、AI初评、专业评审、直播互动与商业转化之间的新内容形式。',
  planTitle: '实验档案与报告',
  planMeta: '3项实验',
  planBody: '记录每次实验的输入、生成方案、测试问题、修改过程和人工验证结果。',
}

const defaultOrder: CardId[] = ['activities', 'insights', 'snapshot', 'plan']
const defaultLayout: Record<CardId, CardPlacement> = {
  activities: { region: 'side', width: 'half' },
  insights: { region: 'side', width: 'half' },
  snapshot: { region: 'side', width: 'half' },
  plan: { region: 'side', width: 'half' },
}
const cardLabels: Record<CardId, string> = {
  activities: 'AI推理内容实验室',
  insights: 'AI游戏机制实验室',
  snapshot: 'AI美食互动实验',
  plan: '实验档案与报告',
}
const regionLabels: Record<RegionId, string> = {
  side: '右侧',
  ageBottom: '年龄卡下方',
  pageBottom: '页面底部',
}

function loadEditorData(): EditorData {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}') as Partial<EditorData>
    const storedLayout = stored.layout || {} as Partial<Record<CardId, CardPlacement>>
    return {
      contentVersion: 3,
      copy: stored.contentVersion === 3 ? { ...defaultCopy, ...(stored.copy || {}) } : defaultCopy,
      logo: stored.logo && stored.logo !== legacyLogo ? stored.logo : defaultLogo,
      avatar: stored.avatar || defaultAvatar,
      order: stored.order?.length === defaultOrder.length ? stored.order : defaultOrder,
      hidden: stored.hidden || [],
      layout: Object.fromEntries(defaultOrder.map(id => [id, { ...defaultLayout[id], ...(storedLayout[id] || {}) }])) as Record<CardId, CardPlacement>,
    }
  } catch {
    return { contentVersion: 3, copy: defaultCopy, logo: defaultLogo, avatar: defaultAvatar, order: defaultOrder, hidden: [], layout: defaultLayout }
  }
}

function AnimatedElement({ children, direction = 'up', delay = 0, className = '' }: { children: ReactNode; direction?: Direction; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.1 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const offsets: Record<Direction, string> = {
    up: 'translate3d(0, 40px, 0)',
    down: 'translate3d(0, -40px, 0)',
    left: 'translate3d(40px, 0, 0)',
    right: 'translate3d(-40px, 0, 0)',
    scale: 'scale(0.9)',
  }

  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translate3d(0, 0, 0) scale(1)' : offsets[direction], transition: `opacity .8s cubic-bezier(.16, 1, .3, 1) ${delay}ms, transform .8s cubic-bezier(.16, 1, .3, 1) ${delay}ms` }}>
      {children}
    </div>
  )
}

function EditableText({ value, editing, onChange, className = '', multiline = false }: { value: string; editing: boolean; onChange: (value: string) => void; className?: string; multiline?: boolean }) {
  return (
    <span
      className={`editable-text ${multiline ? 'whitespace-pre-line' : ''} ${className}`}
      contentEditable={editing}
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={event => onChange(event.currentTarget.innerText.trim() || value)}
      onKeyDown={event => {
        if (!multiline && event.key === 'Enter') {
          event.preventDefault()
          event.currentTarget.blur()
        }
      }}
    >
      {value}
    </span>
  )
}

function ArrowButton({ dark = false, label }: { dark?: boolean; label: string }) {
  return <span className={`grid h-9 w-9 place-items-center rounded-full transition-transform duration-300 group-hover:translate-x-1 ${dark ? 'bg-black text-white' : 'bg-white text-black'}`} aria-label={label}><ArrowRight size={17} strokeWidth={1.7} aria-hidden="true" /></span>
}

function RulerTicker() {
  const ticks = Array.from({ length: 61 })
  return (
    <div className="ruler relative mt-2 h-10 w-full max-w-[620px] overflow-hidden" aria-hidden="true">
      <div className="animate-ticker flex h-full w-max items-center">
        {[0, 1].map(set => <div className="flex h-full items-center gap-[14px] pr-[14px]" key={set}>{ticks.map((_, index) => <span className="block w-px rounded-full bg-[rgba(239,206,150,.5)]" style={{ height: index % 5 === 0 ? 26 : 18 } as CSSProperties} key={`${set}-${index}`} />)}</div>)}
      </div>
      <span className="absolute left-1/2 top-0 h-10 w-0.5 -translate-x-1/2 rounded-full bg-[#EFCE96]" />
    </div>
  )
}

export default function App() {
  const logoInput = useRef<HTMLInputElement>(null)
  const avatarInput = useRef<HTMLInputElement>(null)
  const [data, setData] = useState<EditorData>(loadEditorData)
  const [videoReady, setVideoReady] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draggedCard, setDraggedCard] = useState<CardId | null>(null)
  const editorAvailable = new URLSearchParams(window.location.search).get('edit') === '1'

  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(data)), [data])

  const setCopy = (key: keyof Copy, value: string) => setData(current => ({ ...current, copy: { ...current.copy, [key]: value } }))
  const hidden = (id: CardId) => data.hidden.includes(id)

  const toggleCard = (id: CardId) => setData(current => ({ ...current, hidden: current.hidden.includes(id) ? current.hidden.filter(item => item !== id) : [...current.hidden, id] }))
  const moveCard = (id: CardId, offset: number) => setData(current => {
    const siblings = current.order.filter(item => current.layout[item].region === current.layout[id].region)
    const target = siblings[siblings.indexOf(id) + offset]
    if (!target) return current
    const order = [...current.order]
    const from = order.indexOf(id)
    order.splice(from, 1)
    const targetIndex = order.indexOf(target)
    order.splice(offset > 0 ? targetIndex + 1 : targetIndex, 0, id)
    return { ...current, order }
  })
  const dropCard = (target: CardId) => {
    if (!draggedCard || draggedCard === target) return
    setData(current => {
      const order = current.order.filter(id => id !== draggedCard)
      order.splice(order.indexOf(target), 0, draggedCard)
      return {
        ...current,
        order,
        layout: { ...current.layout, [draggedCard]: { ...current.layout[draggedCard], region: current.layout[target].region } },
      }
    })
    setDraggedCard(null)
  }
  const dropInRegion = (region: RegionId) => {
    if (!draggedCard) return
    setData(current => {
      const order = current.order.filter(id => id !== draggedCard)
      const lastCard = order.filter(id => current.layout[id].region === region).at(-1)
      order.splice(lastCard ? order.indexOf(lastCard) + 1 : order.length, 0, draggedCard)
      return {
        ...current,
        order,
        layout: { ...current.layout, [draggedCard]: { ...current.layout[draggedCard], region } },
      }
    })
    setDraggedCard(null)
  }
  const setRegion = (id: CardId, region: RegionId) => setData(current => ({
    ...current,
    layout: { ...current.layout, [id]: { ...current.layout[id], region } },
  }))
  const setCardWidth = (id: CardId, width: CardWidth) => setData(current => ({
    ...current,
    layout: { ...current.layout, [id]: { ...current.layout[id], width } },
  }))

  const loadImage = (file: File | undefined, target: 'logo' | 'avatar') => {
    if (!file) return
    if (file.size > 1024 * 1024) {
      window.alert(`请选择小于 1MB 的${target === 'logo' ? '品牌 Logo' : '头像'}图片。`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => setData(current => ({ ...current, [target]: String(reader.result) }))
    reader.readAsDataURL(file)
  }

  const exportEdits = () => {
    const blob = new Blob([JSON.stringify({ version: 3, exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'ai-content-lab-page-edits.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const resetEdits = () => {
    if (!window.confirm('确定清除当前浏览器里的全部修改吗？')) return
    localStorage.removeItem(storageKey)
    setData({ contentVersion: 3, copy: defaultCopy, logo: defaultLogo, avatar: defaultAvatar, order: defaultOrder, hidden: [], layout: defaultLayout })
  }

  const cardControls = (id: CardId) => editing && (
    <div className="card-edit-controls" onClick={event => event.stopPropagation()}>
      <GripVertical size={15} aria-hidden="true" />
      <button type="button" aria-label={hidden(id) ? `显示 ${cardLabels[id]}` : `隐藏 ${cardLabels[id]}`} onClick={() => toggleCard(id)}>{hidden(id) ? <Eye size={15} /> : <EyeOff size={15} />}</button>
    </div>
  )

  const renderCard = (id: CardId) => {
    const shared = `editor-card relative ${hidden(id) ? 'editor-card-hidden' : ''}`
    if (id === 'activities') return <article className={`${shared} group flex min-h-[220px] w-full flex-col rounded-2xl bg-[#2F2F2F]/60 p-4 text-left backdrop-blur-[52px] transition-colors hover:bg-[#2F2F2F]/70 sm:rounded-[20px] sm:p-5`}>
      {cardControls(id)}<EditableText value={data.copy.activitiesTitle} editing={editing} onChange={value => setCopy('activitiesTitle', value)} className="pr-12 text-base font-semibold sm:text-lg" />
      <EditableText value={data.copy.activitiesBody} editing={editing} onChange={value => setCopy('activitiesBody', value)} multiline className="mt-4 block text-xs leading-relaxed text-white/60" />
      <span className="mt-auto flex items-end justify-between pt-5"><EditableText value={data.copy.activitiesMeta} editing={editing} onChange={value => setCopy('activitiesMeta', value)} className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] text-white/70 sm:text-xs" /><ArrowButton dark label="查看 AI 推理内容实验" /></span>
    </article>
    if (id === 'insights') return <article className={`${shared} group flex min-h-[220px] w-full flex-col overflow-hidden rounded-2xl bg-cover bg-center p-4 text-left transition-[filter,transform] hover:brightness-110 sm:rounded-[20px] sm:p-5`} style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.24), rgba(0,0,0,.38)), url(${insightsImage})` }}>
      {cardControls(id)}<EditableText value={data.copy.insightsTitle} editing={editing} onChange={value => setCopy('insightsTitle', value)} className="pr-12 text-base font-semibold sm:text-lg" />
      <EditableText value={data.copy.insightsBody} editing={editing} onChange={value => setCopy('insightsBody', value)} multiline className="mt-4 block text-xs leading-relaxed text-white/80" />
      <span className="mt-auto flex items-end justify-between pt-5"><EditableText value={data.copy.insightsMeta} editing={editing} onChange={value => setCopy('insightsMeta', value)} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black" /><ArrowButton label="查看 AI 游戏机制实验" /></span>
    </article>
    if (id === 'snapshot') return <article className={`${shared} group flex min-h-[220px] w-full flex-col overflow-hidden rounded-2xl bg-white p-4 text-left text-black backdrop-blur-[52px] transition-transform hover:-translate-y-0.5 sm:rounded-[20px] sm:p-5`}>
      {cardControls(id)}
      <EditableText value={data.copy.snapshotTitle} editing={editing} onChange={value => setCopy('snapshotTitle', value)} className="block pr-12 text-base font-semibold sm:text-lg" />
      <EditableText value={data.copy.snapshotBody} editing={editing} onChange={value => setCopy('snapshotBody', value)} multiline className="mt-4 block text-xs leading-relaxed text-black/60" />
      <span className="mt-auto flex items-end justify-between pt-5"><EditableText value={data.copy.snapshotMeta} editing={editing} onChange={value => setCopy('snapshotMeta', value)} className="rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white" /><ArrowButton dark label="查看 AI 美食互动实验" /></span>
    </article>
    return <article className={`${shared} group flex min-h-[220px] w-full flex-col overflow-hidden rounded-2xl bg-cover bg-center p-4 text-left transition-[filter,transform] hover:brightness-110 sm:rounded-[20px] sm:p-5`} style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.22), rgba(0,0,0,.42)), url(${planImage})` }}>
      {cardControls(id)}<EditableText value={data.copy.planTitle} editing={editing} onChange={value => setCopy('planTitle', value)} className="pr-12 text-base font-semibold sm:text-lg" />
      <EditableText value={data.copy.planBody} editing={editing} onChange={value => setCopy('planBody', value)} multiline className="mt-4 block text-xs leading-relaxed text-white/80" />
      <span className="mt-auto flex items-end justify-between pt-5"><EditableText value={data.copy.planMeta} editing={editing} onChange={value => setCopy('planMeta', value)} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black" /><ArrowButton label="查看实验档案与报告" /></span>
    </article>
  }

  const renderRegion = (region: RegionId, className = '') => {
    const cards = data.order.filter(id => data.layout[id].region === region && (editing || !hidden(id)))
    if (!editing && cards.length === 0) return null
    return (
      <section
        className={`layout-region ${editing ? 'layout-region-editing' : ''} ${className}`}
        aria-label={`${regionLabels[region]}模块`}
        onDragOver={event => { if (editing) event.preventDefault() }}
        onDrop={() => dropInRegion(region)}
      >
        {editing && <span className="region-label">{regionLabels[region]}</span>}
        {cards.map((id, index) => (
          <AnimatedElement direction="left" delay={500 + index * 120} className={`${data.layout[id].width === 'full' ? 'sm:col-span-2' : ''} ${id === 'snapshot' ? 'relative z-20' : ''}`} key={id}>
            <div
              draggable={editing}
              onDragStart={() => setDraggedCard(id)}
              onDragEnd={() => setDraggedCard(null)}
              onDragOver={event => { if (editing) event.preventDefault() }}
              onDrop={event => { event.stopPropagation(); dropCard(id) }}
            >
              {renderCard(id)}
            </div>
          </AnimatedElement>
        ))}
        {editing && cards.length === 0 && <span className="region-empty">把模块拖到这里</span>}
      </section>
    )
  }

  return (
    <main className={`relative min-h-[100svh] overflow-x-hidden bg-[#0a0a0a] text-white ${editing ? 'is-editing' : ''}`}>
      <video className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-[1500ms] ${videoReady ? 'opacity-100' : 'opacity-0'}`} src={backgroundVideo} autoPlay loop muted playsInline onCanPlay={() => setVideoReady(true)} />
      <div className="scene-overlay absolute inset-0 z-[1]" />

      <AnimatedElement direction="down" delay={100} className="relative z-10">
        <nav className="flex items-start justify-between px-5 pt-6 sm:px-8 sm:pt-8 lg:px-12">
          <div className="flex items-center gap-3">
            <button type="button" className={`logo-editor relative h-10 w-12 shrink-0 ${!data.logo && !editing ? 'hidden' : ''}`} disabled={!editing} onClick={() => logoInput.current?.click()} aria-label="更换品牌 Logo">
              {data.logo ? <img src={data.logo} alt={data.copy.brandName} className="h-full w-full object-contain object-left" /> : <span className="grid h-full w-full place-items-center rounded-lg border border-dashed border-[#EFCE96]/60 text-[#EFCE96]"><Pencil size={16} /></span>}
              {editing && data.logo && <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/55"><Pencil size={17} /></span>}
            </button>
            <span className="flex flex-col">
              <EditableText value={data.copy.brandName} editing={editing} onChange={value => setCopy('brandName', value)} className="text-sm font-semibold tracking-[.08em] sm:text-base" />
              <EditableText value={data.copy.brandEnglish} editing={editing} onChange={value => setCopy('brandEnglish', value)} className="mt-0.5 text-[9px] tracking-[.22em] text-white/55 sm:text-[10px]" />
            </span>
          </div>
          <input ref={logoInput} type="file" accept="image/*" hidden onChange={event => { loadImage(event.target.files?.[0], 'logo'); event.target.value = '' }} />
          <div className="absolute left-1/2 top-8 -translate-x-1/2 sm:top-10">
            <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/20 text-white backdrop-blur-xl transition-colors hover:bg-black/40" aria-label="Show dashboard help" aria-expanded={helpOpen} onClick={() => setHelpOpen(open => !open)}><HelpCircle size={18} strokeWidth={1.5} /></button>
            <div className={`absolute left-1/2 top-12 w-72 -translate-x-1/2 rounded-2xl border border-white/10 bg-black/80 p-4 text-left text-xs leading-relaxed text-white/70 backdrop-blur-2xl transition-all sm:w-80 ${helpOpen || editing ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`}><EditableText value={data.copy.helpTitle} editing={editing} onChange={value => setCopy('helpTitle', value)} className="mb-2 block font-semibold text-[#EFCE96]" /><EditableText value={data.copy.help} editing={editing} onChange={value => setCopy('help', value)} multiline /></div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <EditableText value={data.copy.name} editing={editing} onChange={value => setCopy('name', value)} className="hidden max-w-[300px] text-right text-sm font-semibold leading-snug md:block lg:text-xl" />
            <button type="button" className="avatar-editor relative rounded-full" disabled={!editing} onClick={() => avatarInput.current?.click()} aria-label="更换头像">
              <img src={data.avatar} alt={data.copy.name} className="h-11 w-11 rounded-full border border-white/20 object-cover sm:h-16 sm:w-16 lg:h-[72px] lg:w-[72px]" />
              {editing && <span className="absolute inset-0 grid place-items-center rounded-full bg-black/55"><Pencil size={17} /></span>}
            </button>
            <input ref={avatarInput} type="file" accept="image/*" hidden onChange={event => { loadImage(event.target.files?.[0], 'avatar'); event.target.value = '' }} />
          </div>
        </nav>
      </AnimatedElement>

      <div className="relative z-[5] px-5 pb-6 pt-14 sm:px-8 sm:pb-8 sm:pt-20 lg:px-12 lg:pb-12 xl:pt-12">
        <div className="flex flex-col gap-10 xl:min-h-[calc(100svh-126px)] xl:flex-row xl:items-end xl:justify-between">
          <section className="w-full sm:w-[520px] lg:w-[620px]" aria-labelledby="age-title">
            <AnimatedElement direction="right" delay={300}><div className="relative flex h-[420px] w-full items-center justify-center overflow-hidden rounded-[24px] sm:h-[500px] sm:rounded-[32px] lg:h-[550px] lg:rounded-[40px]">
              <div className="animate-spin-bg absolute inset-[-5%] bg-cover bg-center" style={{ backgroundImage: `url(${ageTexture})` }} /><div className="age-glow absolute inset-0" />
              <div className="relative z-10 flex max-w-[82%] flex-col items-center text-center"><AnimatedElement direction="up" delay={600}><p id="age-title" className="text-base font-medium leading-snug text-gray-200 sm:text-lg md:text-[22px]"><EditableText value={data.copy.ageLabel} editing={editing} onChange={value => setCopy('ageLabel', value)} multiline /></p></AnimatedElement><AnimatedElement direction="scale" delay={800}><strong className="mt-5 block font-sans text-[72px] font-semibold leading-[.85] tracking-[-.07em] tabular-nums sm:text-[100px] lg:text-[132px]"><EditableText value={data.copy.metric} editing={editing} onChange={value => setCopy('metric', value)} /></strong></AnimatedElement></div>
            </div></AnimatedElement>
            <AnimatedElement direction="up" delay={1000} className="mt-4 flex flex-col items-center"><EditableText value={data.copy.ageBadge} editing={editing} onChange={value => setCopy('ageBadge', value)} className="max-w-full rounded-full border border-[#EFCE96]/50 bg-[#EFCE96]/20 px-4 py-2 text-center text-xs font-medium tracking-wide text-white backdrop-blur-xl sm:px-6 sm:text-sm" /><RulerTicker /></AnimatedElement>
            {renderRegion('ageBottom', 'mt-6')}
          </section>
          {renderRegion('side', 'w-full xl:w-[540px]')}
        </div>
        {renderRegion('pageBottom', 'mx-auto mt-8 max-w-[1160px]')}
      </div>

      {editorAvailable && <aside className={`editor-panel ${editing ? 'editor-panel-open' : ''}`}>
        <button type="button" className="editor-main-button" onClick={() => setEditing(value => !value)}>{editing ? <Check size={17} /> : <Pencil size={17} />}{editing ? '完成编辑' : '编辑网页'}</button>
        {editing && <div className="editor-options">
          <div><strong>模块位置、宽度与显示</strong><small>拖拽到虚线区域，或使用下面的选项</small></div>
          <div className="editor-module-list">{data.order.map(id => {
            const siblings = data.order.filter(item => data.layout[item].region === data.layout[id].region)
            const index = siblings.indexOf(id)
            return <div className="editor-module-row" key={id}>
              <div className="editor-module-heading"><span>{cardLabels[id]}</span><span className="editor-module-buttons"><button type="button" disabled={index === 0} aria-label={`上移 ${cardLabels[id]}`} onClick={() => moveCard(id, -1)}><ChevronUp size={14} /></button><button type="button" disabled={index === siblings.length - 1} aria-label={`下移 ${cardLabels[id]}`} onClick={() => moveCard(id, 1)}><ChevronDown size={14} /></button><button type="button" aria-label={hidden(id) ? `显示 ${cardLabels[id]}` : `隐藏 ${cardLabels[id]}`} onClick={() => toggleCard(id)}>{hidden(id) ? <Eye size={14} /> : <EyeOff size={14} />}</button></span></div>
              <div className="editor-module-settings">
                <select value={data.layout[id].region} aria-label={`${cardLabels[id]}的位置`} onChange={event => setRegion(id, event.target.value as RegionId)}>{Object.entries(regionLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
                <button type="button" onClick={() => setCardWidth(id, data.layout[id].width === 'half' ? 'full' : 'half')}>{data.layout[id].width === 'half' ? '半宽' : '整行'}</button>
              </div>
            </div>
          })}</div>
          <div className="editor-actions"><button type="button" onClick={exportEdits}><Download size={15} />导出修改</button><button type="button" onClick={resetEdits}><RotateCcw size={15} />重置</button></div>
          <p>修改会自动保存在当前浏览器，不会直接影响别人看到的线上页面。</p>
        </div>}
      </aside>}
    </main>
  )
}
