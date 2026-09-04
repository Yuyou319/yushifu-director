import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
  ReactFlowInstance
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NodeData, NodeKind, KIND_LABELS } from '../types';
import { UpdateNodeContext } from '../context';
import { useSettings } from '../store';
import NodeCard from '../NodeCard';
import ParamEditor from '../ParamEditor';
import Palette, { KIND_GROUPS } from '../Palette';
import { runGraph } from '../run';
import { TEMPLATES, instantiate } from '../templates';
import { saveProject, loadProject, exportJson } from '../storage';
import ErrorBoundary from '../components/ErrorBoundary';

const nodeTypes: NodeTypes = { custom: NodeCard as any };

let seq = 1;
const uid = () => `n${Date.now()}_${seq++}`;

/**
 * 清洗从 localStorage 读回的画布数据：
 * 丢掉 position 为 NaN / 缺失 data 的坏节点，以及指向不存在节点的连线，
 * 避免脏数据让 React Flow 渲染崩溃（整页黑屏）。
 */
function sanitizeNodes(list: unknown): Node<NodeData>[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((n: any) => {
      const p = n?.position;
      return (
        n &&
        typeof n.id === 'string' &&
        p &&
        Number.isFinite(Number(p.x)) &&
        Number.isFinite(Number(p.y)) &&
        n.data &&
        typeof n.data === 'object'
      );
    })
    .map((n: any) => ({
      ...n,
      type: 'custom',
      position: { x: Number(n.position.x) || 0, y: Number(n.position.y) || 0 },
      data: {
        kind: n.data.kind,
        label: n.data.label ?? '',
        prompt: n.data.prompt ?? '',
        model: n.data.model ?? '',
        params: n.data.params ?? {},
        status: n.data.status ?? 'idle'
      }
    }));
}

function sanitizeEdges(list: unknown, nodeIds: Set<string>): Edge[] {
  if (!Array.isArray(list)) return [];
  return list.filter(
    (e: any) => e && typeof e.id === 'string' && nodeIds.has(e.source) && nodeIds.has(e.target)
  );
}

export default function CanvasPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [running, setRunning] = useState(false);
  const [runErr, setRunErr] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  /** 用 useRef 而不是 state：内联 ref 回调 + setState 会造成无限渲染循环（React #185） */
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const settings = useSettings((s) => s.settings);
  const setSettings = useSettings((s) => s.setSettings);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; fx: number; fy: number } | null>(null);

  const addNodeAt = useCallback(
    (kind: NodeKind, pos: { x: number; y: number }) => {
      const id = uid();
      setNodes((nds) => [
        ...nds,
        { id, type: 'custom', position: pos, data: { kind, label: KIND_LABELS[kind], prompt: '', model: '', params: {}, status: 'idle' } }
      ]);
    },
    [setNodes]
  );

  const onPaneContextMenu = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      e.preventDefault();
      const me = e as MouseEvent;
      if (!rf) return;
      const p = rf.screenToFlowPosition({ x: me.clientX, y: me.clientY });
      setMenu({ x: me.clientX, y: me.clientY, fx: p.x, fy: p.y });
    },
    [rf]
  );

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menu]);

  const updateNode = useCallback((id: string, patch: Partial<NodeData>) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));
  }, [setNodes]);

  const addNode = useCallback(
    (kind: NodeKind) => {
      const id = uid();
      const n: Node<NodeData> = {
        id,
        type: 'custom',
        position: { x: 120 + Math.random() * 220, y: 80 + Math.random() * 200 },
        data: { kind, label: KIND_LABELS[kind], prompt: '', model: '', params: {}, status: 'idle' }
      };
      setNodes((nds) => [...nds, n]);
    },
    [setNodes]
  );

  const loadTemplate = useCallback(
    (idx: number) => {
      const { nodes: tn, edges: te } = instantiate(TEMPLATES[idx]);
      setNodes((nds) => [...nds, ...tn]);
      setEdges((eds) => [...eds, ...te]);
    },
    [setNodes, setEdges]
  );

  const onConnect = useCallback((c: Connection) => setEdges((eds) => addEdge({ ...c, animated: true }, eds)), [setEdges]);

  const run = useCallback(async () => {
    setRunning(true);
    setRunErr('');
    try {
      await runGraph(nodes, edges, settings, updateNode);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      console.error('运行失败', e);
      setRunErr(msg);
    } finally {
      setRunning(false);
    }
  }, [nodes, edges, settings, updateNode]);

  const doSave = useCallback(() => {
    saveProject(nodes, edges, settings);
    alert('已保存到本地（localStorage）');
  }, [nodes, edges, settings]);

  const doLoad = useCallback(() => {
    const p = loadProject();
    if (!p) {
      alert('没有找到已保存的工程');
      return;
    }
    const nds = sanitizeNodes(p.nodes);
    const ids = new Set(nds.map((n) => n.id));
    setNodes(nds);
    setEdges(sanitizeEdges(p.edges, ids));
    if (p.settings) setSettings(p.settings);
  }, [setNodes, setEdges, setSettings]);

  const doExport = useCallback(() => exportJson(nodes, edges, settings), [nodes, edges, settings]);

  const onImportFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const p = JSON.parse(String(reader.result)) as any;
          if (!Array.isArray(p.nodes) || !Array.isArray(p.edges)) throw new Error('格式错误');
          setNodes(p.nodes);
          setEdges(p.edges);
          if (p.settings) setSettings(p.settings);
        } catch (e: any) {
          alert('导入失败：' + (e?.message || '文件格式不合法'));
        }
      };
      reader.readAsText(file);
    },
    [setNodes, setEdges, setSettings]
  );

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selected) || null, [nodes, selected]);

  useEffect(() => {
    const p = loadProject();
    if (p) {
      const nds = sanitizeNodes(p.nodes);
      const ids = new Set(nds.map((n) => n.id));
      setNodes(nds);
      setEdges(sanitizeEdges(p.edges, ids));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UpdateNodeContext.Provider value={updateNode}>
      <div className="canvas-page">
        <div className="canvas-bar">
          <button onClick={doSave}>💾 保存</button>
          <button onClick={doLoad}>📂 载入</button>
          <button onClick={doExport}>⤓ 导出</button>
          <button onClick={() => fileInputRef.current?.click()}>⤒ 导入</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
              e.target.value = '';
            }}
          />
          <button className="primary" disabled={running} onClick={run}>
            {running ? '运行中…' : '▶ 运行'}
          </button>
          {runErr && <span className="canvas-err">运行失败：{runErr}</span>}
          <span className="canvas-tip">右键画布添加节点 · 双击节点编辑 · 连线表示数据流向</span>
        </div>
        <div className="canvas-body">
          <Palette onAdd={addNode} onLoadTemplate={loadTemplate} templates={TEMPLATES} />
          <div className="canvas">
            <ErrorBoundary
              label="画布"
              fallback={
                <div className="err-fallback">
                  <h3>画布渲染出错</h3>
                  <p className="err-msg">已阻止整页黑屏。可重新加载，或重置画布（会清空本机保存的节点数据）。</p>
                  <div className="row-gap">
                    <button className="primary" onClick={() => location.reload()}>
                      重新加载
                    </button>
                    <button
                      className="mini danger-text"
                      onClick={() => {
                        localStorage.removeItem('libtv-local-project');
                        location.reload();
                      }}
                    >
                      重置画布
                    </button>
                  </div>
                </div>
              }
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={(_, n) => setSelected(n.id)}
                onPaneClick={() => setMenu(null)}
                onPaneContextMenu={onPaneContextMenu}
                onInit={setRf}
                zoomOnDoubleClick={false}
                fitView
              >
                <Background color="#d1d1d6" gap={24} size={1} />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </ErrorBoundary>
            {menu && (
              <div className="ctx-menu" style={{ left: menu.x, top: menu.y }} onContextMenu={(e) => e.preventDefault()}>
                <div className="ctx-title">添加节点</div>
                {KIND_GROUPS.map((g) => (
                  <div key={g.title} className="ctx-group">
                    <div className="ctx-group-title">{g.title}</div>
                    <div className="ctx-items">
                      {g.kinds.map((k) => (
                        <button
                          key={k}
                          className="ctx-item"
                          onClick={() => {
                            addNodeAt(k, { x: menu.fx, y: menu.fy });
                            setMenu(null);
                          }}
                        >
                          {KIND_LABELS[k]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {selectedNode && (
            <div className="inspector">
              <div className="panel-title">
                {KIND_LABELS[selectedNode.data.kind as NodeKind]} 参数
                <button className="x" onClick={() => setSelected(null)}>
                  ×
                </button>
              </div>
              <div className="insp-row">ID: {selectedNode.id}</div>
              <div className="insp-row">状态: {selectedNode.data.status ?? 'idle'}</div>
              <div className="panel-title" style={{ marginTop: 10 }}>
                节点参数
              </div>
              <ParamEditor id={selectedNode.id} data={selectedNode.data} />
              {selectedNode.data.error && <div className="node-error">{selectedNode.data.error}</div>}
              <button
                className="danger"
                onClick={() => {
                  setNodes((ns) => ns.filter((n) => n.id !== selectedNode.id));
                  setSelected(null);
                }}
              >
                删除节点
              </button>
            </div>
          )}
        </div>
      </div>
    </UpdateNodeContext.Provider>
  );
}
