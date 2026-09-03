import { Handle, Position, useReactFlow } from 'reactflow';
import { NodeData, KIND_LABELS, MODALITY_OF } from './types';
import { useUpdateNode } from './context';
import { useSettings } from './store';

function ResultView({ kind, output }: { kind: NodeData['kind']; output?: string }) {
  if (!output) return <div className="result-empty">尚无结果</div>;
  if (kind === 'image' || kind === 'image2img' || kind === 'refimg') return <img className="result-media" src={output} alt="result" />;
  if (kind === 'video' || kind === 'image2video') return <video className="result-media" src={output} controls />;
  if (kind === 'audio') return <audio className="result-media" src={output} controls />;
  return <pre className="result-text">{output}</pre>;
}

const NEED_REF = new Set(['image2img', 'image2video', 'upscale', 'bgremove', 'video2video', 'inpaint', 'caption']);

export default function NodeCard({ id, data }: { id: string; data: NodeData }) {
  const update = useUpdateNode();
  const rf = useReactFlow();
  const settings = useSettings((s) => s.settings);
  const isGen = !!data?.kind && data.kind !== 'prompt' && data.kind !== 'output' && data.kind !== 'refimg';
  const cfg = isGen ? (settings[MODALITY_OF[data.kind]] ?? null) : null;
  const models = cfg?.models ?? [];
  const modelValue = data.model || cfg?.defaultModel || '';

  const onDelete = () => {
    rf.deleteElements({ nodes: [{ id }] });
  };

  return (
    <div className="node-card">
      <Handle type="target" position={Position.Top} />
      <div className="node-head">
        <span className="node-title">{KIND_LABELS[data.kind] ?? '节点'}</span>
        <div className="node-head-right">
          <span className={`status-dot status-${data.status ?? 'idle'}`} title={data.status} />
          <button className="node-del" title="删除节点" onClick={onDelete}>×</button>
        </div>
      </div>

      {isGen && (
        <div className="node-row">
          {models.length > 0 ? (
            <select value={modelValue} onChange={(e) => update(id, { model: e.target.value })}>
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value={modelValue}>+ 其它</option>
            </select>
          ) : (
            <input
              placeholder="模型名（如 gpt-4o）"
              value={modelValue}
              onChange={(e) => update(id, { model: e.target.value })}
            />
          )}
        </div>
      )}

      {data.kind === 'refimg' ? (
        <div className="node-row">
          <input
            placeholder="参考图 URL"
            value={data.refImage ?? ''}
            onChange={(e) => update(id, { refImage: e.target.value })}
          />
        </div>
      ) : data.kind !== 'output' ? (
        <div className="node-row">
          <textarea
            rows={3}
            placeholder={data.kind === 'prompt' ? '输入提示词…' : '提示词（留空则取上游文本）'}
            value={data.prompt ?? ''}
            onChange={(e) => update(id, { prompt: e.target.value })}
          />
        </div>
      ) : null}

      {NEED_REF.has(data.kind) && (
        <div className="node-row">
          <input
            placeholder={data.kind === 'lipsync' ? '参考视频 URL（可留空）' : '参考图 URL（可留空）'}
            value={data.refImage ?? ''}
            onChange={(e) => update(id, { refImage: e.target.value })}
          />
        </div>
      )}

      {data.kind === 'lipsync' && (
        <div className="node-row">
          <input
            placeholder="参考音频 URL（可留空，自动取上游）"
            value={data.refAudio ?? ''}
            onChange={(e) => update(id, { refAudio: e.target.value })}
          />
        </div>
      )}

      {data.kind !== 'prompt' && <ResultView kind={data.kind} output={data.output} />}

      {data.status === 'error' && <div className="node-error">{data.error}</div>}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
