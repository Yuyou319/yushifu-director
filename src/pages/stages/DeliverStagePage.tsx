import { useApp } from '../../store';
import { goModeTargets } from '../../lib/engine';

export default function DeliverStagePage() {
  const project = useApp((s) => s.currentProject());
  const goMode = useApp((s) => s.goMode);

  const total = project.shots.length;
  const withVideo = project.shots.filter((s) => s.videoUrl).length;
  const withImage = project.shots.filter((s) => s.imageUrl).length;
  const totalSec = project.shots.reduce((a, s) => a + (s.duration || 0), 0);

  const checks = [
    { label: '创意已填写', ok: !!project.idea.trim() },
    { label: '制作方案已生成', ok: !!project.plan.trim() },
    { label: '剧本已生成', ok: !!project.script.trim() },
    { label: `资产条目（${project.assets.length}）`, ok: project.assets.length > 0 },
    { label: `分镜（${total} 镜）`, ok: total > 0 },
    { label: `画面已出（${withImage}）`, ok: total > 0 && withImage === total },
    { label: `视频已生成（${withVideo}）`, ok: total > 0 && withVideo === total },
    { label: 'Prompt 已保存', ok: project.prompts.length > 0 }
  ];

  const exportAll = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      project,
      prompts: project.prompts
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yushifu-${project.name}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="stage">
      <div className="stage-head">
        <h2>🎞️ 成片</h2>
        <p>合成前最后检查，然后导出项目与 Prompt 清单。</p>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>交付检查</h3>
          <span className="hint">
            {checks.filter((c) => c.ok).length}/{checks.length} 通过
          </span>
        </div>
        <div className="check-list">
          {checks.map((c) => (
            <div key={c.label} className={`check ${c.ok ? 'ok' : ''}`}>
              <span>{c.ok ? '✓' : '○'}</span>
              {c.label}
            </div>
          ))}
        </div>
      </div>

      <div className="plan-grid">
        <div className="card">
          <div className="card-head">
            <h3>影片信息</h3>
          </div>
          <div className="kv">
            <span>类型</span>
            <b>{project.params.videoType}</b>
            <span>时长</span>
            <b>{project.params.duration}（分镜合计 {totalSec}s）</b>
            <span>比例</span>
            <b>{project.params.ratio}</b>
            <span>模型</span>
            <b>{project.params.videoModel}</b>
            <span>风格</span>
            <b>{project.params.visualStyle}</b>
            <span>大师模式</span>
            <b>{project.params.masterOn ? project.params.master : '关闭'}</b>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>合成与导出</h3>
          </div>
          <div className="cfg-ops">
            <button className="mini" onClick={() => goMode('vidtools', 'vt.export')}>
              🎬 合成导出（多段拼接）
            </button>
            <button className="mini" onClick={() => goMode('vidtools', 'vt.subtitle')}>
              🔤 字幕烧录
            </button>
            <button className="mini" onClick={() => goMode('vidtools', 'vt.dub')}>
              🗣️ 视频配音
            </button>
            <button className="mini" onClick={() => goMode('vidtools', 'vt.upscale')}>
              🔎 视频高清放大
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>导出项目</h3>
          <button className="mini" onClick={exportAll}>
            ⤓ 导出 JSON
          </button>
        </div>
        <div className="home-note">
          导出内容包含：创意、策划案、剧本、资产库、分镜表、Saved Prompt（Original / Master 两版）与全部导演参数，可用于备份或迁移。
        </div>
        {project.prompts.length > 0 && (
          <div className="prompt-list">
            {project.prompts.slice(0, 5).map((p) => (
              <div key={p.id} className="prompt-item">
                <b>镜 {p.shotNo}</b>
                <pre>{p.master || p.original}</pre>
              </div>
            ))}
            {project.prompts.length > 5 && <div className="empty">…共 {project.prompts.length} 条，导出后查看完整内容</div>}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h3>快捷复用</h3>
        </div>
        <div className="chips">
          {goModeTargets.map((t) => (
            <button key={t.modeId} className="chip" onClick={() => goMode(t.groupId, t.modeId)}>
              {t.icon} {t.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
