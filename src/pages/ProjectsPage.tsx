import { useRef, useState } from 'react';
import { useApp } from '../store';
import { stageProgress } from '../lib/director';
import { STAGES } from '../types';

export default function ProjectsPage() {
  const projects = useApp((s) => s.projects);
  const currentId = useApp((s) => s.currentId);
  const newProject = useApp((s) => s.newProject);
  const selectProject = useApp((s) => s.selectProject);
  const deleteProject = useApp((s) => s.deleteProject);
  const renameProject = useApp((s) => s.renameProject);
  const setRoute = useApp((s) => s.setRoute);
  const [name, setName] = useState('');
  const [idea, setIdea] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const overall = (p: (typeof projects)[number]) => {
    const pr = stageProgress(p);
    return Math.round(STAGES.reduce((a, s) => a + (pr[s.id] ?? 0), 0) / STAGES.length);
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ version: 1, projects }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yushifu-projects-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="projects">
      <div className="card">
        <div className="card-head">
          <h3>新建导演项目</h3>
        </div>
        <div className="new-proj">
          <input className="inp" placeholder="项目名称" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="inp" placeholder="一句话创意（可选）" value={idea} onChange={(e) => setIdea(e.target.value)} />
          <button
            className="primary"
            onClick={() => {
              newProject(name, idea);
              setName('');
              setIdea('');
            }}
          >
            ＋ 创建并进入
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>我的项目（{projects.length}）</h3>
          <div className="row-gap">
            <button className="mini" onClick={exportAll}>
              ⤓ 导出全部
            </button>
            <button className="mini" onClick={() => fileRef.current?.click()}>
              ⤒ 导入
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = () => {
                  try {
                    const d = JSON.parse(String(r.result));
                    if (Array.isArray(d.projects)) {
                      localStorage.setItem('yushifu_projects', JSON.stringify(d.projects));
                      location.reload();
                    }
                  } catch {
                    alert('导入失败：文件格式不合法');
                  }
                };
                r.readAsText(f);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        {projects.length === 0 && <div className="empty">还没有项目。先创建一个，从创意开始走完 9 步导演流程。</div>}

        <div className="proj-grid">
          {projects.map((p) => (
            <div key={p.id} className={`proj-card2 ${p.id === currentId ? 'on' : ''}`}>
              <div className="proj-top">
                <input className="inp" value={p.name} onChange={(e) => renameProject(p.id, e.target.value)} />
                <span className="proj-type">{p.params.videoType}</span>
              </div>
              <p className="proj-idea">{p.idea.slice(0, 90) || '（未填写创意）'}</p>
              <div className="proj-bar">
                <i style={{ width: `${overall(p)}%` }} />
              </div>
              <div className="proj-meta">
                <span>进度 {overall(p)}%</span>
                <span>{p.shots.length} 镜</span>
                <span>{p.assets.length} 资产</span>
                <span>{new Date(p.updatedAt).toLocaleDateString('zh-CN')}</span>
              </div>
              <div className="row-gap">
                <button
                  className="mini"
                  onClick={() => {
                    selectProject(p.id);
                    setRoute({ kind: 'stage', id: 'idea' });
                  }}
                >
                  打开
                </button>
                <button className="mini danger-text" onClick={() => confirm(`删除项目「${p.name}」？`) && deleteProject(p.id)}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
