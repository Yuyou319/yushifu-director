import { useState } from 'react';
import { useApp } from '../../store';
import { ShotRow } from '../../types';
import { submitAndWait } from '../../lib/engine';
import { generateText } from '../../lib/engine';

const SIZES = ['远景', '全景', '中景', '近景', '特写', '大特写'];
const CAMERAS = ['固定', '推进', '拉远', '横摇', '手持跟随', '环绕', '升降', '航拍'];

export default function ShotPage() {
  const project = useApp((s) => s.currentProject());
  const updateProject = useApp((s) => s.updateProject);
  const setRoute = useApp((s) => s.setRoute);
  const [busy, setBusy] = useState('');

  const patch = (id: string, p: Partial<ShotRow>) =>
    updateProject({ shots: project.shots.map((s) => (s.id === id ? { ...s, ...p } : s)) });

  const addShot = () =>
    updateProject({
      shots: [
        ...project.shots,
        {
          id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          no: project.shots.length + 1,
          size: '中景',
          camera: '固定',
          desc: '',
          line: '',
          duration: 3
        }
      ]
    });

  const genByAI = async () => {
    setBusy('ai');
    const out = await generateText(
      `请把下面的剧本拆成分镜表，每行一个镜头，格式为：镜号 | 景别 | 运镜 | 画面描述 | 台词/声音 | 时长(秒)。\n要求：景别用 远景/全景/中景/近景/特写/大特写；运镜用 固定/推进/拉远/横摇/手持跟随/环绕/升降/航拍；画面描述具体可执行，包含主体、动作、空间、光线。\n\n剧本：\n${project.script.slice(0, 2000)}`,
      '你是分镜师与 AI 视频导演，输出专业、具体、可直接生成画面的分镜表。'
    );
    const rows: ShotRow[] = out
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.includes('|'))
      .map((l, i) => {
        const c = l.split('|').map((x) => x.trim());
        return {
          id: `s_${Date.now()}_${i}`,
          no: Number(c[0]) || i + 1,
          size: c[1] || '中景',
          camera: c[2] || '固定',
          desc: c[3] || '',
          line: c[4] || '',
          duration: Number(c[5]) || 3
        };
      })
      .filter((r) => r.desc || r.line);
    if (rows.length) updateProject({ shots: rows });
    setBusy('');
  };

  const genImage = async (s: ShotRow) => {
    setBusy(`${s.id}_img`);
    const prompt = [project.params.visualStyle, s.size, s.camera, s.desc, s.line].filter(Boolean).join('，');
    const asset = await submitAndWait({ name: `分镜 ${s.no} 画面`, output: 'image', modality: 'image', prompt, groupId: 'shot' });
    if (asset) patch(s.id, { imageUrl: asset.url });
    setBusy('');
  };

  const genVideo = async (s: ShotRow) => {
    setBusy(`${s.id}_vid`);
    const prompt = [s.camera, s.desc, s.line, `${project.params.ratio}，${s.duration} 秒`].filter(Boolean).join('，');
    const asset = await submitAndWait({
      name: `分镜 ${s.no} 视频`,
      output: 'video',
      modality: 'video',
      prompt,
      groupId: 'shot',
      values: s.imageUrl ? { firstFrame: { id: s.id, url: s.imageUrl, name: `shot-${s.no}` } } : {}
    });
    if (asset) patch(s.id, { videoUrl: asset.url });
    setBusy('');
  };

  return (
    <div className="stage">
      <div className="stage-head">
        <h2>🎬 分镜</h2>
        <p>按情绪曲线排布景别与运镜。先出画面定构图，再用图生视频保持稳定。</p>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>分镜表（{project.shots.length}）</h3>
          <div className="row-gap">
            <button className="mini" onClick={addShot}>
              ＋ 添加镜头
            </button>
            <button className="mini" disabled={busy === 'ai' || !project.script.trim()} onClick={genByAI}>
              {busy === 'ai' ? '生成中…' : '✨ AI 生成分镜'}
            </button>
            <button className="mini" onClick={() => setRoute({ kind: 'stage', id: 'prompt' })}>
              下一步：Prompt →
            </button>
          </div>
        </div>

        {project.shots.length === 0 ? (
          <div className="empty">还没有分镜。回到「剧本」阶段拆分，或点「AI 生成分镜」。</div>
        ) : (
          <div className="shot-table">
            <div className="shot-head">
              <span>镜号</span>
              <span>景别</span>
              <span>运镜</span>
              <span>画面描述</span>
              <span>台词 / 声音</span>
              <span>秒</span>
              <span>画面</span>
              <span>操作</span>
            </div>
            {project.shots.map((s) => (
              <div key={s.id} className="shot-row">
                <span className="shot-no">{s.no}</span>
                <select className="inp" value={s.size} onChange={(e) => patch(s.id, { size: e.target.value })}>
                  {SIZES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <select className="inp" value={s.camera} onChange={(e) => patch(s.id, { camera: e.target.value })}>
                  {CAMERAS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <input className="inp" value={s.desc} onChange={(e) => patch(s.id, { desc: e.target.value })} placeholder="画面描述" />
                <input className="inp" value={s.line} onChange={(e) => patch(s.id, { line: e.target.value })} placeholder="台词 / 声音" />
                <input
                  className="inp"
                  type="number"
                  min={1}
                  max={30}
                  value={s.duration}
                  onChange={(e) => patch(s.id, { duration: Number(e.target.value) || 3 })}
                />
                <div className="shot-media">
                  {s.imageUrl ? (
                    <img src={s.imageUrl} alt="" onClick={() => patch(s.id, { imageUrl: undefined })} title="点击移除" />
                  ) : (
                    <button className="mini" disabled={busy === `${s.id}_img`} onClick={() => genImage(s)}>
                      {busy === `${s.id}_img` ? '…' : '出图'}
                    </button>
                  )}
                  {s.videoUrl && <span className="ok-dot" title="已生成视频">▶</span>}
                </div>
                <div className="row-gap">
                  <button className="mini" disabled={busy === `${s.id}_vid`} onClick={() => genVideo(s)}>
                    {busy === `${s.id}_vid` ? '…' : '生视频'}
                  </button>
                  <button
                    className="mini"
                    onClick={() =>
                      updateProject({
                        shots: project.shots.filter((x) => x.id !== s.id).map((x, i) => ({ ...x, no: i + 1 }))
                      })
                    }
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {project.shots.some((s) => s.imageUrl) && (
        <div className="card">
          <div className="card-head">
            <h3>分镜画面墙</h3>
          </div>
          <div className="shot-wall">
            {project.shots
              .filter((s) => s.imageUrl)
              .map((s) => (
                <figure key={s.id}>
                  <img src={s.imageUrl} alt="" />
                  <figcaption>
                    {s.no}. {s.size} · {s.camera} · {s.duration}s
                  </figcaption>
                </figure>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
