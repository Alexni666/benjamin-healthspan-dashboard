interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>
  }
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url)

    if (url.pathname === '/api/deepseek/test') {
      if (request.method !== 'POST') {
        return Response.json({ ok: false, message: '请求方式不支持。' }, { status: 405 })
      }

      try {
        const body = await request.json() as { apiKey?: string }
        const apiKey = body.apiKey?.trim()
        if (!apiKey) {
          return Response.json({ ok: false, message: '请填写 DeepSeek API Key。' }, { status: 400 })
        }

        const response = await fetch('https://api.deepseek.com/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        })

        if (!response.ok) {
          return Response.json({ ok: false, message: response.status === 401 ? '密钥无效，请重新检查。' : 'DeepSeek 暂时无法完成验证。' }, { status: response.status === 401 ? 401 : 502 })
        }

        return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
      } catch {
        return Response.json({ ok: false, message: '连接验证失败，请稍后重试。' }, { status: 500 })
      }
    }

    return env.ASSETS.fetch(request)
  },
}
