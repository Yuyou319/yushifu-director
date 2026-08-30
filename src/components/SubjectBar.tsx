import { useState } from 'react';
import { useApp } from '../store';
import { fileToRef } from '../lib/ui';

export default function SubjectBar({ onPickRef }: { onPickRef?: (url: string, name: string) => void }) {
  const subjects = useApp((s) => s.subjects);
  const addSubject = useApp((s) => s.addSubject);
  const removeSubject = useApp((s) => s.removeSubject);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'角色' | '场景' | '道具' | '风格'>('角色');
  const [tags, setTags] = useState('');
  const [url, setUrl] = useState('');

  return (
    <div className="subj">
      <div className="subj-head">
        <span>主体库（{subjects.length}）</span>
        <button className="mini" onClick={() => setOpen((v) => !v)}>
          {open ? '收起' : '＋ 注册主体'}
        </button>
      </div>

      {open && (
        <div className="subj-form">
          <div className="subj-row">
            <button
              className="up-drop small"
              onClick={() => document.getElementById('subj-file')?.click()}
            >
              {url ? <img src={url} alt="" /> : <span className="up-txt">上传参考图</span>}
            </button>
            <input
              id="subj-file"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setUrl((await fileToRef(f)).url);
                e.target.value = '';
              }}
            />
            <div className="subj-fields">
              <input className="inp" placeholder="主体名称" value={name} onChange={(e) => setName(e.target.value)} />
              <div className="subj-row">
                <select className="inp" value={type} onChange={(e) => setType(e.target.value as any)}>
                  {['角色', '场景', '道具', '风格'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <input className="inp" placeholder="标签，逗号分隔" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
            </div>
          </div>
          <button
            className="primary"
            disabled={!url || !name.trim()}
            onClick={() => {
              addSubject({ name: name.trim(), type, url, tags: tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean) });
              setName('');
              setTags('');
              setUrl('');
              setOpen(false);
            }}
          >
            保存到主体库
          </button>
        </div>
      )}

      <div className="subj-grid">
        {subjects.length === 0 && <div className="empty">主体库为空，注册后可在「多参生视频 / 三视图 / 风格锁定」中直接引用</div>}
        {subjects.map((s) => (
          <div key={s.id} className="subj-card">
            <img src={s.url} alt={s.name} onClick={() => onPickRef?.(s.url, s.name)} />
            <div className="subj-meta">
              <span className="subj-name">{s.name}</span>
              <span className="subj-type">{s.type}</span>
            </div>
            <button className="subj-del" onClick={() => removeSubject(s.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
