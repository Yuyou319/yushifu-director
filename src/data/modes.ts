import { ModeGroup } from '../types';

/* ============================== 公共选项 ============================== */

const IMG_SIZES = ['1024x1024', '1152x864', '864x1152', '1280x720', '720x1280', '1536x1024', '1024x1536', '1920x1080'];
const VIDEO_RATIOS = ['16:9', '9:16', '1:1', '4:3', '3:4', '2.39:1'];
const VIDEO_DURATIONS = ['5 秒', '10 秒', '15 秒', '30 秒'];
const FPS = ['24 fps', '25 fps', '30 fps', '60 fps'];

const STYLES = [
  '写实摄影',
  '电影感',
  '国风古韵',
  '日系清新',
  '赛博朋克',
  '水墨',
  '3D 渲染',
  '插画',
  '黑白胶片',
  '低多边形'
];

const ANGLE_POINTS = [
  { value: 'front', label: '正前' },
  { value: 'fr30r', label: '右前30' },
  { value: 'fr60r', label: '右前60' },
  { value: 'right', label: '正右' },
  { value: 'bk60r', label: '右后60' },
  { value: 'bk30r', label: '右后30' },
  { value: 'back', label: '正后' },
  { value: 'bk30l', label: '左后30' },
  { value: 'bk60l', label: '左后60' },
  { value: 'left', label: '正左' },
  { value: 'fr60l', label: '左前60' },
  { value: 'fr30l', label: '左前30' },
  { value: 'top45', label: '俯视45' },
  { value: 'low45', label: '仰视45' },
  { value: 'bird', label: '鸟瞰' }
];

const LIGHT_POINTS = [
  { value: 'key_front', label: '正面主光' },
  { value: 'front_l', label: '前侧光·左' },
  { value: 'front_r', label: '前侧光·右' },
  { value: 'side_l', label: '侧光·左' },
  { value: 'side_r', label: '侧光·右' },
  { value: 'backside_l', label: '侧逆光·左' },
  { value: 'backside_r', label: '侧逆光·右' },
  { value: 'back', label: '逆光' },
  { value: 'top', label: '顶光' },
  { value: 'top_front', label: '顶前光' },
  { value: 'bottom', label: '底光' },
  { value: 'rembrandt_l', label: '伦勃朗·左' },
  { value: 'rembrandt_r', label: '伦勃朗·右' },
  { value: 'butterfly', label: '蝴蝶光' },
  { value: 'split_l', label: '分割光·左' },
  { value: 'split_r', label: '分割光·右' },
  { value: 'ring', label: '环形光' },
  { value: 'rim', label: '边缘光' },
  { value: 'bg', label: '背景光' },
  { value: 'eye', label: '眼神光' },
  { value: 'cool', label: '冷调环境' },
  { value: 'warm', label: '暖调环境' },
  { value: 'neon_m', label: '霓虹·品红' },
  { value: 'neon_c', label: '霓虹·青' },
  { value: 'sunset', label: '日落侧光' },
  { value: 'overcast', label: '阴天柔光' }
];

const SUBJECT_SLOTS = [
  { id: 'character', label: '角色 / 人物', hint: '锁定长相与体型' },
  { id: 'outfit', label: '服装 / 造型', hint: '锁定穿搭与配色' },
  { id: 'scene', label: '场景 / 环境', hint: '锁定空间与光影' },
  { id: 'prop', label: '道具 / 物件', hint: '锁定关键道具' },
  { id: 'style', label: '风格 / 画风', hint: '锁定整体风格' },
  { id: 'motion', label: '动作 / 姿态', hint: '参考动作与运镜' }
];

/* ================================ 生图 ================================ */

const IMAGE_GROUP: ModeGroup = {
  id: 'image',
  name: '生图',
  icon: '🎨',
  desc: '文生图、图生图、局部重绘、扩图等 8 项',
  section: '创作',
  modes: [
    {
      id: 'image.text2img',
      name: '文生图',
      subtitle: '用一段描述直接出图',
      icon: '✍️',
      output: 'image',
      modality: 'image',
      promptLabel: '画面描述（提示词）',
      promptPlaceholder: '例：雨夜的东京街角，霓虹倒影在积水里，一位撑透明伞的少女侧身回望，电影感，浅景深',
      negativePrompt: true,
      batch: { min: 1, max: 8, default: 2 },
      fields: [
        { type: 'select', key: 'size', label: '画面尺寸', options: IMG_SIZES, default: '1024x1024' },
        { type: 'chips', key: 'style', label: '风格预设', options: STYLES, default: '电影感' },
        { type: 'slider', key: 'steps', label: '采样步数', min: 10, max: 60, step: 1, default: 28 },
        { type: 'slider', key: 'cfg', label: '提示词引导系数 (CFG)', min: 1, max: 20, step: 0.5, default: 7, tip: '越高越贴合提示词，过高易过曝' },
        { type: 'seed', key: 'seed', default: -1 },
        { type: 'switch', key: 'enhance', label: 'AI 提示词增强', default: true },
        { type: 'switch', key: 'hd', label: '高清细节修复', default: false }
      ],
      tips: ['提示词建议：主体 + 动作 + 环境 + 光影 + 镜头 + 风格', '负向提示词可填：低清晰度、畸形手指、过曝、水印']
    },
    {
      id: 'image.img2img',
      name: '图生图',
      subtitle: '以一张图为底再创作',
      icon: '🖼️',
      output: 'image',
      modality: 'image',
      promptLabel: '变化描述',
      promptPlaceholder: '例：改为黄昏光，天空加晚霞，人物换上风衣',
      negativePrompt: true,
      batch: { min: 1, max: 6, default: 2 },
      fields: [
        { type: 'upload', key: 'source', label: '参考图', accept: 'image', required: true },
        { type: 'slider', key: 'strength', label: '重绘幅度', min: 0.05, max: 1, step: 0.05, default: 0.65, tip: '越小越接近原图' },
        { type: 'select', key: 'size', label: '输出尺寸', options: IMG_SIZES, default: '1024x1024' },
        { type: 'chips', key: 'style', label: '风格预设', options: STYLES },
        { type: 'slider', key: 'steps', label: '采样步数', min: 10, max: 60, step: 1, default: 28 },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    },
    {
      id: 'image.inpaint',
      name: '局部重绘',
      subtitle: '只改画面中某一块',
      icon: '🩹',
      output: 'image',
      modality: 'image',
      promptLabel: '重绘内容描述',
      promptPlaceholder: '例：把手中的咖啡杯换成一本翻开的旧书',
      negativePrompt: true,
      batch: { min: 1, max: 4, default: 1 },
      fields: [
        { type: 'upload', key: 'source', label: '原图', accept: 'image', required: true },
        {
          type: 'note',
          text: '蒙版图：白色区域为需要重绘的部分，黑色保持不变。未上传蒙版时，将按「重绘区域」参数整图重绘。'
        },
        { type: 'upload', key: 'mask', label: '蒙版图（可选）', accept: 'image' },
        { type: 'slider', key: 'maskBlur', label: '蒙版边缘羽化', min: 0, max: 64, step: 1, default: 12, unit: 'px' },
        { type: 'slider', key: 'strength', label: '重绘强度', min: 0.1, max: 1, step: 0.05, default: 0.8 },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    },
    {
      id: 'image.outpaint',
      name: '画面扩展',
      subtitle: '把画布向四周延展',
      icon: '↔️',
      output: 'image',
      modality: 'image',
      promptLabel: '延展内容描述',
      promptPlaceholder: '例：延展为开阔的草原与远山，保持原有光线方向',
      negativePrompt: true,
      batch: { min: 1, max: 4, default: 1 },
      fields: [
        { type: 'upload', key: 'source', label: '原图', accept: 'image', required: true },
        { type: 'dirbox', key: 'expand', label: '扩展像素（上/右/下/左）' },
        { type: 'chips', key: 'mode', label: '扩展模式', options: ['智能补全', '纯色背景', '镜像延伸', '模糊延伸'], default: '智能补全' },
        { type: 'slider', key: 'creativity', label: '补全自由度', min: 0, max: 1, step: 0.05, default: 0.6 },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    },
    {
      id: 'image.multiangle',
      name: '多角度生成',
      subtitle: '同一主体 15 个环绕机位',
      icon: '🔄',
      output: 'image',
      modality: 'image',
      promptLabel: '补充描述（可选）',
      promptPlaceholder: '例：保持红裙与短发，光线统一为侧逆光',
      negativePrompt: true,
      batch: { min: 1, max: 6, default: 1 },
      fields: [
        { type: 'upload', key: 'source', label: '主体图', accept: 'image', required: true },
        { type: 'grid', key: 'angle', label: '环绕机位（15 点位）', options: ANGLE_POINTS, cols: 5, default: 'fr30r' },
        { type: 'slider', key: 'similarity', label: '主体保持度', min: 0, max: 1, step: 0.05, default: 0.85 },
        { type: 'select', key: 'size', label: '输出尺寸', options: IMG_SIZES, default: '1024x1024' },
        { type: 'seed', key: 'seed', default: -1 }
      ],
      tips: ['同一主体做多角度连续帧时，建议固定随机种子']
    },
    {
      id: 'image.relight',
      name: '智能打光',
      subtitle: '26 个专业光位重打光',
      icon: '💡',
      output: 'image',
      modality: 'image',
      promptLabel: '补充描述（可选）',
      promptPlaceholder: '例：突出面部轮廓，背景压暗',
      negativePrompt: true,
      batch: { min: 1, max: 4, default: 1 },
      fields: [
        { type: 'upload', key: 'source', label: '原图', accept: 'image', required: true },
        { type: 'grid', key: 'lightPos', label: '光位（26 点位）', options: LIGHT_POINTS, cols: 5, default: 'rembrandt_l' },
        { type: 'color', key: 'lightColor', label: '光色', default: '#ffffff' },
        { type: 'slider', key: 'intensity', label: '光照强度', min: 0, max: 1, step: 0.05, default: 0.6 },
        { type: 'slider', key: 'ambient', label: '环境光保留', min: 0, max: 1, step: 0.05, default: 0.4 },
        { type: 'switch', key: 'keepFace', label: '保护面部细节', default: true },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    },
    {
      id: 'image.turnaround',
      name: '角色三视图',
      subtitle: '正面 / 侧面 / 背面一致性设定图',
      icon: '🧍',
      output: 'image',
      modality: 'image',
      promptLabel: '角色描述',
      promptPlaceholder: '例：20 岁女性，短黑发，红色皮质夹克，身高 168，瘦削，眼神倔强',
      negativePrompt: true,
      batch: { min: 1, max: 4, default: 1 },
      fields: [
        { type: 'upload', key: 'ref', label: '角色参考图（可选）', accept: 'image' },
        { type: 'chips', key: 'views', label: '需要生成的视角', options: ['正面', '侧面', '背面'], multi: true, tip: '可多选' },
        { type: 'chips', key: 'bg', label: '背景', options: ['纯灰底', '纯白底', '透明底', '场景底'], default: '纯灰底' },
        { type: 'slider', key: 'similarity', label: '角色一致度', min: 0, max: 1, step: 0.05, default: 0.9 },
        { type: 'select', key: 'size', label: '输出尺寸', options: IMG_SIZES, default: '1536x1024' },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    },
    {
      id: 'image.storygrid',
      name: '宫格分镜',
      subtitle: '一次生成 9 / 25 宫格连贯分镜',
      icon: '🔢',
      output: 'image',
      modality: 'image',
      promptLabel: '场景 / 剧情描述',
      promptPlaceholder: '例：少女在旧仓库发现一封信，从推门到读信的情绪递进',
      negativePrompt: true,
      batch: { min: 1, max: 3, default: 1 },
      fields: [
        { type: 'chips', key: 'grid', label: '宫格数', options: ['9 宫格', '25 宫格'], default: '9 宫格' },
        { type: 'chips', key: 'style', label: '风格预设', options: STYLES, default: '电影感' },
        { type: 'slider', key: 'continuity', label: '镜头连贯性', min: 0, max: 1, step: 0.05, default: 0.75 },
        { type: 'chips', key: 'shot', label: '景别节奏', options: ['远景为主', '中景为主', '特写为主', '远近交替'], default: '远近交替' },
        { type: 'select', key: 'size', label: '输出尺寸', options: IMG_SIZES, default: '1024x1024' },
        { type: 'seed', key: 'seed', default: -1 }
      ],
      tips: ['生成后可用「图像工具 → 宫格切分」拆成单张镜头图']
    }
  ]
};

/* =============================== 生视频 =============================== */

const VIDEO_GROUP: ModeGroup = {
  id: 'video',
  name: '生视频',
  icon: '🎬',
  desc: '文生/图生/多参/首尾帧/续写/对口型等 7 项',
  section: '创作',
  modes: [
    {
      id: 'video.text2video',
      name: '文生视频',
      subtitle: '一段文字直接生成视频',
      icon: '🎞️',
      output: 'video',
      modality: 'video',
      promptLabel: '画面描述（提示词）',
      promptPlaceholder: '例：航拍雪山之巅，云海翻涌，镜头缓慢推进，阳光穿透云层的丁达尔效应',
      negativePrompt: true,
      batch: { min: 1, max: 4, default: 1 },
      fields: [
        { type: 'chips', key: 'ratio', label: '画面比例', options: VIDEO_RATIOS, default: '16:9' },
        { type: 'chips', key: 'duration', label: '时长', options: VIDEO_DURATIONS, default: '5 秒' },
        { type: 'chips', key: 'fps', label: '帧率', options: FPS, default: '30 fps' },
        { type: 'slider', key: 'motion', label: '运动强度', min: 0, max: 1, step: 0.05, default: 0.5 },
        { type: 'chips', key: 'camera', label: '镜头运动', options: ['静止', '推进', '拉远', '平移', '环绕', '手持', '航拍', '升降'], default: '推进' },
        { type: 'chips', key: 'style', label: '画面风格', options: STYLES.slice(0, 6) },
        { type: 'switch', key: 'enhance', label: 'AI 提示词增强', default: true },
        { type: 'seed', key: 'seed', default: -1 }
      ],
      tips: ['提示词里写清「主体 + 动作 + 镜头 + 光影」出片更稳']
    },
    {
      id: 'video.image2video',
      name: '图生视频',
      subtitle: '一张首帧图动起来',
      icon: '🖼️',
      output: 'video',
      modality: 'video',
      promptLabel: '运动描述',
      promptPlaceholder: '例：镜头缓慢推进，发丝与衣角随风轻微飘动，光线缓慢变化',
      negativePrompt: true,
      batch: { min: 1, max: 4, default: 1 },
      fields: [
        { type: 'upload', key: 'firstFrame', label: '首帧图', accept: 'image', required: true, tip: '决定视频第一帧画面' },
        { type: 'slider', key: 'motion', label: '运动幅度', min: 0, max: 1, step: 0.05, default: 0.45, tip: '越大运动越剧烈' },
        { type: 'switch', key: 'motionBrush', label: '启用运动笔刷（指定区域运动）', default: false },
        { type: 'slider', key: 'brushStrength', label: '笔刷区域运动权重', min: 0, max: 1, step: 0.05, default: 0.7 },
        { type: 'switch', key: 'keepFirst', label: '严格保持首帧构图', default: true },
        { type: 'chips', key: 'duration', label: '时长', options: VIDEO_DURATIONS, default: '5 秒' },
        { type: 'chips', key: 'camera', label: '镜头运动', options: ['静止', '推进', '拉远', '平移', '环绕', '手持'], default: '静止' },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    },
    {
      id: 'video.multiref',
      name: '多参生视频',
      subtitle: '角色 / 服装 / 场景 / 道具 / 风格 / 动作 多参考位同时约束',
      icon: '🧩',
      output: 'video',
      modality: 'video',
      promptLabel: '画面与动作描述',
      promptPlaceholder: '例：少女在旧仓库中转身走向窗边，光从窗外斜射进来，手握信封',
      negativePrompt: true,
      batch: { min: 1, max: 4, default: 1 },
      fields: [
        {
          type: 'slots',
          key: 'refs',
          label: '多参考位（可分别上传多张并设置权重）',
          slots: SUBJECT_SLOTS,
          accept: 'image',
          max: 4,
          tip: '每个参考位可放多张图，权重越高影响越大'
        },
        { type: 'slider', key: 'consistency', label: '整体一致性强度', min: 0, max: 1, step: 0.05, default: 0.8 },
        {
          type: 'chips',
          key: 'conflict',
          label: '参考冲突策略',
          options: ['以角色为准', '以场景为准', '以风格为准', '均衡融合'],
          default: '以角色为准'
        },
        { type: 'chips', key: 'ratio', label: '画面比例', options: VIDEO_RATIOS, default: '16:9' },
        { type: 'chips', key: 'duration', label: '时长', options: VIDEO_DURATIONS, default: '5 秒' },
        { type: 'slider', key: 'motion', label: '运动强度', min: 0, max: 1, step: 0.05, default: 0.5 },
        { type: 'seed', key: 'seed', default: -1 }
      ],
      tips: [
        '「角色」位建议放 2-4 张同一人物的不同角度照片，一致性最好',
        '权重：风格位一般 0.4-0.6，角色位 0.8-1.0',
        '参考位冲突时，先在「冲突策略」里指定优先级'
      ]
    },
    {
      id: 'video.firstlast',
      name: '首尾帧生视频',
      subtitle: '给定首帧与尾帧，自动插值中间过程',
      icon: '⏭️',
      output: 'video',
      modality: 'video',
      promptLabel: '中间过程描述',
      promptPlaceholder: '例：人物从站立到坐下，镜头保持不动，光线自然过渡',
      negativePrompt: true,
      batch: { min: 1, max: 4, default: 1 },
      fields: [
        {
          type: 'pair',
          key: 'frames',
          label: '首帧 / 尾帧',
          a: '首帧（起点）',
          b: '尾帧（终点）',
          accept: 'image',
          tip: '两张都上传后才会做插值；可点击 ⇄ 交换首尾'
        },
        {
          type: 'chips',
          key: 'curve',
          label: '过渡曲线',
          options: ['线性', '缓入', '缓出', '缓入缓出', '贝塞尔'],
          default: '缓入缓出'
        },
        { type: 'slider', key: 'interp', label: '插值平滑度', min: 0, max: 1, step: 0.05, default: 0.7 },
        { type: 'switch', key: 'keepPose', label: '锁定首尾构图与机位', default: true },
        { type: 'chips', key: 'duration', label: '过渡时长', options: VIDEO_DURATIONS, default: '5 秒' },
        { type: 'chips', key: 'fps', label: '帧率', options: FPS, default: '30 fps' },
        { type: 'switch', key: 'extendTail', label: '尾帧后追加 1 秒静止', default: false },
        { type: 'seed', key: 'seed', default: -1 }
      ],
      tips: ['首帧与尾帧主体位置差异越大，中间运动越明显；差异过大会产生形变']
    },
    {
      id: 'video.extend',
      name: '视频续写延长',
      subtitle: '在已有视频前后继续生成',
      icon: '➡️',
      output: 'video',
      modality: 'video',
      promptLabel: '续写内容描述',
      promptPlaceholder: '例：镜头继续向前推进，穿过走廊尽头的门',
      negativePrompt: true,
      batch: { min: 1, max: 3, default: 1 },
      fields: [
        { type: 'upload', key: 'source', label: '源视频', accept: 'video', required: true },
        { type: 'chips', key: 'direction', label: '续写方向', options: ['向后续写', '向前补写', '双向'], default: '向后续写' },
        { type: 'slider', key: 'extendSec', label: '延长时长', min: 1, max: 30, step: 1, default: 5, unit: ' 秒' },
        { type: 'slider', key: 'keepMotion', label: '运动连贯度', min: 0, max: 1, step: 0.05, default: 0.8 },
        { type: 'switch', key: 'keepAudio', label: '保留原音轨', default: true },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    },
    {
      id: 'video.lipsync',
      name: '对口型',
      subtitle: '让人物口型匹配音频或文本',
      icon: '👄',
      output: 'video',
      modality: 'video',
      promptLabel: '口型文本（当不使用音频文件时）',
      promptPlaceholder: '例：你好，欢迎来到我们的故事。',
      batch: { min: 1, max: 3, default: 1 },
      fields: [
        { type: 'upload', key: 'source', label: '人物视频', accept: 'video', required: true },
        { type: 'upload', key: 'audio', label: '配音音频（可选，留空则用上方文本合成）', accept: 'audio' },
        { type: 'slider', key: 'sync', label: '口型同步强度', min: 0, max: 1, step: 0.05, default: 0.9 },
        { type: 'slider', key: 'quality', label: '画质保护', min: 0, max: 1, step: 0.05, default: 0.8 },
        { type: 'switch', key: 'keepAudio', label: '输出保留音频', default: true },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    },
    {
      id: 'video.video2video',
      name: '视频转视频',
      subtitle: '保留运动结构，重塑画面风格',
      icon: '🔁',
      output: 'video',
      modality: 'video',
      promptLabel: '目标风格描述',
      promptPlaceholder: '例：改为赛博朋克霓虹夜景，金属质感，青品色调',
      negativePrompt: true,
      batch: { min: 1, max: 3, default: 1 },
      fields: [
        { type: 'upload', key: 'source', label: '源视频', accept: 'video', required: true },
        { type: 'slider', key: 'strength', label: '风格重绘强度', min: 0.05, max: 1, step: 0.05, default: 0.6 },
        { type: 'slider', key: 'keepStructure', label: '运动结构保留', min: 0, max: 1, step: 0.05, default: 0.85 },
        { type: 'chips', key: 'style', label: '风格预设', options: STYLES.slice(0, 6) },
        { type: 'chips', key: 'fps', label: '输出帧率', options: FPS, default: '30 fps' },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    }
  ]
};

/* =============================== 生音频 =============================== */

const AUDIO_GROUP: ModeGroup = {
  id: 'audio',
  name: '生音频',
  icon: '🔊',
  desc: '配音、克隆、音乐、音效 4 项',
  section: '创作',
  modes: [
    {
      id: 'audio.tts',
      name: '文本配音',
      subtitle: 'TTS 文字转语音',
      icon: '🗣️',
      output: 'audio',
      modality: 'audio',
      promptLabel: '配音文本',
      promptPlaceholder: '输入需要朗读的文本，长文本建议分段落生成',
      batch: { min: 1, max: 4, default: 1 },
      fields: [
        { type: 'chips', key: 'voice', label: '音色', options: ['温柔女声', '沉稳男声', '少年音', '少女音', '磁性旁白', '新闻播报', '方言·川普', '方言·粤语'], default: '温柔女声' },
        { type: 'slider', key: 'speed', label: '语速', min: 0.5, max: 2, step: 0.05, default: 1 },
        { type: 'slider', key: 'pitch', label: '语调', min: -12, max: 12, step: 1, default: 0 },
        { type: 'chips', key: 'emotion', label: '情绪', options: ['平静', '开心', '悲伤', '愤怒', '紧张', '温柔', '激昂'], default: '平静' },
        { type: 'chips', key: 'format', label: '输出格式', options: ['mp3', 'wav', 'flac'], default: 'mp3' },
        { type: 'chips', key: 'sr', label: '采样率', options: ['16 kHz', '24 kHz', '44.1 kHz', '48 kHz'], default: '24 kHz' }
      ]
    },
    {
      id: 'audio.clone',
      name: '声音克隆',
      subtitle: '上传一段参考音频复刻音色',
      icon: '🎙️',
      output: 'audio',
      modality: 'audio',
      promptLabel: '要合成的文本',
      promptPlaceholder: '输入希望该音色朗读的内容',
      batch: { min: 1, max: 3, default: 1 },
      fields: [
        { type: 'upload', key: 'ref', label: '参考音频（建议 10-30 秒干净人声）', accept: 'audio', required: true },
        { type: 'slider', key: 'similarity', label: '音色相似度', min: 0, max: 1, step: 0.05, default: 0.85 },
        { type: 'slider', key: 'speed', label: '语速', min: 0.5, max: 2, step: 0.05, default: 1 },
        { type: 'switch', key: 'denoise', label: '参考音频降噪', default: true },
        { type: 'chips', key: 'format', label: '输出格式', options: ['mp3', 'wav'], default: 'wav' }
      ],
      tips: ['参考音频越干净、越长，克隆效果越好']
    },
    {
      id: 'audio.music',
      name: '音乐生成',
      subtitle: '按风格 / 情绪 / 乐器生成 BGM',
      icon: '🎵',
      output: 'audio',
      modality: 'audio',
      promptLabel: '音乐描述',
      promptPlaceholder: '例：温暖的钢琴独奏，逐渐加入弦乐，情绪从平静走向希望',
      batch: { min: 1, max: 4, default: 1 },
      fields: [
        { type: 'chips', key: 'genre', label: '风格', options: ['流行', '古典', '电子', '国风', '爵士', '摇滚', '民谣', '氛围'], default: '氛围' },
        { type: 'chips', key: 'mood', label: '情绪', options: ['平静', '欢快', '悲伤', '紧张', '史诗', '治愈', '悬疑'], default: '治愈' },
        { type: 'chips', key: 'instrument', label: '主奏乐器', options: ['钢琴', '吉他', '弦乐', '合成器', '古筝', '鼓组', '笛子'], multi: true },
        { type: 'slider', key: 'duration', label: '时长', min: 10, max: 180, step: 5, default: 30, unit: ' 秒' },
        { type: 'slider', key: 'bpm', label: '速度 BPM', min: 60, max: 180, step: 1, default: 96 },
        { type: 'switch', key: 'vocal', label: '含人声演唱', default: false },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    },
    {
      id: 'audio.sfx',
      name: '音效生成',
      subtitle: '环境音 / 动作音 / 转场音',
      icon: '🔔',
      output: 'audio',
      modality: 'audio',
      promptLabel: '音效描述',
      promptPlaceholder: '例：老木门缓缓推开并发出吱呀声，伴随远处雷声',
      batch: { min: 1, max: 4, default: 1 },
      fields: [
        { type: 'chips', key: 'cat', label: '类别', options: ['环境音', '动作音', '交通', '自然', '机械', '魔法', 'UI 提示', '转场'], default: '环境音' },
        { type: 'slider', key: 'duration', label: '时长', min: 1, max: 30, step: 1, default: 3, unit: ' 秒' },
        { type: 'slider', key: 'intensity', label: '强度', min: 0, max: 1, step: 0.05, default: 0.6 },
        { type: 'switch', key: 'loop', label: '可无缝循环', default: false },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    }
  ]
};

/* ============================== 剧本 / 分镜 ============================== */

const SCRIPT_GROUP: ModeGroup = {
  id: 'script',
  name: '剧本 / 分镜',
  icon: '📜',
  desc: 'AI 剧本、分镜表、故事板、导演台',
  section: '策划',
  modes: [
    {
      id: 'script.script',
      name: 'AI 剧本',
      subtitle: '从一句话梗概扩展成完整剧本',
      icon: '✒️',
      output: 'text',
      modality: 'text',
      promptLabel: '故事梗概 / 灵感',
      promptPlaceholder: '例：一位退休邮差在旧仓库里发现二十年前未寄出的信，决定亲自送达',
      fields: [
        { type: 'select', key: 'genre', label: '题材', options: ['都市情感', '悬疑', '科幻', '古装', '喜剧', '纪录片', '广告短片', '动画'], default: '都市情感' },
        { type: 'select', key: 'tone', label: '基调', options: ['温暖治愈', '紧张刺激', '沉重压抑', '轻松幽默', '史诗宏大'], default: '温暖治愈' },
        { type: 'number', key: 'shots', label: '预计镜头数', min: 5, max: 120, step: 1, default: 24 },
        { type: 'number', key: 'totalSec', label: '成片时长', min: 15, max: 900, step: 5, default: 90, unit: ' 秒' },
        { type: 'switch', key: 'dialogue', label: '包含台词', default: true },
        { type: 'switch', key: 'twist', label: '加入反转', default: false },
        { type: 'slider', key: 'temperature', label: '创意度', min: 0, max: 1.5, step: 0.05, default: 0.8 }
      ]
    },
    {
      id: 'script.shots',
      name: '分镜生成',
      subtitle: '剧本 → 结构化分镜表（可手工微调）',
      icon: '🎬',
      output: 'text',
      modality: 'text',
      promptLabel: '剧本文本',
      promptPlaceholder: '粘贴 AI 剧本或自己的剧本内容',
      fields: [
        { type: 'number', key: 'shotCount', label: '分镜数量', min: 3, max: 60, step: 1, default: 12 },
        { type: 'chips', key: 'shotPref', label: '景别偏好', options: ['远景为主', '中景为主', '特写为主', '远近交替'], default: '远近交替' },
        { type: 'chips', key: 'pace', label: '节奏', options: ['慢', '中等', '快'], default: '中等' },
        { type: 'switch', key: 'withCamera', label: '输出运镜建议', default: true },
        { type: 'switch', key: 'withAudio', label: '输出声音/音乐提示', default: true },
        {
          type: 'table',
          key: 'rows',
          label: '分镜表（可直接编辑，或由 AI 生成后回填）',
          columns: [
            { key: '景别', label: '景别', width: 0.6 },
            { key: '运镜', label: '运镜', width: 0.6 },
            { key: '画面描述', label: '画面描述', width: 2 },
            { key: '台词', label: '台词/声音', width: 1.2 },
            { key: '时长', label: '时长(s)', width: 0.5 }
          ]
        }
      ],
      tips: ['生成后可在「故事板」里一键批量转成镜头图']
    },
    {
      id: 'script.storyboard',
      name: '故事板',
      subtitle: '分镜表 → 批量生成镜头画面',
      icon: '🖼️',
      output: 'image',
      modality: 'image',
      promptLabel: '统一风格描述',
      promptPlaceholder: '例：电影感，青橙色调，35mm 胶片颗粒，浅景深',
      negativePrompt: true,
      batch: { min: 1, max: 25, default: 9 },
      fields: [
        {
          type: 'table',
          key: 'rows',
          label: '待渲染分镜（每行生成一张图）',
          columns: [
            { key: '景别', label: '景别', width: 0.6 },
            { key: '运镜', label: '运镜', width: 0.6 },
            { key: '画面描述', label: '画面描述', width: 2 },
            { key: '时长', label: '时长(s)', width: 0.5 }
          ]
        },
        { type: 'chips', key: 'style', label: '风格预设', options: STYLES, default: '电影感' },
        { type: 'select', key: 'size', label: '画面尺寸', options: IMG_SIZES, default: '1280x720' },
        { type: 'upload', key: 'characterRef', label: '角色参考图（保持一致性）', accept: 'image' },
        { type: 'slider', key: 'consistency', label: '角色一致度', min: 0, max: 1, step: 0.05, default: 0.8 },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    },
    {
      id: 'script.director',
      name: '导演台 · 机位参数',
      subtitle: '机位 / 视角 / 运镜 / 打光 / 色调 参数包',
      icon: '🎥',
      output: 'text',
      modality: 'text',
      promptLabel: '场景描述',
      promptPlaceholder: '例：狭窄的走廊追逐戏，需要压迫感',
      fields: [
        { type: 'chips', key: 'camera', label: '机位', options: ['低机位', '平视', '高机位', '过肩', '主观视角', '俯拍', '仰拍'], default: '平视' },
        { type: 'chips', key: 'lens', label: '镜头焦段', options: ['16mm 广角', '24mm', '35mm', '50mm 标准', '85mm 人像', '135mm 长焦'], default: '35mm' },
        { type: 'chips', key: 'move', label: '运镜', options: ['固定', '推轨', '摇镜', '手持', '斯坦尼康', '航拍', '甩镜'], default: '推轨' },
        { type: 'grid', key: 'light', label: '打光位', options: LIGHT_POINTS, cols: 5, default: 'side_l' },
        { type: 'chips', key: 'grade', label: '色调', options: ['青橙', '冷暖对比', '低饱和', '高对比黑白', '胶片颗粒', '赛博紫'], default: '青橙' },
        { type: 'slider', key: 'depth', label: '景深强度', min: 0, max: 1, step: 0.05, default: 0.6 }
      ]
    }
  ]
};

/* ============================== 角色一致性 ============================== */

const CHARACTER_GROUP: ModeGroup = {
  id: 'character',
  name: '角色一致性',
  icon: '👤',
  desc: '三视图、风格锁定、一致性应用',
  section: '策划',
  modes: [
    {
      id: 'character.turnaround',
      name: '角色三视图',
      subtitle: '为主体生成正面 / 侧面 / 背面设定图',
      icon: '🧍',
      output: 'image',
      modality: 'image',
      promptLabel: '角色补充描述',
      promptPlaceholder: '例：保持短发与红夹克，姿态自然放松',
      negativePrompt: true,
      batch: { min: 1, max: 4, default: 1 },
      fields: [
        { type: 'upload', key: 'ref', label: '角色参考图', accept: 'image', required: true },
        { type: 'chips', key: 'views', label: '视角', options: ['正面', '侧面', '背面'], multi: true },
        { type: 'chips', key: 'bg', label: '背景', options: ['纯灰底', '纯白底', '透明底'], default: '纯灰底' },
        { type: 'slider', key: 'similarity', label: '一致度', min: 0, max: 1, step: 0.05, default: 0.9 },
        { type: 'select', key: 'size', label: '输出尺寸', options: IMG_SIZES, default: '1536x1024' },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    },
    {
      id: 'character.stylelock',
      name: '风格锁定',
      subtitle: '用一张风格图统一后续所有画面',
      icon: '🎭',
      output: 'image',
      modality: 'image',
      promptLabel: '内容描述',
      promptPlaceholder: '例：少女站在旧仓库中央，手持信封',
      negativePrompt: true,
      batch: { min: 1, max: 6, default: 2 },
      fields: [
        { type: 'upload', key: 'styleRef', label: '风格参考图', accept: 'image', required: true },
        { type: 'slider', key: 'styleWeight', label: '风格权重', min: 0, max: 1, step: 0.05, default: 0.7, tip: '过高会削弱内容还原' },
        { type: 'select', key: 'size', label: '输出尺寸', options: IMG_SIZES, default: '1024x1024' },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    },
    {
      id: 'character.consistency',
      name: '一致性多图',
      subtitle: '同一角色一次产出多张不同情境图',
      icon: '🧬',
      output: 'image',
      modality: 'image',
      promptLabel: '情境描述（多个用换行分隔）',
      promptPlaceholder: '第一行：在窗边读信\n第二行：雨中奔跑\n第三行：坐在台阶上发呆',
      negativePrompt: true,
      batch: { min: 1, max: 8, default: 3 },
      fields: [
        { type: 'uploads', key: 'refs', label: '角色参考图（建议 2-4 张不同角度）', accept: 'image', max: 4 },
        { type: 'slider', key: 'similarity', label: '角色一致度', min: 0, max: 1, step: 0.05, default: 0.85 },
        { type: 'select', key: 'size', label: '输出尺寸', options: IMG_SIZES, default: '1024x1024' },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    }
  ]
};

/* =============================== 图像工具 =============================== */

const IMG_TOOLS_GROUP: ModeGroup = {
  id: 'imgtools',
  name: '图像工具',
  icon: '🛠️',
  desc: '超分、扩图、打光、重绘、抠图、切分等 10 项',
  section: '工具',
  modes: [
    {
      id: 'it.upscale',
      name: '超分放大',
      subtitle: '2 / 4 / 6 倍高清放大',
      icon: '🔍',
      output: 'image',
      modality: 'image',
      fields: [
        { type: 'upload', key: 'source', label: '原图', accept: 'image', required: true },
        { type: 'chips', key: 'scale', label: '放大倍数', options: ['2x', '4x', '6x', '8x'], default: '4x' },
        { type: 'chips', key: 'model', label: '放大算法', options: ['通用', '人像优化', '动漫插画', '建筑线条', '文字清晰'], default: '通用' },
        { type: 'slider', key: 'denoise', label: '降噪强度', min: 0, max: 1, step: 0.05, default: 0.3 },
        { type: 'slider', key: 'sharpen', label: '锐化', min: 0, max: 1, step: 0.05, default: 0.4 },
        { type: 'switch', key: 'faceFix', label: '人脸修复', default: true }
      ]
    },
    {
      id: 'it.outpaint',
      name: '画面扩展',
      subtitle: '向外扩展画布并智能补全',
      icon: '↔️',
      output: 'image',
      modality: 'image',
      promptLabel: '延展描述（可选）',
      promptPlaceholder: '例：延展为延伸的道路与远山',
      fields: [
        { type: 'upload', key: 'source', label: '原图', accept: 'image', required: true },
        { type: 'dirbox', key: 'expand', label: '扩展像素' },
        { type: 'chips', key: 'mode', label: '扩展模式', options: ['智能补全', '纯色背景', '镜像延伸', '模糊延伸'], default: '智能补全' },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    },
    {
      id: 'it.multiangle',
      name: '多角度生成',
      subtitle: '15 个环绕点位生成同一主体',
      icon: '🔄',
      output: 'image',
      modality: 'image',
      fields: [
        { type: 'upload', key: 'source', label: '主体图', accept: 'image', required: true },
        { type: 'grid', key: 'angle', label: '环绕点位', options: ANGLE_POINTS, cols: 5, default: 'right' },
        { type: 'slider', key: 'similarity', label: '主体保持度', min: 0, max: 1, step: 0.05, default: 0.85 },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    },
    {
      id: 'it.relight',
      name: '智能打光',
      subtitle: '26 个专业光位重打光',
      icon: '💡',
      output: 'image',
      modality: 'image',
      fields: [
        { type: 'upload', key: 'source', label: '原图', accept: 'image', required: true },
        { type: 'grid', key: 'lightPos', label: '光位', options: LIGHT_POINTS, cols: 5, default: 'key_front' },
        { type: 'color', key: 'lightColor', label: '光色', default: '#ffffff' },
        { type: 'slider', key: 'intensity', label: '强度', min: 0, max: 1, step: 0.05, default: 0.6 },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    },
    {
      id: 'it.inpaint',
      name: '局部重绘',
      subtitle: '蒙版区域重新生成',
      icon: '🩹',
      output: 'image',
      modality: 'image',
      promptLabel: '重绘内容',
      promptPlaceholder: '例：换成一顶黑色礼帽',
      negativePrompt: true,
      fields: [
        { type: 'upload', key: 'source', label: '原图', accept: 'image', required: true },
        { type: 'upload', key: 'mask', label: '蒙版图（白色为重绘区）', accept: 'image' },
        { type: 'slider', key: 'maskBlur', label: '羽化', min: 0, max: 64, step: 1, default: 12, unit: 'px' },
        { type: 'slider', key: 'strength', label: '重绘强度', min: 0.1, max: 1, step: 0.05, default: 0.8 },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    },
    {
      id: 'it.erase',
      name: '智能擦除',
      subtitle: '去掉水印、杂物、路人',
      icon: '🧽',
      output: 'image',
      modality: 'image',
      fields: [
        { type: 'upload', key: 'source', label: '原图', accept: 'image', required: true },
        { type: 'upload', key: 'mask', label: '擦除区域蒙版（不传则整图智能去水印）', accept: 'image' },
        { type: 'chips', key: 'target', label: '擦除对象', options: ['水印', '文字', '人物', '电线/杂物', '自定义'], default: '水印' },
        { type: 'slider', key: 'fill', label: '背景补全强度', min: 0, max: 1, step: 0.05, default: 0.7 },
        { type: 'seed', key: 'seed', default: -1 }
      ]
    },
    {
      id: 'it.matting',
      name: '智能抠图',
      subtitle: '主体抠出为透明底 / 纯色底',
      icon: '✂️',
      output: 'image',
      modality: 'image',
      fields: [
        { type: 'upload', key: 'source', label: '原图', accept: 'image', required: true },
        { type: 'chips', key: 'subject', label: '主体类型', options: ['人物', '商品', '动物', '车辆', '建筑', '通用'], default: '人物' },
        { type: 'chips', key: 'bg', label: '输出背景', options: ['透明', '纯白', '纯黑', '自定义纯色'], default: '透明' },
        { type: 'slider', key: 'edge', label: '边缘精细度', min: 0, max: 1, step: 0.05, default: 0.7 },
        { type: 'switch', key: 'hair', label: '发丝级抠图', default: true }
      ]
    },
    {
      id: 'it.gridsplit',
      name: '宫格切分',
      subtitle: '把 9 / 25 宫格图拆成单张镜头',
      icon: '🧮',
      output: 'image',
      modality: 'image',
      batch: { min: 1, max: 25, default: 9 },
      fields: [
        { type: 'upload', key: 'source', label: '宫格图', accept: 'image', required: true },
        { type: 'chips', key: 'grid', label: '宫格规格', options: ['3x3', '5x5', '2x2', '4x4'], default: '3x3' },
        { type: 'switch', key: 'trim', label: '自动裁掉白边', default: true },
        { type: 'switch', key: 'upscale', label: '切分后自动 2x 放大', default: false }
      ]
    },
    {
      id: 'it.caption',
      name: '标注打标',
      subtitle: '图生文：生成描述与标签',
      icon: '🏷️',
      output: 'text',
      modality: 'text',
      fields: [
        { type: 'upload', key: 'source', label: '图片', accept: 'image', required: true },
        { type: 'chips', key: 'lang', label: '输出语言', options: ['中文', '英文', '中英双语'], default: '中文' },
        { type: 'chips', key: 'detail', label: '详细程度', options: ['简短标签', '一句话描述', '详细描述', '提示词反推'], default: '提示词反推' },
        { type: 'number', key: 'tags', label: '标签数量', min: 5, max: 60, step: 1, default: 20 }
      ]
    },
    {
      id: 'it.crop',
      name: '裁剪',
      subtitle: '按比例或像素裁取区域',
      icon: '🗜️',
      output: 'image',
      modality: 'image',
      fields: [
        { type: 'upload', key: 'source', label: '原图', accept: 'image', required: true },
        { type: 'chips', key: 'ratio', label: '裁剪比例', options: ['自由', '1:1', '16:9', '9:16', '4:3', '3:4', '2.39:1'], default: '16:9' },
        { type: 'number', key: 'x', label: '起点 X', min: 0, max: 8192, step: 1, default: 0 },
        { type: 'number', key: 'y', label: '起点 Y', min: 0, max: 8192, step: 1, default: 0 },
        { type: 'number', key: 'w', label: '宽度', min: 1, max: 8192, step: 1, default: 1920 },
        { type: 'number', key: 'h', label: '高度', min: 1, max: 8192, step: 1, default: 1080 }
      ]
    }
  ]
};

/* =============================== 视频工具 =============================== */

const VID_TOOLS_GROUP: ModeGroup = {
  id: 'vidtools',
  name: '视频工具',
  icon: '🎛️',
  desc: '高清放大、补帧、分镜解析、剪辑、配音、字幕等 8 项',
  section: '工具',
  modes: [
    {
      id: 'vt.upscale',
      name: '视频高清放大',
      subtitle: '2 / 4 倍画质增强',
      icon: '🔎',
      output: 'video',
      modality: 'video',
      fields: [
        { type: 'upload', key: 'source', label: '源视频', accept: 'video', required: true },
        { type: 'chips', key: 'scale', label: '放大倍数', options: ['2x', '4x'], default: '2x' },
        { type: 'chips', key: 'target', label: '目标清晰度', options: ['1080P', '2K', '4K'], default: '1080P' },
        { type: 'slider', key: 'denoise', label: '降噪', min: 0, max: 1, step: 0.05, default: 0.35 },
        { type: 'switch', key: 'faceFix', label: '人脸增强', default: true }
      ]
    },
    {
      id: 'vt.fps',
      name: '帧率提升',
      subtitle: '补帧到 60 / 90 / 120 fps',
      icon: '⏩',
      output: 'video',
      modality: 'video',
      fields: [
        { type: 'upload', key: 'source', label: '源视频', accept: 'video', required: true },
        { type: 'chips', key: 'fps', label: '目标帧率', options: ['30 fps', '60 fps', '90 fps', '120 fps'], default: '60 fps' },
        { type: 'chips', key: 'algo', label: '补帧算法', options: ['光流', 'AI 插帧', '混合'], default: 'AI 插帧' },
        { type: 'switch', key: 'smoothMotion', label: '运动平滑优化', default: true }
      ]
    },
    {
      id: 'vt.shotsplit',
      name: '视频分镜解析',
      subtitle: '把长视频切成多个镜头片段',
      icon: '🧩',
      output: 'video',
      modality: 'video',
      batch: { min: 1, max: 30, default: 6 },
      fields: [
        { type: 'upload', key: 'source', label: '源视频', accept: 'video', required: true },
        { type: 'chips', key: 'method', label: '切分依据', options: ['镜头切换', '固定时长', '场景变化', '手动时间点'], default: '镜头切换' },
        { type: 'number', key: 'minSec', label: '最短镜头时长', min: 1, max: 30, step: 1, default: 2, unit: ' 秒' },
        { type: 'slider', key: 'sensitivity', label: '切换检测灵敏度', min: 0, max: 1, step: 0.05, default: 0.5 },
        { type: 'switch', key: 'exportThumb', label: '同时导出镜头缩略图', default: true }
      ]
    },
    {
      id: 'vt.trim',
      name: '基础剪辑',
      subtitle: '片段裁取 / 拼接 / 调速',
      icon: '✂️',
      output: 'video',
      modality: 'video',
      fields: [
        { type: 'upload', key: 'source', label: '源视频', accept: 'video', required: true },
        { type: 'range', key: 'range', label: '裁取区间', min: 0, max: 120, default: [0, 10], unit: 's' },
        { type: 'slider', key: 'speed', label: '播放速度', min: 0.25, max: 4, step: 0.05, default: 1 },
        { type: 'switch', key: 'mute', label: '静音', default: false },
        { type: 'chips', key: 'out', label: '输出规格', options: ['原样', '1080P', '720P', '竖屏 9:16'], default: '原样' }
      ]
    },
    {
      id: 'vt.toaudio',
      name: '视频转音频',
      subtitle: '提取 / 分离人声与背景音',
      icon: '🎧',
      output: 'audio',
      modality: 'audio',
      fields: [
        { type: 'upload', key: 'source', label: '源视频', accept: 'video', required: true },
        { type: 'chips', key: 'track', label: '提取内容', options: ['完整音轨', '仅人声', '仅背景音乐', '人声+伴奏分离'], default: '完整音轨' },
        { type: 'chips', key: 'format', label: '输出格式', options: ['mp3', 'wav', 'flac'], default: 'mp3' },
        { type: 'switch', key: 'denoise', label: '降噪', default: false }
      ]
    },
    {
      id: 'vt.dub',
      name: '视频配音',
      subtitle: '画面 + 配音合成为成片',
      icon: '🗣️',
      output: 'video',
      modality: 'audio',
      promptLabel: '配音文本（不上传音频时使用）',
      promptPlaceholder: '输入旁白文本',
      fields: [
        { type: 'upload', key: 'source', label: '视频画面', accept: 'video', required: true },
        { type: 'upload', key: 'audio', label: '配音音频（可选）', accept: 'audio' },
        { type: 'chips', key: 'voice', label: '音色（无音频文件时）', options: ['温柔女声', '沉稳男声', '少年音', '磁性旁白'], default: '温柔女声' },
        { type: 'slider', key: 'bgmVolume', label: '原声保留音量', min: 0, max: 1, step: 0.05, default: 0.2 },
        { type: 'switch', key: 'align', label: '自动对齐字幕节奏', default: true }
      ]
    },
    {
      id: 'vt.subtitle',
      name: '字幕烧录',
      subtitle: '把字幕压进画面',
      icon: '🔤',
      output: 'video',
      modality: 'video',
      promptLabel: '字幕文本（每行一句，可用时间轴格式）',
      promptPlaceholder: '00:00:01,000 --> 00:00:03,000\n你好，欢迎来到我们的故事。',
      fields: [
        { type: 'upload', key: 'source', label: '源视频', accept: 'video', required: true },
        { type: 'chips', key: 'style', label: '字幕样式', options: ['底部黑边白字', '描边黑字', '半透明底', '无样式'], default: '底部黑边白字' },
        { type: 'chips', key: 'font', label: '字体', options: ['思源黑体', '思源宋体', '微软雅黑', 'Arial'], default: '思源黑体' },
        { type: 'slider', key: 'size', label: '字号', min: 12, max: 72, step: 1, default: 32 },
        { type: 'switch', key: 'bilingual', label: '中英双语', default: false }
      ]
    },
    {
      id: 'vt.export',
      name: '合成导出',
      subtitle: '多段画面 + 音轨合成成片',
      icon: '📦',
      output: 'video',
      modality: 'video',
      fields: [
        { type: 'uploads', key: 'clips', label: '视频片段（按顺序拼接）', accept: 'video', max: 12 },
        { type: 'upload', key: 'audio', label: '音轨（可选）', accept: 'audio' },
        { type: 'chips', key: 'transition', label: '转场', options: ['硬切', '淡入淡出', '叠化', '闪白', '推拉'], default: '硬切' },
        { type: 'chips', key: 'out', label: '输出规格', options: ['1080P 30fps', '1080P 60fps', '4K 30fps', '720P 30fps'], default: '1080P 30fps' },
        { type: 'chips', key: 'codec', label: '编码', options: ['H.264', 'H.265', 'ProRes'], default: 'H.264' }
      ]
    }
  ]
};

/* ================================= 导出 ================================= */

export const GROUPS: ModeGroup[] = [
  IMAGE_GROUP,
  VIDEO_GROUP,
  AUDIO_GROUP,
  SCRIPT_GROUP,
  CHARACTER_GROUP,
  IMG_TOOLS_GROUP,
  VID_TOOLS_GROUP
];

export const GROUP_MAP: Record<string, ModeGroup> = Object.fromEntries(GROUPS.map((g) => [g.id, g]));

export function findMode(modeId: string): { group: ModeGroup; mode: (typeof GROUPS)[number]['modes'][number] } | null {
  for (const g of GROUPS) {
    const m = g.modes.find((x) => x.id === modeId);
    if (m) return { group: g, mode: m };
  }
  return null;
}

export const QUICK_MODES: { modeId: string; icon: string; name: string; desc: string }[] = [
  { modeId: 'image.text2img', icon: '🎨', name: '文生图', desc: '一段描述直接出图' },
  { modeId: 'video.multiref', icon: '🧩', name: '多参生视频', desc: '多参考位强约束' },
  { modeId: 'video.firstlast', icon: '⏭️', name: '首尾帧生视频', desc: '首尾帧自动插值' },
  { modeId: 'video.image2video', icon: '🖼️', name: '图生视频', desc: '首帧图动起来' },
  { modeId: 'audio.tts', icon: '🗣️', name: '文本配音', desc: 'TTS 配音' },
  { modeId: 'script.script', icon: '✒️', name: 'AI 剧本', desc: '梗概扩写成剧本' },
  { modeId: 'script.storyboard', icon: '🖼️', name: '故事板', desc: '分镜批量转图' },
  { modeId: 'it.upscale', icon: '🔍', name: '超分放大', desc: '图片高清放大' }
];
