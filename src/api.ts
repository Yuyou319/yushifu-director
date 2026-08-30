import { EndpointConfig, NodeKind, MODALITY_OF } from './types';

const headers = (key: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${key}`
});

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

const PROXY = '/apiproxy/';
/** 开发模式（浏览器）下走本地代理以绕过 CORS；Tauri 内直连 */
function resolveUrl(fullUrl: string): string {
  const dev = (import.meta as any).env?.DEV;
  if (dev && !isTauri()) return PROXY + encodeURIComponent(fullUrl);
  return fullUrl;
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
    try { detail = await res.text(); } catch { /* ignore */ }
    throw new Error(`HTTP ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

/** 通用：从响应里取出可用的 URL 或文本 */
function pickOutput(json: any): string {
  if (!json) return '[空响应]';
  if (Array.isArray(json.data) && json.data[0]) {
    const d: any = json.data[0];
    if (d.url) return d.url;
    if (d.b64_json) return `data:image/png;base64,${d.b64_json}`;
    if (d.content) return d.content;
  }
  if (json.choices && json.choices[0]) {
    const c: any = json.choices[0];
    if (c.message?.content) return c.message.content;
    if (c.text) return c.text;
  }
  if (json.url) return json.url;
  if (json.video_url) return json.video_url;
  if (json.audio_url) return json.audio_url;
  if (json.output) return json.output;
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
  return pickOutput(json);
}

export async function callImage(cfg: EndpointConfig, model: string, prompt: string, params: Record<string, any> = {}): Promise<string> {
  const json = await post(cfg.baseUrl.replace(/\/$/, '') + '/images/generations', cfg.apiKey, {
    model: model || cfg.defaultModel,
    prompt,
    n: 1,
    size: params.size || '1024x1024',
    ...(params.refImage ? { image: [params.refImage] } : {})
  });
  return pickOutput(json);
}

export async function callGeneric(
  cfg: EndpointConfig,
  model: string,
  prompt: string,
  kind: 'video' | 'audio',
  params: Record<string, any> = {}
): Promise<string> {
  const path = cfg.endpointPath || (kind === 'video' ? '/v1/videos/generations' : '/v1/audio/generations');
  const json = await post(cfg.baseUrl.replace(/\/$/, '') + path, cfg.apiKey, {
    model: model || cfg.defaultModel,
    prompt,
    input: prompt,
    ...(params.refImage ? { video: params.refImage } : {}),
    ...(params.refAudio ? { audio: params.refAudio } : {}),
    ...params
  });
  return pickOutput(json);
}

export async function callNode(
  kind: NodeKind,
  cfg: EndpointConfig,
  model: string,
  prompt: string,
  params: Record<string, any> = {}
): Promise<string> {
  const m = MODALITY_OF[kind];
  if (m === 'text') return callText(cfg, model, prompt, params);
  if (m === 'image') return callImage(cfg, model, prompt, params);
  if (m === 'video') return callGeneric(cfg, model, prompt, 'video', params);
  return callGeneric(cfg, model, prompt, 'audio', params);
}
