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
  if (!summary || insights.length < 4) throw new Error('Incomplete analysis')
  return { summary, insights, questions }
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
          inputs?: { story?: string; rules?: string; people?: string; duration?: string }
          writerNote?: string
        }
        const model = allowedModels.has(body.model || '') ? body.model! : 'deepseek-v4-pro'
        const input = {
          story: cleanText(body.inputs?.story, 30000),
          rules: cleanText(body.inputs?.rules, 20000),
          people: cleanText(body.inputs?.people, 100),
          duration: cleanText(body.inputs?.duration, 100),
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
                content: `你是服务专业编剧部门的内容推理顾问。只分析用户提供的内容，不补写未给出的事实，不替代编剧做最终决定。请只输出合法 JSON，不要 Markdown。JSON 结构必须为：
{"summary":"本轮整体理解","insights":[{"id":"premise","title":"核心命题","content":"分析内容","evidence":"明确引用哪项输入并指出缺口","confidence":"高|中|待确认"}],"questions":["需要编剧确认的问题"]}
insights 必须恰好 6 项并依次覆盖：核心命题、主冲突结构、世界与规则边界、人物关系动力、戏剧时间线、体验目标。每项 evidence 必须说明输入依据；无法确定时明确写待确认，不能编造。questions 输出 3 至 6 个对后续推演真正有影响的问题。`,
              },
              {
                role: 'user',
                content: `请对以下创作基线做结构化 JSON 分析：\n${JSON.stringify(input)}`,
              },
            ],
            thinking: { type: 'enabled' },
            reasoning_effort: 'high',
            response_format: { type: 'json_object' },
            max_tokens: 3000,
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
