import { getToken } from '@/utils/auth'

/**
 * SSE 流式对话。onEvent(evt) 每收到一条 data 回调一次。
 */
export async function chatStreamApi(data, onEvent) {
  const baseURL = import.meta.env.VITE_API_BASE_URL || ''
  const token = getToken()
  const res = await fetch(`${baseURL}/api/ai/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      // EventSource 带不了自定义头；fetch 可以带 JWT
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  })

  if (res.status === 401) {
    throw new Error('登录已失效，请重新登录')
  }
  if (!res.ok || !res.body) {
    throw new Error('流式接口请求失败')
  }

  const contentType = res.headers.get('content-type') || ''
  // 若被全局异常收成普通 JSON，不能按 SSE 去拆
  if (!contentType.includes('text/event-stream')) {
    const payload = await res.json().catch(() => null)
    throw new Error(payload?.message || '流式接口返回异常')
  }

  // getReader：按二进制块读响应体，不是等全部下载完
  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  // buffer：TCP 可能把半条 SSE 拆开送达，要先攒着
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      // HTTP 流结束不等于 Agent 已完成，必须收到业务结束事件。
      if (done) throw new Error('响应中断，未收到结束事件，请核对结果后重试')
      buffer += decoder.decode(value, { stream: true })

      const chunks = buffer.split('\n\n')
      buffer = chunks.pop() || ''
      for (const chunk of chunks) {
        const line = chunk
          .split('\n')
          .map((item) => item.trim())
          .find((item) => item.startsWith('data:'))
        if (!line) continue
        const raw = line.slice(5).trim()
        if (!raw) continue
        // 完整帧才能到这里；JSON 无效或回调异常时交给 handleSend 提示。
        const event = JSON.parse(raw)
        onEvent(event)
        // error 已由页面回调提示，不再把它误报为断流。
        if (event.type === 'done' || event.type === 'error') return
      }
    }
  } finally {
    // 收到结束事件、读取失败或回调异常时均释放读取器。
    try {
      await reader.cancel()
    } finally {
      reader.releaseLock()
    }
  }
}
