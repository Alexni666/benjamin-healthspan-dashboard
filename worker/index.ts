interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>
  }
  COOKIE_ENCRYPTION_KEY?: string
}

type AnalysisInsight = {
  id: string
  title: string
  content: string
  evidence: string
  confidence: '高' | '中' | '待确认'
}

type SpaceDirection = {
  id: string
  title: string
  meta: string
  copy: string
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

const cookieName = 'deepseek_admin_session'
const cookieMaxAge = 60 * 60 * 24 * 30
const allowedModels = new Set(['deepseek-v4-pro', 'deepseek-v4-flash'])

function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  })
}

function toBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function fromBase64Url(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

async function encryptionKey(secret: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

async function encryptSecret(value: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await encryptionKey(secret),
    new TextEncoder().encode(value),
  )
  const output = new Uint8Array(iv.length + encrypted.byteLength)
  output.set(iv)
  output.set(new Uint8Array(encrypted), iv.length)
  return toBase64Url(output)
}

async function decryptSecret(value: string, secret: string) {
  const input = fromBase64Url(value)
  if (input.length < 13) throw new Error('Invalid encrypted value')
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: input.slice(0, 12) },
    await encryptionKey(secret),
    input.slice(12),
  )
  return new TextDecoder().decode(decrypted)
}

function readCookie(request: Request, name: string) {
  const cookies = request.headers.get('Cookie') || ''
  for (const item of cookies.split(';')) {
    const separator = item.indexOf('=')
    if (separator === -1) continue
    if (item.slice(0, separator).trim() === name) return item.slice(separator + 1).trim()
  }
  return ''
}

function sameOrigin(request: Request) {
  const origin = request.headers.get('Origin')
  return !origin || origin === new URL(request.url).origin
}

function cleanText(value: unknown, limit: number) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : ''
}

function providerMessage(status: number) {
  if (status === 401) return 'DeepSeek 密钥已失效，请重新保存。'
  if (status === 402) return 'DeepSeek 账户余额不足，请充值后再试。'
  if (status === 429) return 'DeepSeek 请求较多，请稍后再试。'
  return 'DeepSeek 暂时没有完成分析，请稍后重试。'
}

async function savedApiKey(request: Request, env: Env) {
  const encrypted = readCookie(request, cookieName)
  if (!encrypted || !env.COOKIE_ENCRYPTION_KEY) return ''
  try {
    return await decryptSecret(encrypted, env.COOKIE_ENCRYPTION_KEY)
  } catch {
    return ''
  }
}

function parseAnalysis(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Invalid analysis')
  const raw = value as Record<string, unknown>
  const summary = cleanText(raw.summary, 900)
  const insightList = Array.isArray(raw.insights) ? raw.insights : []
  const insights = insightList.slice(0, 8).map((item, index): AnalysisInsight => {
    const row = item && typeof item === 'object' ? item as Record<string, unknown> : {}
    const confidenceText = cleanText(row.confidence, 10)
    const confidence = confidenceText === '高' || confidenceText === '中' ? confidenceText : '待确认'
    return {
      id: cleanText(row.id, 40) || `insight-${index + 1}`,
      title: cleanText(row.title, 80) || `分析维度 ${index + 1}`,
      content: cleanText(row.content, 1400),
      evidence: cleanText(row.evidence, 500),
      confidence,
    }
  }).filter(item => item.content)
  const questions = (Array.isArray(raw.questions) ? raw.questions : [])
    .map(item => cleanText(item, 300))
    .filter(Boolean)
    .slice(0, 6)
  const modelValue = raw.model || raw.v1
  const rawV1 = modelValue && typeof modelValue === 'object' ? modelValue as Record<string, unknown> : {}
  const beats = (Array.isArray(rawV1.beats) ? rawV1.beats : [])
    .map(item => cleanText(item, 120))
    .filter(Boolean)
    .slice(0, 8)
  const rawDirections = Array.isArray(rawV1.spaceDirections) ? rawV1.spaceDirections : []
  const spaceDirections = rawDirections.slice(0, 2).map((item, index): SpaceDirection => {
    const row = item && typeof item === 'object' ? item as Record<string, unknown> : {}
    return {
      id: ['A', 'B'][index],
      title: cleanText(row.title, 80) || `空间方向 ${index + 1}`,
      meta: cleanText(row.meta, 80),
      copy: cleanText(row.copy, 500),
    }
  }).filter(item => item.copy)
  const v1 = {
    title: cleanText(rawV1.title, 100),
    logline: cleanText(rawV1.logline, 500),
    beats,
    roleDesign: cleanText(rawV1.roleDesign, 1200),
    clueChain: cleanText(rawV1.clueChain, 1200),
    mechanics: cleanText(rawV1.mechanics, 1200),
    recovery: cleanText(rawV1.recovery, 1200),
    spaceDirections,
  }
  const rawSimulation = raw.simulation && typeof raw.simulation === 'object' ? raw.simulation as Record<string, unknown> : {}
  const findings = (Array.isArray(rawSimulation.findings) ? rawSimulation.findings : [])
    .slice(0, 8)
    .map((item, index): SimulationFinding => {
      const row = item && typeof item === 'object' ? item as Record<string, unknown> : {}
      const levelText = cleanText(row.level, 10)
      return {
        id: cleanText(row.id, 40) || `finding-${index + 1}`,
        level: levelText === 'P0' || levelText === 'P1' ? levelText : '观察',
        time: cleanText(row.time, 50),
        actor: cleanText(row.actor, 100),
        event: cleanText(row.event, 800),
        impact: cleanText(row.impact, 600),
        evidence: cleanText(row.evidence, 500),
        suggestion: cleanText(row.suggestion, 800),
      }
    })
    .filter(item => item.event && item.impact && item.suggestion)
  const playerRuns = (Array.isArray(rawSimulation.playerRuns) ? rawSimulation.playerRuns : [])
    .slice(0, 8)
    .map((item): PlayerRun => {
      const row = item && typeof item === 'object' ? item as Record<string, unknown> : {}
      const statusText = cleanText(row.status, 10)
      return {
        type: cleanText(row.type, 80),
        behavior: cleanText(row.behavior, 400),
        result: cleanText(row.result, 600),
        status: statusText === '阻断' || statusText === '通过' ? statusText : '风险',
      }
    })
    .filter(item => item.type && item.result)
  const timeline = (Array.isArray(rawSimulation.timeline) ? rawSimulation.timeline : [])
    .slice(0, 8)
    .map(item => {
      const row = item && typeof item === 'object' ? item as Record<string, unknown> : {}
      return {
        time: cleanText(row.time, 50),
        event: cleanText(row.event, 160),
        outcome: cleanText(row.outcome, 600),
      }
    })
    .filter(item => item.time && item.event && item.outcome)
  const simulation = {
    verdict: cleanText(rawSimulation.verdict, 160),
    headline: cleanText(rawSimulation.headline, 600),
    score: Math.max(1, Math.min(100, Number(rawSimulation.score) || 60)),
    scoreReason: cleanText(rawSimulation.scoreReason, 500),
    pathCount: Math.max(1, Math.min(999, Number(rawSimulation.pathCount) || 1)),
    checks: Math.max(1, Math.min(999, Number(rawSimulation.checks) || 1)),
    coverage: Math.max(1, Math.min(100, Number(rawSimulation.coverage) || 1)),
    blockers: Math.max(0, Math.min(99, Number(rawSimulation.blockers) || 0)),
    findings,
    playerRuns,
    timeline,
  }
  if (
    !summary
    || insights.length < 4
    || !v1.title
    || !v1.logline
    || beats.length < 4
    || !v1.roleDesign
    || !v1.clueChain
    || !v1.mechanics
    || !v1.recovery
    || spaceDirections.length < 2
    || !simulation.verdict
    || !simulation.headline
    || findings.length < 4
    || playerRuns.length < 4
    || timeline.length < 4
  ) throw new Error('Incomplete analysis')
  return { summary, insights, questions, v1, simulation }
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url)

    if (url.pathname === '/api/deepseek/status') {
      if (request.method !== 'GET') return json({ ok: false, message: '请求方式不支持。' }, 405)
      return json({ ok: true, configured: Boolean(await savedApiKey(request, env)) })
    }

    if (url.pathname === '/api/deepseek/config') {
      if (request.method !== 'POST') return json({ ok: false, message: '请求方式不支持。' }, 405)
      if (!sameOrigin(request)) return json({ ok: false, message: '请求来源不被允许。' }, 403)
      if (!env.COOKIE_ENCRYPTION_KEY) return json({ ok: false, message: '网站安全配置尚未完成。' }, 503)

      try {
        const body = await request.json() as { apiKey?: string }
        const apiKey = body.apiKey?.trim()
        if (!apiKey) return json({ ok: false, message: '请填写 DeepSeek API Key。' }, 400)
        if (apiKey.length > 300) return json({ ok: false, message: '密钥格式不正确。' }, 400)

        const response = await fetch('https://api.deepseek.com/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (!response.ok) return json({ ok: false, message: providerMessage(response.status) }, response.status === 401 ? 401 : 502)

        const encrypted = await encryptSecret(apiKey, env.COOKIE_ENCRYPTION_KEY)
        return json(
          { ok: true },
          200,
          { 'Set-Cookie': `${cookieName}=${encrypted}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${cookieMaxAge}` },
        )
      } catch {
        return json({ ok: false, message: '连接验证失败，请稍后重试。' }, 500)
      }
    }

    if (url.pathname === '/api/deepseek/clear') {
      if (request.method !== 'POST') return json({ ok: false, message: '请求方式不支持。' }, 405)
      if (!sameOrigin(request)) return json({ ok: false, message: '请求来源不被允许。' }, 403)
      return json(
        { ok: true },
        200,
        { 'Set-Cookie': `${cookieName}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0` },
      )
    }

    if (url.pathname === '/api/deepseek/analyze') {
      if (request.method !== 'POST') return json({ ok: false, message: '请求方式不支持。' }, 405)
      if (!sameOrigin(request)) return json({ ok: false, message: '请求来源不被允许。' }, 403)
      const apiKey = await savedApiKey(request, env)
      if (!apiKey) return json({ ok: false, message: '请先在模型设置中保存 DeepSeek 密钥。' }, 401)

      try {
        const body = await request.json() as {
          model?: string
          inputs?: {
            story?: string
            rules?: string
            people?: string
            duration?: string
            characters?: Array<{ name?: string; profile?: string }>
          }
          writerNote?: string
        }
        const model = allowedModels.has(body.model || '') ? body.model! : 'deepseek-v4-pro'
        const input = {
          story: cleanText(body.inputs?.story, 30000),
          rules: cleanText(body.inputs?.rules, 20000),
          people: cleanText(body.inputs?.people, 100),
          duration: cleanText(body.inputs?.duration, 100),
          characters: (Array.isArray(body.inputs?.characters) ? body.inputs.characters : [])
            .slice(0, 20)
            .map(character => ({
              name: cleanText(character?.name, 100),
              profile: cleanText(character?.profile, 1200),
            })),
          writerNote: cleanText(body.writerNote, 10000),
        }
        if (!input.story) return json({ ok: false, message: '请先填写故事详情。' }, 400)

        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: `你是服务专业编剧和导演部门的 AI 内容模拟实验室。用户提交的是他们自己的原始创作版本；你的工作是建立内部推演模型、模拟玩家行为并报告具体发生的事件，不是替用户重写作品。

请只输出合法 JSON，不要 Markdown。JSON 结构必须为：
{"summary":"本轮推演依据概述","simulation":{"verdict":"一句话推进建议","headline":"一句话说明首轮最重要的实际现象","score":68,"scoreReason":"说明评分最主要的加分与扣分依据","pathCount":36,"checks":32,"coverage":86,"blockers":2,"findings":[{"id":"ending-bypass","level":"P0|P1|观察","time":"发生时点","actor":"哪类玩家或哪些角色","event":"模拟中具体发生了什么","impact":"这个事件造成的实际影响","evidence":"由哪条输入、规则关系或行为路径触发","suggestion":"只作为参考、可由编剧改写的具体修改建议"}],"playerRuns":[{"type":"玩家策略类型","behavior":"采用的行为策略","result":"这类玩家在模拟中的具体结果","status":"阻断|风险|通过"}],"timeline":[{"time":"时间区间","event":"阶段或事件","outcome":"这个阶段实际出现的结果"}]},"insights":[{"id":"premise","title":"核心命题","content":"分析内容","evidence":"明确引用哪项输入并指出缺口","confidence":"高|中|待确认"}],"questions":["必须由编剧判断的问题"],"model":{"title":"原始内容的推演模型名称","logline":"一句话描述系统如何理解原始体验","beats":["按时间顺序的体验阶段"],"roleDesign":"人物目标、秘密、权限与信息差的结构重建","clueChain":"证据链、验证逻辑与结局条件","mechanics":"机关触发、分支与核心玩法规则","recovery":"卡关、误解或机关失败时的恢复路径","spaceDirections":[{"title":"由首轮问题带出的空间方向","meta":"方向侧重点","copy":"空间组织方式及其与首轮行为问题的关系"}]}}

simulation.score 必须是 0 至 100 的首轮可运行度评分，只衡量主线可完成性、规则闭环、角色参与、节奏与异常恢复，不评价故事创作水平，也不得机械使用示例数字。scoreReason 必须用一句话解释主要加分项与扣分项。simulation.findings 必须输出 6 项具体事件，禁止只写“节奏不足、角色参与度低”这类抽象评价；每项必须包含发生时间、行为主体、具体动作、实际后果和触发证据。playerRuns 必须输出 6 种明显不同的玩家策略。timeline 输出 5 至 7 个连续时间阶段。pathCount、checks、coverage 和 blockers 应与本轮实际分析规模一致，不要机械使用示例数字。

insights 必须恰好 6 项并依次覆盖：核心命题、主冲突结构、世界与规则边界、人物关系动力、戏剧时间线、体验目标。每项 evidence 必须说明输入依据；无法确定时写待确认。model.beats 输出 5 至 8 个名称简短的节点。spaceDirections 必须恰好输出 2 个方向：第一项为“集中控制型”，重点解决控场、拍摄、人员调度和信息汇合；第二项为“探索强化型”，重点解决分层探索、隐藏区域、发现感和行动路径。两项都要明确回应首轮出现的行动或空间问题。questions 输出 3 至 6 个真正需要编剧决定、AI不能代替判断的问题。

当输入资料不足时，可以为了模拟建立假设，但必须在 evidence 或 summary 中明确标注为“模拟假设”，不能把补充内容伪装成用户原稿。`,
              },
              {
                role: 'user',
                content: `请对以下原始创作版本运行首轮 AI 模拟试玩并输出结构化结果：\n${JSON.stringify(input)}`,
              },
            ],
            thinking: { type: 'enabled' },
            reasoning_effort: 'high',
            response_format: { type: 'json_object' },
            max_tokens: 6500,
            stream: false,
          }),
        })
        if (!response.ok) return json({ ok: false, message: providerMessage(response.status) }, response.status === 401 ? 401 : 502)

        const providerResult = await response.json() as {
          choices?: Array<{ message?: { content?: string } }>
          usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
        }
        const content = providerResult.choices?.[0]?.message?.content?.trim()
        if (!content) return json({ ok: false, message: 'DeepSeek 返回了空结果，请重试一次。' }, 502)
        const parsed = JSON.parse(content.replace(/^```json\s*/i, '').replace(/\s*```$/, ''))
        const analysis = parseAnalysis(parsed)
        return json({
          ok: true,
          analysis,
          usage: {
            prompt_tokens: providerResult.usage?.prompt_tokens || 0,
            completion_tokens: providerResult.usage?.completion_tokens || 0,
            total_tokens: providerResult.usage?.total_tokens || 0,
          },
        })
      } catch {
        return json({ ok: false, message: '分析结果没有形成完整结构，请重试一次。' }, 502)
      }
    }

    return env.ASSETS.fetch(request)
  },
}
