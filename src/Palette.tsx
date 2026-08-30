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
  Zap
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
  video: Video,
  image2video: Clapperboard,
  video2video: RefreshCw,
  lipsync: Mic,
  audio: AudioLines,
  music: Music,
  output: Upload
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

export const KIND_GROUPS: { title: string; kinds: NodeKind[] }[] = [
  { title: '输入', kinds: ['prompt', 'refimg'] },
  { title: '文本', kinds: ['text', 'storyboard', 'rewrite', 'translate', 'caption'] },
  { title: '图像', kinds: ['image', 'image2img', 'upscale', 'bgremove', 'inpaint'] },
  { title: '视频', kinds: ['video', 'image2video', 'video2video', 'lipsync'] },
  { title: '音频', kinds: ['audio', 'music'] },
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
