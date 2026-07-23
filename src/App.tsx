import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, HelpCircle } from 'lucide-react'

const backgroundVideo = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_044635_8daabe05-1a5c-491c-920f-4b0bd8f04812.mp4'
const logo = 'https://polo-pecan-73837341.figma.site/_assets/v11/f73360d8fc2d33f2b5a4bfb1fa4935fca355946f.svg'
const avatar = 'https://polo-pecan-73837341.figma.site/_assets/v11/745de561b3ebfa8634a3483efc95f21feedd96c9.png'
const ageTexture = 'https://polo-pecan-73837341.figma.site/_assets/v11/d8d9bd498347ea96ca4d675a624c8d90e06786e7.png'
const insightsImage = 'https://polo-pecan-73837341.figma.site/_assets/v11/94903fdf21e145cd4ba873c15fc03251c0600ee5.png'
const planImage = 'https://polo-pecan-73837341.figma.site/_assets/v11/0c38fdb8a933b0da384a5a3f8b0d9986bb919838.png'

type Direction = 'up' | 'down' | 'left' | 'right' | 'scale'

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
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate3d(0, 0, 0) scale(1)' : offsets[direction],
        transition: `opacity .8s cubic-bezier(.16, 1, .3, 1) ${delay}ms, transform .8s cubic-bezier(.16, 1, .3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
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
    return () => {
      window.clearInterval(countUp)
      window.clearInterval(increment)
    }
  }, [])

  return age
}

function ArrowButton({ dark = false, label }: { dark?: boolean; label: string }) {
  return (
    <span className={`grid h-9 w-9 place-items-center rounded-full transition-transform duration-300 group-hover:translate-x-1 ${dark ? 'bg-black text-white' : 'bg-white text-black'}`} aria-label={label}>
      <ArrowRight size={17} strokeWidth={1.7} aria-hidden="true" />
    </span>
  )
}

function RulerTicker() {
  const ticks = Array.from({ length: 61 })
  return (
    <div className="ruler relative mt-2 h-10 w-full max-w-[620px] overflow-hidden" aria-hidden="true">
      <div className="animate-ticker flex h-full w-max items-center">
        {[0, 1].map(set => (
          <div className="flex h-full items-center gap-[14px] pr-[14px]" key={set}>
            {ticks.map((_, index) => (
              <span
                className="block w-px rounded-full bg-[rgba(239,206,150,.5)]"
                style={{ height: index % 5 === 0 ? 26 : 18 } as CSSProperties}
                key={`${set}-${index}`}
              />
            ))}
          </div>
        ))}
      </div>
      <span className="absolute left-1/2 top-0 h-10 w-0.5 -translate-x-1/2 rounded-full bg-[#EFCE96]" />
    </div>
  )
}

export default function App() {
  const age = useBiologicalAge()
  const [videoReady, setVideoReady] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [snapshotOpen, setSnapshotOpen] = useState(false)

  const useHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#0a0a0a] text-white">
      <video
        className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-[1500ms] ${videoReady ? 'opacity-100' : 'opacity-0'}`}
        src={backgroundVideo}
        autoPlay
        loop
        muted
        playsInline
        onCanPlay={() => setVideoReady(true)}
      />
      <div className="scene-overlay absolute inset-0 z-[1]" />

      <AnimatedElement direction="down" delay={100} className="relative z-10">
        <nav className="flex items-start justify-between px-5 pt-6 sm:px-8 sm:pt-8 lg:px-12">
          <img src={logo} alt="Healthspan" className="h-10 w-40 object-contain object-left" />

          <div className="absolute left-1/2 top-8 -translate-x-1/2 sm:top-10">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/20 text-white backdrop-blur-xl transition-colors hover:bg-black/40"
              aria-label="Show dashboard help"
              aria-expanded={helpOpen}
              onClick={() => setHelpOpen(open => !open)}
            >
              <HelpCircle size={18} strokeWidth={1.5} />
            </button>
            <div className={`absolute left-1/2 top-12 w-48 -translate-x-1/2 rounded-2xl border border-white/10 bg-black/70 p-3 text-center text-xs leading-relaxed text-white/70 backdrop-blur-2xl transition-all ${helpOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`}>
              Your daily longevity overview, updated from your latest health data.
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden text-right text-xl font-bold leading-none md:block sm:text-3xl lg:text-[42px]">Benjamin Carter</span>
            <img src={avatar} alt="Benjamin Carter" className="h-11 w-11 rounded-full border border-white/20 object-cover sm:h-16 sm:w-16 lg:h-[72px] lg:w-[72px]" />
          </div>
        </nav>
      </AnimatedElement>

      <div className="relative z-[5] flex flex-col gap-10 px-5 pb-6 pt-14 sm:px-8 sm:pb-8 sm:pt-20 lg:px-12 lg:pb-12 xl:absolute xl:inset-x-0 xl:bottom-0 xl:flex-row xl:items-end xl:justify-between xl:pt-28">
        <section className="w-full sm:w-[520px] lg:w-[620px]" aria-labelledby="age-title">
          <AnimatedElement direction="right" delay={300}>
            <div className="relative flex h-[420px] w-full items-center justify-center overflow-hidden rounded-[24px] sm:h-[500px] sm:rounded-[32px] lg:h-[550px] lg:rounded-[40px]">
              <div
                className="animate-spin-bg absolute inset-[-5%] bg-cover bg-center"
                style={{ backgroundImage: `url(${ageTexture})` }}
              />
              <div className="age-glow absolute inset-0" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <AnimatedElement direction="up" delay={600}>
                  <p id="age-title" className="text-base font-medium leading-snug text-gray-200 sm:text-lg md:text-[22px]">Estimated<br />Biological Age</p>
                </AnimatedElement>
                <AnimatedElement direction="scale" delay={800}>
                  <strong className="mt-5 block font-sans text-[72px] font-semibold leading-[.85] tracking-[-.07em] tabular-nums sm:text-[100px] lg:text-[132px]">{age}</strong>
                </AnimatedElement>
              </div>
            </div>
          </AnimatedElement>

          <AnimatedElement direction="up" delay={1000} className="mt-4 flex flex-col items-center">
            <span className="rounded-full border border-[#EFCE96]/50 bg-[#EFCE96]/20 px-4 py-2 text-xs font-medium tracking-wide text-white backdrop-blur-xl sm:px-6 sm:text-sm">3 Years Younger</span>
            <RulerTicker />
          </AnimatedElement>
        </section>

        <section className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:w-[540px]" aria-label="Health dashboard shortcuts">
          <AnimatedElement direction="left" delay={500}>
            <button type="button" className="group flex h-[130px] w-full flex-col justify-between rounded-2xl bg-[#2F2F2F]/60 p-4 text-left backdrop-blur-[52px] transition-colors hover:bg-[#2F2F2F]/70 sm:h-36 sm:rounded-[20px] sm:p-5">
              <span className="text-base font-semibold sm:text-lg">Upcoming Activities</span>
              <span className="flex items-end justify-between"><span className="text-[11px] text-white/55 sm:text-xs">4 events</span><ArrowButton dark label="View upcoming activities" /></span>
            </button>
          </AnimatedElement>

          <AnimatedElement direction="left" delay={650}>
            <button type="button" className="group flex h-[130px] w-full flex-col justify-between rounded-2xl bg-cover bg-center p-4 text-left transition-[filter,transform] hover:brightness-110 sm:h-36 sm:rounded-[20px] sm:p-5" style={{ backgroundImage: `url(${insightsImage})` }}>
              <span className="text-base font-semibold sm:text-lg">Your Insights</span>
              <span className="flex items-end justify-between"><span className="flex h-6 items-center rounded-full bg-white px-3 text-xs font-medium text-black sm:h-7 sm:text-sm">8 Risks</span><ArrowButton label="View health insights" /></span>
            </button>
          </AnimatedElement>

          <AnimatedElement direction="left" delay={800} className="relative z-20">
            <button
              type="button"
              className={`group flex w-full flex-col justify-between overflow-hidden rounded-2xl p-4 text-left backdrop-blur-[52px] transition-all duration-300 ease-in-out sm:rounded-[20px] sm:p-5 ${snapshotOpen ? 'h-auto min-h-[280px] bg-white text-black' : 'h-[130px] bg-[#2F2F2F]/60 text-white sm:h-36'}`}
              aria-expanded={snapshotOpen}
              onClick={() => setSnapshotOpen(open => !open)}
              onMouseEnter={() => { if (useHover()) setSnapshotOpen(true) }}
              onMouseLeave={() => { if (useHover()) setSnapshotOpen(false) }}
            >
              <span>
                <span className="block text-base font-semibold sm:text-lg">Your Health Snapshot</span>
                <span className={`mt-1 block text-[11px] sm:text-xs ${snapshotOpen ? 'text-black/50' : 'text-white/55'}`}>Recommendations</span>
              </span>
              <span className={`grid transition-all duration-300 ${snapshotOpen ? 'mt-5 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <span className="overflow-hidden text-sm leading-relaxed text-black/65">With a biological age of 28, your body is performing like a young, energetic you. Keep fueling it with movement, nourishing food, quality rest, and a calm mind — so you can stay strong, sharp, and unstoppable.</span>
              </span>
              <span className="mt-3 flex justify-end">
                <span className={`grid h-9 w-9 place-items-center rounded-full ${snapshotOpen ? 'bg-[#F0F0F0] text-black' : 'bg-black text-white'}`}>
                  {snapshotOpen ? <ArrowDown size={17} strokeWidth={1.7} /> : <ArrowUp size={17} strokeWidth={1.7} />}
                </span>
              </span>
            </button>
          </AnimatedElement>

          <AnimatedElement direction="left" delay={950}>
            <button type="button" className="group flex h-[130px] w-full flex-col justify-between rounded-2xl bg-cover bg-center p-4 text-left transition-[filter,transform] hover:brightness-110 sm:h-36 sm:rounded-[20px] sm:p-5" style={{ backgroundImage: `url(${planImage})` }}>
              <span className="text-base font-semibold sm:text-lg">Action Plan</span>
              <span className="flex items-end justify-between"><span className="flex h-6 items-center rounded-full bg-white px-3 text-xs font-medium text-black sm:h-7 sm:text-sm">Details</span><ArrowButton label="View action plan" /></span>
            </button>
          </AnimatedElement>
        </section>
      </div>
    </main>
  )
}

