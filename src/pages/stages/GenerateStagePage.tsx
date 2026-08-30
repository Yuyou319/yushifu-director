import { useState } from 'react';
import GeneratePage from '../GeneratePage';
import { useApp } from '../../store';

const TABS = [
  { id: 'image', name: '生图', icon: '🎨' },
  { id: 'video', name: '生视频', icon: '🎬' },
  { id: 'audio', name: '生音频', icon: '🔊' }
];

export default function GenerateStagePage() {
  const [g, setG] = useState('video');
  const goMode = useApp((s) => s.goMode);

  return (
    <div className="gen-stage">
      <div className="gen-stage-bar">
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={`tab ${g === t.id ? 'on' : ''}`} onClick={() => setG(t.id)}>
              {t.icon} {t.name}
            </button>
          ))}
        </div>
        <div className="row-gap">
          <button className="mini" onClick={() => goMode('image', 'image.text2img')}>
            文生图
          </button>
          <button className="mini" onClick={() => goMode('video', 'video.multiref')}>
            多参生视频
          </button>
          <button className="mini" onClick={() => goMode('video', 'video.firstlast')}>
            首尾帧生视频
          </button>
          <button className="mini" onClick={() => goMode('audio', 'audio.tts')}>
            文本配音
          </button>
        </div>
      </div>
      <GeneratePage groupId={g} />
    </div>
  );
}
