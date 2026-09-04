import { useEffect, useMemo, useState } from 'react';
import { useApp, PageId } from './store';
import { GROUPS } from './data/modes';
import { STAGES, StageId } from './types';
import WorkflowBar from './components/WorkflowBar';
import DirectorRight from './components/DirectorRight';
import AppIcon from './components/AppIcon';

import HomePage from './pages/HomePage';
import GeneratePage from './pages/GeneratePage';
import CanvasPage from './pages/CanvasPage';
import AssetsPage from './pages/AssetsPage';
import ProjectsPage from './pages/ProjectsPage';
import SettingsPage from './pages/SettingsPage';

import IdeaPage from './pages/stages/IdeaPage';
import PlanPage from './pages/stages/PlanPage';
import ScriptPage from './pages/stages/ScriptPage';
import AssetStagePage from './pages/stages/AssetStagePage';
import ShotPage from './pages/stages/ShotPage';
import PromptStagePage from './pages/stages/PromptStagePage';
import GenerateStagePage from './pages/stages/GenerateStagePage';
import EditStagePage from './pages/stages/EditStagePage';
import DeliverStagePage from './pages/stages/DeliverStagePage';

const STAGE_VIEWS: Record<StageId, () => JSX.Element> = {
  idea: IdeaPage,
  plan: PlanPage,
  script: ScriptPage,
  asset: AssetStagePage,
  shot: ShotPage,
  prompt: PromptStagePage,
  generate: GenerateStagePage,
  edit: EditStagePage,
  deliver: DeliverStagePage
};

interface ToolItem {
  id: PageId;
  name: string;
  icon: string;
  section: string;
}

const TOOLS: ToolItem[] = [
  { id: 'home', name: '工作台', icon: '🏠', section: '总览' },
  { id: 'image', name: '生图', icon: '🎨', section: '创作工具' },
  { id: 'video', name: '生视频', icon: '🎬', section: '创作工具' },
  { id: 'audio', name: '生音频', icon: '🔊', section: '创作工具' },
  { id: 'script', name: '剧本 / 分镜', icon: '📜', section: '创作工具' },
  { id: 'character', name: '角色一致性', icon: '👤', section: '创作工具' },
  { id: 'imgtools', name: '图像工具', icon: '🛠️', section: '创作工具' },
  { id: 'vidtools', name: '视频工具', icon: '🎛️', section: '创作工具' },
  { id: 'canvas', name: '无限画布', icon: '🕸️', section: '编排' },
  { id: 'assets', name: '资产库', icon: '📦', section: '管理' },
  { id: 'projects', name: '项目', icon: '🗂️', section: '管理' },
  { id: 'settings', name: '设置', icon: '⚙️', section: '管理' }
];

const TOOL_SECTIONS = Array.from(new Set(TOOLS.map((t) => t.section)));

export default function App() {
  const route = useApp((s) => s.route);
  const setRoute = useApp((s) => s.setRoute);
  const projects = useApp((s) => s.projects);
  const project = useApp((s) => s.currentProject());
  const selectProject = useApp((s) => s.selectProject);
  const newProject = useApp((s) => s.newProject);
  const assets = useApp((s) => s.assets);
  const tasks = useApp((s) => s.tasks);
  const prefs = useApp((s) => s.prefs);
  const setPrefs = useApp((s) => s.setPrefs);

  const running = tasks.filter((t) => t.status === 'running').length;
  const [q, setQ] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.documentElement.dataset.theme = 'dark';
  }, []);

  const match = (t: string) => t.toLowerCase().includes(q.trim().toLowerCase());

  const stages = useMemo(() => (q.trim() ? STAGES.filter((s) => match(s.name)) : STAGES), [q]);
  const toolSections = useMemo(
    () =>
      TOOL_SECTIONS.map((sec) => ({
        sec,
        items: q.trim() ? TOOLS.filter((t) => t.section === sec && match(t.name)) : TOOLS.filter((t) => t.section === sec)
      })).filter((g) => g.items.length > 0),
    [q]
  );

  const routeName =
    route.kind === 'stage' ? STAGES.find((s) => s.id === route.id)?.name ?? '' : TOOLS.find((t) => t.id === route.id)?.name ?? '';
  const savedAt = new Date(project.updatedAt).toLocaleTimeString('zh-CN', { hour12: false });

  const StageView = route.kind === 'stage' ? STAGE_VIEWS[route.id] : null;

  const renderTool = () => {
    const id = route.kind === 'tool' ? route.id : '';
    if (id === 'home') return <HomePage />;
    if (id === 'canvas') return <CanvasPage />;
    if (id === 'assets') return <AssetsPage />;
    if (id === 'projects') return <ProjectsPage />;
    if (id === 'settings') return <SettingsPage />;
    if (GROUPS.some((g) => g.id === id)) return <GeneratePage key={id} groupId={id} />;
    return <HomePage />;
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-logo"><AppIcon id="brand" /></span>
          <span>于师傅的导演台</span>
          {routeName && <span className="brand-sub">/ {routeName}</span>}
        </div>

        <div className="top-search">
          <input
            className="inp"
            placeholder="搜索创作功能 / 提示词"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="top-tools">
          <div className="proj-switch">
            <select
              className="inp"
              value={project.id}
              onChange={(e) => selectProject(e.target.value)}
              title="切换项目"
            >
              {projects.length === 0 && <option value={project.id}>{project.name}</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button className="mini" onClick={() => newProject()} title="新建项目">
              ＋
            </button>
          </div>

          <div className="credits-chip" title="积分余额">⚡ 129,900</div>

          <button className="top-icon" title="通知">
            🔔
          </button>

          <button
            className={`mini ${prefs.demoMode ? 'on' : ''}`}
            title="未配置 API 时用本地演示结果"
            onClick={() => setPrefs({ demoMode: !prefs.demoMode })}
          >
            {prefs.demoMode ? '演示' : '真实 API'}
          </button>

          <button
            className="top-icon"
            title="设置"
            onClick={() => setRoute({ kind: 'tool', id: 'settings' })}
          >
            ⚙️
          </button>

          <div className="top-avatar" title="用户">L</div>
        </div>
      </header>

      {route.kind === 'stage' && <WorkflowBar />}

      <div className="body">
        <nav className="nav">
          <div className="nav-search">
            <div className="search-box">
              <input
                className="inp"
                placeholder="搜索功能…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className={`nav-group ${collapsed['stage'] ? 'collapsed' : ''}`}>
            <div className="nav-sec" onClick={() => setCollapsed({ ...collapsed, stage: !collapsed['stage'] })}>
              <span>导演流程</span>
              <span className="chevron">⌄</span>
            </div>
            {stages.map((s) => (
              <button
                key={s.id}
                className={`nav-item ${route.kind === 'stage' && route.id === s.id ? 'on' : ''}`}
                onClick={() => setRoute({ kind: 'stage', id: s.id })}
                title={s.desc}
              >
                <span className="nav-ico"><AppIcon id={s.id} /></span>
                <span>{s.name}</span>
              </button>
            ))}
          </div>

          {toolSections.map(({ sec, items }) => (
            <div key={sec} className={`nav-group ${collapsed[sec] ? 'collapsed' : ''}`}>
              <div className="nav-sec" onClick={() => setCollapsed({ ...collapsed, [sec]: !collapsed[sec] })}>
                <span>{sec}</span>
                <span className="chevron">⌄</span>
              </div>
              {items.map((t) => (
                <button
                  key={t.id}
                  className={`nav-item ${route.kind === 'tool' && route.id === t.id ? 'on' : ''}`}
                  onClick={() => setRoute({ kind: 'tool', id: t.id })}
                >
                  <span className="nav-ico"><AppIcon id={t.id} /></span>
                  <span>{t.name}</span>
                  {t.id === 'assets' && assets.length > 0 && <span className="nav-badge">{assets.length}</span>}
                </button>
              ))}
            </div>
          ))}

          <div className="nav-foot">
            {GROUPS.reduce((s, g) => s + g.modes.length, 0)} 项创作功能 · 9 步导演流程 · 数据存本机
          </div>
        </nav>

        <main className="main">{StageView ? <StageView /> : renderTool()}</main>

        {route.kind === 'stage' && <DirectorRight />}
      </div>

      <footer className="statusbar">
        <div className="status-left">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="status-dot" />
            {running > 0 ? `生成中 ${running}` : '就绪'}
          </span>
          <span>{routeName || '工作台'}</span>
          <span>{project.name}</span>
        </div>
        <div>资产 {assets.length} · 自动保存于 {savedAt}</div>
      </footer>
    </div>
  );
}
