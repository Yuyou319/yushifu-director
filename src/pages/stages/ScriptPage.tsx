import { useState } from 'react';
import { useApp } from '../../store';
import { buildScriptOutline } from '../../lib/director';
import { generateText } from '../../lib/engine';
import { splitScriptToShots } from '../../lib/director';

const STRUCTURE = [
  { key: '开场', hint: '建立人物与常态' },
  { key: '转折', hint: '出现阻力与选择' },
  { key: '高潮', hint: '冲突最大化' },
  { key: '收束', hint: '情绪落点' }
];

export default function ScriptPage() {
  const project = useApp((s) => s.currentProject());
  const updateProject = useApp((s) => s.updateProject);
  const setRoute = useApp((s) => s.setRoute);
  const [busy, setBusy] = useState(false);
  const [shotCount, setShotCount] = useState(12);

  const generate = async () => {
    setBusy(true);
    const outline = buildScriptOutline(project);
    const out = await generateText(
      `请基于以下要求，写一个完整剧本。要求：\n1. 按「开场 / 转折 / 高潮 / 收束」四段标注；\n2. 台词克制，用动作与细节表达情绪；\n3. 场景不超过 3 个；\n4. 结尾回到开场母题形成呼应。\n\n${outline}\n\n${project.plan ? `策划案：\n${project.plan}` : ''}`,
      '你是职业编剧与 AI 视频导演，输出专业、具体、可直接分镜的剧本。'
    );
    updateProject({ script: out });
    setBusy(false);
  };

  const toShots = () => {
    const rows = splitScriptToShots(project.script, shotCount);
    updateProject({ shots: rows });
    setRoute({ kind: 'stage', id: 'shot' });
  };

  const missing = STRUCTURE.filter((s) => !project.script.includes(s.key)).map((s) => s.key);

  return (
    <div className="stage">
      <div className="stage-head">
        <h2>📜 剧本</h2>
        <p>按「开场 / 转折 / 高潮 / 收束」四段结构写，台词克制，场景尽量少。</p>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>剧本正文</h3>
          <div className="row-gap">
            <button className="mini" disabled={busy || !project.idea.trim()} onClick={generate}>
              {busy ? '生成中…' : '✨ AI 生成剧本'}
            </button>
            <button className="mini" onClick={() => updateProject({ script: buildScriptOutline(project) })}>
              填入结构模板
            </button>
          </div>
        </div>
        <textarea
          className="inp prompt"
          rows={18}
          value={project.script}
          placeholder="在此编写剧本，或点击「AI 生成剧本」"
          onChange={(e) => updateProject({ script: e.target.value })}
        />
        <div className="script-foot">
          <span>{project.script.length} 字</span>
          {project.script.trim() && (
            <span className={missing.length ? 'warn' : 'ok'}>
              {missing.length ? `结构缺失：${missing.join(' / ')}` : '四段结构完整 ✓'}
            </span>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>拆分为分镜</h3>
        </div>
        <div className="split-row">
          <label className="dir-label">
            镜头数量
            <input
              className="inp"
              type="number"
              min={3}
              max={60}
              value={shotCount}
              onChange={(e) => setShotCount(Math.max(3, Math.min(60, Number(e.target.value) || 12)))}
            />
          </label>
          <button className="primary" disabled={!project.script.trim()} onClick={toShots}>
            拆分为 {shotCount} 个镜头 →
          </button>
        </div>
        <div className="home-note">
          拆分后会进入「分镜」阶段，可逐镜编辑景别、运镜、画面描述与时长。配置文本 API 后，AI 会生成更合理的镜头切分。
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>结构提示</h3>
        </div>
        <div className="struct">
          {STRUCTURE.map((s) => (
            <div key={s.key} className={`struct-item ${project.script.includes(s.key) ? 'ok' : ''}`}>
              <b>{s.key}</b>
              <span>{s.hint}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
