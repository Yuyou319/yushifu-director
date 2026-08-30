import { ModelPromptInput, VideoModelProfile } from '../types';

const clean = (...parts: (string | undefined)[]) =>
  parts
    .filter((p) => p && String(p).trim())
    .map((p) => String(p).trim())
    .join('，');

/**
 * 视频模型适配：同一组分镜要素，按不同模型的 Prompt 结构与擅长项重新组织
 */
export const VIDEO_MODELS: VideoModelProfile[] = [
  {
    id: 'kling',
    name: '可灵 Kling 1.6',
    vendor: '快手',
    strength: '人物表演与物理运动，中文语义理解好',
    maxDuration: '10 秒',
    ratios: ['16:9', '9:16', '1:1'],
    structure: ['主体描述', '动作', '场景', '镜头语言', '光影', '风格'],
    template: (p) => clean(p.subject, p.action, p.scene, p.camera, p.lighting, p.style, p.extra),
    tips: '用「主语+连续动作」写法，动作一次只写一个；镜头语言单独成句效果更稳。',
    supportsFirstLast: true,
    supportsMultiRef: true
  },
  {
    id: 'jimeng',
    name: '即梦 Jimeng / Seedance',
    vendor: '字节',
    strength: '运镜表现力与画面美感，适合氛围镜头',
    maxDuration: '5 秒',
    ratios: ['16:9', '9:16', '1:1', '4:3', '3:4'],
    structure: ['画面主体', '环境氛围', '运镜', '风格', '画质词'],
    template: (p) => clean(p.subject, p.scene, p.camera, p.mood, p.style, '电影感，高画质，细节丰富', p.extra),
    tips: '先写画面再写运镜；结尾加画质词（电影感、8k、细节丰富）提升明显。',
    supportsFirstLast: true,
    supportsMultiRef: false
  },
  {
    id: 'hailuo',
    name: '海螺 Hailuo 02',
    vendor: 'MiniMax',
    strength: '大幅动作与镜头运动，指令遵循强',
    maxDuration: '6 秒',
    ratios: ['16:9', '9:16', '1:1'],
    structure: ['镜头', '主体', '动作', '场景', '氛围'],
    template: (p) => clean(p.camera, p.subject, p.action, p.scene, p.mood, p.extra),
    tips: '把运镜写在最前面效果最好；支持较复杂的连续动作描述。',
    supportsFirstLast: true,
    supportsMultiRef: false
  },
  {
    id: 'wan',
    name: '通义万相 Wan 2.2',
    vendor: '阿里',
    strength: '中文场景与国风题材，首尾帧稳定',
    maxDuration: '5 秒',
    ratios: ['16:9', '9:16', '1:1'],
    structure: ['主体', '动作', '场景', '风格', '镜头'],
    template: (p) => clean(p.subject, p.action, p.scene, p.style, p.camera, p.extra),
    tips: '首尾帧模式对构图控制最好；风格词放中间，镜头词放最后。',
    supportsFirstLast: true,
    supportsMultiRef: false
  },
  {
    id: 'runway',
    name: 'Runway Gen-4',
    vendor: 'Runway',
    strength: '多参考一致性与电影感运镜',
    maxDuration: '10 秒',
    ratios: ['16:9', '9:16', '1:1', '4:3', '21:9'],
    structure: ['Camera', 'Subject', 'Action', 'Environment', 'Lighting', 'Style'],
    template: (p) =>
      [
        p.camera && `Camera: ${p.camera}`,
        p.subject && `Subject: ${p.subject}`,
        p.action && `Action: ${p.action}`,
        p.scene && `Environment: ${p.scene}`,
        p.lighting && `Lighting: ${p.lighting}`,
        p.style && `Style: ${p.style}`,
        p.mood && `Mood: ${p.mood}`,
        p.extra
      ]
        .filter(Boolean)
        .join('. '),
    tips: '英文分段式写法（Camera/Subject/Action）遵循度最高；多参考图可锁定角色。',
    supportsFirstLast: true,
    supportsMultiRef: true
  },
  {
    id: 'sora',
    name: 'Sora',
    vendor: 'OpenAI',
    strength: '长时长与复杂场面调度，叙事连贯',
    maxDuration: '20 秒',
    ratios: ['16:9', '9:16', '1:1'],
    structure: ['场景设定', '人物与表演', '镜头调度', '声音氛围', '风格'],
    template: (p) =>
      clean(
        `场景：${p.scene || ''}`,
        `人物与表演：${clean(p.subject, p.action)}`,
        `镜头：${p.camera || ''}`,
        `氛围：${clean(p.mood, p.lighting)}`,
        `风格：${p.style || ''}`,
        p.extra
      ),
    tips: '用段落式长描述，写清场景、表演、镜头三个层次；允许更复杂的连续事件。',
    supportsFirstLast: false,
    supportsMultiRef: false
  },
  {
    id: 'vidu',
    name: 'Vidu Q2',
    vendor: '生数科技',
    strength: '动漫与风格化题材，多参一致性',
    maxDuration: '8 秒',
    ratios: ['16:9', '9:16', '1:1'],
    structure: ['风格', '主体', '动作', '场景', '镜头'],
    template: (p) => clean(p.style, p.subject, p.action, p.scene, p.camera, p.extra),
    tips: '风格词前置能显著强化画风；动漫题材优先使用。',
    supportsFirstLast: true,
    supportsMultiRef: true
  },
  {
    id: 'generic',
    name: '通用 OpenAI 兼容接口',
    vendor: 'BYOK',
    strength: '取决于你接入的服务商',
    maxDuration: '取决于接口',
    ratios: ['16:9', '9:16', '1:1'],
    structure: ['主体', '动作', '场景', '镜头', '风格'],
    template: (p) => clean(p.subject, p.action, p.scene, p.camera, p.lighting, p.style, p.extra),
    tips: '通用结构，适配大多数兼容接口；负向提示词单独提交。',
    supportsFirstLast: false,
    supportsMultiRef: false
  }
];

export const VIDEO_MODEL_MAP: Record<string, VideoModelProfile> = Object.fromEntries(
  VIDEO_MODELS.map((m) => [m.name, m])
);
export const VIDEO_MODEL_NAMES = VIDEO_MODELS.map((m) => m.name);

export function findVideoModel(name: string): VideoModelProfile {
  return VIDEO_MODEL_MAP[name] ?? VIDEO_MODELS[VIDEO_MODELS.length - 1];
}

export function emptyModelInput(): ModelPromptInput {
  return { subject: '', action: '', scene: '', camera: '', lighting: '', style: '', mood: '', extra: '', negative: '' };
}
