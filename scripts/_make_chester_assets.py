from PIL import Image
import numpy as np, os
from scipy.ndimage import binary_dilation, gaussian_filter

src=r'C:\Users\Pichau\Desktop\lp'
dst=r'C:\Users\Pichau\cartoon-short\jimi-broom-short\public\chester-crawling'
os.makedirs(dst, exist_ok=True)
mapping={
  'chesternormal.png':'chester_normal.png',
  'chestercantando.png':'chester_singing.png',
  'chestertrisnte.png':'chester_sad.png',
}
for s,t in mapping.items():
    p=os.path.join(src,s)
    im=Image.open(p).convert('RGBA')
    arr=np.array(im).astype(np.float32)
    rgb=arr[:,:,:3]
    bg=np.array([71,112,76],dtype=np.float32)
    dist=np.linalg.norm(rgb-bg,axis=2)
    g=rgb[:,:,1]; r=rgb[:,:,0]; b=rgb[:,:,2]
    green_dom = (g - np.maximum(r,b))
    mask = (dist < 80) | ((green_dom > 18) & (g>60) & (dist<140))
    m2=binary_dilation(mask, iterations=1).astype(np.float32)
    alpha=(1.0 - gaussian_filter(m2, sigma=1.2))*255.0
    alpha[dist<35]=0
    alpha = np.clip(alpha,0,255)
    arr[:,:,3]=alpha
    out=Image.fromarray(arr.astype(np.uint8),'RGBA')
    bbox=out.getbbox()
    if bbox:
        pad=20
        bbox=(max(0,bbox[0]-pad),max(0,bbox[1]-pad),min(out.size[0],bbox[2]+pad),min(out.size[1],bbox[3]+pad))
        out=out.crop(bbox)
    canvas=Image.new('RGBA',(1024,1024),(0,0,0,0))
    ow,oh=out.size
    scale=min(980/ow, 980/oh)
    nw,nh=int(ow*scale), int(oh*scale)
    out=out.resize((nw,nh), Image.LANCZOS)
    x=(1024-nw)//2
    y=1024-nh-10
    canvas.paste(out,(x,y),out)
    canvas.save(os.path.join(dst,t))
    print('saved',t,canvas.size)
