import { create } from 'zustand';
import {
  Settings,
  Modality,
  EndpointConfig,
  Asset,
  Task,
  Subject,
  AppPrefs,
  DEFAULT_PREFS,
  AssetType,
  Project,
  DirectorParams,
  DEFAULT_DIRECTOR_PARAMS,
  StageId
} from './types';

/* --------------------------------- 设置 --------------------------------- */

const DEFAULT_SETTINGS: Settings = {
  text: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1', 'deepseek-chat', 'qwen-plus'],
    defaultModel: 'gpt-4o-mini',
    endpointPath: ''
  },
  image: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    models: ['dall-e-3', 'gpt-image-1', 'kolors', 'flux.1-dev', 'midjourney'],
    defaultModel: 'dall-e-3',
    endpointPath: ''
  },
  video: {
    baseUrl: '',
    apiKey: '',
    models: ['sora-2', 'kling-v1.6', 'hailuo-02', 'wan-2.2', 'seedance-1.0', 'vidu-q2', 'runway-gen4'],
    defaultModel: 'kling-v1.6',
    endpointPath: '/v1/videos/generations'
  },
  audio: {
    baseUrl: '',
    apiKey: '',
    models: ['tts-1', 'tts-1-hd', 'fish-speech', 'gpt-sovits', 'suno-v4', 'mureka-v6'],
    defaultModel: 'tts-1',
    endpointPath: '/v1/audio/generations'
  }
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 忽略：超出配额等情况 */
  }
}

/* --------------------------------- Store --------------------------------- */

export type PageId =
  | 'home'
  | 'image'
  | 'video'
  | 'audio'
  | 'script'
  | 'character'
  | 'imgtools'
  | 'vidtools'
  | 'canvas'
  | 'assets'
  | 'projects'
  | 'settings';

/** 路由：导演流程阶段 或 工具页 */
export type Route = { kind: 'stage'; id: StageId } | { kind: 'tool'; id: string };

interface State {
  /* 路由 */
  route: Route;
  setRoute: (r: Route) => void;
  setPage: (p: PageId) => void;
  /** 首页快捷入口跳转后要聚焦的模式 */
  focus: { groupId: string; modeId: string } | null;
  goMode: (groupId: string, modeId: string) => void;
  clearFocus: () => void;

  /* 导演项目 */
  projects: Project[];
  currentId: string;
  currentProject: () => Project;
  newProject: (name?: string, idea?: string) => void;
  selectProject: (id: string) => void;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  updateProject: (patch: Partial<Project>) => void;
  updateParams: (patch: Partial<DirectorParams>) => void;

  /* API 配置 */
  settings: Settings;
  setEndpoint: (m: Modality, patch: Partial<EndpointConfig>) => void;
  setSettings: (s: Settings) => void;

  /* 偏好 */
  prefs: AppPrefs;
  setPrefs: (p: Partial<AppPrefs>) => void;

  /* 资产库 */
  assets: Asset[];
  addAsset: (a: Omit<Asset, 'id' | 'createdAt'> & { id?: string }) => Asset;
  removeAsset: (id: string) => void;
  toggleFav: (id: string) => void;
  clearAssets: (type?: AssetType) => void;

  /* 任务队列 */
  tasks: Task[];
  pushTask: (t: Omit<Task, 'id' | 'createdAt' | 'progress' | 'status'> & Partial<Task>) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  clearTasks: () => void;

  /* 主体库 */
  subjects: Subject[];
  addSubject: (s: Omit<Subject, 'id' | 'createdAt'>) => void;
  removeSubject: (id: string) => void;
}

let seq = 0;
const uid = (p: string) => `${p}_${Date.now().toString(36)}_${(seq++).toString(36)}`;

/** 空项目占位（必须是稳定引用，避免 zustand 选择器每次返回新对象导致重渲染死循环） */
let _fallback: Project | null = null;
function fallbackProject(): Project {
  if (!_fallback) _fallback = blankProject();
  return _fallback;
}

/** 新项目模板 */
export function blankProject(): Project {
  return {
    id: uid('p'),
    name: '未命名项目',
    idea: '',
    params: { ...DEFAULT_DIRECTOR_PARAMS },
    plan: '',
    sop: [],
    script: '',
    assets: [],
    shots: [],
    prompts: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export const useApp = create<State>((set, get) => ({
  route: { kind: 'tool', id: 'home' },
  setRoute: (r) => set({ route: r }),
  setPage: (p) => set({ route: { kind: 'tool', id: p } }),
  focus: null,
  goMode: (groupId, modeId) => set({ route: { kind: 'tool', id: groupId }, focus: { groupId, modeId } }),
  clearFocus: () => set({ focus: null }),

  projects: readJSON<Project[]>('yushifu_projects', []),
  currentId: readJSON<string>('yushifu_current', ''),
  currentProject() {
    const s = get();
    return s.projects.find((p) => p.id === s.currentId) ?? s.projects[0] ?? fallbackProject();
  },
  newProject: (name, idea) => {
    const list = get().projects;
    const p: Project = {
      ...blankProject(),
      id: uid('p'),
      name: name?.trim() || `未命名项目 ${list.length + 1}`,
      idea: idea ?? ''
    };
    const next = [p, ...list];
    writeJSON('yushifu_projects', next);
    writeJSON('yushifu_current', p.id);
    set({ projects: next, currentId: p.id, route: { kind: 'stage', id: 'idea' } });
  },
  selectProject: (id) => {
    writeJSON('yushifu_current', id);
    set({ currentId: id });
  },
  deleteProject: (id) => {
    const next = get().projects.filter((p) => p.id !== id);
    writeJSON('yushifu_projects', next);
    const cur = next[0]?.id ?? '';
    writeJSON('yushifu_current', cur);
    set({ projects: next, currentId: cur });
  },
  renameProject: (id, name) => {
    const next = get().projects.map((p) => (p.id === id ? { ...p, name, updatedAt: Date.now() } : p));
    writeJSON('yushifu_projects', next);
    set({ projects: next });
  },
  updateProject: (patch) => {
    const s = get();
    const cur = s.currentProject();
    const id = cur.id;
    const exists = s.projects.some((p) => p.id === id);
    const updated: Project = { ...cur, ...patch, updatedAt: Date.now() };
    const next = exists ? s.projects.map((p) => (p.id === id ? updated : p)) : [updated, ...s.projects];
    writeJSON('yushifu_projects', next);
    if (!exists) writeJSON('yushifu_current', id);
    set({ projects: next, currentId: id });
  },
  updateParams: (patch) => {
    const s = get();
    const cur = s.currentProject();
    const params = { ...cur.params, ...patch };
    s.updateProject({ params });
  },

  settings: readJSON<Settings>('libtv_settings', DEFAULT_SETTINGS),
  setEndpoint: (m, patch) => {
    const next: Settings = { ...get().settings, [m]: { ...get().settings[m], ...patch } };
    writeJSON('libtv_settings', next);
    set({ settings: next });
  },
  setSettings: (s) => {
    writeJSON('libtv_settings', s);
    set({ settings: s });
  },

  prefs: { ...DEFAULT_PREFS, ...readJSON<Partial<AppPrefs>>('libtv_prefs', {}) },
  setPrefs: (p) => {
    const next = { ...get().prefs, ...p };
    writeJSON('libtv_prefs', next);
    set({ prefs: next });
  },

  assets: readJSON<Asset[]>('libtv_assets', []),
  addAsset: (a) => {
    const asset: Asset = { ...a, id: a.id ?? uid('a'), createdAt: Date.now() };
    const next = [asset, ...get().assets].slice(0, 500);
    writeJSON('libtv_assets', next);
    set({ assets: next });
    return asset;
  },
  removeAsset: (id) => {
    const next = get().assets.filter((a) => a.id !== id);
    writeJSON('libtv_assets', next);
    set({ assets: next });
  },
  toggleFav: (id) => {
    const next = get().assets.map((a) => (a.id === id ? { ...a, favorite: !a.favorite } : a));
    writeJSON('libtv_assets', next);
    set({ assets: next });
  },
  clearAssets: (type) => {
    const next = type ? get().assets.filter((a) => a.type !== type) : [];
    writeJSON('libtv_assets', next);
    set({ assets: next });
  },

  tasks: readJSON<Task[]>('libtv_tasks', []),
  pushTask: (t) => {
    const task: Task = {
      id: uid('t'),
      createdAt: Date.now(),
      progress: 0,
      status: 'queued',
      ...t
    };
    const next = [task, ...get().tasks].slice(0, 200);
    writeJSON('libtv_tasks', next);
    set({ tasks: next });
    return task;
  },
  updateTask: (id, patch) => {
    const next = get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
    writeJSON('libtv_tasks', next);
    set({ tasks: next });
  },
  clearTasks: () => {
    writeJSON('libtv_tasks', []);
    set({ tasks: [] });
  },

  subjects: readJSON<Subject[]>('libtv_subjects', []),
  addSubject: (s) => {
    const next = [{ ...s, id: uid('s'), createdAt: Date.now() }, ...get().subjects];
    writeJSON('libtv_subjects', next);
    set({ subjects: next });
  },
  removeSubject: (id) => {
    const next = get().subjects.filter((s) => s.id !== id);
    writeJSON('libtv_subjects', next);
    set({ subjects: next });
  }
}));

/* --------------------------------------------------------------------------
 * 兼容旧引用：节点画布 / 设置面板用的 useSettings(selector)
 * -------------------------------------------------------------------------- */

export interface SettingsSlice {
  settings: Settings;
  setSettings: (s: Settings) => void;
  setEndpoint: (m: Modality, patch: Partial<EndpointConfig>) => void;
}

export function useSettings<T>(selector: (s: SettingsSlice) => T): T {
  return useApp((st) =>
    selector({ settings: st.settings, setSettings: st.setSettings, setEndpoint: st.setEndpoint })
  );
}
