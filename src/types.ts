export type Modality = 'text' | 'image' | 'video' | 'audio';

export interface EndpointConfig {
  baseUrl: string;
  apiKey: string;
  models: string[];
  defaultModel:  string;
  /** 非聊天类接口的自定义路径，例如视频/音频。留空则按 OpenAI 兼容规则推断 */
  endpointPath: string;
}

export interface Settings {
  text: EndpointConfig;
  image: EndpointConfig;
  video: EndpointConfig;
  audio: EndpointConfig;
}

export type NodeKind =
  | 'prompt'
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'output'
  | 'storyboard'
  | 'rewrite'
  | 'translate'
  | 'image2img'
  | 'image2video'
  | 'refimg'
  | 'upscale'
  | 'bgremove'
  | 'video2video'
  | 'caption'
  | 'inpaint'
  | 'music'
  | 'lipsync';

export interface NodeData {
  kind: NodeKind;
  label: string;
  model?: string;
  prompt?: string;
  /** 参考图/视频 URL（图生图 / 图生视频 / 对口型 使用） */
  refImage?: string;
  /** 参考音频 URL（对口型 使用） */
  refAudio?: string;
  /** 生成类参数：temperature / size / duration / voice 等 */
  params?: Record<string, any>;
  status?: 'idle' | 'running' | 'done' | 'error';
  output?: string;
  error?: string;
}

export const MODALITY_OF: Record<string, Modality> = {
  text: 'text',
  storyboard: 'text',
  rewrite: 'text',
  translate: 'text',
  image: 'image',
  image2img: 'image',
  upscale: 'image',
  bgremove: 'image',
  inpaint: 'image',
  video: 'video',
  lipsync: 'video',
  image2video: 'video',
  audio: 'audio',
  music: 'audio'
};

/* =========================================================================
 *  LIBTV 本地版 · 资产 / 任务 / 功能模式规格
 * ========================================================================= */

export type AssetType = 'image' | 'video' | 'audio' | 'text';

export interface Asset {
  id: string;
  type: AssetType;
  url: string;
  title: string;
  prompt?: string;
  model?: string;
  modeId?: string;
  modeName?: string;
  groupId?: string;
  createdAt: number;
  params?: Record<string, any>;
  /** true = 演示模式（未配置 API）下本地生成的示例结果 */
  demo?: boolean;
  favorite?: boolean;
}

export type TaskStatus = 'queued' | 'running' | 'done' | 'error';

export interface Task {
  id: string;
  modeId: string;
  modeName: string;
  groupId: string;
  output: AssetType;
  status: TaskStatus;
  progress: number;
  createdAt: number;
  finishedAt?: number;
  error?: string;
  assetId?: string;
  prompt?: string;
}

export interface RefItem {
  id: string;
  url: string;
  name: string;
}

export interface SlotValue {
  enabled: boolean;
  weight: number;
  items: RefItem[];
}

export type SlotMap = Record<string, SlotValue>;

export interface PairValue {
  a?: RefItem;
  b?: RefItem;
}

export interface DirValue {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface TableRow {
  id: string;
  [key: string]: any;
}

/* ---------------------------- 表单字段规格 ---------------------------- */

export type FieldSpec =
  | { type: 'text'; key: string; label: string; placeholder?: string; default?: string; tip?: string }
  | { type: 'textarea'; key: string; label: string; placeholder?: string; default?: string; rows?: number; tip?: string }
  | { type: 'number'; key: string; label: string; min?: number; max?: number; step?: number; default?: number; unit?: string; tip?: string }
  | { type: 'slider'; key: string; label: string; min: number; max: number; step: number; default: number; unit?: string; tip?: string }
  | { type: 'select'; key: string; label: string; options: string[]; default?: string; tip?: string }
  | { type: 'chips'; key: string; label: string; options: string[]; default?: string; multi?: boolean; tip?: string }
  | { type: 'switch'; key: string; label: string; default?: boolean; tip?: string }
  | { type: 'seed'; key: string; label?: string; default?: number }
  | { type: 'upload'; key: string; label: string; accept: AssetType; tip?: string; required?: boolean }
  | { type: 'uploads'; key: string; label: string; accept: AssetType; max?: number; tip?: string }
  | { type: 'pair'; key: string; label: string; a: string; b: string; accept: AssetType; tip?: string }
  | { type: 'slots'; key: string; label: string; slots: { id: string; label: string; hint?: string }[]; accept: AssetType; max?: number; tip?: string }
  | { type: 'grid'; key: string; label: string; options: { value: string; label: string }[]; cols?: number; default?: string; multi?: boolean; tip?: string }
  | { type: 'dirbox'; key: string; label: string; tip?: string }
  | { type: 'table'; key: string; label: string; columns: { key: string; label: string; width?: number }[]; tip?: string }
  | { type: 'range'; key: string; label: string; min: number; max: number; default: [number, number]; unit?: string; tip?: string }
  | { type: 'color'; key: string; label: string; default?: string }
  | { type: 'note'; key?: string; label?: string; text: string };

export interface ModeSpec {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  /** 输出类型 */
  output: AssetType;
  /** 使用哪一套 API 配置 */
  modality: Modality;
  /** 提示词区（留空表示该模式无需提示词） */
  promptLabel?: string;
  promptPlaceholder?: string;
  promptDefault?: string;
  negativePrompt?: boolean;
  /** 生成数量（图片一次多张） */
  batch?: { min: number; max: number; default: number };
  fields: FieldSpec[];
  tips?: string[];
}

export interface ModeGroup {
  id: string;
  name: string;
  icon: string;
  desc: string;
  /** 侧栏分组 */
  section: '创作' | '策划' | '工具';
  modes: ModeSpec[];
}

/* ---------------------------- 主体库（角色一致性） ---------------------------- */

export interface Subject {
  id: string;
  name: string;
  type: '角色' | '场景' | '道具' | '风格';
  url: string;
  tags: string[];
  createdAt: number;
}

/* ---------------------------- 应用设置 ---------------------------- */

export interface AppPrefs {
  theme: 'auto' | 'light' | 'dark';
  /** 未配置 API Key 时使用本地演示生成 */
  demoMode: boolean;
  concurrency: number;
  timeoutSec: number;
  exportPath: string;
  autoSave: boolean;
}

export const DEFAULT_PREFS: AppPrefs = {
  theme: 'auto',
  demoMode: true,
  concurrency: 2,
  timeoutSec: 300,
  exportPath: '',
  autoSave: true
};

export const KIND_LABELS: Record<NodeKind, string> = {
  prompt: '提示词',
  text: '文本生成',
  image: '文生图',
  video: '文生视频',
  audio: '生音频',
  output: '输出/预览',
  storyboard: '分镜脚本',
  rewrite: '改写润色',
  translate: '翻译',
  image2img: '图生图',
  image2video: '图生视频',
  refimg: '参考图',
  upscale: '超分放大',
  bgremove: '智能抠图',
  video2video: '视频转视频',
  caption: '图生文',
  inpaint: '局部重绘',
  music: '音乐生成',
  lipsync: '对口型'
};

/* =========================================================================
 *  AI 导演工作台 · 项目 / 流程 / 导演参数
 * ========================================================================= */

export type StageId = 'idea' | 'plan' | 'script' | 'asset' | 'shot' | 'prompt' | 'generate' | 'edit' | 'deliver';

export interface StageMeta {
  id: StageId;
  name: string;
  icon: string;
  desc: string;
}

export const STAGES: StageMeta[] = [
  { id: 'idea', name: '创意', icon: '💡', desc: '一句话想法与项目定位' },
  { id: 'plan', name: '策划', icon: '🧭', desc: '按视频类型生成制作 SOP' },
  { id: 'script', name: '剧本', icon: '📜', desc: '故事梗概 → 结构化剧本' },
  { id: 'asset', name: '资产', icon: '🎭', desc: '角色/场景/道具/服装/产品/风格' },
  { id: 'shot', name: '分镜', icon: '🎬', desc: '分镜表与镜头设计' },
  { id: 'prompt', name: 'Prompt', icon: '🧾', desc: '模型适配 + 大师模式' },
  { id: 'generate', name: '生成', icon: '⚡', desc: '调用创作工具产出画面' },
  { id: 'edit', name: '剪辑', icon: '✂️', desc: '视频工具与节奏处理' },
  { id: 'deliver', name: '成片', icon: '🎞️', desc: '合成、字幕与导出' }
];

/* ------------------------------ 导演参数 ------------------------------ */

export interface DirectorParams {
  videoType: string;
  duration: string;
  ratio: string;
  videoModel: string;
  visualStyle: string;
  /** 0-1 剧情冲突强度 */
  conflict: number;
  /** 0-1 情绪强度 */
  emotion: number;
  /** 0-1 反转强度 */
  twist: number;
  /** 0-1 镜头密度 */
  shotDensity: number;
  /** 0-1 剪辑节奏 */
  editRhythm: number;
  /** 电影大师 */
  master: string;
  masterOn: boolean;
}

export const DEFAULT_DIRECTOR_PARAMS: DirectorParams = {
  videoType: 'AI 剧情短片',
  duration: '60 秒',
  ratio: '16:9',
  videoModel: '可灵 Kling 1.6',
  visualStyle: '电影感',
  conflict: 0.5,
  emotion: 0.6,
  twist: 0.3,
  shotDensity: 0.5,
  editRhythm: 0.5,
  master: '王家卫',
  masterOn: false
};

/* ------------------------------ 资产条目 ------------------------------ */

export type AssetKind = '角色' | '场景' | '道具' | '服装' | '产品' | '美术风格' | '关键参考图';

export const ASSET_KINDS: AssetKind[] = ['角色', '场景', '道具', '服装', '产品', '美术风格', '关键参考图'];

export interface AssetSpec {
  id: string;
  kind: AssetKind;
  name: string;
  desc: string;
  /** 该资产的生成/描述提示词 */
  prompt: string;
  /** 一致性要求（多条） */
  consistency: string[];
  imageUrl?: string;
}

/* ------------------------------- 分镜行 ------------------------------- */

export interface ShotRow {
  id: string;
  no: number;
  size: string;
  camera: string;
  desc: string;
  line: string;
  duration: number;
  imageUrl?: string;
  videoUrl?: string;
}

/* ------------------------------ Prompt 条目 ------------------------------ */

export interface PromptItem {
  id: string;
  shotId: string;
  shotNo: number;
  model: string;
  original: string;
  master: string;
  diff: string[];
  updatedAt: number;
}

/* -------------------------------- SOP -------------------------------- */

export interface SopStep {
  title: string;
  detail: string;
}

export interface VideoTypeSop {
  id: string;
  name: string;
  icon: string;
  goal: string;
  steps: SopStep[];
  prep: string[];
  consistencyFocus: string[];
  shotFocus: string;
  promptFocus: string;
  pitfalls: string[];
  tools: string[];
}

/* ------------------------------ 电影大师 ------------------------------ */

export interface MasterProfile {
  id: string;
  name: string;
  en: string;
  intro: string;
  keywords: string[];
  /** 12 维导演语言 */
  dims: {
    composition: string;
    lens: string;
    depth: string;
    cameraHeight: string;
    cameraMove: string;
    blocking: string;
    lighting: string;
    color: string;
    productionDesign: string;
    editRhythm: string;
    emotionRhythm: string;
    narrative: string;
  };
  /** 转译成可执行的镜头动作提示 */
  directives: string[];
}

export const DIM_LABELS: { key: keyof MasterProfile['dims']; label: string }[] = [
  { key: 'composition', label: '构图 Composition' },
  { key: 'lens', label: '焦段 Lens' },
  { key: 'depth', label: '景深 Depth of Field' },
  { key: 'cameraHeight', label: '机位高度 Camera Height' },
  { key: 'cameraMove', label: '摄影机运动 Camera Movement' },
  { key: 'blocking', label: '人物调度 Blocking' },
  { key: 'lighting', label: '光线 Lighting' },
  { key: 'color', label: '色彩 Color' },
  { key: 'productionDesign', label: '美术 Production Design' },
  { key: 'editRhythm', label: '剪辑节奏 Editing Rhythm' },
  { key: 'emotionRhythm', label: '情绪节奏 Emotional Rhythm' },
  { key: 'narrative', label: '叙事 Narrative Style' }
];

/* ------------------------------ 视频模型 ------------------------------ */

export interface VideoModelProfile {
  id: string;
  name: string;
  vendor: string;
  strength: string;
  maxDuration: string;
  ratios: string[];
  /** Prompt 结构顺序 */
  structure: string[];
  template: (p: ModelPromptInput) => string;
  tips: string;
  supportsFirstLast: boolean;
  supportsMultiRef: boolean;
}

export interface ModelPromptInput {
  subject: string;
  action: string;
  scene: string;
  camera: string;
  lighting: string;
  style: string;
  mood: string;
  extra: string;
  negative: string;
}

/* -------------------------------- 项目 -------------------------------- */

export interface Project {
  id: string;
  name: string;
  idea: string;
  params: DirectorParams;
  plan: string;
  sop: SopStep[];
  script: string;
  assets: AssetSpec[];
  shots: ShotRow[];
  prompts: PromptItem[];
  createdAt: number;
  updatedAt: number;
}
