import {
  AssetSpec,
  DirectorParams,
  MasterProfile,
  ModelPromptInput,
  Project,
  ShotRow
} from '../types';
import { VIDEO_TYPE_MAP } from '../data/videoTypes';
import { MASTER_MAP } from '../data/masters';
import { findVideoModel } from '../data/videomodels';

/* ------------------------------ 强度转文字 ------------------------------ */

export function strength(v: number, low: string, mid: string, high: string): string {
  if (v < 0.34) return low;
  if (v < 0.67) return mid;
  return high;
}

export function paramsToText(p: DirectorParams): string {
  return [
    `冲突强度 ${Math.round(p.conflict * 100)}%：${strength(p.conflict, '平和推进，少对抗', '存在明确阻力与对峙', '强对抗，关系紧绷，矛盾外化')}`,
    `情绪强度 ${Math.round(p.emotion * 100)}%：${strength(p.emotion, '克制内敛，情绪不外露', '情绪清晰可感', '情绪饱和，外放而强烈')}`,
    `反转强度 ${Math.round(p.twist * 100)}%：${strength(p.twist, '线性叙事，不设反转', '在结尾有一次预期违背', '多点反转，信息反复重构')}`,
    `镜头密度 ${Math.round(p.shotDensity * 100)}%：${strength(p.shotDensity, '长镜头为主，镜头数少', '中景与近景交替', '高密度快切，镜头数多')}`,
    `剪辑节奏 ${Math.round(p.editRhythm * 100)}%：${strength(p.editRhythm, '缓慢，留白充足', '中等，按情绪切', '紧凑，卡点密集')}`
  ].join('；');
}

/* ------------------------------ 分镜 → 要素 ------------------------------ */

function pickAssetText(assets: AssetSpec[], kinds: string[]): string {
  return assets
    .filter((a) => kinds.includes(a.kind))
    .map((a) => cleanJoin(a.name, a.desc))
    .filter(Boolean)
    .join('；');
}

function cleanJoin(...parts: (string | undefined)[]): string {
  return parts
    .filter((p) => p && String(p).trim())
    .map((p) => String(p).trim())
    .join('，');
}

export function buildShotInput(project: Project, shot: ShotRow): ModelPromptInput {
  const p = project.params;
  const sop = VIDEO_TYPE_MAP[p.videoType];
  const subject = pickAssetText(project.assets, ['角色', '产品']) || shot.desc.slice(0, 30);
  const scene = pickAssetText(project.assets, ['场景']) || '';
  const style = cleanJoin(p.visualStyle, pickAssetText(project.assets, ['美术风格']), sop?.promptFocus);
  return {
    subject,
    action: cleanJoin(shot.desc, shot.line ? `（台词：${shot.line}）` : ''),
    scene,
    camera: cleanJoin(shot.size, shot.camera),
    lighting: cleanJoin(
      strength(p.emotion, '柔和均匀的散射光', '明确主光方向，明暗有层次', '强反差硬光，大面积阴影'),
      sop ? '' : ''
    ),
    style,
    mood: strength(p.emotion, '平静克制', '有温度的情绪流动', '浓烈而外放的情绪'),
    extra: cleanJoin(
      `${p.ratio}，时长 ${shot.duration} 秒`,
      project.assets.find((a) => a.kind === '关键参考图') ? '参考关键参考图的构图与色调' : ''
    ),
    negative: '低清晰度，畸形，手指异常，闪烁，水印，文字错误'
  };
}

/* ------------------------------- Prompt 组装 ------------------------------- */

export function composePrompt(input: ModelPromptInput, modelName: string): string {
  const model = findVideoModel(modelName);
  return model.template(input);
}

/** 普通版本（不含大师模式） */
export function buildOriginalPrompt(project: Project, shot: ShotRow): string {
  return composePrompt(buildShotInput(project, shot), project.params.videoModel);
}

/** 大师版本：在普通版本基础上注入导演语言与剧情参数 */
export function buildMasterPrompt(project: Project, shot: ShotRow, master: MasterProfile): string {
  const base = buildShotInput(project, shot);
  const p = project.params;

  const injected: ModelPromptInput = {
    ...base,
    camera: cleanJoin(
      base.camera,
      master.dims.cameraMove,
      master.dims.cameraHeight,
      master.dims.lens,
      master.dims.depth
    ),
    scene: cleanJoin(base.scene, master.dims.productionDesign),
    lighting: cleanJoin(base.lighting, master.dims.lighting),
    style: cleanJoin(base.style, master.dims.color, master.keywords.slice(0, 2).join('、')),
    mood: cleanJoin(base.mood, master.dims.emotionRhythm),
    extra: cleanJoin(
      base.extra,
      `【导演方法】构图：${master.dims.composition}`,
      `调度：${master.dims.blocking}`,
      `剪辑节奏：${master.dims.editRhythm}`,
      `叙事：${master.dims.narrative}`,
      master.directives.slice(0, 3).join('；'),
      `【剧情参数】${paramsToText(p)}`
    )
  };

  return composePrompt(injected, p.videoModel);
}

/** 大师模式具体改了什么 */
export function buildDiff(master: MasterProfile, p: DirectorParams): string[] {
  return [
    `构图：${master.dims.composition}`,
    `焦段与景深：${master.dims.lens}；${master.dims.depth}`,
    `机位与摄影机运动：${master.dims.cameraHeight}；${master.dims.cameraMove}`,
    `人物调度：${master.dims.blocking}`,
    `光线：${master.dims.lighting}`,
    `色彩：${master.dims.color}`,
    `美术：${master.dims.productionDesign}`,
    `剪辑节奏：${master.dims.editRhythm}`,
    `情绪节奏：${master.dims.emotionRhythm}`,
    `叙事方式：${master.dims.narrative}`,
    `剧情参数：${paramsToText(p)}`,
    `可执行指令：${master.directives.join(' / ')}`
  ];
}

/** 为一镜同时产出 Original 与 Master 两版 */
export function buildPair(project: Project, shot: ShotRow): { original: string; master: string; diff: string[] } {
  const original = buildOriginalPrompt(project, shot);
  if (!project.params.masterOn) return { original, master: '', diff: [] };
  const master = MASTER_MAP[project.params.master];
  if (!master) return { original, master: '', diff: [] };
  return { original, master: buildMasterPrompt(project, shot, master), diff: buildDiff(master, project.params) };
}

/* ------------------------------- 资产提示词 ------------------------------- */

const ASSET_PROMPT_TEMPLATES: Record<string, (a: AssetSpec, p: DirectorParams) => string> = {
  角色: (a, p) =>
    cleanJoin(
      `${a.name}角色设定图`,
      a.desc,
      '正面视角，全身，中性姿态',
      `${p.visualStyle}风格`,
      '纯色背景，均匀柔光，面部清晰，服装细节完整',
      a.consistency.join('；')
    ),
  场景: (a, _) => cleanJoin(`${a.name}场景设定图`, a.desc, '广角，空间关系清晰，自然光照，环境细节丰富，空镜'),
  道具: (a, _) => cleanJoin(`${a.name}`, a.desc, '产品级静物，柔光，干净背景，材质与结构清晰'),
  服装: (a, _) => cleanJoin(`${a.name}`, a.desc, '服装平铺展示，面料纹理清晰，均匀布光，无模特'),
  产品: (a, _) => cleanJoin(`${a.name}`, a.desc, '商业产品摄影棚，柔光箱，干净背景，结构准确，材质真实'),
  美术风格: (a, _) => cleanJoin(`${a.name}风格参考图`, a.desc, '色彩方案、笔触与质感明确，可作为风格锚点'),
  关键参考图: (a, _) => cleanJoin(`${a.name}`, a.desc, '作为构图与色调参考，保持画面关系一致')
};

export function buildAssetPrompt(a: AssetSpec, p: DirectorParams): string {
  const tpl = ASSET_PROMPT_TEMPLATES[a.kind];
  return tpl ? tpl(a, p) : cleanJoin(a.name, a.desc);
}

/* ---------------------------- 资产库自动生成 ---------------------------- */

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** 从剧本里抽取角色名（对话前的说话人） */
function extractCharacters(script: string): string[] {
  const names = new Set<string>();
  script.split(/\n+/).forEach((line) => {
    const m = line.trim().match(/^([一-龥A-Za-z0-9·]{2,6})\s*[：:]/);
    if (m) names.add(m[1]);
  });
  return Array.from(names).slice(0, 4);
}

/** 从剧本里抽取场景（以 场景/内景/外景 开头的行） */
function extractScenes(script: string): string[] {
  const out: string[] = [];
  script.split(/\n+/).forEach((line) => {
    const t = line.trim();
    if (/^(场景|内景|外景|场次)/.test(t) && t.length < 40) out.push(t);
  });
  return Array.from(new Set(out)).slice(0, 4);
}

/** 本地启发式生成项目资产库（配置 API 后由模型生成更精准的内容） */
export function autoAssetLibrary(
  project: Project,
  scriptOverride?: string
): AssetSpec[] {
  const script = scriptOverride ?? project.script;
  const p = project.params;
  const chars = extractCharacters(script);
  const scenes = extractScenes(script);
  const list: AssetSpec[] = [];

  const charNames = chars.length ? chars : ['主角'];
  charNames.forEach((n, i) => {
    list.push({
      id: uid('a'),
      kind: '角色',
      name: n,
      desc: project.idea.slice(0, 40) || '待补充人物小传',
      prompt: '',
      consistency: ['面部特征与发型固定', '服装配色固定', '体型与年龄固定', '每镜保持同一光线方向']
    });
    void i;
  });

  const sceneNames = scenes.length ? scenes : ['主场景'];
  sceneNames.forEach((s) => {
    list.push({
      id: uid('a'),
      kind: '场景',
      name: s,
      desc: '待补充空间关系、时间、光线方向',
      prompt: '',
      consistency: ['空间结构固定', '光线方向固定', '色彩方案固定', '陈设位置固定']
    });
  });

  list.push({
    id: uid('a'),
    kind: '道具',
    name: '关键道具',
    desc: '推动剧情的核心物件，需在多个镜头中保持完全一致',
    prompt: '',
    consistency: ['造型与材质固定', '尺寸比例固定', '磨损痕迹固定']
  });

  list.push({
    id: uid('a'),
    kind: '服装',
    name: '主造型',
    desc: '主要角色的核心穿搭',
    prompt: '',
    consistency: ['款式与配色固定', '面料质感固定']
  });

  if (['电商视频', '产品展示', 'TVC / 品牌广告'].includes(p.videoType)) {
    list.push({
      id: uid('a'),
      kind: '产品',
      name: '产品主体',
      desc: '需要准确呈现结构与材质，不得被改形',
      prompt: '',
      consistency: ['结构比例固定', '材质反射固定', '品牌色固定', '禁止添加不存在的细节']
    });
  }

  list.push({
    id: uid('a'),
    kind: '美术风格',
    name: `${p.visualStyle}风格锚图`,
    desc: `全片统一的视觉风格基准，${p.videoType}类型`,
    prompt: '',
    consistency: ['色调固定', '质感固定', '颗粒与锐度固定']
  });

  list.push({
    id: uid('a'),
    kind: '关键参考图',
    name: '构图与光影参考',
    desc: '用于统一全片构图习惯与光线逻辑',
    prompt: '',
    consistency: ['机位高度习惯一致', '光比一致']
  });

  return list.map((a) => ({ ...a, prompt: buildAssetPrompt(a, p) }));
}

/* ------------------------------ 剧本 / 策划 ------------------------------ */

export function buildScriptOutline(project: Project): string {
  const p = project.params;
  const sop = VIDEO_TYPE_MAP[p.videoType];
  return [
    `项目名称：${project.name}`,
    `视频类型：${p.videoType}`,
    `目标：${sop?.goal ?? ''}`,
    `时长：${p.duration}｜比例：${p.ratio}｜风格：${p.visualStyle}`,
    `创意：${project.idea}`,
    '',
    '【剧情参数】',
    paramsToText(p),
    '',
    '【结构要求】',
    '开场（0-20%）：建立人物与世界的常态，埋下一个具体的欲望或问题',
    '转折（20-50%）：出现阻力，人物做出第一个主动选择',
    '高潮（50-85%）：冲突最大化，人物付出代价',
    '收束（85-100%）：给出情绪落点，回到开场母题形成呼应',
    '',
    '【一致性约束】',
    (sop?.consistencyFocus ?? []).map((c) => `- ${c}`).join('\n')
  ].join('\n');
}

export function buildPlan(project: Project): string {
  const sop = VIDEO_TYPE_MAP[project.params.videoType];
  if (!sop) return '';
  return [
    `# ${project.name} · 制作方案（${sop.name}）`,
    '',
    `## 制作目标`,
    sop.goal,
    '',
    '## 制作流程 SOP',
    ...sop.steps.map((s, i) => `${i + 1}. **${s.title}**：${s.detail}`),
    '',
    '## 前期准备素材',
    sop.prep.map((s) => `- ${s}`).join('\n'),
    '',
    '## 一致性控制重点',
    sop.consistencyFocus.map((s) => `- ${s}`).join('\n'),
    '',
    '## 分镜设计重点',
    sop.shotFocus,
    '',
    '## Prompt 描述重点',
    sop.promptFocus,
    '',
    '## 常见坑',
    sop.pitfalls.map((s) => `- ${s}`).join('\n'),
    '',
    '## 推荐工具链',
    sop.tools.join(' → ')
  ].join('\n');
}

/** 把剧本文本切成镜头建议（本地启发式，配置 API 后由模型生成） */
export function splitScriptToShots(script: string, count: number): ShotRow[] {
  const lines = script
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const sizePool = ['远景', '全景', '中景', '近景', '特写'];
  const cameraPool = ['固定', '缓慢推进', '横摇', '手持跟随', '环绕', '下拉'];
  if (lines.length === 0) {
    return Array.from({ length: Math.max(1, count) }, (_, i) => ({
      id: `s_${Date.now()}_${i}`,
      no: i + 1,
      size: sizePool[i % sizePool.length],
      camera: '固定',
      desc: '',
      line: '',
      duration: 3
    }));
  }
  const each = Math.max(1, Math.ceil(lines.length / count));
  const rows: ShotRow[] = [];
  for (let i = 0; i < count; i++) {
    const seg = lines.slice(i * each, (i + 1) * each);
    if (seg.length === 0) break;
    const text = seg.join(' ');
    const isDialogue = /[：:]/.test(text) && text.length < 40;
    rows.push({
      id: `s_${Date.now()}_${i}`,
      no: rows.length + 1,
      size: sizePool[i % sizePool.length],
      camera: cameraPool[i % cameraPool.length],
      desc: isDialogue ? '' : text.slice(0, 120),
      line: isDialogue ? text : '',
      duration: 3
    });
  }
  return rows;
}

export function stageProgress(project: Project): Record<string, number> {
  return {
    idea: project.idea.trim() ? 100 : 0,
    plan: project.plan.trim() ? 100 : project.idea.trim() ? 40 : 0,
    script: project.script.trim() ? 100 : project.plan.trim() ? 30 : 0,
    asset: project.assets.length ? 100 : project.script.trim() ? 30 : 0,
    shot: project.shots.length ? 100 : project.assets.length ? 30 : 0,
    prompt: project.prompts.length ? 100 : project.shots.length ? 30 : 0,
    generate: project.shots.filter((s) => s.imageUrl || s.videoUrl).length
      ? Math.round((project.shots.filter((s) => s.imageUrl || s.videoUrl).length / Math.max(1, project.shots.length)) * 100)
      : 0,
    edit: project.shots.filter((s) => s.videoUrl).length
      ? Math.round((project.shots.filter((s) => s.videoUrl).length / Math.max(1, project.shots.length)) * 100)
      : 0,
    deliver: project.shots.length && project.shots.every((s) => s.videoUrl) ? 100 : 0
  };
}
