import { Edge, Node } from 'reactflow';
import { NodeData, Settings, MODALITY_OF } from './types';
import { callNode } from './api';

/** Kahn 拓扑排序：返回按依赖顺序排列的节点 id 列表；存在环时退化为原始顺序 */
export function topoOrder(nodes: Node<NodeData>[], edges: Edge[]): Node<NodeData>[] {
  const indeg = new Map<string, number>();
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => {
    indeg.set(n.id, 0);
    adj.set(n.id, []);
  });
  edges.forEach((e) => {
    if (!indeg.has(e.source) || !indeg.has(e.target)) return;
    adj.get(e.source)!.push(e.target);
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
  });
  const queue = nodes.filter((n) => (indeg.get(n.id) ?? 0) === 0).map((n) => n.id);
  const order: string[] = [];
  const seen = new Set<string>();
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(id);
    for (const next of adj.get(id) ?? []) {
      indeg.set(next, (indeg.get(next) ?? 1) - 1);
      if ((indeg.get(next) ?? 0) <= 0) queue.push(next);
    }
  }
  // 兜底：未被纳入的有环节点也加上
  nodes.forEach((n) => {
    if (!seen.has(n.id)) order.push(n.id);
  });
  return order.map((id) => nodes.find((n) => n.id === id)!).filter(Boolean);
}

function upstreamText(nodes: Node<NodeData>[], edges: Edge[], nodeId: string): string {
  const ins = edges.filter((e) => e.target === nodeId).map((e) => e.source);
  for (const src of ins) {
    const n = nodes.find((x) => x.id === src);
    if (n?.data.output) return n.data.output;
  }
  return '';
}

function isUrl(s: string): boolean {
  return typeof s === 'string' && /^https?:\/\//.test(s.trim());
}

/** 执行整张图，返回更新后的 nodes（带 status / output / error） */
export async function runGraph(
  nodes: Node<NodeData>[],
  edges: Edge[],
  settings: Settings,
  onUpdate: (id: string, patch: Partial<NodeData>) => void
): Promise<void> {
  const order = topoOrder(nodes, edges);
  for (const node of order) {
    const d = node.data;
    if (d.kind === 'prompt') {
      onUpdate(node.id, { status: 'done', output: d.prompt ?? '', error: undefined });
      continue;
    }
    if (d.kind === 'refimg') {
      if (!d.refImage) {
        onUpdate(node.id, { status: 'error', error: '请填写参考图 URL' });
        continue;
      }
      onUpdate(node.id, { status: 'done', output: d.refImage, error: undefined });
      continue;
    }
    if (d.kind === 'output') {
      const text = upstreamText(nodes, edges, node.id);
      onUpdate(node.id, { status: 'done', output: text, error: undefined });
      continue;
    }
    // 生成类节点
    const modality = MODALITY_OF[d.kind];
    const cfg = settings[modality];
    const prompt = d.prompt || upstreamText(nodes, edges, node.id);
    // 参考图：节点自带优先；否则取上游输出（通常是图片/视频 URL）
    const upstreamRef = upstreamText(nodes, edges, node.id);
    const refImage = d.refImage || (isUrl(upstreamRef) ? upstreamRef : '');
    const refAudio = d.refAudio || (isUrl(upstreamRef) ? upstreamRef : '');
    if (!prompt && !refImage && !refAudio) {
      onUpdate(node.id, { status: 'error', error: '缺少输入（请填写提示词/参考图/音频或连接上游）' });
      continue;
    }
    if (!cfg.apiKey) {
      onUpdate(node.id, { status: 'error', error: `未配置 ${modality} 的 API Key（请在设置中填写）` });
      continue;
    }
       onUpdate(node.id, { status: 'running', error: undefined });
    try {
      const out = await callNode(d.kind, cfg, d.model || cfg.defaultModel, prompt, {
        ...(d.params ?? {}),
        refImage: d.kind === 'lipsync' ? refImage : refImage,
        refAudio
      });
      onUpdate(node.id, { status: 'done', output: out });
    } catch (e: any) {
      onUpdate(node.id, { status: 'error', error: e?.message ?? String(e) });
    }
  }
}
