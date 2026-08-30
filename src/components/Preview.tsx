import { Asset } from '../types';

export function AssetView({ asset, maxHeight = 320 }: { asset: Asset; maxHeight?: number }) {
  if (asset.type === 'image') return <img className="av-img" src={asset.url} alt={asset.title} style={{ maxHeight }} />;
  if (asset.type === 'video') {
    const isPoster = asset.url.startsWith('data:image');
    return isPoster ? (
      <div className="av-video-demo">
        <img className="av-img" src={asset.url} alt={asset.title} style={{ maxHeight }} />
        <span className="av-badge">演示占位帧</span>
      </div>
    ) : (
      <video className="av-img" src={asset.url} controls loop muted style={{ maxHeight }} />
    );
  }
  if (asset.type === 'audio')
    return (
      <div className="av-audio">
        <audio src={asset.url} controls style={{ width: '100%' }} />
      </div>
    );
  return <pre className="av-text">{asset.url}</pre>;
}

export function AssetGrid({
  assets,
  onPick,
  onFav,
  onDelete
}: {
  assets: Asset[];
  onPick?: (a: Asset) => void;
  onFav?: (a: Asset) => void;
  onDelete?: (a: Asset) => void;
}) {
  if (assets.length === 0) return <div className="empty">暂无结果</div>;
  return (
    <div className="agrid">
      {assets.map((a) => (
        <div key={a.id} className="acard">
          <div className="acard-media" onClick={() => onPick?.(a)}>
            <AssetView asset={a} maxHeight={190} />
          </div>
          <div className="acard-bar">
            <span className="acard-title" title={a.title}>
              {a.title}
            </span>
            <div className="acard-ops">
              {onFav && (
                <button className="mini" onClick={() => onFav(a)} title="收藏">
                  {a.favorite ? '★' : '☆'}
                </button>
              )}
              <button
                className="mini"
                onClick={() => {
                  const ext = a.type === 'image' ? 'png' : a.type === 'video' ? 'mp4' : a.type === 'audio' ? 'mp3' : 'txt';
                  const el = document.createElement('a');
                  el.href = a.url;
                  el.download = `${a.modeName ?? a.type}-${a.id}.${ext}`;
                  el.click();
                }}
                title="下载"
              >
                ⤓
              </button>
              {onDelete && (
                <button className="mini" onClick={() => onDelete(a)} title="删除">
                  ×
                </button>
              )}
            </div>
          </div>
          {a.prompt && <div className="acard-prompt">{a.prompt}</div>}
        </div>
      ))}
    </div>
  );
}
