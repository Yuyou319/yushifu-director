import { useState } from 'react';
import { useApp } from '../store';
import { VIDEO_TYPES, VIDEO_TYPE_MAP } from '../data/videoTypes';
import { MASTERS, MASTER_MAP } from '../data/masters';
import { VIDEO_MODEL_NAMES, findVideoModel } from '../data/videomodels';
import { DIM_LABELS } from '../types';
import { paramsToText } from '../lib/director';
import { Section, Slider, Select, Chips } from '../lib/ui';

const DURATIONS = ['15 秒', '30 秒', '60 秒', '90 秒', '3 分钟', '5 分钟'];
const RATIOS = ['16:9', '9:16', '1:1', '4:3', '2.39:1'];
const STYLES = ['电影感', '写实摄影', '国风古韵', '赛博朋克', '日系清新', '水墨', '3D 渲染', '插画', '黑白胶片'];

export default function DirectorRight() {
  const project = useApp((s) => s.currentProject());
  const updateParams = useApp((s) => s.updateParams);
  const p = project.params;
  const [showMaster, setShowMaster] = useState(false);
  const [customMaster, setCustomMaster] = useState('');

  const sop = VIDEO_TYPE_MAP[p.videoType];
  const master = MASTER_MAP[p.master];
  const model = findVideoModel(p.videoModel);

  return (
    <aside className="dir-right">
      <div className="dir-head">
        <span>导演参数</span>
        <span className="hint">{project.name}</span>
      </div>

      <Section title="影片类型" defaultOpen>
        <div className="vtype-grid">
          {VIDEO_TYPES.map((t) => (
            <button
              key={t.id}
              className={`vtype ${p.videoType === t.name ? 'on' : ''}`}
              title={t.goal}
              onClick={() => updateParams({ videoType: t.name })}
            >
              <span>{t.icon}</span>
              <span>{t.name.replace(' / 品牌广告', '').replace('AI ', '')}</span>
            </button>
          ))}
        </div>
        {sop && <div className="dir-note">{sop.goal}</div>}
      </Section>

      <Section title="基础参数" defaultOpen>
        <label className="dir-label">
          时长
          <Chips value={p.duration} options={DURATIONS} onChange={(v) => updateParams({ duration: v })} />
        </label>
        <label className="dir-label">
          画面比例
          <Chips value={p.ratio} options={RATIOS} onChange={(v) => updateParams({ ratio: v })} />
        </label>
        <label className="dir-label">
          视频模型
          <Select value={p.videoModel} options={VIDEO_MODEL_NAMES} onChange={(v) => updateParams({ videoModel: v })} />
        </label>
        <div className="dir-note">
          {model.strength} · 最长 {model.maxDuration} · 结构：{model.structure.join(' → ')}
          <br />
          {model.tips}
        </div>
        <label className="dir-label">
          视觉风格
          <Select value={p.visualStyle} options={STYLES} onChange={(v) => updateParams({ visualStyle: v })} />
        </label>
      </Section>

      <Section title="剧情与节奏" defaultOpen>
        <label className="dir-slider">
          <span>冲突强度</span>
          <Slider min={0} max={1} step={0.05} value={p.conflict} onChange={(v) => updateParams({ conflict: v })} />
        </label>
        <label className="dir-slider">
          <span>情绪强度</span>
          <Slider min={0} max={1} step={0.05} value={p.emotion} onChange={(v) => updateParams({ emotion: v })} />
        </label>
        <label className="dir-slider">
          <span>反转强度</span>
          <Slider min={0} max={1} step={0.05} value={p.twist} onChange={(v) => updateParams({ twist: v })} />
        </label>
        <label className="dir-slider">
          <span>镜头密度</span>
          <Slider min={0} max={1} step={0.05} value={p.shotDensity} onChange={(v) => updateParams({ shotDensity: v })} />
        </label>
        <label className="dir-slider">
          <span>剪辑节奏</span>
          <Slider min={0} max={1} step={0.05} value={p.editRhythm} onChange={(v) => updateParams({ editRhythm: v })} />
        </label>
        <div className="dir-note">{paramsToText(p)}</div>
      </Section>

      <Section title="电影大师模式" defaultOpen={p.masterOn}>
        <div className="master-switch">
          <button className={`chip ${p.masterOn ? 'on' : ''}`} onClick={() => updateParams({ masterOn: !p.masterOn })}>
            {p.masterOn ? '已启用' : '已关闭'}
          </button>
          {p.masterOn && master && <span className="dir-note">{master.intro}</span>}
        </div>

        <div className="master-grid">
          {MASTERS.map((m) => (
            <button
              key={m.id}
              className={`master-card ${p.master === m.name && p.masterOn ? 'on' : ''}`}
              onClick={() => updateParams({ master: m.name, masterOn: true })}
            >
              <b>{m.name}</b>
              <span>{m.en}</span>
              <div className="master-kw">
                {m.keywords.slice(0, 3).map((k) => (
                  <i key={k}>{k}</i>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div className="custom-master">
          <input
            className="inp"
            placeholder="自定义导演（手动输入名字）"
            value={customMaster}
            onChange={(e) => setCustomMaster(e.target.value)}
          />
          <button
            className="mini"
            onClick={() => {
              if (!customMaster.trim()) return;
              updateParams({ master: customMaster.trim(), masterOn: true });
              setCustomMaster('');
            }}
          >
            使用
          </button>
        </div>

        {p.masterOn && (
          <>
            {master ? (
              <>
                <button className="mini" onClick={() => setShowMaster((v) => !v)}>
                  {showMaster ? '收起导演语言' : '查看 12 维导演语言'}
                </button>
                {showMaster && (
                  <div className="dims">
                    {DIM_LABELS.map((d) => (
                      <div key={d.key} className="dim">
                        <b>{d.label}</b>
                        <span>{master.dims[d.key]}</span>
                      </div>
                    ))}
                    <div className="dim">
                      <b>可执行指令</b>
                      <span>{master.directives.join('；')}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="dir-note">
                自定义导演「{p.master}」：系统将以该名字作为风格锚点注入 Prompt，建议在 Prompt 阶段人工微调镜头描述。
              </div>
            )}
          </>
        )}
      </Section>
    </aside>
  );
}
