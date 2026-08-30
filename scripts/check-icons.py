from PIL import Image
import os, glob

files = sorted(glob.glob('g:/CoodBuddy_work/HBv1.0/src/assets/icons/icon_*.png'))
for f in files:
    img = Image.open(f).convert('RGBA')
    bbox = img.getbbox()
    name = os.path.basename(f)
    if bbox:
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        print(f'{name}: size={img.size} bbox={bbox} content={w}x{h}')
    else:
        print(f'{name}: EMPTY')
