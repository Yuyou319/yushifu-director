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

const PRESETS: { name: string; patch: Partial<EndpointConfig>; models: string[] }[] = [
  { name: 'OpenAI 兼容', patch: { baseUrl: 'https://api.openai.com/v1', endpointPath: '' }, models: ['gpt-4o-mini', 'dall-e-3', 'tts-1'] },
  { name: 'DeepSeek', patch: { baseUrl: 'https://api.deepseek.com/v1', endpointPath: '' }, models: ['deepseek-chat', 'deepseek-reasoner'] },
  { name: '通义千问', patch: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', endpointPath: '' }, models: ['qwen-plus', 'qwen-turbo', 'wanx-v1'] },
  { name: '智谱 GLM', patch: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', endpointPath: '' }, models: ['glm-4-flash', 'cogview-4'] },
  { name: '硅基流动', patch: { baseUrl: 'https://api.siliconflow.cn/v1', endpointPath: '' }, models: ['Qwen/Qwen2.5-7B-Instruct', 'black-forest-labs/FLUX.1-dev'] },
  { name: '火山方舟', patch: { baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', endpointPath: '' }, models: ['doubao-pro-32k', 'doubao-seedream-3.0'] }
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
      const out = await callNode(key as NodeKind, settings[key], settings[key].defaultModel, '测试连接', {});
      setTest((t) => ({ ...t, [key]: '✅ 成功：' + String(out).slice(0, 80) }));
    } catch (e: any) {
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
                      placeholder={key === 'video' ? '/v1/videos/generations' : '/v1/audio/generations'}
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
                      onClick={() => setEndpoint(key, { ...p.patch, models: Array.from(new Set([...cfg.models, ...p.models])) })}
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
