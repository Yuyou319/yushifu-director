import { Edge, Node } from 'reactflow';
import { NodeData, NodeKind } from './types';

export interface TemplateNode {
  kind: NodeKind;
  prompt?: string;
  model?: string;
  params?: Record<string, any>;
  x: number;
  y: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  desc: string;
  nodes: TemplateNode[];
  /** 连线：用 nodes 的索引对 [from, to] */
  edges: [number, number][];
}

export const TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'text2img',
    name: '文生图',
    desc: '提示词 → 生图',
    nodes: [
      { kind: 'prompt', prompt: '一只戴帽子的小猫，水彩风格', x: 80, y: 60 },
      { kind: 'image', prompt: '', x: 80, y: 240 }
    ],
    edges: [[0, 1]]
  },
  {
    id: 'text2video',
    name: '文生视频',
    desc: '提示词 → 生视频',
    nodes: [
      { kind: 'prompt', prompt: '海浪拍打礁石，电影感，日落', x: 80, y: 60 },
      { kind: 'video', prompt: '', x: 80, y: 240 }
    ],
    edges: [[0, 1]]
  },
  {
    id: 'story2film',
    name: '故事分镜成片',
    desc: '提示词 → 文本(分镜) → 生图 → 生视频 → 输出',
    nodes: [
      { kind: 'prompt', prompt: '赛博都市里的外卖剑客，三幕短剧', x: 60, y: 40 },
      { kind: 'text', prompt: '把上面的设定扩写成 3 个分镜脚本', x: 60, y: 220, params: { temperature: 0.8 } },
      { kind: 'image', prompt: '', x: 60, y: 400, params: { size: '1024x1024' } },
      { kind: 'video', prompt: '', x: 320, y: 400, params: { duration: 4 } },
      { kind: 'output', x: 580, y: 400 }
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4]]
  },
  {
    id: 'tts',
    name: '文案配音',
    desc: '提示词 → 文本 → 生音频',
    nodes: [
      { kind: 'prompt', prompt: '用温柔女声念一首诗', x: 80, y: 60 },
      { kind: 'text', prompt: '写一段 30 字文案', x: 80, y: 240 },
      { kind: 'audio', prompt: '', x: 80, y: 420, params: { voice: 'female' } }
    ],
    edges: [[0, 1], [1, 2]]
  },
  {
    id: 'imgpipe',
    name: '图片精修',
    desc: '提示词 → 文生图 → 超分 → 输出',
    nodes: [
      { kind: 'prompt', prompt: '雪山下的小屋，油画风', x: 60, y: 40 },
      { kind: 'image', prompt: '', x: 60, y: 220, params: { size: '1024x1024' } },
      { kind: 'upscale', prompt: '', x: 320, y: 220 },
      { kind: 'output', x: 580, y: 220 }
    ],
    edges: [[0, 1], [1, 2], [2, 3]]
  },
  {
    id: 'captionflow',
    name: '图生文',
    desc: '参考图 → 图生文(反推提示词) → 输出',
    nodes: [
      { kind: 'refimg', prompt: '', x: 60, y: 60 },
      { kind: 'caption', prompt: '用中文详细描述这张图片，作为生图提示词', x: 320, y: 60 },
      { kind: 'output', x: 580, y: 60 }
    ],
    edges: [[0, 1], [1, 2]]
  }
];

let seq = 1000;
export function instantiate(t: WorkflowTemplate): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const ids = t.nodes.map(() => `t${Date.now()}_${seq++}`);
  const nodes: Node<NodeData>[] = t.nodes.map((n, i) => ({
    id: ids[i],
    type: 'custom',
    position: { x: n.x, y: n.y },
    data: { kind: n.kind, label: '', prompt: n.prompt ?? '', model: n.model ?? '', params: n.params ?? {}, status: 'idle' }
  }));
  const edges: Edge[] = t.edges.map(([a, b]) => ({
    id: `e_${ids[a]}_${ids[b]}`,
    source: ids[a],
    target: ids[b],
    animated: true
  }));
  return { nodes, edges };
}
