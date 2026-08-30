import { STAGES, StageId } from '../types';
import { useApp } from '../store';
import { stageProgress } from '../lib/director';
import AppIcon from './AppIcon';

export default function WorkflowBar() {
  const project = useApp((s) => s.currentProject());
  const route = useApp((s) => s.route);
  const setRoute = useApp((s) => s.setRoute);
  const progress = stageProgress(project);

  return (
    <div className="wfbar">
      {STAGES.map((s, i) => {
        const p = progress[s.id] ?? 0;
        const active = route.kind === 'stage' && route.id === s.id;
        return (
          <div key={s.id} className={`wf-step ${active ? 'on' : ''}`}>
            <button className="wf-btn" onClick={() => setRoute({ kind: 'stage', id: s.id })} title={s.desc}>
              <span className="wf-idx">{p >= 100 ? '✓' : i + 1}</span>
              <span className="wf-ico"><AppIcon id={s.id} /></span>
              <span className="wf-name">{s.name}</span>
            </button>
            <div className="wf-bar">
              <i style={{ width: `${p}%` }} className={p >= 100 ? 'full' : ''} />
            </div>
            {i < STAGES.length - 1 && <span className="wf-arrow">›</span>}
          </div>
        );
      })}
    </div>
  );
}
