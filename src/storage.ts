import { Edge, Node } from 'reactflow';
import { NodeData, Settings } from './types';

export interface ProjectFile {
  version: number;
  nodes: Node<NodeData>[];
  edges: Edge[];
  settings: Settings;
}

const KEY = 'libtv-local-project';

export function saveProject(nodes: Node<NodeData>[], edges: Edge[], settings: Settings): void {
  const data: ProjectFile = { version: 1, nodes, edges, settings };
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function loadProject(): ProjectFile | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as ProjectFile;
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) return null;
    return data;
  } catch {
    return null;
  }
}

export function exportJson(nodes: Node<NodeData>[], edges: Edge[], settings: Settings): void {
  const data: ProjectFile = { version: 1, nodes, edges, settings };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `libtv-workflow-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
