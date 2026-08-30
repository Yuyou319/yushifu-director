import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Asset,
  AssetType,
  DirValue,
  FieldSpec,
  PairValue,
  RefItem,
  SlotMap,
  SlotValue,
  TableRow
} from '../types';
import { useApp } from '../store';

/* ================================ 基础布局 ================================ */

export function Section({
  title,
  desc,
  right,
  children,
  defaultOpen = true
}: {
  title?: string;
  desc?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sec">
      {title && (
        <div className="sec-head">
          <button className="sec-toggle" onClick={() => setOpen((v) => !v)}>
            <span className={`chev ${open ? 'open' : ''}`}>›</span>
            {title}
          </button>
          <div className="sec-right">{right}</div>
        </div>
      )}
      {open && <div className="sec-body">{desc && <div className="sec-desc">{desc}</div>}{children}</div>}
    </div>
  );
}

export function Field({
  label,
  tip,
  required,
  children
}: {
  label?: string;
  tip?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fld">
      {label && (
        <div className="fld-label">
          {label}
          {required && <span className="req">*</span>}
          {tip && <span className="fld-tip" title={tip}>?</span>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ================================ 基础控件 ================================ */

export function TextInput({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return <input className="inp" value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 5
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea className="inp" rows={rows} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  );
}

export function Select({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="sel-wrap">
      <select className="inp" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Chips({
  value,
  onChange,
  options,
  multi
}: {
  value: any;
  onChange: (v: any) => void;
  options: string[];
  multi?: boolean;
}) {
  const arr: string[] = multi ? (Array.isArray(value) ? value : []) : [];
  return (
    <div className="chips">
      {options.map((o) => {
        const active = multi ? arr.includes(o) : value === o;
        return (
          <button
            key={o}
            className={`chip ${active ? 'on' : ''}`}
            onClick={() => {
              if (multi) onChange(arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o]);
              else onChange(value === o ? '' : o);
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button className={`sw-row ${value ? 'on' : ''}`} onClick={() => onChange(!value)}>
      <span className="sw">
        <span className="sw-dot" />
      </span>
      <span className="sw-label">{label}</span>
    </button>
  );
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step,
  unit
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
}) {
  return (
    <div className="sld">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? min}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="sld-val">
        {value ?? min}
        {unit ?? ''}
      </div>
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  unit
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div className="num-wrap">
      <input
        className="inp"
        type="number"
        value={value ?? 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {unit && <span className="unit">{unit}</span>}
    </div>
  );
}

export function SeedInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const rand = () => onChange(Math.floor(Math.random() * 2147483647));
  return (
    <div className="seed">
      <input className="inp" type="number" value={value ?? -1} onChange={(e) => onChange(Number(e.target.value))} />
      <button className="mini" onClick={rand} title="随机种子">
        🎲
      </button>
      <button className="mini" onClick={() => onChange(-1)} title="-1 表示随机">
        ∞
      </button>
    </div>
  );
}

/* ================================= 文件 ================================= */

export function fileToRef(file: File): Promise<RefItem> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () =>
      resolve({ id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, url: String(r.result), name: file.name });
    r.onerror = () => reject(new Error('读取文件失败'));
    r.readAsDataURL(file);
  });
}

function AssetPicker({
  accept,
  onPick,
  onClose
}: {
  accept: AssetType;
  onPick: (a: Asset) => void;
  onClose: () => void;
}) {
  const assets = useApp((s) => s.assets);
  const list = assets.filter((a) => a.type === accept).slice(0, 60);
  return (
    <div className="pick">
      <div className="pick-head">
        从资产库选择
        <button className="x" onClick={onClose}>
          ×
        </button>
      </div>
      {list.length === 0 && <div className="pick-empty">资产库暂无{labelOf(accept)}</div>}
      <div className="pick-grid">
        {list.map((a) => (
          <button
            key={a.id}
            className="pick-item"
            title={a.title}
            onClick={() => {
              onPick(a);
              onClose();
            }}
          >
            {a.type === 'image' || a.type === 'video' ? <img src={a.url} alt={a.title} /> : <span className="pick-txt">{a.title}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function labelOf(t: AssetType): string {
  return t === 'image' ? '图片' : t === 'video' ? '视频' : t === 'audio' ? '音频' : '文本';
}

export function UploadBox({
  accept,
  value,
  onChange,
  hint,
  compact
}: {
  accept: AssetType;
  value?: RefItem;
  onChange: (v?: RefItem) => void;
  hint?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [picking, setPicking] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [url, setUrl] = useState('');

  const onFiles = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    onChange(await fileToRef(files[0]));
  };

  return (
    <div className={`up ${compact ? 'compact' : ''}`}>
      {value ? (
        <div className="up-prev">
          {accept === 'audio' ? (
            <audio src={value.url} controls style={{ width: '100%' }} />
          ) : accept === 'video' ? (
            <video src={value.url} controls muted loop style={{ width: '100%', maxHeight: 180 }} />
          ) : (
            <img src={value.url} alt="" />
          )}
          <div className="up-bar">
            <span className="up-name" title={value.name}>
              {value.name}
            </span>
            <button className="mini" onClick={() => onChange(undefined)}>
              移除
            </button>
          </div>
        </div>
      ) : (
        <button className="up-drop" onClick={() => inputRef.current?.click()}>
          <span className="up-ico">＋</span>
          <span className="up-txt">上传{labelOf(accept)}</span>
          <span className="up-hint">{hint ?? '点击或拖拽文件到这里'}</span>
        </button>
      )}
      <div className="up-actions">
        <button className="mini" onClick={() => inputRef.current?.click()}>
          本地文件
        </button>
        <button className="mini" onClick={() => setPicking((v) => !v)}>
          资产库
        </button>
        <button className="mini" onClick={() => setUrlMode((v) => !v)}>
          URL
        </button>
      </div>
      {urlMode && (
        <div className="up-url">
          <input className="inp" placeholder="粘贴 http(s) 链接" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button
            className="mini"
            onClick={() => {
              if (!url.trim()) return;
              onChange({ id: `u_${Date.now()}`, url: url.trim(), name: url.trim().slice(0, 40) });
              setUrl('');
              setUrlMode(false);
            }}
          >
            填入
          </button>
        </div>
      )}
      {picking && (
        <AssetPicker
          accept={accept}
          onClose={() => setPicking(false)}
          onPick={(a) => onChange({ id: a.id, url: a.url, name: a.title })}
        />
      )}
      <input
        ref={inputRef}
        type="file"
        style={{ display: 'none' }}
        accept={accept === 'image' ? 'image/*' : accept === 'video' ? 'video/*' : 'audio/*'}
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export function MultiUpload({
  accept,
  value,
  onChange,
  max = 4
}: {
  accept: AssetType;
  value: RefItem[];
  onChange: (v: RefItem[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const items = value ?? [];
  return (
    <div>
      <div className="mu-grid">
        {items.map((it) => (
          <div key={it.id} className="mu-item">
            <img src={it.url} alt="" />
            <button
              className="mu-del"
              onClick={() => onChange(items.filter((x) => x.id !== it.id))}
            >
              ×
            </button>
          </div>
        ))}
        {items.length < max && (
          <button className="mu-add" onClick={() => inputRef.current?.click()}>
            ＋
            <span>{items.length}/{max}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        accept="image/*"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []).slice(0, max - items.length);
          const refs = await Promise.all(files.map(fileToRef));
          onChange([...items, ...refs]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

/** 首帧 / 尾帧（可交换） */
export function PairUpload({
  value,
  onChange,
  aLabel,
  bLabel,
  accept
}: {
  value: PairValue;
  onChange: (v: PairValue) => void;
  aLabel: string;
  bLabel: string;
  accept: AssetType;
}) {
  const v = value ?? {};
  const swap = () => onChange({ a: v.b, b: v.a });
  return (
    <div className="pair">
      <div className="pair-cell">
        <div className="pair-tag">{aLabel}</div>
        <UploadBox accept={accept} value={v.a} onChange={(a) => onChange({ ...v, a })} compact />
      </div>
      <button className="pair-swap" onClick={swap} title="交换首帧与尾帧">
        ⇄
      </button>
      <div className="pair-cell">
        <div className="pair-tag warn">{bLabel}</div>
        <UploadBox accept={accept} value={v.b} onChange={(b) => onChange({ ...v, b })} compact />
      </div>
    </div>
  );
}

const EMPTY_SLOT: SlotValue = { enabled: false, weight: 0.8, items: [] };

/** 多参生视频：参考槽位矩阵（角色 / 服装 / 场景 / 道具 / 风格 / 动作） */
export function SlotMatrix({
  value,
  onChange,
  slots,
  accept,
  max = 4
}: {
  value: SlotMap;
  onChange: (v: SlotMap) => void;
  slots: { id: string; label: string; hint?: string }[];
  accept: AssetType;
  max?: number;
}) {
  const map: SlotMap = value ?? {};
  const patch = (id: string, p: Partial<SlotValue>) =>
    onChange({ ...map, [id]: { ...EMPTY_SLOT, ...(map[id] ?? {}), ...p } });

  const enabledCount = slots.filter((s) => map[s.id]?.enabled && (map[s.id]?.items?.length ?? 0) > 0).length;

  return (
    <div className="slots">
      <div className="slots-head">
        <span>
          已启用 <b>{enabledCount}</b> / {slots.length} 个参考位
        </span>
        <button
          className="mini"
          onClick={() =>
            onChange(Object.fromEntries(slots.map((s) => [s.id, { ...EMPTY_SLOT, ...(map[s.id] ?? {}), enabled: true }])))
          }
        >
          全部启用
        </button>
      </div>
      {slots.map((s) => {
        const sv = map[s.id] ?? EMPTY_SLOT;
        return (
          <div key={s.id} className={`slot ${sv.enabled ? 'on' : ''}`}>
            <div className="slot-head">
              <Switch
                value={!!sv.enabled}
                onChange={(v) => patch(s.id, { enabled: v })}
                label={s.label}
              />
              {s.hint && <span className="slot-hint">{s.hint}</span>}
            </div>
            {sv.enabled && (
              <div className="slot-body">
                <MultiUpload
                  accept={accept}
                  max={max}
                  value={sv.items}
                  onChange={(items) => patch(s.id, { items })}
                />
                <div className="slot-w">
                  <span>参考权重</span>
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    value={sv.weight}
                    onChange={(v) => patch(s.id, { weight: v })}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 点位网格（15 环绕视角 / 26 光位） */
export function PointGrid({
  options,
  cols = 5,
  value,
  onChange,
  multi
}: {
  options: { value: string; label: string }[];
  cols?: number;
  value: any;
  onChange: (v: any) => void;
  multi?: boolean;
}) {
  const arr: string[] = multi ? (Array.isArray(value) ? value : []) : [];
  return (
    <div className="pgrid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map((o) => {
        const active = multi ? arr.includes(o.value) : value === o.value;
        return (
          <button
            key={o.value}
            className={`pg ${active ? 'on' : ''}`}
            title={o.label}
            onClick={() => {
              if (multi) onChange(arr.includes(o.value) ? arr.filter((x) => x !== o.value) : [...arr, o.value]);
              else onChange(value === o.value ? '' : o.value);
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** 四向扩图 */
export function DirBox({ value, onChange }: { value: DirValue; onChange: (v: DirValue) => void }) {
  const v: DirValue = value ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const set = (k: keyof DirValue, n: number) => onChange({ ...v, [k]: n });
  return (
    <div className="dirbox">
      <div className="dir-grid">
        <div className="dir-t">
          <NumberInput value={v.top} onChange={(n) => set('top', n)} min={0} max={2048} step={64} />
        </div>
        <div className="dir-l">
          <NumberInput value={v.left} onChange={(n) => set('left', n)} min={0} max={2048} step={64} />
        </div>
        <div className="dir-c">画面</div>
        <div className="dir-r">
          <NumberInput value={v.right} onChange={(n) => set('right', n)} min={0} max={2048} step={64} />
        </div>
        <div className="dir-b">
          <NumberInput value={v.bottom} onChange={(n) => set('bottom', n)} min={0} max={2048} step={64} />
        </div>
      </div>
      <div className="dir-quick">
        <button className="mini" onClick={() => onChange({ top: 256, right: 256, bottom: 256, left: 256 })}>
          四周 256
        </button>
        <button className="mini" onClick={() => onChange({ top: 0, right: 0, bottom: 0, left: 0 })}>
          重置
        </button>
        <button className="mini" onClick={() => onChange({ top: 0, right: 0, bottom: 512, left: 0 })}>
          向下延展
        </button>
      </div>
    </div>
  );
}

/** 时间区间（视频裁取） */
export function RangeField({
  value,
  onChange,
  min,
  max,
  unit
}: {
  value: [number, number];
  onChange: (v: [number, number]) => void;
  min: number;
  max: number;
  unit?: string;
}) {
  const v: [number, number] = value ?? [min, max];
  return (
    <div className="rng">
      <input type="range" min={min} max={max} step={0.1} value={v[0]} onChange={(e) => onChange([Number(e.target.value), v[1]])} />
      <input type="range" min={min} max={max} step={0.1} value={v[1]} onChange={(e) => onChange([v[0], Number(e.target.value)])} />
      <div className="rng-val">
        {v[0].toFixed(1)}
        {unit} → {v[1].toFixed(1)}
        {unit}（时长 {(Math.max(0, v[1] - v[0])).toFixed(1)}
        {unit}）
      </div>
    </div>
  );
}

/** 分镜表编辑器 */
export function TableEditor({
  columns,
  value,
  onChange
}: {
  columns: { key: string; label: string; width?: number }[];
  value: TableRow[];
  onChange: (v: TableRow[]) => void;
}) {
  const rows = value ?? [];
  const patch = (id: string, k: string, v: any) => onChange(rows.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
  return (
    <div className="tbl">
      <div className="tbl-head">
        <div className="tbl-idx">#</div>
        {columns.map((c) => (
          <div key={c.key} style={{ flex: c.width ?? 1 }}>
            {c.label}
          </div>
        ))}
        <div className="tbl-idx">×</div>
      </div>
      {rows.length === 0 && <div className="tbl-empty">暂无分镜，点击「＋ 添加一镜」手动编排，或在左侧用 AI 生成</div>}
      {rows.map((r, i) => (
        <div className="tbl-row" key={r.id}>
          <div className="tbl-idx">{i + 1}</div>
          {columns.map((c) => (
            <div key={c.key} style={{ flex: c.width ?? 1 }}>
              <input className="inp" value={r[c.key] ?? ''} onChange={(e) => patch(r.id, c.key, e.target.value)} />
            </div>
          ))}
          <button className="tbl-idx del" onClick={() => onChange(rows.filter((x) => x.id !== r.id))}>
            ×
          </button>
        </div>
      ))}
      <button
        className="mini"
        onClick={() =>
          onChange([
            ...rows,
            { id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, 景别: '中景', 运镜: '固定', 画面描述: '', 台词: '', 时长: 3 }
          ])
        }
      >
        ＋ 添加一镜
      </button>
    </div>
  );
}

/* ============================ 字段渲染分发器 ============================ */

export function FieldRenderer({
  spec,
  value,
  onChange
}: {
  spec: FieldSpec;
  value: any;
  onChange: (v: any) => void;
}) {
  switch (spec.type) {
    case 'note':
      return <div className="note">{spec.text}</div>;
    case 'text':
      return (
        <Field label={spec.label} tip={spec.tip}>
          <TextInput value={value ?? spec.default ?? ''} onChange={onChange} placeholder={spec.placeholder} />
        </Field>
      );
    case 'textarea':
      return (
        <Field label={spec.label} tip={spec.tip}>
          <TextArea
            rows={spec.rows ?? 4}
            value={value ?? spec.default ?? ''}
            onChange={onChange}
            placeholder={spec.placeholder}
          />
        </Field>
      );
    case 'number':
      return (
        <Field label={spec.label} tip={spec.tip}>
          <NumberInput value={value ?? spec.default ?? 0} onChange={onChange} min={spec.min} max={spec.max} step={spec.step} unit={spec.unit} />
        </Field>
      );
    case 'slider':
      return (
        <Field label={spec.label} tip={spec.tip}>
          <Slider value={value ?? spec.default} onChange={onChange} min={spec.min} max={spec.max} step={spec.step} unit={spec.unit} />
        </Field>
      );
    case 'select':
      return (
        <Field label={spec.label} tip={spec.tip}>
          <Select value={value ?? spec.default ?? spec.options[0]} onChange={onChange} options={spec.options} />
        </Field>
      );
    case 'chips':
      return (
        <Field label={spec.label} tip={spec.tip}>
          <Chips value={value ?? spec.default} onChange={onChange} options={spec.options} multi={spec.multi} />
        </Field>
      );
    case 'switch':
      return <Switch value={!!(value ?? spec.default)} onChange={onChange} label={spec.label} />;
    case 'seed':
      return (
        <Field label={spec.label ?? '随机种子'}>
          <SeedInput value={value ?? spec.default ?? -1} onChange={onChange} />
        </Field>
      );
    case 'upload':
      return (
        <Field label={spec.label} tip={spec.tip} required={spec.required}>
          <UploadBox accept={spec.accept} value={value} onChange={onChange} />
        </Field>
      );
    case 'uploads':
      return (
        <Field label={spec.label} tip={spec.tip}>
          <MultiUpload accept={spec.accept} value={value ?? []} onChange={onChange} max={spec.max ?? 4} />
        </Field>
      );
    case 'pair':
      return (
        <Field label={spec.label} tip={spec.tip}>
          <PairUpload value={value ?? {}} onChange={onChange} aLabel={spec.a} bLabel={spec.b} accept={spec.accept} />
        </Field>
      );
    case 'slots':
      return (
        <Field label={spec.label} tip={spec.tip}>
          <SlotMatrix value={value ?? {}} onChange={onChange} slots={spec.slots} accept={spec.accept} max={spec.max ?? 4} />
        </Field>
      );
    case 'grid':
      return (
        <Field label={spec.label} tip={spec.tip}>
          <PointGrid options={spec.options} cols={spec.cols ?? 5} value={value ?? spec.default} onChange={onChange} multi={spec.multi} />
        </Field>
      );
    case 'dirbox':
      return (
        <Field label={spec.label} tip={spec.tip}>
          <DirBox value={value} onChange={onChange} />
        </Field>
      );
    case 'table':
      return (
        <Field label={spec.label} tip={spec.tip}>
          <TableEditor columns={spec.columns} value={value ?? []} onChange={onChange} />
        </Field>
      );
    case 'range':
      return (
        <Field label={spec.label} tip={spec.tip}>
          <RangeField value={value ?? spec.default} onChange={onChange} min={spec.min} max={spec.max} unit={spec.unit} />
        </Field>
      );
    case 'color': {
      const colors = ['#ffffff', '#ffd9a0', '#ffb3b3', '#a0d8ff', '#b8ffd9', '#e0b3ff', '#ff9de0'];
      return (
        <Field label={spec.label}>
          <div className="colors">
            {colors.map((c) => (
              <button
                key={c}
                className={`clr ${value === c ? 'on' : ''}`}
                style={{ background: c }}
                onClick={() => onChange(c)}
                title={c}
              />
            ))}
          </div>
        </Field>
      );
    }
    default:
      return null;
  }
}

/* ================================ 默认值 ================================ */

export function defaultValues(fields: FieldSpec[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const f of fields) {
    if (f.type === 'note') continue;
    if ('default' in f && f.default !== undefined) out[f.key] = f.default;
    else if (f.type === 'uploads') out[f.key] = [];
    else if (f.type === 'upload') out[f.key] = undefined;
    else if (f.type === 'pair') out[f.key] = {};
    else if (f.type === 'slots') out[f.key] = {};
    else if (f.type === 'table') out[f.key] = [];
    else if (f.type === 'chips') out[f.key] = f.multi ? [] : undefined;
    else if (f.type === 'dirbox') out[f.key] = { top: 0, right: 0, bottom: 0, left: 0 };
    else if (f.type === 'select') out[f.key] = f.options[0];
    else if (f.type === 'switch') out[f.key] = false;
    else out[f.key] = '';
  }
  return out;
}

/** 把表单值转成可提交给 API 的扁平参数（图片/视频取第一张参考图等） */
export function flattenParams(values: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      const urls = v.map((x) => (typeof x === 'object' ? x?.url : x)).filter(Boolean);
      if (urls.length) out[k] = urls;
      continue;
    }
    if (typeof v === 'object') {
      if ('a' in v || 'b' in v) {
        if (v.a?.url) out[`${k}_start`] = v.a.url;
        if (v.b?.url) out[`${k}_end`] = v.b.url;
        continue;
      }
      if ('url' in v && 'name' in v) {
        out[k] = v.url;
        continue;
      }
      // slots
      const slotOut: Record<string, any> = {};
      let any = false;
      for (const [sid, sv] of Object.entries<any>(v)) {
        if (!sv || !sv.enabled) continue;
        if (!sv.items?.length) continue;
        any = true;
        slotOut[sid] = { weight: sv.weight, images: sv.items.map((i: RefItem) => i.url) };
      }
      if (any) out[k] = slotOut;
      continue;
    }
    out[k] = v;
  }
  return out;
}

/** 统计已填写的参考素材数量，用于校验必填 */
export function countRefs(values: Record<string, any>): number {
  let n = 0;
  for (const v of Object.values(values)) {
    if (!v) continue;
    if (Array.isArray(v)) n += v.length;
    else if (typeof v === 'object') {
      if ('url' in v) n += 1;
      else if ('a' in v || 'b' in v) n += (v.a ? 1 : 0) + (v.b ? 1 : 0);
      else for (const sv of Object.values<any>(v)) if (sv?.enabled && sv?.items?.length) n += sv.items.length;
    }
  }
  return n;
}

export function useLatest<T>(v: T): T {
  const ref = useRef(v);
  ref.current = v;
  return ref.current;
}

export function useToggle(init = false): [boolean, () => void] {
  const [v, setV] = useState(init);
  return [v, useCallback(() => setV((x) => !x), [])];
}

export function useMemoized<T>(fn: () => T, deps: any[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(fn, deps);
}
