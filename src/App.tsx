import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, Check, ChevronDown, ChevronUp, Download, Eye, EyeOff, GripVertical, HelpCircle, Pencil, RotateCcw } from 'lucide-react'

const backgroundVideo = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_044635_8daabe05-1a5c-491c-920f-4b0bd8f04812.mp4'
const logo = 'https://polo-pecan-73837341.figma.site/_assets/v11/f73360d8fc2d33f2b5a4bfb1fa4935fca355946f.svg'
const defaultAvatar = 'https://polo-pecan-73837341.figma.site/_assets/v11/745de561b3ebfa8634a3483efc95f21feedd96c9.png'
const ageTexture = 'https://polo-pecan-73837341.figma.site/_assets/v11/d8d9bd498347ea96ca4d675a624c8d90e06786e7.png'
const insightsImage = 'https://polo-pecan-73837341.figma.site/_assets/v11/94903fdf21e145cd4ba873c15fc03251c0600ee5.png'
const planImage = 'https://polo-pecan-73837341.figma.site/_assets/v11/0c38fdb8a933b0da384a5a3f8b0d9986bb919838.png'
const storageKey = 'healthspan-simple-editor:v1'

type Direction = 'up' | 'down' | 'left' | 'right' | 'scale'
type CardId = 'activities' | 'insights' | 'snapshot' | 'plan'

type Copy = {
  name: string
  help: string
  ageLabel: string
  ageBadge: string
  activitiesTitle: string
  activitiesMeta: string
  insightsTitle: string
  insightsMeta: string
  snapshotTitle: string
  snapshotMeta: string
  snapshotBody: string
  planTitle: string
  planMeta: string
}

type EditorData = {
  copy: Copy
  avatar: string
  order: CardId[]
  hidden: CardId[]
}

const defaultCopy: Copy = {
  name: 'Benjamin Carter',
  help: 'Your daily longevity overview, updated from your latest health data.',
  ageLabel: 'Estimated\nBiological Age',
  ageBadge: '3 Years Younger',
  activitiesTitle: 'Upcoming Activities',
  activitiesMeta: '4 events',
  insightsTitle: 'Your Insights',
  insightsMeta: '8 Risks',
  snapshotTitle: 'Your Health Snapshot',
  snapshotMeta: 'Recommendations',
  snapshotBody: 'With a biological age of 28, your body is performing like a young, energetic you. Keep fueling it with movement, nourishing food, quality rest, and a calm mind — so you can stay strong, sharp, and unstoppable.',
  planTitle: 'Action Plan',
  planMeta: 'Details',
}

const defaultOrder: CardId[] = ['activities', 'insights', 'snapshot', 'plan']
const cardLabels: Record<CardId, string> = {
  activities: 'Upcoming Activities',
  insights: 'Your Insights',
  snapshot: 'Your Health Snapshot',
  plan: 'Action Plan',
}

function loadEditorData(): EditorData {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}') as Partial<EditorData>
    return {
      copy: { ...defaultCopy, ...(stored.copy || {}) },
      avatar: stored.avatar || defaultAvatar,
      order: stored.order?.length === defaultOrder.length ? stored.order : defaultOrder,
      hidden: stored.hidden || [],
    }
  } catch {
    return { copy: defaultCopy, avatar: defaultAvatar, order: defaultOrder, hidden: [] }
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

function useBiologicalAge() {
  const [age, setAge] = useState(0)
  useEffect(() => {
    let step = 0
    const countUp = window.setInterval(() => {
      step += 1
      setAge(Math.round((step / 40) * 28))
      if (step >= 40) {
        window.clearInterval(countUp)
        setAge(28)
      }
    }, 45)
    const increment = window.setInterval(() => setAge(value => value + 1), 6000)
    return () => { window.clearInterval(countUp); window.clearInterval(increment) }
  }, [])
  return age
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
  const age = useBiologicalAge()
  const avatarInput = useRef<HTMLInputElement>(null)
  const [data, setData] = useState<EditorData>(loadEditorData)
  const [videoReady, setVideoReady] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [snapshotOpen, setSnapshotOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draggedCard, setDraggedCard] = useState<CardId | null>(null)
  const editorAvailable = new URLSearchParams(window.location.search).get('edit') === '1'

  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(data)), [data])

  const setCopy = (key: keyof Copy, value: string) => setData(current => ({ ...current, copy: { ...current.copy, [key]: value } }))
  const useHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const hidden = (id: CardId) => data.hidden.includes(id)

  const toggleCard = (id: CardId) => setData(current => ({ ...current, hidden: current.hidden.includes(id) ? current.hidden.filter(item => item !== id) : [...current.hidden, id] }))
  const moveCard = (id: CardId, offset: number) => setData(current => {
    const from = current.order.indexOf(id)
    const to = Math.max(0, Math.min(current.order.length - 1, from + offset))
    if (from === to) return current
    const order = [...current.order]
    order.splice(from, 1)
    order.splice(to, 0, id)
    return { ...current, order }
  })
  const dropCard = (target: CardId) => {
    if (!draggedCard || draggedCard === target) return
    setData(current => {
      const order = current.order.filter(id => id !== draggedCard)
      order.splice(order.indexOf(target), 0, draggedCard)
      return { ...current, order }
    })
    setDraggedCard(null)
  }

  const loadAvatar = (file?: File) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      window.alert('请选择小于 2MB 的头像图片。')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setData(current => ({ ...current, avatar: String(reader.result) }))
    reader.readAsDataURL(file)
  }

  const exportEdits = () => {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'healthspan-page-edits.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const resetEdits = () => {
    if (!window.confirm('确定清除当前浏览器里的全部修改吗？')) return
    localStorage.removeItem(storageKey)
    setData({ copy: defaultCopy, avatar: defaultAvatar, order: defaultOrder, hidden: [] })
  }

  const cardControls = (id: CardId) => editing && (
    <div className="card-edit-controls" onClick={event => event.stopPropagation()}>
      <GripVertical size={15} aria-hidden="true" />
      <button type="button" aria-label={hidden(id) ? `显示 ${cardLabels[id]}` : `隐藏 ${cardLabels[id]}`} onClick={() => toggleCard(id)}>{hidden(id) ? <Eye size={15} /> : <EyeOff size={15} />}</button>
    </div>
  )

  const renderCard = (id: CardId) => {
    const shared = `editor-card relative ${hidden(id) ? 'editor-card-hidden' : ''}`
    if (id === 'activities') return <article className={`${shared} group flex h-[130px] w-full flex-col justify-between rounded-2xl bg-[#2F2F2F]/60 p-4 text-left backdrop-blur-[52px] transition-colors hover:bg-[#2F2F2F]/70 sm:h-36 sm:rounded-[20px] sm:p-5`}>
      {cardControls(id)}<EditableText value={data.copy.activitiesTitle} editing={editing} onChange={value => setCopy('activitiesTitle', value)} className="text-base font-semibold sm:text-lg" />
      <span className="flex items-end justify-between"><EditableText value={data.copy.activitiesMeta} editing={editing} onChange={value => setCopy('activitiesMeta', value)} className="text-[11px] text-white/55 sm:text-xs" /><ArrowButton dark label="View upcoming activities" /></span>
    </article>
    if (id === 'insights') return <article className={`${shared} group flex h-[130px] w-full flex-col justify-between rounded-2xl bg-cover bg-center p-4 text-left transition-[filter,transform] hover:brightness-110 sm:h-36 sm:rounded-[20px] sm:p-5`} style={{ backgroundImage: `url(${insightsImage})` }}>
      {cardControls(id)}<EditableText value={data.copy.insightsTitle} editing={editing} onChange={value => setCopy('insightsTitle', value)} className="text-base font-semibold sm:text-lg" />
      <span className="flex items-end justify-between"><EditableText value={data.copy.insightsMeta} editing={editing} onChange={value => setCopy('insightsMeta', value)} className="flex h-6 items-center rounded-full bg-white px-3 text-xs font-medium text-black sm:h-7 sm:text-sm" /><ArrowButton label="View health insights" /></span>
    </article>
    if (id === 'snapshot') return <article className={`${shared} group flex w-full flex-col justify-between overflow-hidden rounded-2xl p-4 text-left backdrop-blur-[52px] transition-all duration-300 ease-in-out sm:rounded-[20px] sm:p-5 ${snapshotOpen || editing ? 'h-auto min-h-[280px] bg-white text-black' : 'h-[130px] bg-[#2F2F2F]/60 text-white sm:h-36'}`} role={editing ? undefined : 'button'} tabIndex={editing ? undefined : 0} aria-expanded={snapshotOpen} onClick={() => { if (!editing) setSnapshotOpen(open => !open) }} onKeyDown={event => { if (!editing && (event.key === 'Enter' || event.key === ' ')) setSnapshotOpen(open => !open) }} onMouseEnter={() => { if (!editing && useHover()) setSnapshotOpen(true) }} onMouseLeave={() => { if (!editing && useHover()) setSnapshotOpen(false) }}>
      {cardControls(id)}
      <span><EditableText value={data.copy.snapshotTitle} editing={editing} onChange={value => setCopy('snapshotTitle', value)} className="block text-base font-semibold sm:text-lg" /><EditableText value={data.copy.snapshotMeta} editing={editing} onChange={value => setCopy('snapshotMeta', value)} className="mt-1 block text-[11px] text-black/50 sm:text-xs" /></span>
      <span className={`grid transition-all duration-300 ${snapshotOpen || editing ? 'mt-5 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}><EditableText value={data.copy.snapshotBody} editing={editing} onChange={value => setCopy('snapshotBody', value)} multiline className="overflow-hidden text-sm leading-relaxed text-black/65" /></span>
      <span className="mt-3 flex justify-end"><span className={`grid h-9 w-9 place-items-center rounded-full ${snapshotOpen || editing ? 'bg-[#F0F0F0] text-black' : 'bg-black text-white'}`}>{snapshotOpen || editing ? <ArrowDown size={17} strokeWidth={1.7} /> : <ArrowUp size={17} strokeWidth={1.7} />}</span></span>
    </article>
    return <article className={`${shared} group flex h-[130px] w-full flex-col justify-between rounded-2xl bg-cover bg-center p-4 text-left transition-[filter,transform] hover:brightness-110 sm:h-36 sm:rounded-[20px] sm:p-5`} style={{ backgroundImage: `url(${planImage})` }}>
      {cardControls(id)}<EditableText value={data.copy.planTitle} editing={editing} onChange={value => setCopy('planTitle', value)} className="text-base font-semibold sm:text-lg" />
      <span className="flex items-end justify-between"><EditableText value={data.copy.planMeta} editing={editing} onChange={value => setCopy('planMeta', value)} className="flex h-6 items-center rounded-full bg-white px-3 text-xs font-medium text-black sm:h-7 sm:text-sm" /><ArrowButton label="View action plan" /></span>
    </article>
  }

  return (
    <main className={`relative min-h-[100svh] overflow-hidden bg-[#0a0a0a] text-white ${editing ? 'is-editing' : ''}`}>
      <video className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-[1500ms] ${videoReady ? 'opacity-100' : 'opacity-0'}`} src={backgroundVideo} autoPlay loop muted playsInline onCanPlay={() => setVideoReady(true)} />
      <div className="scene-overlay absolute inset-0 z-[1]" />

      <AnimatedElement direction="down" delay={100} className="relative z-10">
        <nav className="flex items-start justify-between px-5 pt-6 sm:px-8 sm:pt-8 lg:px-12">
          <img src={logo} alt="Healthspan" className="h-10 w-40 object-contain object-left" />
          <div className="absolute left-1/2 top-8 -translate-x-1/2 sm:top-10">
            <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/20 text-white backdrop-blur-xl transition-colors hover:bg-black/40" aria-label="Show dashboard help" aria-expanded={helpOpen} onClick={() => setHelpOpen(open => !open)}><HelpCircle size={18} strokeWidth={1.5} /></button>
            <div className={`absolute left-1/2 top-12 w-52 -translate-x-1/2 rounded-2xl border border-white/10 bg-black/70 p-3 text-center text-xs leading-relaxed text-white/70 backdrop-blur-2xl transition-all ${helpOpen || editing ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`}><EditableText value={data.copy.help} editing={editing} onChange={value => setCopy('help', value)} multiline /></div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <EditableText value={data.copy.name} editing={editing} onChange={value => setCopy('name', value)} className="hidden text-right text-xl font-bold leading-none md:block sm:text-3xl lg:text-[42px]" />
            <button type="button" className="avatar-editor relative rounded-full" disabled={!editing} onClick={() => avatarInput.current?.click()} aria-label="更换头像">
              <img src={data.avatar} alt={data.copy.name} className="h-11 w-11 rounded-full border border-white/20 object-cover sm:h-16 sm:w-16 lg:h-[72px] lg:w-[72px]" />
              {editing && <span className="absolute inset-0 grid place-items-center rounded-full bg-black/55"><Pencil size={17} /></span>}
            </button>
            <input ref={avatarInput} type="file" accept="image/*" hidden onChange={event => { loadAvatar(event.target.files?.[0]); event.target.value = '' }} />
          </div>
        </nav>
      </AnimatedElement>

      <div className="relative z-[5] flex flex-col gap-10 px-5 pb-6 pt-14 sm:px-8 sm:pb-8 sm:pt-20 lg:px-12 lg:pb-12 xl:absolute xl:inset-x-0 xl:bottom-0 xl:flex-row xl:items-end xl:justify-between xl:pt-28">
        <section className="w-full sm:w-[520px] lg:w-[620px]" aria-labelledby="age-title">
          <AnimatedElement direction="right" delay={300}><div className="relative flex h-[420px] w-full items-center justify-center overflow-hidden rounded-[24px] sm:h-[500px] sm:rounded-[32px] lg:h-[550px] lg:rounded-[40px]">
            <div className="animate-spin-bg absolute inset-[-5%] bg-cover bg-center" style={{ backgroundImage: `url(${ageTexture})` }} /><div className="age-glow absolute inset-0" />
            <div className="relative z-10 flex flex-col items-center text-center"><AnimatedElement direction="up" delay={600}><p id="age-title" className="text-base font-medium leading-snug text-gray-200 sm:text-lg md:text-[22px]"><EditableText value={data.copy.ageLabel} editing={editing} onChange={value => setCopy('ageLabel', value)} multiline /></p></AnimatedElement><AnimatedElement direction="scale" delay={800}><strong className="mt-5 block font-sans text-[72px] font-semibold leading-[.85] tracking-[-.07em] tabular-nums sm:text-[100px] lg:text-[132px]">{age}</strong></AnimatedElement></div>
          </div></AnimatedElement>
          <AnimatedElement direction="up" delay={1000} className="mt-4 flex flex-col items-center"><EditableText value={data.copy.ageBadge} editing={editing} onChange={value => setCopy('ageBadge', value)} className="rounded-full border border-[#EFCE96]/50 bg-[#EFCE96]/20 px-4 py-2 text-xs font-medium tracking-wide text-white backdrop-blur-xl sm:px-6 sm:text-sm" /><RulerTicker /></AnimatedElement>
        </section>

        <section className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:w-[540px]" aria-label="Health dashboard shortcuts">
          {data.order.map((id, index) => (editing || !hidden(id)) && <AnimatedElement direction="left" delay={500 + index * 150} className={id === 'snapshot' ? 'relative z-20' : ''} key={id}><div draggable={editing} onDragStart={() => setDraggedCard(id)} onDragOver={event => { if (editing) event.preventDefault() }} onDrop={() => dropCard(id)}>{renderCard(id)}</div></AnimatedElement>)}
        </section>
      </div>

      {editorAvailable && <aside className={`editor-panel ${editing ? 'editor-panel-open' : ''}`}>
        <button type="button" className="editor-main-button" onClick={() => setEditing(value => !value)}>{editing ? <Check size={17} /> : <Pencil size={17} />}{editing ? '完成编辑' : '编辑网页'}</button>
        {editing && <div className="editor-options">
          <div><strong>模块顺序与显示</strong><small>拖拽卡片，或使用下面的按钮</small></div>
          <div className="editor-module-list">{data.order.map((id, index) => <div className="editor-module-row" key={id}><span>{cardLabels[id]}</span><span><button type="button" disabled={index === 0} aria-label={`上移 ${cardLabels[id]}`} onClick={() => moveCard(id, -1)}><ChevronUp size={14} /></button><button type="button" disabled={index === data.order.length - 1} aria-label={`下移 ${cardLabels[id]}`} onClick={() => moveCard(id, 1)}><ChevronDown size={14} /></button><button type="button" aria-label={hidden(id) ? `显示 ${cardLabels[id]}` : `隐藏 ${cardLabels[id]}`} onClick={() => toggleCard(id)}>{hidden(id) ? <Eye size={14} /> : <EyeOff size={14} />}</button></span></div>)}</div>
          <div className="editor-actions"><button type="button" onClick={exportEdits}><Download size={15} />导出修改</button><button type="button" onClick={resetEdits}><RotateCcw size={15} />重置</button></div>
          <p>修改会自动保存在当前浏览器，不会直接影响别人看到的线上页面。</p>
        </div>}
      </aside>}
    </main>
  )
}
