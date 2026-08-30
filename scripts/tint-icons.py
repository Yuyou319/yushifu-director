"""把切好的图标统一偏暖黄：
- 饱和的青色强调块 -> 暖金黄
- 近白的细线     -> 温润的暖象牙色
保留原始形状，只改颜色。
"""
from PIL import Image
import colorsys
import glob
import os

# 色相：金黄约 45~50 度 -> 0.125 ~ 0.14
ACCENT_HUE = 0.125   # 强调块（原青色）
STROKE_HUE = 0.13    # 线条（原冷白）
STROKE_SAT = 0.16    # 线条饱和度，控制"黄"的程度

files = sorted(glob.glob('g:/CoodBuddy_work/HBv1.0/src/assets/icons/icon_*.png'))

for f in files:
    img = Image.open(f).convert('RGBA')
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            if s > 0.25 and l > 0.15:
                # 有彩色像素（青色强调） -> 暖金黄，保持明度
                h = ACCENT_HUE
                s = min(1.0, s * 1.05)
            else:
                # 近白/灰（细线）-> 暖象牙色
                h = STROKE_HUE
                s = STROKE_SAT
            nr, ng, nb = colorsys.hls_to_rgb(h, l, s)
            px[x, y] = (
                min(255, int(nr * 255)),
                min(255, int(ng * 255)),
                min(255, int(nb * 255)),
                a
            )
    img.save(f)
    print(f'tinted {os.path.basename(f)}')
