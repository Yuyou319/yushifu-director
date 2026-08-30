import { useState } from 'react';
import { useApp } from '../../store';
import { VIDEO_TYPES, VIDEO_TYPE_MAP } from '../../data/videoTypes';
import { generateText } from '../../lib/engine';
import { paramsToText } from '../../lib/director';

const SAMPLES = [
  '一位退休邮差在旧仓库里发现二十年前未寄出的信，决定亲自送达',
  '深夜便利店里，两个陌生人因为最后一盒便当开始聊天',
  '一个不会游泳的男孩每天在泳池边坐着，直到有一天他决定下水'
];

export default function IdeaPage() {
  const project = useApp((s) => s.currentProject());
  const updateProject = useApp((s) => s.updateProject);
  const updateParams = useApp((s) => s.updateParams);
  const setRoute = useApp((s) => s.setRoute);
  const [busy, setBusy] = useState(false);

  const sop = VIDEO_TYPE_MAP[project.params.videoType];

  const expand = async () => {
    if (!project.idea.trim()) return;
    setBusy(true);
    const out = await generateText(
      `请把下面的一句话创意扩展为一个可用于拍摄的创意简报（含：核心主张、目标观众、情绪关键词、3 个可选方向、推荐时长与镜头数量）：\n\n${project.idea}`,
      '你是资深广告与影视创意总监，输出专业、具体、可执行。'
    );
    updateProject({ idea: `${project.idea}\n\n【创意简报】\n${out}` });
    setBusy(false);
  };

  return (
    <div className="stage">
      <div className="stage-head">
        <h2>💡 创意</h2>
        <p>用一句话说清楚你想做什么，右侧选择影片类型，AI 会按类型匹配后续整套制作流程。</p>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>项目名称</h3>
        </div>
        <input
          className="inp"
          value={project.name}
          onChange={(e) => updateProject({ name: e.target.value })}
          placeholder="给这个项目起个名字"
        />
      </div>

      <div className="card">
        <div className="card-head">
          <h3>一句话创意</h3>
          <div className="row-gap">
            <button className="mini" onClick={() => updateProject({ idea: SAMPLES[Math.floor(Math.random() * SAMPLES.length)] })}>
              🎲 示例
            </button>
            <button className="mini" disabled={busy || !project.idea.trim()} onClick={expand}>
              {busy ? '生成中…' : '✨ AI 扩展创意简报'}
            </button>
          </div>
        </div>
        <textarea
          className="inp prompt"
          rows={7}
          value={project.idea}
          placeholder="例：一位退休邮差在旧仓库里发现二十年前未寄出的信，决定亲自送达"
          onChange={(e) => updateProject({ idea: e.target.value })}
        />
      </div>

      <div className="card">
        <div className="card-head">
          <h3>影片类型（决定后续 SOP）</h3>
        </div>
        <div className="vtype-grid">
          {VIDEO_TYPES.map((t) => (
            <button
              key={t.id}
              className={`vtype ${project.params.videoType === t.name ? 'on' : ''}`}
              onClick={() => updateParams({ videoType: t.name })}
            >
              <span>{t.icon}</span>
              <span>{t.name}</span>
            </button>
          ))}
        </div>
        {sop && (
          <div className="idea-sop">
            <div>
              <b>制作目标</b>
              <p>{sop.goal}</p>
            </div>
            <div>
              <b>流程概览</b>
              <p>{sop.steps.map((s) => s.title).join(' → ')}</p>
            </div>
            <div>
              <b>分镜重点</b>
              <p>{sop.shotFocus}</p>
            </div>
            <div>
              <b>常见坑</b>
              <p>{sop.pitfalls.join('；')}</p>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h3>当前剧情参数</h3>
          <button className="mini" onClick={() => setRoute({ kind: 'stage', id: 'plan' })}>
            下一步：生成策划 →
          </button>
        </div>
        <div className="dir-note">{paramsToText(project.params)}</div>
      </div>
    </div>
  );
}
