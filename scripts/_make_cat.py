from PIL import Image, ImageDraw
import os

W=H=1024
img = Image.new('RGBA',(W,H),(0,0,0,0))
d = ImageDraw.Draw(img)

ink=(30,20,18,255)
orange=(235,140,55,255)
stripe=(200,95,35,255)
cream=(250,232,200,255)
eye=(120,170,80,255)
pupil=(35,45,30,255)
nose=(230,140,150,255)
ear_in=(245,180,170,255)

def ell(b, fill, outline=ink, w=10):
    d.ellipse(b, fill=fill, outline=outline, width=w)

# tail
d.line([(740,700),(860,560),(820,420)], fill=stripe, width=46, joint='curve')
d.line([(740,700),(860,560),(820,420)], fill=orange, width=34, joint='curve')
for y in [460,520,580,640]:
    d.line([(860-int((700-y)*0.55),y),(820-int((700-y)*0.55),y+20)], fill=stripe, width=14)

# body
ell((300,520,740,900), orange)
ell((420,600,640,860), cream, w=8)
# paws
for x in [360,470,580,690]:
    ell((x,820,x+90,900), orange, w=8)
    ell((x+18,855,x+72,895), cream, w=6)

ell((330,470,710,720), orange)

# head
ell((330,260,710,560), orange)
ell((390,380,650,540), cream, w=8)

# ears
d.polygon([(360,330),(420,140),(500,300)], fill=orange, outline=ink)
d.polygon([(680,330),(620,140),(540,300)], fill=orange, outline=ink)
d.polygon([(385,315),(430,190),(485,305)], fill=ear_in)
d.polygon([(655,315),(610,190),(555,305)], fill=ear_in)

# stripes forehead
for dx in [-40,0,40]:
    x=520+dx
    d.line([(x-18,275),(x,320),(x+18,275)], fill=stripe, width=10, joint='curve')
# side stripes
for y in [360,400,440]:
    d.line([(350, y),(390, y+10)], fill=stripe, width=10)
    d.line([(690, y),(650, y+10)], fill=stripe, width=10)
# body stripes
for y in [560,600,640,680]:
    d.arc((320,y,720,y+80), start=200, end=340, fill=stripe, width=10)

# eyes
for cx in [450,590]:
    ell((cx-55,360,cx+55,450), (245,250,240,255), w=8)
    ell((cx-35,370,cx+35,440), eye, w=6)
    ell((cx-12,385,cx+12,425), pupil, w=0)
    d.ellipse((cx-2,392,cx+10,404), fill=(255,255,255,230))

# nose
d.polygon([(520,455),(500,480),(540,480)], fill=nose, outline=ink)
# mouth
d.arc((470,470,520,510), start=20, end=160, fill=ink, width=6)
d.arc((520,470,570,510), start=20, end=160, fill=ink, width=6)

# whiskers
for sx in [-1,1]:
    bx=520+sx*40
    for j,dy in enumerate([-8,4,16]):
        d.ellipse((bx+sx*4-4,486+dy-4,bx+sx*4+4,486+dy+4), fill=(120,90,70,255))
        d.line([(bx+sx*8,486+dy),(bx+sx*120,486+dy+sx*j*6)], fill=ink, width=4)

out=r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\gato-banheiro\cat.png"
img.save(out)
print('cat', os.path.getsize(out))
