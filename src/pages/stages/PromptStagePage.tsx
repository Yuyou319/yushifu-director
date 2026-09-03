import { useMemo, useState } from 'react';
import { useApp } from '../../store';
import { buildPair } from '../../lib/director';
import { VIDEO_MODEL_NAMES, findVideoModel } from '../../data/videomodels';
import PromptCompare from '../../components/PromptCompare';
import { copyText } from '../../lib/clipboard';
import { PromptItem } from '../../types';

export default function PromptStagePage() {
  const project = useApp((s) => s.currentProject());
  const updateProject = useApp((s) => s.updateProject);
  const updateParams = useApp((s) => s.updateParams);
  const setRoute = useApp((s) => s.setRoute);
  const [sel, setSel] = useState<string>('');

  const model = findVideoModel(project.params.videoModel);

  const pairs = useMemo(
    () => project.shots.map((s) => ({ shot: s, ...buildPair(project, s) })),
    [project]
  );

  const current = pairs.find((x) => x.shot.id === sel) ?? pairs[0];

  const save = () => {
    if (!current) return;
    const items: PromptItem[] = pairs.map((x) => ({
      id: `pr_${x.shot.id}`,
      shotId: x.shot.id,
      shotNo: x.shot.no,
      model: project.params.videoModel,
      original: x.original,
      master: x.master,
      diff: x.diff,
      updatedAt: Date.now()
    }));
    updateProject({ prompts: items });
  };

  const copyAll = () => {
    const text = pairs
      .map((x) => `【镜 ${x.shot.no}】\nOriginal: ${x.original}\n${x.master ? `Master: ${x.master}\n` : ''}`)
      .join('\n\n');
    void copyText(text);
  };

  return (
    <div className="stage">
      <div className="stage-head">
        <h2>🧾 Prompt</h2>
        <p>
          按「{model.name}」的 Prompt 结构重新组织每一镜；开启大师模式后可逐镜查看
          <b> Original VS Director Master </b>
          对比与修改了什么。
        </p>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>模型与大师模式</h3>
          <div className="row-gap">
            <button className="mini" onClick={save}>
              💾 保存 Prompt 版本
            </button>
            <button className="mini" onClick={copyAll}>
              复制全部
            </button>
            <button className="mini" onClick={() => setRoute({ kind: 'stage', id: 'generate' })}>
              下一步：生成 →
            </button>
          </div>
        </div>
        <div className="prompt-cfg">
          <label className="dir-label">
            视频模型
            <select className="inp" value={project.params.videoModel} onChange={(e) => updateParams({ videoModel: e.target.value })}>
              {VIDEO_MODEL_NAMES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="switch-label">
            <input
              type="checkbox"
              checked={project.params.masterOn}
              onChange={(e) => updateParams({ masterOn: e.target.checked })}
            />
            启用电影大师模式（{project.params.master || '未选择'}）
          </label>
        </div>
        <div className="dir-note">
          结构：{model.structure.join(' → ')}｜{model.tips}
        </div>
      </div>

      {pairs.length === 0 ? (
        <div className="card">
          <div className="empty">还没有分镜，先到「分镜」阶段生成镜头。</div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-head">
              <h3>逐镜切换</h3>
              <span className="hint">共 {pairs.length} 镜</span>
            </div>
            <div className="chips">
              {pairs.map((x) => (
                <button
                  key={x.shot.id}
                  className={`chip ${(current?.shot.id ?? '') === x.shot.id ? 'on' : ''}`}
                  onClick={() => setSel(x.shot.id)}
                >
                  镜 {x.shot.no} · {x.shot.size}
                </button>
              ))}
            </div>
          </div>

          {current && (
            <div className="card">
              <div className="card-head">
                <h3>
                  镜 {current.shot.no}｜{current.shot.size}｜{current.shot.camera}｜{current.shot.duration}s
                </h3>
              </div>
              <p className="shot-desc">{current.shot.desc || current.shot.line || '（该镜暂无描述）'}</p>
              <PromptCompare
                original={current.original}
                master={current.master}
                diff={current.diff}
                masterName={project.params.master}
              />
            </div>
          )}

          <div className="card">
            <div className="card-head">
              <h3>全片 Prompt 一览</h3>
            </div>
            <div className="prompt-list">
              {pairs.map((x) => (
                <div key={x.shot.id} className="prompt-item">
                  <b>镜 {x.shot.no}</b>
                  <pre>{x.master || x.original}</pre>
                  <button
                    className="mini"
                    onClick={() => {
                      void copyText(x.master || x.original);
                    }}
                  >
                    复制
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
