import { NodeKind, KIND_LABELS } from './types';
import { WorkflowTemplate } from './templates';
import {
  Pencil,
  Image,
  FileText,
  LayoutGrid,
  PenLine,
  Languages,
  ScanText,
  Images,
  ZoomIn,
  Eraser,
  Paintbrush,
  Video,
  Clapperboard,
  RefreshCw,
  Mic,
  AudioLines,
  Music,
  Sparkles,
  Upload,
  Zap,
  // 新增图标
  Maximize,
  RotateCw,
  Lightbulb,
  User,
  Grid3x3,
  Layers,
  Puzzle,
  SkipForward,
  FastForward,
  Megaphone,
  Bell,
  BookOpen,
  Camera,
  Lock,
  Crop,
  Gauge,
  Scissors,
  Film,
  Headphones,
  Type,
  Package
} from 'lucide-react';

const KIND_ICONS: Record<NodeKind, React.ElementType<{ size?: number | string; className?: string }>> = {
  prompt: Pencil,
  refimg: Image,
  text: FileText,
  storyboard: LayoutGrid,
  rewrite: PenLine,
  translate: Languages,
  caption: ScanText,
  image: Image,
  image2img: Images,
  upscale: ZoomIn,
  bgremove: Eraser,
  inpaint: Paintbrush,
  // 生图新增
  outpaint: Maximize,
  multiangle: RotateCw,
  relight: Lightbulb,
  turnaround: User,
  storygrid: Grid3x3,
  // 视频
  video: Video,
  image2video: Clapperboard,
  video2video: RefreshCw,
  lipsync: Mic,
  // 生视频新增
  multiref: Puzzle,
  firstlast: SkipForward,
  extend: FastForward,
  // 音频
  audio: AudioLines,
  music: Music,
  // 生音频新增
  tts: Megaphone,
  clone: Mic,
  sfx: Bell,
  // 输出
  output: Upload,
  // 剧本/分镜新增
  script: BookOpen,
  shots: Clapperboard,
  director: Camera,
  // 角色一致性新增
  stylelock: Lock,
  consistency: Layers,
  // 图像工具新增
  erase: Eraser,
  gridsplit: Grid3x3,
  crop: Crop,
  // 视频工具新增
  vupscale: ZoomIn,
  fps: Gauge,
  shotsplit: Scissors,
  trim: Film,
  toaudio: Headphones,
  dub: Mic,
  subtitle: Type,
  compose: Package
};

// 每个模板用不同图标，避免全部一样
const TEMPLATE_ICONS: Record<string, React.ElementType<{ size?: number | string; className?: string }>> = {
  text2img: Image,
  text2video: Video,
  story2film: Clapperboard,
  tts: Mic,
  imgpipe: Sparkles,
  captionflow: ScanText
};

/**
 * 节点库分组：与外部「生图 / 生视频 / 生音频 / 剧本 / 分镜 / 角色一致性 /
 * 图像工具 / 视频工具」的功能入口对齐。
 */
export const KIND_GROUPS: { title: string; kinds: NodeKind[] }[] = [
  { title: '输入', kinds: ['prompt', 'refimg'] },
  { title: '文本', kinds: ['text', 'rewrite', 'translate'] },
  { title: '生图', kinds: ['image', 'image2img', 'outpaint', 'multiangle', 'relight', 'turnaround', 'storygrid', 'upscale', 'bgremove', 'inpaint'] },
  { title: '生视频', kinds: ['video', 'image2video', 'multiref', 'firstlast', 'extend', 'video2video', 'lipsync'] },
  { title: '生音频', kinds: ['audio', 'tts', 'clone', 'music', 'sfx'] },
  { title: '剧本 / 分镜', kinds: ['storyboard', 'script', 'shots', 'director'] },
  { title: '角色一致性', kinds: ['stylelock', 'consistency', 'turnaround'] },
  { title: '图像工具', kinds: ['erase', 'gridsplit', 'crop', 'caption'] },
  { title: '视频工具', kinds: ['vupscale', 'fps', 'shotsplit', 'trim', 'toaudio', 'dub', 'subtitle', 'compose'] },
  { title: '输出', kinds: ['output'] }
];

export default function Palette({
  onAdd,
  onLoadTemplate,
  templates
}: {
  onAdd: (k: NodeKind) => void;
  onLoadTemplate: (idx: number) => void;
  templates: WorkflowTemplate[];
}) {
  return (
    <div className="palette">
      <div className="panel-title">节点库</div>
      {KIND_GROUPS.map((g) => (
        <div key={g.title} className="palette-group">
          <div className="palette-group-title">{g.title}</div>
          {g.kinds.map((k) => {
            const Icon = KIND_ICONS[k];
            return (
              <button key={k} className="palette-item" onClick={() => onAdd(k)}>
                <Icon size={14} className="palette-item-icon" />
                <span>{KIND_LABELS[k]}</span>
              </button>
            );
          })}
        </div>
      ))}

      <div className="panel-title" style={{ marginTop: 14 }}>模板库</div>
      {templates.map((t, i) => {
        const TplIcon = TEMPLATE_ICONS[t.id] ?? Zap;
        return (
          <button key={t.id} className="palette-item tpl" onClick={() => onLoadTemplate(i)} title={t.desc}>
            <TplIcon size={14} className="palette-item-icon" />
            <span className="tpl-name">{t.name}</span>
            <span className="tpl-desc">{t.desc}</span>
          </button>
        );
      })}

      <div className="palette-tip">
        双击节点可编辑；连线表示数据流向（上→下）。从模板库一键铺好常用工作流。
      </div>
    </div>
  );
}
