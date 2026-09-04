import { useMemo, useState } from 'react';
import { useApp } from '../store';
import { GROUPS, QUICK_MODES, findMode } from '../data/modes';
import { STAGES } from '../types';
import { AssetGrid } from '../components/Preview';
import AppIcon from '../components/AppIcon';

export default function HomePage() {
  const assets = useApp((s) => s.assets);
  const tasks = useApp((s) => s.tasks);
  const settings = useApp((s) => s.settings);
  const goMode = useApp((s) => s.goMode);
  const setPage = useApp((s) => s.setPage);
  const setRoute = useApp((s) => s.setRoute);
  const project = useApp((s) => s.currentProject());
  const toggleFav = useApp((s) => s.toggleFav);
  const removeAsset = useApp((s) => s.removeAsset);
  const [q, setQ] = useState('');

  const stat = useMemo(() => {
    const s = { image: 0, video: 0, audio: 0, text: 0 };
    assets.forEach((a) => (s[a.type] += 1));
    return s;
  }, [assets]);

  const recent = useMemo(() => {
    const list = q.trim()
      ? assets.filter(
          (a) => a.title.includes(q) || (a.prompt ?? '').includes(q) || (a.modeName ?? '').includes(q)
        )
      : assets;
    return list.slice(0, 12);
  }, [assets, q]);

  const apiStatus = (['text', 'image', 'video', 'audio'] as const).map((k) => ({
    key: k,
    label: k === 'text' ? '文本 LLM' : k === 'image' ? '生图' : k === 'video' ? '生视频' : '生音频',
    ok: !!settings[k].apiKey && !!settings[k].baseUrl
  }));

  const running = tasks.filter((t) => t.status === 'running');

  return (
    <div className="home">
      <div className="hero">
        <div>
          <h1>于师傅的导演台</h1>
          <p>AI 导演工作台 · 9 步导演流程 + 45 项创作功能 · 自带 API（BYOK）· 数据不出本机</p>
          <div className="row-gap" style={{ marginTop: 10 }}>
            <button className="primary" onClick={() => setRoute({ kind: 'stage', id: 'idea' })}>
              ▶ 进入导演流程
            </button>
            <button className="mini" onClick={() => setPage('projects')}>
              🗂️ 项目列表
            </button>
          </div>
        </div>
        <div className="hero-stat">
          <div>
            <b>{assets.length}</b>
            <span>资产</span>
          </div>
          <div>
            <b>{stat.image}</b>
            <span>图片</span>
          </div>
          <div>
            <b>{stat.video}</b>
            <span>视频</span>
          </div>
          <div>
            <b>{stat.audio}</b>
            <span>音频</span>
          </div>
        </div>
      </div>

      <div className="home-grid">
        <div className="card span3">
          <div className="card-head">
            <h3>导演流程</h3>
            <button className="mini" onClick={() => setRoute({ kind: 'stage', id: 'idea' })}>
              打开「{project.name}」
            </button>
          </div>
          <div className="quick">
            {STAGES.map((s) => (
              <button key={s.id} className="quick-item" onClick={() => setRoute({ kind: 'stage', id: s.id })}>
                <AppIcon id={s.id} className="quick-ico" />
                <span className="quick-name">{s.name}</span>
                <span className="quick-desc">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card span2">
          <div className="card-head">
            <h3>快捷创作</h3>
          </div>
          <div className="quick">
            {QUICK_MODES.map((m) => {
              const found = findMode(m.modeId);
              return (
                <button
                  key={m.modeId}
                  className="quick-item"
                  onClick={() => found && goMode(found.group.id, found.mode.id)}
                >
                  <AppIcon id={found?.group.id ?? 'home'} className="quick-ico" />
                  <span className="quick-name">{m.name}</span>
                  <span className="quick-desc">{m.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>API 状态</h3>
            <button className="mini" onClick={() => setPage('settings')}>
              去配置
            </button>
          </div>
          <div className="api-list">
            {apiStatus.map((a) => (
              <div key={a.key} className="api-row">
                <span className={`dot ${a.ok ? 'ok' : 'off'}`} />
                <span className="api-name">{a.label}</span>
                <span className={`api-tag ${a.ok ? 'ok' : 'off'}`}>{a.ok ? '已配置' : '未配置'}</span>
              </div>
            ))}
          </div>
          <div className="home-note">
            未配置的模态会以「演示模式」本地出图，方便先跑通流程；填入 Key 后自动切换为真实调用。
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>任务队列</h3>
            {running.length > 0 && <span className="dot-run">{running.length} 进行中</span>}
          </div>
          {tasks.length === 0 && <div className="empty">暂无任务</div>}
          {tasks.slice(0, 6).map((t) => (
            <div key={t.id} className={`task ${t.status}`}>
              <div className="task-top">
                <span className="task-name">{t.modeName}</span>
                <span className="task-st">
                  {t.status === 'running' ? `${Math.round(t.progress)}%` : t.status === 'done' ? '完成' : t.status === 'error' ? '失败' : '排队'}
                </span>
              </div>
              <div className="task-bar">
                <div className="task-fill" style={{ width: `${t.progress}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card span2">
          <div className="card-head">
            <h3>功能地图</h3>
          </div>
          <div className="map">
            {GROUPS.map((g) => (
              <button key={g.id} className="map-item" onClick={() => setPage(g.id as never)}>
                <AppIcon id={`map-${g.id}`} className="map-ico" size={26} />
                <span className="map-name">{g.name}</span>
                <span className="map-cnt">{g.modes.length} 项</span>
                <span className="map-desc">{g.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card span3">
          <div className="card-head">
            <h3>最近生成</h3>
            <input className="inp search" placeholder="搜索提示词 / 功能名" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <AssetGrid assets={recent} onFav={(a) => toggleFav(a.id)} onDelete={(a) => removeAsset(a.id)} />
        </div>
      </div>
    </div>
  );
}
