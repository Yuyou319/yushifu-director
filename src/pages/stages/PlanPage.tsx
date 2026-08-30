import { useState } from 'react';
import { useApp } from '../../store';
import { VIDEO_TYPE_MAP } from '../../data/videoTypes';
import { buildPlan, buildScriptOutline } from '../../lib/director';
import { generateText } from '../../lib/engine';

export default function PlanPage() {
  const project = useApp((s) => s.currentProject());
  const updateProject = useApp((s) => s.updateProject);
  const setRoute = useApp((s) => s.setRoute);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const sop = VIDEO_TYPE_MAP[project.params.videoType];

  const generate = async () => {
    setBusy(true);
    const outline = buildScriptOutline(project);
    const out = sop
      ? await generateText(
          `请基于以下信息，输出一份可执行的制作策划案（含：创意解读、叙事策略、视觉方案、镜头策略、声音方案、制作风险与规避、执行排期建议）：\n\n${outline}\n\n类型 SOP：\n${buildPlan(project)}`,
          '你是资深影视制片人与 AI 视频导演，输出专业、具体、可执行。'
        )
      : '';
    updateProject({ plan: out || buildPlan(project), sop: sop?.steps ?? [] });
    setBusy(false);
  };

  const useTemplate = () => {
    updateProject({ plan: buildPlan(project), sop: sop?.steps ?? [] });
  };

  return (
    <div className="stage">
      <div className="stage-head">
        <h2>🧭 策划</h2>
        <p>根据「{project.params.videoType}」自动匹配制作 SOP。可以直接用模板，也可以让 AI 生成完整策划案。</p>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>制作方案</h3>
          <div className="row-gap">
            <button className="mini" onClick={useTemplate}>
              使用 SOP 模板
            </button>
            <button className="mini" disabled={busy} onClick={generate}>
              {busy ? '生成中…' : '✨ AI 生成策划案'}
            </button>
            <button className="mini" onClick={() => setRoute({ kind: 'stage', id: 'script' })}>
              下一步：剧本 →
            </button>
          </div>
        </div>
        <textarea
          className="inp prompt"
          rows={16}
          value={project.plan}
          placeholder="点击上方按钮生成策划案，或直接在这里编写"
          onChange={(e) => updateProject({ plan: e.target.value })}
        />
      </div>

      {sop && (
        <>
          <div className="card">
            <div className="card-head">
              <h3>制作流程 SOP（{sop.name}）</h3>
            </div>
            <div className="sop-list">
              {sop.steps.map((s, i) => (
                <div key={s.title} className="sop-step">
                  <div className="sop-idx">{i + 1}</div>
                  <div>
                    <b>{s.title}</b>
                    <p>{s.detail}</p>
                  </div>
                  <label className="sop-check">
                    <input
                      type="checkbox"
                      checked={!!checked[s.title]}
                      onChange={(e) => setChecked({ ...checked, [s.title]: e.target.checked })}
                    />
                    完成
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="plan-grid">
            <div className="card">
              <div className="card-head">
                <h3>前期准备</h3>
              </div>
              <ul className="plan-list">
                {sop.prep.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="card">
              <div className="card-head">
                <h3>一致性控制重点</h3>
              </div>
              <ul className="plan-list">
                {sop.consistencyFocus.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="card">
              <div className="card-head">
                <h3>Prompt 描述重点</h3>
              </div>
              <p className="plan-text">{sop.promptFocus}</p>
            </div>
            <div className="card">
              <div className="card-head">
                <h3>推荐工具链</h3>
              </div>
              <div className="chips">
                {sop.tools.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
