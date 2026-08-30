import { useMemo, useState } from 'react';
import { useApp } from '../store';
import { AssetGrid, AssetView } from '../components/Preview';
import { AssetType } from '../types';

const TABS: { key: AssetType | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'image', label: '图片' },
  { key: 'video', label: '视频' },
  { key: 'audio', label: '音频' },
  { key: 'text', label: '文本' }
];

export default function AssetsPage() {
  const assets = useApp((s) => s.assets);
  const removeAsset = useApp((s) => s.removeAsset);
  const toggleFav = useApp((s) => s.toggleFav);
  const clearAssets = useApp((s) => s.clearAssets);
  const [tab, setTab] = useState<AssetType | 'all'>('all');
  const [favOnly, setFavOnly] = useState(false);
  const [q, setQ] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const list = useMemo(() => {
    let l = assets;
    if (tab !== 'all') l = l.filter((a) => a.type === tab);
    if (favOnly) l = l.filter((a) => a.favorite);
    if (q.trim()) l = l.filter((a) => a.title.includes(q) || (a.prompt ?? '').includes(q) || (a.modeName ?? '').includes(q));
    return l;
  }, [assets, tab, favOnly, q]);

  const cur = assets.find((a) => a.id === preview) ?? null;

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(assets, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yushifu-assets-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="assets">
      <div className="assets-bar">
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.key} className={`tab ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
              <span className="tab-cnt">
                {t.key === 'all' ? assets.length : assets.filter((a) => a.type === t.key).length}
              </span>
            </button>
          ))}
        </div>
        <div className="assets-ops">
          <input className="inp search" placeholder="搜索资产" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className={`mini ${favOnly ? 'on' : ''}`} onClick={() => setFavOnly((v) => !v)}>
            ★ 仅收藏
          </button>
          <button className="mini" onClick={exportAll}>
            ⤓ 导出索引
          </button>
          <button
            className="mini danger-text"
            onClick={() => {
              if (confirm(`确定清空 ${tab === 'all' ? '全部' : TABS.find((t) => t.key === tab)?.label} 资产？`)) clearAssets(tab === 'all' ? undefined : tab);
            }}
          >
            清空
          </button>
        </div>
      </div>

      <AssetGrid
        assets={list}
        onPick={(a) => setPreview(a.id)}
        onFav={(a) => toggleFav(a.id)}
        onDelete={(a) => removeAsset(a.id)}
      />

      {cur && (
        <div className="lightbox" onClick={() => setPreview(null)}>
          <div className="lb-body" onClick={(e) => e.stopPropagation()}>
            <div className="lb-head">
              <span>{cur.title}</span>
              <button className="x" onClick={() => setPreview(null)}>
                ×
              </button>
            </div>
            <AssetView asset={cur} maxHeight={520} />
            <div className="lb-meta">
              <span>{cur.modeName}</span>
              <span>{cur.model}</span>
              <span>{new Date(cur.createdAt).toLocaleString('zh-CN')}</span>
              <button
                className="mini"
                onClick={() => {
                  const ext = cur.type === 'image' ? 'png' : cur.type === 'video' ? 'mp4' : cur.type === 'audio' ? 'mp3' : 'txt';
                  const el = document.createElement('a');
                  el.href = cur.url;
                  el.download = `${cur.modeName ?? cur.type}-${cur.id}.${ext}`;
                  el.click();
                }}
              >
                ⤓ 下载
              </button>
            </div>
            {cur.prompt && <pre className="lb-prompt">{cur.prompt}</pre>}
          </div>
        </div>
      )}
    </div>
  );
}
