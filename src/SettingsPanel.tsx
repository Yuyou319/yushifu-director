import { useState } from 'react';
import { Settings, Modality, NodeKind } from './types';
import { useSettings } from './store';
import { callNode } from './api';

const MODALITIES: { key: Modality; label: string }[] = [
  { key: 'text', label: '文本 (LLM)' },
  { key: 'image', label: '生图' },
  { key: 'video', label: '生视频' },
  { key: 'audio', label: '生音频' }
];

/** 一键填入 Agnes AI 免费模型（Base URL + 模型列表 + 默认模型） */
const AGNES: Partial<Record<Modality, { models: string[]; defaultModel: string }>> = {
  text: { models: ['agnes-2.5-flash'], defaultModel: 'agnes-2.5-flash' },
  image: { models: ['agnes-image-2.1-flash', 'agnes-image-2.5-flash'], defaultModel: 'agnes-image-2.1-flash' },
  video: { models: ['agnes-video-v2.0', 'agnes-video-2.5-flash'], defaultModel: 'agnes-video-v2.0' }
};
const AGNES_URLS = {
  global: 'https://apihub.agnes-ai.com/v1',
  cn: 'https://api.agnes-ai.cn/v1'
};

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const settings = useSettings((s) => s.settings);
  const setEndpoint = useSettings((s) => s.setEndpoint);
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
    <div className="settings">
      <div className="panel-title">
        模型 / API 配置（存于本机）
        <button className="x" onClick={onClose}>×</button>
      </div>
      {MODALITIES.map(({ key, label }) => {
        const cfg = settings[key];
        return (
          <div key={key} className="setting-group">
            <h4>{label}</h4>
            <label>Base URL</label>
            <input
              value={cfg.baseUrl}
              placeholder="https://api.xxx.com/v1"
              onChange={(e) => setEndpoint(key, { baseUrl: e.target.value })}
            />
            <label>API Key</label>
            <input
              type="password"
              value={cfg.apiKey}
              placeholder="sk-..."
              onChange={(e) => setEndpoint(key, { apiKey: e.target.value })}
            />
            <label>模型列表（逗号分隔）</label>
            <input
              value={cfg.models.join(', ')}
              placeholder="gpt-4o-mini, gpt-4o"
              onChange={(e) =>
                setEndpoint(key, {
                  models: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                })
              }
            />
            <label>默认模型</label>
            <input
              value={cfg.defaultModel}
              placeholder="默认使用的模型"
              onChange={(e) => setEndpoint(key, { defaultModel: e.target.value })}
            />
            {key === 'video' || key === 'audio' ? (
              <>
                <label>接口路径（非 OpenAI 兼容时填）</label>
                <input
                  value={cfg.endpointPath}
                  placeholder={key === 'video' ? '/videos（Agnes）或 /videos/generations' : '/audio/speech（Agnes TTS）或 /audio/generations'}
                  onChange={(e) => setEndpoint(key, { endpointPath: e.target.value })}
                />
              </>
            ) : null}
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="test-btn" disabled={busy[key]} onClick={() => testConn(key)}>
                {busy[key] ? '测试中…' : '测试连接'}
              </button>
              {AGNES[key] && (
                <>
                  <button
                    className="test-btn"
                    onClick={() =>
                      setEndpoint(key, {
                        baseUrl: AGNES_URLS.global,
                        endpointPath: '',
                        models: Array.from(new Set([...cfg.models, ...AGNES[key]!.models])),
                        defaultModel: AGNES[key]!.defaultModel
                      })
                    }
                  >
                    Agnes 国际
                  </button>
                  <button
                    className="test-btn"
                    onClick={() =>
                      setEndpoint(key, {
                        baseUrl: AGNES_URLS.cn,
                        endpointPath: '',
                        models: Array.from(new Set([...cfg.models, ...AGNES[key]!.models])),
                        defaultModel: AGNES[key]!.defaultModel
                      })
                    }
                  >
                    Agnes 国内
                  </button>
                  <button
                    className="test-btn"
                    onClick={() => setEndpoint(key, { baseUrl: 'http://localhost:8000/v1', endpointPath: '' })}
                  >
                    本地算力
                  </button>
                </>
              )}
              {test[key] && <span className="test-result">{test[key]}</span>}
            </div>
          </div>
        );
      })}
      <div className="settings-note">
        密钥仅保存在你本机 localStorage，不会上传到任何服务器。测试连接会向该接口发送一次最小请求（生图/视频/音频可能产生计费）。
      </div>
    </div>
  );
}
