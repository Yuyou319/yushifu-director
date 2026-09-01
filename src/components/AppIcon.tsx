import {
  Home,
  Image,
  Video,
  AudioLines,
  Wrench,
  SlidersHorizontal,
  LayoutGrid,
  Package,
  Folder,
  Settings,
  Lightbulb,
  ListTodo,
  FileText,
  Images,
  Clapperboard,
  Pencil,
  Sparkles,
  Scissors,
  Upload,
  Palette,
  Film,
  Mic,
  ScrollText,
  Users,
  ImagePlus,
  Gauge
} from 'lucide-react';

const ICONS: Record<string, React.ElementType<{ className?: string; size?: number | string }>> = {
  // 顶部/侧边导航 + 品牌 fallback
  home: Home,
  image: Image,
  video: Video,
  audio: AudioLines,
  imgtools: Wrench,
  vidtools: SlidersHorizontal,
  canvas: LayoutGrid,
  assets: Package,
  projects: Folder,
  settings: Settings,
  character: Users,

  // 导演流程
  idea: Lightbulb,
  plan: ListTodo,
  script: FileText,
  asset: Images,
  shot: Clapperboard,
  prompt: Pencil,
  generate: Sparkles,
  edit: Scissors,
  deliver: Upload,

  // 功能地图（与导航图标区分开）
  'map-image': Palette,
  'map-video': Film,
  'map-audio': Mic,
  'map-script': ScrollText,
  'map-character': Users,
  'map-imgtools': ImagePlus,
  'map-vidtools': Gauge
};

function BrandIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l8.66 5v10L12 22 3.34 17V7L12 2z" />
      <path d="M12 12l8.66-5" />
      <path d="M12 12v10" />
      <path d="M12 12L3.34 7" />
      <path d="M17 3.5l3-3M20 8.5h4M17 13.5l3 3" />
    </svg>
  );
}

export default function AppIcon({
  id,
  className,
  size = 18
}: {
  id: string;
  className?: string;
  size?: number;
}) {
  if (id === 'brand') return <BrandIcon className={className} />;
  const Icon = ICONS[id];
  if (!Icon) return null;
  return <Icon className={className} size={size} />;
}
