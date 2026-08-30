import { ModeGroup, ModeSpec, Asset, AssetType, Modality } from '../types';
import { useApp } from '../store';
import { callGeneric, callImage, callText } from '../api';
import { mockOutput, mockText } from './mock';
import { countRefs, flattenParams } from './ui';

/** 从表单值里挑出第一个媒体素材（作为参考图/参考视频/参考音频） */
export function pickFirstMedia(values: Record<string, any>): string {
  const scan = (v: any): string => {
    if (!v) return '';
    if (Array.isArray(v)) {
      for (const it of v) {
        const u = scan(it);
        if (u) return u;
      }
      return '';
    }
    if (typeof v === 'object') {
      if (typeof v.url === 'string') return v.url;
      if (v.a?.url) return v.a.url;
      for (const sv of Object.values<any>(v)) {
        if (sv?.enabled && sv?.items?.length) return sv.items[0].url;
      }
    }
    return '';
  };
  return scan(values);
}

export interface SubmitOptions {
  group: ModeGroup;
  mode: ModeSpec;
  prompt: string;
  negative?: string;
  values: Record<string, any>;
  model: string;
  batch: number;
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** 提交一次生成任务；返回创建的任务 id */
export function submitTask(opts: SubmitOptions): string {
  const st = useApp.getState();
  const { group, mode, prompt, negative, values, model, batch } = opts;

  const task = st.pushTask({
    modeId: mode.id,
    modeName: mode.name,
    groupId: group.id,
    output: mode.output,
    prompt
  });

  void (async () => {
    const s = useApp.getState();
    s.updateTask(task.id, { status: 'running', progress: 5 });

    const params = flattenParams(values);
    if (negative) params.negative_prompt = negative;
    const cfg = s.settings[mode.modality];
    const useReal = !!cfg.apiKey && !!cfg.baseUrl && !s.prefs.demoMode;
    const timer = setInterval(() => {
      const cur = useApp.getState().tasks.find((t) => t.id === task.id);
      if (!cur || cur.status !== 'running') return;
      useApp.getState().updateTask(task.id, { progress: Math.min(95, (cur.progress ?? 0) + Math.random() * 12) });
    }, 400);

    try {
      let urls: string[] = [];
      if (useReal) {
        const n = Math.max(1, batch || 1);
        for (let i = 0; i < n; i++) {
          const out =
            mode.modality === 'text'
              ? await callText(cfg, model, prompt, { ...params, refImage: pickFirstMedia(values) })
              : mode.modality === 'image'
              ? await callImage(cfg, model, prompt, { ...params, size: params.size, refImage: pickFirstMedia(values) })
              : await callGeneric(cfg, model, prompt, mode.modality === 'video' ? 'video' : 'audio', {
                  ...params,
                  size: params.size,
                  duration: params.duration,
                  refImage: pickFirstMedia(values)
                });
          urls.push(out);
        }
      } else {
        await wait(600 + Math.random() * 700);
        const n = Math.max(1, batch || 1);
        for (let i = 0; i < n; i++) {
          urls.push(
            mockOutput(mode.output, prompt, mode.name, (params.seed ?? 1) + i * 977, { duration: params.duration })
          );
        }
      }
      clearInterval(timer);

      let lastId = '';
      urls.forEach((url, i) => {
        const asset = useApp.getState().addAsset({
          type: mode.output,
          url,
          title: `${mode.name} · ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}${
            urls.length > 1 ? ` (${i + 1})` : ''
          }`,
          prompt,
          model: useReal ? model : '演示模式',
          modeId: mode.id,
          modeName: mode.name,
          groupId: group.id,
          params,
          demo: !useReal
        });
        lastId = asset.id;
      });
      useApp.getState().updateTask(task.id, {
        status: 'done',
        progress: 100,
        finishedAt: Date.now(),
        assetId: lastId
      });
    } catch (e: any) {
      clearInterval(timer);
      useApp.getState().updateTask(task.id, {
        status: 'error',
        progress: 100,
        finishedAt: Date.now(),
        error: e?.message ?? String(e)
      });
    }
  })();

  return task.id;
}

/** 阶段页里的即时生成：不需要预先定义 ModeSpec */
export function submitAdhoc(opts: {
  name: string;
  output: AssetType;
  modality: Modality;
  prompt: string;
  groupId: string;
  values?: Record<string, any>;
  batch?: number;
}): string {
  const mode: ModeSpec = {
    id: `${opts.groupId}.adhoc`,
    name: opts.name,
    subtitle: '',
    icon: '⚡',
    output: opts.output,
    modality: opts.modality,
    fields: []
  };
  const group: ModeGroup = {
    id: opts.groupId,
    name: opts.name,
    icon: '⚡',
    desc: '',
    section: '工具',
    modes: [mode]
  };
  return submitTask({
    group,
    mode,
    prompt: opts.prompt,
    values: opts.values ?? {},
    model: useApp.getState().settings[opts.modality].defaultModel,
    batch: opts.batch ?? 1
  });
}

/** 提交并等待结果，返回生成的资产 */
export function submitAndWait(opts: Parameters<typeof submitAdhoc>[0]): Promise<Asset | null> {
  const taskId = submitAdhoc(opts);
  return new Promise((resolve) => {
    let done = false;
    const unsub = useApp.subscribe((st) => {
      if (done) return;
      const t = st.tasks.find((x) => x.id === taskId);
      if (!t) return;
      if (t.status === 'done') {
        done = true;
        unsub();
        resolve(st.assets.find((a) => a.id === t.assetId) ?? null);
      } else if (t.status === 'error') {
        done = true;
        unsub();
        resolve(null);
      }
    });
  });
}

/**
 * 调用文本模型（未配置 API 时返回本地演示文本）
 */
export async function generateText(prompt: string, system = '', temperature = 0.8): Promise<string> {
  const st = useApp.getState();
  const cfg = st.settings.text;
  if (cfg.apiKey && cfg.baseUrl && !st.prefs.demoMode) {
    try {
      return await callText(cfg, cfg.defaultModel, system ? `${system}\n\n${prompt}` : prompt, { temperature });
    } catch (e: any) {
      return `【调用失败】${e?.message ?? e}\n\n${mockText(prompt, '文本生成')}`;
    }
  }
  await wait(500 + Math.random() * 600);
  return mockText(prompt, '文本生成');
}

/** 成片阶段常用入口 */
export const goModeTargets = [
  { groupId: 'vidtools', modeId: 'vt.export', icon: '🎬', name: '合成导出' },
  { groupId: 'vidtools', modeId: 'vt.subtitle', icon: '🔤', name: '字幕烧录' },
  { groupId: 'vidtools', modeId: 'vt.dub', icon: '🗣️', name: '视频配音' },
  { groupId: 'audio', modeId: 'audio.music', icon: '🎵', name: '音乐生成' },
  { groupId: 'audio', modeId: 'audio.tts', icon: '🗣️', name: '文本配音' },
  { groupId: 'imgtools', modeId: 'it.upscale', icon: '🔍', name: '超分放大' }
];

/** 校验：必填项是否齐备 */
export function validate(mode: ModeSpec, prompt: string, values: Record<string, any>): string {
  if (mode.promptLabel && !String(prompt ?? '').trim()) return '请填写提示词';
  for (const f of mode.fields) {
    if (f.type === 'upload' && f.required) {
      const v = values[f.key];
      if (!v || !v.url) return `请上传${f.label}`;
    }
    if (f.type === 'pair') {
      const v = values[f.key] ?? {};
      if (!v.a?.url) return `请上传${f.a}`;
      if (!v.b?.url) return `请上传${f.b}`;
    }
    if (f.type === 'slots') {
      const map = values[f.key] ?? {};
      const has = Object.values<any>(map).some((sv) => sv?.enabled && sv?.items?.length);
      if (!has) return `${f.label}：请至少在一个参考位上传素材`;
    }
  }
  return '';
}

export function assetTypeLabel(t: AssetType): string {
  return t === 'image' ? '图片' : t === 'video' ? '视频' : t === 'audio' ? '音频' : '文本';
}

export function recentAssets(type?: AssetType, limit = 24): Asset[] {
  const all = useApp.getState().assets;
  const list = type ? all.filter((a) => a.type === type) : all;
  return list.slice(0, limit);
}

export { countRefs };
