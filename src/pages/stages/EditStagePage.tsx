import { useState } from 'react';
import GeneratePage from '../GeneratePage';
import { useApp } from '../../store';

export default function EditStagePage() {
  const project = useApp((s) => s.currentProject());
  const updateProject = useApp((s) => s.updateProject);
  const setRoute = useApp((s) => s.setRoute);
  const [tab, setTab] = useState<'vidtools' | 'imgtools'>('vidtools');

  const done = project.shots.filter((s) => s.videoUrl).length;
  const totalSec = project.shots.reduce((a, s) => a + (s.duration || 0), 0);

  return (
    <div className="gen-stage">
      <div className="gen-stage-bar">
        <div className="tabs">
          <button className={`tab ${tab === 'vidtools' ? 'on' : ''}`} onClick={() => setTab('vidtools')}>
            🎛️ 视频工具
          </button>
          <button className={`tab ${tab === 'imgtools' ? 'on' : ''}`} onClick={() => setTab('imgtools')}>
            🛠️ 图像工具
          </button>
        </div>
        <div className="row-gap">
          <span className="hint">
            已生成 {done}/{project.shots.length} 镜 · 总时长 {totalSec}s
          </span>
          <button className="mini" onClick={() => setRoute({ kind: 'stage', id: 'deliver' })}>
            下一步：成片 →
          </button>
        </div>
      </div>

      <div className="stage timeline-wrap">
        {project.shots.length > 0 && (
          <div className="card">
            <div className="card-head">
              <h3>时间轴</h3>
              <span className="hint">点击片段可移除视频</span>
            </div>
            <div className="timeline">
              {project.shots.map((s) => (
                <div
                  key={s.id}
                  className={`tl-clip ${s.videoUrl ? 'ok' : ''}`}
                  style={{ flexGrow: Math.max(1, s.duration) }}
                  title={`镜 ${s.no}｜${s.size}｜${s.camera}｜${s.duration}s`}
                  onClick={() => s.videoUrl && updateProject({ shots: project.shots.map((x) => (x.id === s.id ? { ...x, videoUrl: undefined } : x)) })}
                >
                  <span className="tl-no">{s.no}</span>
                  <span className="tl-txt">{s.desc.slice(0, 18) || s.size}</span>
                </div>
              ))}
            </div>
            <div className="tl-scale">
              {project.shots.map((s) => (
                <span key={s.id} style={{ flexGrow: Math.max(1, s.duration) }}>
                  {s.duration}s
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <GeneratePage groupId={tab} />
    </div>
  );
}
