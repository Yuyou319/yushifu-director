import { useState } from 'react';
import { Modality, EndpointConfig } from '../types';
import { useApp } from '../store';
import { callNode } from '../api';
import { NodeKind } from '../types';

const MODALITIES: { key: Modality; label: string; hint: string }[] = [
  { key: 'text', label: '文本 LLM', hint: '剧本、分镜、图生文等文本能力' },
  { key: 'image', label: '生图', hint: '文生图、图生图、图像工具' },
  { key: 'video', label: '生视频', hint: '文生视频、图生视频、多参、首尾帧' },
  { key: 'audio', label: '生音频', hint: '配音、克隆、音乐、音效' }
];

const PRESETS: { name: string; patch: Partial<EndpointConfig>; models: Partial<Record<Modality, string[]>> }[] = [
  { name: 'OpenAI 兼容', patch: { baseUrl: 'https://api.openai.com/v1', endpointPath: '' }, models: { text: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1'], image: ['dall-e-3', 'gpt-image-1'], video: ['sora-2'], audio: ['tts-1', 'tts-1-hd'] } },
  { name: 'DeepSeek', patch: { baseUrl: 'https://api.deepseek.com/v1', endpointPath: '' }, models: { text: ['deepseek-chat', 'deepseek-reasoner'] } },
  { name: '通义千问', patch: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', endpointPath: '' }, models: { text: ['qwen-plus', 'qwen-turbo'], image: ['wanx-v1'] } },
  { name: '智谱 GLM', patch: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', endpointPath: '' }, models: { text: ['glm-4-flash'], image: ['cogview-4'] } },
  { name: '硅基流动', patch: { baseUrl: 'https://api.siliconflow.cn/v1', endpointPath: '' }, models: { text: ['Qwen/Qwen2.5-7B-Instruct'], image: ['black-forest-labs/FLUX.1-dev'] } },
  { name: '火山方舟', patch: { baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', endpointPath: '' }, models: { text: ['doubao-pro-32k'], image: ['doubao-seedream-3.0'] } },
  { name: 'Agnes AI 免费（国际）', patch: { baseUrl: 'https://apihub.agnes-ai.com/v1', endpointPath: '' }, models: { text: ['agnes-2.5-flash'], image: ['agnes-image-2.1-flash', 'agnes-image-2.5-flash', 'agnes-image-2.0-flash'], video: ['agnes-video-v2.0', 'agnes-video-2.5-flash'] } },
  { name: 'Agnes AI 免费（国内）', patch: { baseUrl: 'https://api.agnes-ai.cn/v1', endpointPath: '' }, models: { text: ['agnes-2.5-flash'], image: ['agnes-image-2.1-flash', 'agnes-image-2.5-flash'], video: ['agnes-video-v2.0', 'agnes-video-2.5-flash'] } },
  { name: '本地·Ollama', patch: { baseUrl: 'http://localhost:11434/v1', endpointPath: '' }, models: {} },
  { name: '本地·vLLM', patch: { baseUrl: 'http://localhost:8000/v1', endpointPath: '' }, models: {} },
  { name: '本地·LocalAI', patch: { baseUrl: 'http://localhost:8080/v1', endpointPath: '' }, models: {} },
  { name: '本地·LM Studio', patch: { baseUrl: 'http://localhost:1234/v1', endpointPath: '' }, models: {} },
  { name: '本地·自建网关', patch: { baseUrl: 'http://localhost:8000/v1', endpointPath: '' }, models: {} }
];

export default function SettingsPage() {
  const settings = useApp((s) => s.settings);
  const setEndpoint = useApp((s) => s.setEndpoint);
  const prefs = useApp((s) => s.prefs);
  const setPrefs = useApp((s) => s.setPrefs);
  const assets = useApp((s) => s.assets);
  const clearAssets = useApp((s) => s.clearAssets);
  const [test, setTest] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const testConn = async (key: Modality) => {
    setBusy((b) => ({ ...b, [key]: true }));
    setTest((t) => ({ ...t, [key]: '测试中…' }));
    try {
      const out = await callNode(key as NodeKind, settings[key], settings[key].defaultModel, '测试连接', {}, { test: true });
      setTest((t) => ({ ...t, [key]: '✅ 成功：' + String(out).slice(0, 80) }));
    } catch (e: any) {
      console.error('[testConn]', key, e);
      setTest((t) => ({ ...t, [key]: '❌ ' + (e?.message || e) }));
    } finally {
      setBusy((b) => ({ ...b, [key]: false }));
    }
  };

  return (
    <div className="settings-page">
      <h2>⚙ 设置</h2>

      <div className="card">
        <div className="card-head">
          <h3>本地算力 / 私域服务器</h3>
          <span className="hint">对接你自己部署的 OpenAI 兼容服务</span>
        </div>
        <div className="home-note">
          可对接本机或局域网内自建的 <b>OpenAI 兼容</b> 服务（vLLM、Ollama、LocalAI、LM Studio、自建网关等）。
          直接填 <b>Base URL</b>（如 <code>http://localhost:8000/v1</code> 或 <code>http://192.168.x.x:8080/v1</code>），
          多数本地服务 <b>无需 API Key</b>（留空即可，已自动处理不发送鉴权头）。
          生视频/生音频若服务走 OpenAI 兼容路径（<code>/videos/generations</code>、<code>/audio/generations</code>）直接可用；
          否则在对应能力里填「接口路径」。
          下方每个能力都有「本地·xxx」一键预设，点一下填入常见本地地址，再改成你的实际地址并填写模型名即可。
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>模型 / API 配置（BYOK）</h3>
          <span className="hint">密钥仅存本机 localStorage</span>
        </div>
        {MODALITIES.map(({ key, label, hint }) => {
          const cfg = settings[key];
          return (
            <div key={key} className="cfg-block">
              <div className="cfg-head">
                <b>{label}</b>
                <span>{hint}</span>
              </div>
              <div className="cfg-grid">
                <label>
                  Base URL
                  <input value={cfg.baseUrl} placeholder="https://api.xxx.com/v1" onChange={(e) => setEndpoint(key, { baseUrl: e.target.value })} />
                </label>
                <label>
                  API Key
                  <input type="password" value={cfg.apiKey} placeholder="sk-..." onChange={(e) => setEndpoint(key, { apiKey: e.target.value })} />
                </label>
                <label>
                  模型列表（逗号分隔）
                  <input
                    value={cfg.models.join(', ')}
                    onChange={(e) =>
                      setEndpoint(key, { models: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
                    }
                  />
                </label>
                <label>
                  默认模型
                  <input value={cfg.defaultModel} onChange={(e) => setEndpoint(key, { defaultModel: e.target.value })} />
                </label>
                {(key === 'video' || key === 'audio') && (
                  <label>
                    接口路径（非 OpenAI 兼容时填）
                    <input
                      value={cfg.endpointPath}
                      placeholder={key === 'video' ? '/videos（Agnes）或 /videos/generations' : '/audio/generations'}
                      onChange={(e) => setEndpoint(key, { endpointPath: e.target.value })}
                    />
                  </label>
                )}
              </div>
              <div className="cfg-ops">
                <button className="mini" disabled={busy[key]} onClick={() => testConn(key)}>
                  {busy[key] ? '测试中…' : '测试连接'}
                </button>
                <div className="presets">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      className="mini"
                      onClick={() => {
                        const pm = p.models[key] || [];
                        setEndpoint(key, {
                          ...p.patch,
                          models: Array.from(new Set([...cfg.models, ...pm])),
                          ...(pm[0] ? { defaultModel: pm[0] } : {})
                        });
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                {test[key] && <span className="test-result">{test[key]}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-head">
          <h3>偏好</h3>
        </div>
        <div className="pref-grid">
          <label>
            主题
            <select className="inp" value={prefs.theme} onChange={(e) => setPrefs({ theme: e.target.value as never })}>
              <option value="auto">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </label>
          <label>
            并发数
            <input
              className="inp"
              type="number"
              min={1}
              max={8}
              value={prefs.concurrency}
              onChange={(e) => setPrefs({ concurrency: Number(e.target.value) || 1 })}
            />
          </label>
          <label>
            超时（秒）
            <input
              className="inp"
              type="number"
              min={10}
              max={3600}
              value={prefs.timeoutSec}
              onChange={(e) => setPrefs({ timeoutSec: Number(e.target.value) || 60 })}
            />
          </label>
          <label className="switch-label">
            <input type="checkbox" checked={prefs.demoMode} onChange={(e) => setPrefs({ demoMode: e.target.checked })} />
            演示模式（未配置 API 时本地出示例结果；关闭后强制走真实 API）
          </label>
          <label className="switch-label">
            <input type="checkbox" checked={prefs.autoSave} onChange={(e) => setPrefs({ autoSave: e.target.checked })} />
            自动保存工程与资产到本机
          </label>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>数据管理</h3>
          <span className="hint">当前资产 {assets.length} 条</span>
        </div>
        <div className="cfg-ops">
          <button
            className="mini"
            onClick={() => {
              const blob = new Blob([JSON.stringify({ settings, prefs }, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `yushifu-config-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            ⤓ 导出配置
          </button>
          <button
            className="mini danger-text"
            onClick={() => {
              if (confirm('确定清空本机全部生成资产？')) clearAssets();
            }}
          >
            清空全部资产
          </button>
        </div>
        <div className="home-note">
          本应用无后端：所有请求由你的电脑直接发往你填写的 API 地址，Key 保存在浏览器 localStorage，不会上传任何服务器。
        </div>
      </div>
    </div>
  );
}
