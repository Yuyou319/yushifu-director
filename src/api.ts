import { EndpointConfig, NodeKind, MODALITY_OF } from './types';

const headers = (key?: string): Record<string, string> => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  // 本地/私域服务多数无需鉴权，Key 为空时不发送 Authorization 头
  if (key && key.trim()) h.Authorization = `Bearer ${key}`;
  return h;
};

/** 是否运行在 Tauri 桌面壳内 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** 统一取 fetch：Tauri 内用 Rust 侧 http 插件（免 CORS），否则用浏览器 fetch */
let _tauriFetch: ((input: any, init?: any) => Promise<any>) | null = null;
async function getFetch(): Promise<(input: any, init?: any) => Promise<any>> {
  if (isTauri()) {
    if (!_tauriFetch) {
      const mod: any = await import('@tauri-apps/plugin-http');
      _tauriFetch = mod.fetch;
    }
    return _tauriFetch!;
  }
  return (input: any, init?: any) => fetch(input, init);
}

/**
 * 请求地址解析。
 *
 * 早期在开发模式（浏览器）下通过 vite 的 /apiproxy 代理转发以绕过 CORS。
 * 但该代理由 Node 进程发起请求，在 Agnes（前面是 Cloudflare）等环境下会被服务端拒绝
 * （ECONNREFUSED / HTTP 500），导致“测试连接”始终失败，而浏览器/curl 直连却正常。
 *
 * 实际上 Agnes、OpenAI 等兼容服务本身已返回 CORS 响应头
 * （access-control-allow-origin: *、access-control-allow-headers: *），
 * 浏览器可以直接跨域请求。因此这里统一直连，由浏览器（或 Tauri 的 Rust 侧）直接发送，
 * 彻底绕开 Node 代理链路的网络限制。
 */
function resolveUrl(fullUrl: string): string {
  return fullUrl;
}

/** 拼接 baseUrl 与 path，避免 base 已带 /v1 时 path 再重复 /v1 */
function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, '');
  let p = path.replace(/^\/+/, '');
  if (b.endsWith('/v1') && p.startsWith('v1/')) {
    p = p.slice(3);
  }
  return `${b}/${p}`;
}

async function post(fullUrl: string, key: string, body: any): Promise<any> {
  const f = await getFetch();
  const res = await f(resolveUrl(fullUrl), {
    method: 'POST',
    headers: headers(key),
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    let detail = '';
    try {
      const text = await res.text();
      console.error('[api] raw error response', res.status, text);
      detail = text;
      const json = JSON.parse(text);
      detail = json.error?.message || json.message || json.detail || text;
    } catch { /* ignore */ }
    throw new Error(`HTTP ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

async function get(fullUrl: string, key: string): Promise<any> {
  const f = await getFetch();
  const res = await f(resolveUrl(fullUrl), {
    method: 'GET',
    headers: headers(key)
  });
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch { /* ignore */ }
    throw new Error(`HTTP ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

/** 通用：从响应里取出可用的 URL 或文本 */
function pickOutput(json: any, kind?: 'image' | 'video' | 'audio' | 'text'): string {
  if (!json) return '[空响应]';
  const findUrl = (obj: any): string | undefined => {
    if (!obj || typeof obj !== 'object') return undefined;
    if (typeof obj.url === 'string') return obj.url;
    if (typeof obj.image_url === 'string') return obj.image_url;
    if (typeof obj.video_url === 'string') return obj.video_url;
    if (typeof obj.audio_url === 'string') return obj.audio_url;
    if (typeof obj.output === 'string') return obj.output;
    if (typeof obj.b64_json === 'string') return `data:image/png;base64,${obj.b64_json}`;
    return undefined;
  };

  // OpenAI 兼容：{ data: [{ url, b64_json, content }] }
  if (Array.isArray(json.data) && json.data[0]) {
    const d: any = json.data[0];
    const u = findUrl(d);
    if (u) return u;
    if (typeof d.content === 'string') return d.content;
  }

  // OpenAI 兼容：chat.completions { choices: [...] }
  if (json.choices && json.choices[0]) {
    const c: any = json.choices[0];
    if (c.message?.content) return c.message.content;
    if (c.text) return c.text;
  }

  // 扁平字段
  const flat = findUrl(json);
  if (flat) return flat;

  // 兜底：在某些响应里图片可能在 { images: [{ url }] } 或 { output: { url } }
  if (Array.isArray(json.images) && json.images[0]) {
    const u = findUrl(json.images[0]);
    if (u) return u;
  }
  if (json.output && typeof json.output === 'object') {
    const u = findUrl(json.output);
    if (u) return u;
  }

  // Agnes 视频/音频异步结果：{ metadata: { url } }
  if (json.metadata && typeof json.metadata === 'object') {
    const u = findUrl(json.metadata);
    if (u) return u;
  }

  console.warn('[api] 未识别的响应结构', { kind, json });
  return JSON.stringify(json).slice(0, 500);
}

export async function callText(cfg: EndpointConfig, model: string, prompt: string, params: Record<string, any> = {}): Promise<string> {
  const messages = params.refImage
    ? [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt || '请描述这张图片' },
            { type: 'image_url', image_url: { url: params.refImage } }
          ]
        }
      ]
    : [{ role: 'user', content: prompt }];
  const json = await post(cfg.baseUrl.replace(/\/$/, '') + '/chat/completions', cfg.apiKey, {
    model: model || cfg.defaultModel,
    messages,
    temperature: params.temperature ?? 0.7
  });
  return pickOutput(json, 'text');
}

export async function callImage(cfg: EndpointConfig, model: string, prompt: string, params: Record<string, any> = {}): Promise<string> {
  const json = await post(cfg.baseUrl.replace(/\/$/, '') + '/images/generations', cfg.apiKey, {
    model: model || cfg.defaultModel,
    prompt,
    n: 1,
    size: params.size || '1024x1024',
    ...(params.refImage ? { image: [params.refImage] } : {})
  });
  return pickOutput(json, 'image');
}

export async function callGeneric(
  cfg: EndpointConfig,
  model: string,
  prompt: string,
  kind: 'video' | 'audio',
  params: Record<string, any> = {},
  test: boolean = false
): Promise<string> {
  const base = cfg.baseUrl.replace(/\/$/, '');
  let path = cfg.endpointPath;
  const isAgnes = base.includes('agnes-ai');
  if (!path) {
    // Agnes 国内站：视频原生接口 /v1/videos；音频走 OpenAI 兼容 /v1/audio/speech
    // 其他 OpenAI 兼容服务：/v1/videos/generations、/v1/audio/generations
    if (isAgnes) {
      path = kind === 'video' ? '/videos' : '/audio/speech';
    } else {
      path = kind === 'video' ? '/videos/generations' : '/audio/generations';
    }
  }
  // UI 里的 duration 可能是 '5 秒'、'10 秒' 这种字符串，Agnes 要求整数
  const cleanParams = { ...params };
  if (typeof cleanParams.duration === 'string') {
    const m = cleanParams.duration.match(/(\d+)/);
    if (m) cleanParams.duration = parseInt(m[1], 10);
  }
  if (typeof cleanParams.duration === 'number') {
    cleanParams.duration = Math.floor(cleanParams.duration);
  }
  // Agnes 不接受负数 seed，UI 里 -1 表示随机，提交时去掉
  if (typeof cleanParams.seed === 'number' && cleanParams.seed < 0) {
    delete cleanParams.seed;
  }

  const body: Record<string, any> = {
    model: model || cfg.defaultModel,
    ...(cleanParams.refImage ? { image: cleanParams.refImage } : {}),
    ...(cleanParams.refAudio ? { audio: cleanParams.refAudio } : {}),
    ...cleanParams
  };
  // Agnes 视频是原生接口，用 prompt；Agnes 音频走 OpenAI /audio/speech，用 input + voice
  if (isAgnes && kind === 'audio') {
    body.input = prompt;
    body.voice = cleanParams.voice || 'alloy';
  } else {
    body.prompt = prompt;
    // 非 Agnes 的 OpenAI 兼容视频/音频接口通常需要 input 字段
    if (!isAgnes) body.input = prompt;
  }

  const json = await post(joinUrl(base, path), cfg.apiKey, body);

  // Agnes 视频/音频是异步任务：创建即返回，由前端后续手动刷新结果
  const taskId = json?.id || json?.task_id;
  if (taskId && cfg.baseUrl.includes('agnes-ai.cn') && (kind === 'video' || kind === 'audio')) {
    if (test) return `任务创建成功（ID=${taskId}），测试连接通过，未等待生成完成`;
    return `AGNES_ASYNC:${taskId}:${kind}`;
  }

  return pickOutput(json, kind);
}

/** 查询一次 Agnes 异步任务状态，返回 url 或 null（仍在排队） */
export async function refreshAgnesTask(
  base: string,
  key: string,
  taskId: string,
  kind: 'video' | 'audio'
): Promise<{ status: string; url: string | null }> {
  const path = kind === 'video' ? `videos/${taskId}` : `audio/${taskId}`;
  const status = await get(joinUrl(base, path), key);
  const url = pickOutput(status, kind);
  const s = status?.status || '';
  if (url && !url.startsWith('{')) return { status: s, url };
  if (s === 'failed' || s === 'error') {
    throw new Error(status?.error?.message || `任务失败: ${JSON.stringify(status)}`);
  }
  return { status: s, url: null };
}

export async function callNode(
  kind: NodeKind,
  cfg: EndpointConfig,
  model: string,
  prompt: string,
  params: Record<string, any> = {},
  opts: { test?: boolean } = {}
): Promise<string> {
  const m = MODALITY_OF[kind];
  if (m === 'text') return callText(cfg, model, prompt, params);
  if (m === 'image') return callImage(cfg, model, prompt, params);
  if (m === 'video') return callGeneric(cfg, model, prompt, 'video', params, opts.test);
  return callGeneric(cfg, model, prompt, 'audio', params, opts.test);
}
