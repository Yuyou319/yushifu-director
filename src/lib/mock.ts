import { AssetType } from '../types';

/* 演示模式：未配置 API Key 时，本地直接产出可预览的示例结果 */

const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function wrap(text: string, n = 26): string[] {
  const out: string[] = [];
  let line = '';
  for (const ch of text) {
    line += ch;
    if (line.length >= n) {
      out.push(line);
      line = '';
    }
  }
  if (line) out.push(line);
  return out.slice(0, 8);
}

const PALETTES: [string, string, string][] = [
  ['#1f2a44', '#6a5acd', '#f7c8d8'],
  ['#062b34', '#0f9b8e', '#ffd166'],
  ['#2b1055', '#7597de', '#ff8fab'],
  ['#3b1f2b', '#c24914', '#ffdab9'],
  ['#101820', '#3d5a80', '#98c1d9'],
  ['#241023', '#6d213c', '#e0aaff']
];

export function mockImageDataUri(prompt: string, label: string, seed = 1): string {
  const [c1, c2, c3] = PALETTES[Math.abs(seed) % PALETTES.length];
  const lines = wrap(prompt || '（未填写提示词）');
  const txt = lines
    .map(
      (l, i) =>
        `<text x="40" y="${150 + i * 26}" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="15" fill="rgba(255,255,255,0.82)">${esc(
          l
        )}</text>`
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="512">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${c1}"/><stop offset="55%" stop-color="${c2}"/><stop offset="100%" stop-color="${c3}"/>
</linearGradient>
<radialGradient id="r" cx="0.75" cy="0.2" r="0.7">
<stop offset="0%" stop-color="rgba(255,255,255,0.35)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/>
</radialGradient>
</defs>
<rect width="768" height="512" fill="url(#g)"/>
<rect width="768" height="512" fill="url(#r)"/>
<circle cx="600" cy="120" r="70" fill="rgba(255,255,255,0.16)"/>
<circle cx="150" cy="420" r="110" fill="rgba(0,0,0,0.12)"/>
<text x="40" y="70" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="26" font-weight="700" fill="#fff">${esc(
    label
  )}</text>
<text x="40" y="106" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="14" fill="rgba(255,255,255,0.6)">演示模式 · 本地生成（未调用任何 API）</text>
${txt}
<rect x="40" y="452" width="150" height="30" rx="15" fill="rgba(0,0,0,0.28)"/>
<text x="60" y="473" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="13" fill="#fff">seed ${Math.abs(
    Math.floor(seed)
  )}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function writeStr(dv: DataView, offset: number, s: string) {
  for (let i = 0; i < s.length; i++) dv.setUint8(offset + i, s.charCodeAt(i));
}

/** 本地合成一段可播放的 WAV（演示配音 / 音乐 / 音效） */
export function mockAudioDataUri(seconds = 2, base = 440, kind: 'voice' | 'music' | 'sfx' = 'voice'): string {
  const sr = 22050;
  const n = Math.max(1, Math.floor(sr * seconds));
  const buffer = new ArrayBuffer(44 + n * 2);
  const dv = new DataView(buffer);
  writeStr(dv, 0, 'RIFF');
  dv.setUint32(4, 36 + n * 2, true);
  writeStr(dv, 8, 'WAVE');
  writeStr(dv, 12, 'fmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true);
  dv.setUint32(24, sr, true);
  dv.setUint32(28, sr * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  writeStr(dv, 36, 'data');
  dv.setUint32(40, n * 2, true);

  const notes = [0, 3, 7, 10];
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.min(1, t * 6) * Math.min(1, (seconds - t) * 4);
    let s = 0;
    if (kind === 'music') {
      const step = notes[Math.floor(t * 2.4) % notes.length];
      const f = base * Math.pow(2, step / 12);
      s = Math.sin(2 * Math.PI * f * t) * 0.3 + Math.sin(2 * Math.PI * f * 2 * t) * 0.12;
    } else if (kind === 'sfx') {
      s = (Math.sin(2 * Math.PI * base * (1 + t) * t) * 0.5 + (Math.random() * 2 - 1) * 0.18) * Math.exp(-t * 1.1);
    } else {
      const vib = 1 + Math.sin(2 * Math.PI * 5 * t) * 0.02;
      s = Math.sin(2 * Math.PI * base * vib * t) * 0.32 + Math.sin(2 * Math.PI * base * 2 * vib * t) * 0.1;
    }
    dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s * env)) * 32000, true);
  }

  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  }
  return `data:audio/wav;base64,${btoa(bin)}`;
}

export function mockVideoPoster(prompt: string, label: string, seed = 1, duration = 5): string {
  const [c1, c2, c3] = PALETTES[(Math.abs(seed) + 2) % PALETTES.length];
  const lines = wrap(prompt || '（未填写提示词）', 24);
  const txt = lines
    .map(
      (l, i) =>
        `<text x="36" y="${170 + i * 24}" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="14" fill="rgba(255,255,255,0.8)">${esc(
          l
        )}</text>`
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="512">
<defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0">
<stop offset="0%" stop-color="${c1}"/><stop offset="50%" stop-color="${c2}"/><stop offset="100%" stop-color="${c3}"/>
</linearGradient></defs>
<rect width="768" height="512" fill="url(#g)"/>
<g opacity="0.18" fill="#fff">
<circle cx="120" cy="90" r="52"/><circle cx="300" cy="60" r="26"/><circle cx="640" cy="140" r="70"/>
</g>
<text x="36" y="66" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="25" font-weight="700" fill="#fff">${esc(
    label
  )}</text>
<text x="36" y="100" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="13" fill="rgba(255,255,255,0.62)">演示模式 · 视频占位帧（未调用任何 API）</text>
${txt}
<rect x="36" y="424" width="118" height="30" rx="15" fill="rgba(0,0,0,0.32)"/>
<text x="56" y="445" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="13" fill="#fff">${duration}s · seed ${Math.abs(
    Math.floor(seed)
  )}</text>
<circle cx="690" cy="460" r="30" fill="rgba(0,0,0,0.35)"/>
<path d="M680 446 L712 460 L680 474 Z" fill="#fff"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function mockText(prompt: string, modeName: string): string {
  const p = (prompt || '（空）').slice(0, 60);
  return `【${modeName} · 演示模式输出】

输入：${p}

—— 以下为本地演示文本，配置 API Key 后将由你的模型真实生成 ——

第一幕 · 开场
清晨的旧仓库里，铁皮门被推开一道缝，光柱斜切进尘埃。镜头缓缓推进，主角的手指划过桌面上的旧照片。

第二幕 · 转折
电话铃声响起，镜头切至特写：主角眼神一紧。窗外有车灯扫过，风向突变。

第三幕 · 高潮
追逐戏在狭窄走廊展开，手持镜头，快切，节奏 24 格。音乐推至高点后骤停。

第四幕 · 收束
回到开场的仓库，光柱仍在。主角放下照片，走出画面。黑场，字幕起。

（演示文本结束）`;
}

export function mockOutput(
  type: AssetType,
  prompt: string,
  modeName: string,
  seed = 1,
  extra: Record<string, any> = {}
): string {
  if (type === 'image') return mockImageDataUri(prompt, modeName, seed);
  if (type === 'video') return mockVideoPoster(prompt, modeName, seed, Number(extra?.duration ?? 5));
  if (type === 'audio') {
    const dur = Number(extra?.duration ?? 3);
    const kind = modeName.includes('音乐') ? 'music' : modeName.includes('音效') ? 'sfx' : 'voice';
    return mockAudioDataUri(Math.min(6, Math.max(1, dur)), kind === 'music' ? 330 : 220, kind);
  }
  return mockText(prompt, modeName);
}
