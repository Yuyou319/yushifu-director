import { useState } from 'react';
import { useApp } from '../../store';
import { ASSET_KINDS, AssetKind, AssetSpec } from '../../types';
import { autoAssetLibrary, buildAssetPrompt } from '../../lib/director';
import { submitAndWait } from '../../lib/engine';
import { generateText } from '../../lib/engine';

const KIND_ICON: Record<AssetKind, string> = {
  角色: '🧍',
  场景: '🏙️',
  道具: '🔦',
  服装: '👕',
  产品: '📦',
  美术风格: '🎨',
  关键参考图: '🖼️'
};

export default function AssetStagePage() {
  const project = useApp((s) => s.currentProject());
  const updateProject = useApp((s) => s.updateProject);
  const setRoute = useApp((s) => s.setRoute);
  const [busy, setBusy] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState('');

  const p = project.params;

  const patch = (id: string, patchItem: Partial<AssetSpec>) => {
    updateProject({
      assets: project.assets.map((a) => {
        if (a.id !== id) return a;
        const next = { ...a, ...patchItem };
        if (patchItem.desc !== undefined || patchItem.kind !== undefined || patchItem.consistency !== undefined) {
          next.prompt = buildAssetPrompt(next, p);
        }
        return next;
      })
    });
  };

  const gen = () => updateProject({ assets: autoAssetLibrary(project) });

  const genByAI = async () => {
    setBusy('ai');
    const out = await generateText(
      `请为下面这个项目输出「资产库清单」，按 角色 / 场景 / 道具 / 服装 / 产品 / 美术风格 / 关键参考图 七类分别列出，每一条给出：名称、描述、生成提示词、一致性要求（3-4 条）。\n\n项目：${project.name}\n类型：${p.videoType}\n风格：${p.visualStyle}\n创意：${project.idea}\n剧本：\n${project.script.slice(0, 1500)}`,
      '你是影视美术指导与 AI 视频资产设计师，输出结构化、可直接执行。'
    );
    setAiNote(out);
    if (project.assets.length === 0) updateProject({ assets: autoAssetLibrary(project) });
    setBusy('');
  };

  const genImage = async (a: AssetSpec) => {
    setBusy(a.id);
    const asset = await submitAndWait({
      name: `资产参考图 · ${a.name}`,
      output: 'image',
      modality: 'image',
      prompt: a.prompt || a.desc,
      groupId: 'asset'
    });
    if (asset) patch(a.id, { imageUrl: asset.url });
    setBusy('');
  };

  return (
    <div className="stage">
      <div className="stage-head">
        <h2>🎭 资产</h2>
        <p>先固化角色、场景、道具与风格，再进分镜。资产提示词会随你的描述自动重算。</p>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>资产库（{project.assets.length}）</h3>
          <div className="row-gap">
            <button className="mini" onClick={gen}>
              ⚡ 本地生成清单
            </button>
            <button className="mini" disabled={busy === 'ai'} onClick={genByAI}>
              {busy === 'ai' ? '生成中…' : '✨ AI 生成资产库'}
            </button>
            <button className="mini" onClick={() => setRoute({ kind: 'stage', id: 'shot' })}>
              下一步：分镜 →
            </button>
          </div>
        </div>
        {project.assets.length === 0 && (
          <div className="empty">还没有资产条目。点击「本地生成清单」快速搭建，或用 AI 生成完整资产库。</div>
        )}

        {ASSET_KINDS.filter((k) => project.assets.some((a) => a.kind === k)).map((k) => (
          <div key={k} className="asset-group">
            <div className="asset-group-title">
              {KIND_ICON[k]} {k}
              <button
                className="mini"
                onClick={() =>
                  updateProject({
                    assets: [
                      ...project.assets,
                      { id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, kind: k, name: `新${k}`, desc: '', prompt: '', consistency: [] }
                    ]
                  })
                }
              >
                ＋
              </button>
            </div>
            {project.assets
              .filter((a) => a.kind === k)
              .map((a) => (
                <div key={a.id} className="asset-item">
                  <div className="asset-row">
                    {a.imageUrl ? (
                      <img className="asset-thumb" src={a.imageUrl} alt="" onClick={() => setOpen(open === a.id ? null : a.id)} />
                    ) : (
                      <button className="asset-thumb empty" onClick={() => genImage(a)}>
                        {busy === a.id ? '生成中' : '生成图'}
                      </button>
                    )}
                    <input
                      className="inp"
                      value={a.name}
                      onChange={(e) => patch(a.id, { name: e.target.value })}
                      placeholder="名称"
                    />
                    <input
                      className="inp"
                      value={a.desc}
                      onChange={(e) => patch(a.id, { desc: e.target.value })}
                      placeholder="描述（人物小传 / 空间关系 / 材质…）"
                    />
                    <div className="row-gap">
                      <button className="mini" onClick={() => genImage(a)} disabled={busy === a.id}>
                        {busy === a.id ? '…' : '🖼 出图'}
                      </button>
                      <button
                        className="mini"
                        onClick={() => updateProject({ assets: project.assets.filter((x) => x.id !== a.id) })}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  {open === a.id && (
                    <div className="asset-detail">
                      <label>
                        生成提示词（自动合成，可手改）
                        <textarea className="inp" rows={3} value={a.prompt} onChange={(e) => patch(a.id, { prompt: e.target.value })} />
                      </label>
                      <label>
                        一致性要求（每行一条）
                        <textarea
                          className="inp"
                          rows={3}
                          value={a.consistency.join('\n')}
                          onChange={(e) => patch(a.id, { consistency: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
                        />
                      </label>
                    </div>
                  )}
                </div>
              ))}
          </div>
        ))}
      </div>

      {aiNote && (
        <div className="card">
          <div className="card-head">
            <h3>AI 资产库建议</h3>
            <button className="mini" onClick={() => setAiNote('')}>
              收起
            </button>
          </div>
          <pre className="text-out">{aiNote}</pre>
        </div>
      )}

      {project.assets.some((a) => a.imageUrl) && (
        <div className="card">
          <div className="card-head">
            <h3>资产参考图</h3>
          </div>
          <div className="asset-gallery">
            {project.assets
              .filter((a) => a.imageUrl)
              .map((a) => (
                <figure key={a.id}>
                  <img src={a.imageUrl} alt={a.name} />
                  <figcaption>
                    {KIND_ICON[a.kind]} {a.name}
                  </figcaption>
                </figure>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
