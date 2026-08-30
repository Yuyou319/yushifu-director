import type { ReactNode } from 'react';
import { NodeData } from './types';
import { useUpdateNode } from './context';

export default function ParamEditor({ id, data }: { id: string; data: NodeData }) {
  const update = useUpdateNode();
  const p = data.params ?? {};
  const setParam = (  k: string, v: any) => update(id, { params: { ...p, [k]: v } });
  const wrap = (label: string, ctrl: ReactNode) => (
    <label className="param-label">
      {label}
      {ctrl}
    </label>
  );

  if (data.kind === 'text')
    return wrap(
      '温度 (0–1)',
      <input
        type="number"
        step="0.1"
        min="0"
        max="1"
        value={p.temperature ?? 0.7}
        onChange={(e) => setParam('temperature', parseFloat(e.target.value) || 0)}
      />
    );

  if (data.kind === 'image')
    return wrap(
      '尺寸',
      <select value={p.size || '1024x1024'} onChange={(e) => setParam('size', e.target.value)}>
        {['1024x1024', '512x512', '1792x1024', '1024x1792'].map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    );

  if (data.kind === 'video')
    return wrap(
      '时长(秒)',
      <input
        type="number"
        value={p.duration ?? 4}
        onChange={(e) => setParam('duration', parseInt(e.target.value) || 4)}
      />
    );

  if (data.kind === 'audio')
    return wrap(
      '音色',
      <select value={p.voice || 'female'} onChange={(e) => setParam('voice', e.target.value)}>
        <option value="female">女声</option>
        <option value="male">男声</option>
        <option value="child">童声</option>
      </select>
    );

  return null;
}
