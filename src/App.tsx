import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowRight, Check, ChevronDown, ChevronUp, Download, Eye, EyeOff, GripVertical, Pencil, RotateCcw } from 'lucide-react'

const backgroundVideo = '/dna-background.mp4'
const legacyLogo = 'https://polo-pecan-73837341.figma.site/_assets/v11/f73360d8fc2d33f2b5a4bfb1fa4935fca355946f.svg'
const defaultLogo = ''
const defaultAvatar = 'https://polo-pecan-73837341.figma.site/_assets/v11/745de561b3ebfa8634a3483efc95f21feedd96c9.png'
const ageTexture = 'https://polo-pecan-73837341.figma.site/_assets/v11/d8d9bd498347ea96ca4d675a624c8d90e06786e7.png'
const insightsImage = 'https://polo-pecan-73837341.figma.site/_assets/v11/94903fdf21e145cd4ba873c15fc03251c0600ee5.png'
const planImage = 'https://polo-pecan-73837341.figma.site/_assets/v11/0c38fdb8a933b0da384a5a3f8b0d9986bb919838.png'
const storageKey = 'healthspan-simple-editor:v1'

type Direction = 'up' | 'down' | 'left' | 'right' | 'scale'
type CardId = 'activities' | 'insights'
type RegionId = 'side' | 'ageBottom' | 'pageBottom'
type CardWidth = 'half' | 'full'
type CardPlacement = { region: RegionId; width: CardWidth }

type Copy = {
  brandName: string
  brandEnglish: string
  name: string
  ageLabel: string
  metric: string
  ageBadge: string
  activitiesTitle: string
  activitiesMeta: string
  activitiesIntro: string
  activitiesBody: string
  insightsTitle: string
  insightsMeta: string
  insightsIntro: string
  insightsBody: string
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
  name: '实验控制台',
  ageLabel: '正在孵化的实验方向',
  metric: '03',
  ageBadge: '先验证，再制作',
  activitiesTitle: '内容推理实验室',
  activitiesMeta: '开始推演',
  activitiesIntro: '输入故事与规则，生成场景并完成模拟试玩。',
  activitiesBody: '内容生成 · 场景推演 · 风险分析',
  insightsTitle: '案例进化引擎',
  insightsMeta: '生成案例',
  insightsIntro: '沉淀历史案件与试玩结果，生成新案例并给出改进建议。',
  insightsBody: '案例沉淀 · 创意生成 · 方案优化',
}

const defaultOrder: CardId[] = ['activities', 'insights']
const defaultLayout: Record<CardId, CardPlacement> = {
  activities: { region: 'side', width: 'full' },
  insights: { region: 'side', width: 'full' },
}
const cardLabels: Record<CardId, string> = {
  activities: '内容推理实验室',
  insights: '案例进化引擎',
}
const regionLabels: Record<RegionId, string> = {
  side: '右侧',
  ageBottom: '年龄卡下方',
  pageBottom: '页面底部',
}

function loadEditorData(): EditorData {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}') as Partial<EditorData>
    const currentContent = stored.contentVersion === 5
    const storedLayout = currentContent ? stored.layout || {} as Partial<Record<CardId, CardPlacement>> : {}
    return {
      contentVersion: 5,
      copy: currentContent ? { ...defaultCopy, ...(stored.copy || {}) } : defaultCopy,
      logo: stored.logo && stored.logo !== legacyLogo ? stored.logo : defaultLogo,
      avatar: stored.avatar || defaultAvatar,
      order: currentContent && stored.order?.length === defaultOrder.length ? stored.order : defaultOrder,
      hidden: currentContent ? stored.hidden || [] : [],
      layout: Object.fromEntries(defaultOrder.map(id => [id, { ...defaultLayout[id], ...(storedLayout[id] || {}) }])) as Record<CardId, CardPlacement>,
    }
  } catch {
    return { contentVersion: 5, copy: defaultCopy, logo: defaultLogo, avatar: defaultAvatar, order: defaultOrder, hidden: [], layout: defaultLayout }
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

function useAnimatedMetric(initialValue: string) {
  const initialNumber = Number.parseInt(initialValue, 10)
  const [value, setValue] = useState(Number.isFinite(initialNumber) ? initialNumber : 3)

  useEffect(() => {
    setValue(Number.isFinite(initialNumber) ? initialNumber : 3)
    const interval = window.setInterval(() => setValue(current => (current + 1) % 100), 1800)
    return () => window.clearInterval(interval)
  }, [initialNumber])

  return String(value).padStart(2, '0')
}

function RulerTicker() {
  const ticks = Array.from({ length: 61 })
  return (
    <div className="ruler relative mt-2 h-8 w-full max-w-[620px] overflow-hidden" aria-hidden="true">
      <div className="animate-ticker flex h-full w-max items-center">
        {[0, 1].map(set => <div className="flex h-full items-center gap-[14px] pr-[14px]" key={set}>{ticks.map((_, index) => <span className="block w-px rounded-full bg-[rgba(239,206,150,.5)]" style={{ height: index % 5 === 0 ? 22 : 14 } as CSSProperties} key={`${set}-${index}`} />)}</div>)}
      </div>
      <span className="absolute left-1/2 top-0 h-8 w-0.5 -translate-x-1/2 rounded-full bg-[#EFCE96]" />
    </div>
  )
}

export default function App() {
  const logoInput = useRef<HTMLInputElement>(null)
  const avatarInput = useRef<HTMLInputElement>(null)
  const [data, setData] = useState<EditorData>(loadEditorData)
  const animatedMetric = useAnimatedMetric(data.copy.metric)
  const [videoReady, setVideoReady] = useState(false)
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
    const blob = new Blob([JSON.stringify({ version: 5, exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: 'application/json' })
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
    setData({ contentVersion: 5, copy: defaultCopy, logo: defaultLogo, avatar: defaultAvatar, order: defaultOrder, hidden: [], layout: defaultLayout })
  }

  const cardControls = (id: CardId) => editing && (
    <div className="card-edit-controls" onClick={event => event.stopPropagation()}>
      <GripVertical size={15} aria-hidden="true" />
      <button type="button" aria-label={hidden(id) ? `显示 ${cardLabels[id]}` : `隐藏 ${cardLabels[id]}`} onClick={() => toggleCard(id)}>{hidden(id) ? <Eye size={15} /> : <EyeOff size={15} />}</button>
    </div>
  )

  const renderCard = (id: CardId) => {
    const shared = `editor-card relative ${hidden(id) ? 'editor-card-hidden' : ''}`
    if (id === 'activities') return <article className={`${shared} experiment-card group flex min-h-[184px] w-full flex-col overflow-hidden rounded-xl bg-cover bg-center p-4 text-left transition-[filter,transform] hover:brightness-110`} style={{ backgroundImage: `linear-gradient(100deg, rgba(28, 14, 12, .2), rgba(10, 10, 10, .02)), url(${insightsImage})` }}>
      {cardControls(id)}<EditableText value={data.copy.activitiesTitle} editing={editing} onChange={value => setCopy('activitiesTitle', value)} className="pr-12 text-base font-semibold sm:text-lg" />
      <EditableText value={data.copy.activitiesIntro} editing={editing} onChange={value => setCopy('activitiesIntro', value)} multiline className="mt-3 block text-xs font-medium leading-relaxed text-white/90" />
      <EditableText value={data.copy.activitiesBody} editing={editing} onChange={value => setCopy('activitiesBody', value)} multiline className="mt-3 block text-[10px] leading-relaxed tracking-[.08em] text-white/50 sm:text-[11px]" />
      <span className="mt-auto flex items-end justify-between pt-4"><EditableText value={data.copy.activitiesMeta} editing={editing} onChange={value => setCopy('activitiesMeta', value)} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black" /><ArrowButton label="开始内容推演" /></span>
    </article>
    return <article className={`${shared} experiment-card group flex min-h-[184px] w-full flex-col overflow-hidden rounded-xl bg-cover bg-center p-4 text-left transition-[filter,transform] hover:brightness-110`} style={{ backgroundImage: `linear-gradient(100deg, rgba(28, 14, 12, .18), rgba(10, 10, 10, .02)), url(${planImage})` }}>
      {cardControls(id)}<EditableText value={data.copy.insightsTitle} editing={editing} onChange={value => setCopy('insightsTitle', value)} className="pr-12 text-base font-semibold sm:text-lg" />
      <EditableText value={data.copy.insightsIntro} editing={editing} onChange={value => setCopy('insightsIntro', value)} multiline className="mt-3 block text-xs font-medium leading-relaxed text-white/90" />
      <EditableText value={data.copy.insightsBody} editing={editing} onChange={value => setCopy('insightsBody', value)} multiline className="mt-3 block text-[10px] leading-relaxed tracking-[.08em] text-white/50 sm:text-[11px]" />
      <span className="mt-auto flex items-end justify-between pt-4"><EditableText value={data.copy.insightsMeta} editing={editing} onChange={value => setCopy('insightsMeta', value)} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black" /><ArrowButton label="生成新案例" /></span>
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
          <AnimatedElement direction="left" delay={500 + index * 120} className={data.layout[id].width === 'full' ? 'sm:col-span-2' : ''} key={id}>
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
      <video className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-[1500ms] ${videoReady ? 'opacity-100' : 'opacity-0'}`} src={backgroundVideo} autoPlay loop muted playsInline preload="auto" onCanPlay={() => setVideoReady(true)} />
      <div className="scene-overlay absolute inset-0 z-[1]" />

      <AnimatedElement direction="down" delay={100} className="relative z-10">
        <nav className="flex items-start justify-between px-5 pt-6 sm:px-8 sm:pt-8 lg:px-12">
          <div className="flex items-center gap-3">
            <button type="button" className={`logo-editor relative h-12 w-14 shrink-0 ${!data.logo && !editing ? 'hidden' : ''}`} disabled={!editing} onClick={() => logoInput.current?.click()} aria-label="更换品牌 Logo">
              {data.logo ? <img src={data.logo} alt={data.copy.brandName} className="h-full w-full object-contain object-left" /> : <span className="grid h-full w-full place-items-center rounded-lg border border-dashed border-[#EFCE96]/60 text-[#EFCE96]"><Pencil size={16} /></span>}
              {editing && data.logo && <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/55"><Pencil size={17} /></span>}
            </button>
            <span className="flex flex-col">
              <EditableText value={data.copy.brandName} editing={editing} onChange={value => setCopy('brandName', value)} className="text-base font-semibold tracking-[.08em] sm:text-lg" />
              <EditableText value={data.copy.brandEnglish} editing={editing} onChange={value => setCopy('brandEnglish', value)} className="mt-0.5 text-[10px] tracking-[.22em] text-white/55 sm:text-[11px]" />
            </span>
          </div>
          <input ref={logoInput} type="file" accept="image/*" hidden onChange={event => { loadImage(event.target.files?.[0], 'logo'); event.target.value = '' }} />
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

      <div className="relative z-[5] px-5 pb-6 pt-14 sm:px-8 sm:pb-8 sm:pt-20 lg:px-12 lg:pb-12 xl:pb-0 xl:pt-0">
        <div className="flex flex-col gap-10 xl:min-h-[calc(100svh-104px)] xl:flex-row xl:items-center xl:justify-between">
          <section className="w-full sm:w-[520px] lg:w-[620px]" aria-labelledby="age-title">
            <AnimatedElement direction="right" delay={300}><div className="relative flex h-[420px] w-full items-center justify-center overflow-hidden rounded-[24px] sm:h-[500px] sm:rounded-[32px] lg:h-[550px] lg:rounded-[40px] xl:h-[450px]">
              <div className="animate-spin-bg absolute inset-[-5%] bg-cover bg-center" style={{ backgroundImage: `url(${ageTexture})` }} /><div className="age-glow absolute inset-0" />
              <div className="relative z-10 flex max-w-[82%] flex-col items-center text-center"><AnimatedElement direction="up" delay={600}><p id="age-title" className="text-base font-medium leading-snug text-gray-200 sm:text-lg md:text-[22px]"><EditableText value={data.copy.ageLabel} editing={editing} onChange={value => setCopy('ageLabel', value)} multiline /></p></AnimatedElement><AnimatedElement direction="scale" delay={800}><strong className="mt-5 block font-sans text-[72px] font-semibold leading-[.85] tracking-[-.07em] tabular-nums sm:text-[100px] lg:text-[132px]"><EditableText value={editing ? data.copy.metric : animatedMetric} editing={editing} onChange={value => setCopy('metric', value)} /></strong></AnimatedElement></div>
            </div></AnimatedElement>
            <AnimatedElement direction="up" delay={1000} className="mt-4 flex flex-col items-center"><EditableText value={data.copy.ageBadge} editing={editing} onChange={value => setCopy('ageBadge', value)} className="max-w-full rounded-full border border-[#EFCE96]/50 bg-[#EFCE96]/20 px-4 py-2 text-center text-xs font-medium tracking-wide text-white backdrop-blur-xl sm:px-6 sm:text-sm" /><RulerTicker /></AnimatedElement>
            {renderRegion('ageBottom', 'mt-6')}
          </section>
          {renderRegion('side', 'w-full xl:w-[350px] xl:max-w-[31vw] xl:translate-y-10')}
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
