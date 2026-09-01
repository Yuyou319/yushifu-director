import { useEffect, useMemo, useState } from 'react';
import { GROUP_MAP } from '../data/modes';
import { useApp } from '../store';
import { defaultValues, FieldRenderer, Section } from '../lib/ui';
import { submitTask, validate } from '../lib/engine';
import { AssetGrid, AssetView } from '../components/Preview';
import { ModeSpec, Asset } from '../types';
import SubjectBar from '../components/SubjectBar';
import AppIcon from '../components/AppIcon';

interface FormState {
  prompt: string;
  negative: string;
  values: Record<string, any>;
  model: string;
  batch: number;
}

function initForm(mode: ModeSpec, defModel: string): FormState {
  return {
    prompt: mode.promptDefault ?? '',
    negative: '',
    values: defaultValues(mode.fields),
    model: defModel,
    batch: mode.batch?.default ?? 1
  };
}

const SAMPLES: Record<string, string[]> = {
  'image.text2img': [
    '雨夜的东京街角，霓虹倒影在积水里，一位撑透明伞的少女侧身回望，电影感，浅景深',
    '清晨的江南古镇，薄雾未散，乌篷船缓缓划过水面，水墨质感'
  ],
  'video.text2video': [
    '航拍雪山之巅，云海翻涌，镜头缓慢推进，阳光穿透云层形成丁达尔效应',
    '微距视角下，一滴墨汁在清水中缓慢扩散，背景纯黑'
  ],
  'video.multiref': ['少女在旧仓库里转身走向窗边，光从窗外斜射进来，手里握着一封信'],
  'video.firstlast': ['人物从站立缓慢坐下，镜头全程固定，光线自然过渡'],
  'script.script': ['一位退休邮差在旧仓库里发现二十年前未寄出的信，决定亲自送达'],
  'audio.tts': ['你好，欢迎来到我们的故事。今天，我们一起走进那间旧仓库。'],
  'audio.music': ['温暖的钢琴独奏，逐渐加入弦乐，情绪从平静走向希望']
};

export default function GeneratePage({ groupId }: { groupId: string }) {
  const group = GROUP_MAP[groupId] ?? Object.values(GROUP_MAP)[0];
  const [modeId, setModeId] = useState(group.modes[0].id);

  /* 切换功能组时重置子模式，避免残留上一个组的 modeId */
  useEffect(() => {
    setModeId(group.modes[0].id);
  }, [group]);

  const mode = useMemo(
    () => group.modes.find((m) => m.id === modeId) ?? group.modes[0],
    [group, modeId]
  );

  /* 首页快捷入口跳转定位 */
  const focus = useApp((s) => s.focus);
  const clearFocus = useApp((s) => s.clearFocus);
  useEffect(() => {
    if (focus && focus.groupId === groupId) {
      setModeId(focus.modeId);
      clearFocus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, groupId]);

  const settings = useApp((s) => s.settings);
  const prefs = useApp((s) => s.prefs);
  const assets = useApp((s) => s.assets);
  const tasks = useApp((s) => s.tasks);
  const removeAsset = useApp((s) => s.removeAsset);
  const toggleFav = useApp((s) => s.toggleFav);

  const [forms, setForms] = useState<Record<string, FormState>>({});
  const [err, setErr] = useState('');
  const cfg = settings[mode.modality];

  const form: FormState =
    forms[modeId] ?? initForm(mode, cfg.defaultModel || (cfg.models[0] ?? ''));
  const setForm = (patch: Partial<FormState>) =>
    setForms((f) => ({ ...f, [modeId]: { ...form, ...patch } }));

  const setField = (key: string, v: any) => setForm({ values: { ...form.values, [key]: v } });

  const results = assets.filter((a) => a.modeId === modeId);
  const runningTasks = tasks.filter((t) => t.modeId === modeId && t.status === 'running');
  const history = tasks.filter((t) => t.modeId === modeId).slice(0, 6);
  const useReal = !!cfg.apiKey && !!cfg.baseUrl && !prefs.demoMode;

  const lastText = results.find((a) => a.type === 'text');

  const onGenerate = () => {
    const msg = validate(mode, form.prompt, form.values);
    if (msg) {
      setErr(msg);
      return;
    }
    setErr('');
    submitTask({
      group,
      mode,
      prompt: form.prompt,
      negative: form.negative,
      values: form.values,
      model: form.model,
      batch: form.batch
    });
  };

  return (
    <div className="gen">
      {/* 左侧：子功能列表 */}
      <aside className="gen-side">
        <div className="gen-side-head">
          <span className="gen-ico"><AppIcon id={group.id} /></span>
          <div>
            <div className="gen-title">{group.name}</div>
            <div className="gen-sub">{group.desc}</div>
          </div>
        </div>
        <div className="mode-list">
          {group.modes.map((m) => (
            <button
              key={m.id}
              className={`mode-item ${m.id === modeId ? 'on' : ''}`}
              onClick={() => setModeId(m.id)}
            >
              <span className="mode-ico"><AppIcon id={group.id} /></span>
              <span className="mode-txt">
                <span className="mode-name">{m.name}</span>
                <span className="mode-desc">{m.subtitle}</span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* 中间：参数区 */}
      <section className="gen-main">
        <div className="gen-head">
          <div>
            <h2>
              {mode.icon} {mode.name}
            </h2>
            <p>{mode.subtitle}</p>
          </div>
          <span className={`tag ${useReal ? 'ok' : 'demo'}`}>
            {useReal ? `真实调用 · ${form.model || cfg.defaultModel}` : '演示模式 · 本地生成'}
          </span>
        </div>

        {group.id === 'character' && <SubjectBar onPickRef={(url) => setField('ref', { id: `s_${Date.now()}`, url, name: '主体库参考图' })} />}

        {mode.promptLabel && (
          <div className="prompt-card">
            <Section title={mode.promptLabel} right={<ModelHint modality={mode.modality} />}>
              <textarea
                className="inp prompt"
                rows={5}
                value={form.prompt}
                placeholder={mode.promptPlaceholder}
                onChange={(e) => setForm({ prompt: e.target.value })}
              />
              <div className="prompt-ops">
                <button
                  className="mini"
                  onClick={() => {
                    const arr = SAMPLES[mode.id] ?? [];
                    if (arr.length) setForm({ prompt: arr[Math.floor(Math.random() * arr.length)] });
                  }}
                >
                  ✨ 示例提示词
                </button>
                <button className="mini" onClick={() => setForm({ prompt: '' })}>
                  清空
                </button>
                <span className="cnt">{form.prompt.length} 字</span>
              </div>
            </Section>
          </div>
        )}

        {mode.negativePrompt && (
          <Section title="负向提示词" defaultOpen={false}>
            <textarea
              className="inp"
              rows={2}
              value={form.negative}
              placeholder="不希望出现的内容，如：低清晰度、畸形手指、过曝、水印"
              onChange={(e) => setForm({ negative: e.target.value })}
            />
          </Section>
        )}

        <Section title="功能参数">
          {mode.fields.map((f, i) => {
            const key = 'key' in f && f.key ? f.key : `__note${i}`;
            return <FieldRenderer key={key} spec={f} value={form.values[key]} onChange={(v) => setField(key, v)} />;
          })}
        </Section>

        {mode.tips && mode.tips.length > 0 && (
          <Section title="使用提示" defaultOpen>
            <ul className="tips">
              {mode.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </Section>
        )}
      </section>

      {/* 右侧：模型 / 生成 / 结果 */}
      <aside className="gen-right">
        <div className="gen-panel">
          <div className="panel-title">模型</div>
          <select className="inp" value={form.model} onChange={(e) => setForm({ model: e.target.value })}>
            {(cfg.models.length ? cfg.models : [cfg.defaultModel]).filter(Boolean).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            {form.model && !cfg.models.includes(form.model) && <option value={form.model}>{form.model}</option>}
          </select>
          <input
            className="inp"
            style={{ marginTop: 8 }}
            placeholder="或手动填写模型名"
            value={form.model}
            onChange={(e) => setForm({ model: e.target.value })}
          />

          {mode.batch && (
            <>
              <div className="panel-title" style={{ marginTop: 12 }}>
                生成数量
              </div>
              <input
                className="inp"
                type="number"
                min={mode.batch.min}
                max={mode.batch.max}
                value={form.batch}
                onChange={(e) =>
                  setForm({
                    batch: Math.max(mode.batch!.min, Math.min(mode.batch!.max, Number(e.target.value) || 1))
                  })
                }
              />
            </>
          )}

          {err && <div className="err-box">{err}</div>}

          <button className="primary gen-btn" disabled={runningTasks.length > 0} onClick={onGenerate}>
            {runningTasks.length > 0 ? '生成中…' : `生成${mode.output === 'text' ? '' : mode.output === 'video' ? '视频' : mode.output === 'audio' ? '音频' : '图片'}`}
          </button>
          {!useReal && (
            <div className="demo-note">
              未配置 {modalityName(mode.modality)} API 或已开启演示模式，当前为本地演示结果。到「设置」填写 API 即切换为真实生成。
            </div>
          )}
        </div>

        <div className="gen-panel">
          <div className="panel-title">
            任务
            {runningTasks.length > 0 && <span className="dot-run">{runningTasks.length} 个进行中</span>}
          </div>
          {history.length === 0 && <div className="empty">暂无任务</div>}
          {history.map((t) => (
            <div key={t.id} className={`task ${t.status}`}>
              <div className="task-top">
                <span className="task-name">{t.modeName}</span>
                <span className="task-st">
                  {t.status === 'running' ? `${Math.round(t.progress)}%` : t.status === 'done' ? '完成' : t.status === 'error' ? '失败' : '排队'}
                </span>
              </div>
              <div className="task-bar">
                <div className="task-fill" style={{ width: `${t.progress}%` }} />
              </div>
              {t.error && <div className="task-err">{t.error}</div>}
            </div>
          ))}
        </div>

        <div className="gen-panel grow">
          <div className="panel-title">
            结果{results.length > 0 && <span className="cnt">{results.length}</span>}
          </div>
          {mode.output === 'text' && lastText ? (
            <div className="text-out">
              <pre>{lastText.url}</pre>
            </div>
          ) : null}
          <AssetGrid
            assets={results}
            onFav={(a) => toggleFav(a.id)}
            onDelete={(a) => removeAsset(a.id)}
          />
        </div>
      </aside>
    </div>
  );
}

function ModelHint({ modality }: { modality: string }) {
  return <span className="hint">调用「{modalityName(modality)}」接口</span>;
}

export function modalityName(m: string): string {
  return m === 'text' ? '文本 LLM' : m === 'image' ? '生图' : m === 'video' ? '生视频' : '生音频';
}

export function assetLabel(a: Asset): string {
  return a.modeName ?? a.type;
}
