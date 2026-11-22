from PIL import Image, ImageDraw
import os

OUT = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\linkin-park-anthem"
W = H = 1024
ink = (28, 20, 18, 255)
skin = (236, 200, 170, 255)
skin_sh = (220, 182, 150, 255)


def E(d, b, fill, outline=ink, w=8):
    d.ellipse(b, fill=fill, outline=outline, width=w)

def R(d, b, fill, outline=ink, w=8, r=18):
    d.rounded_rectangle(b, radius=r, fill=fill, outline=outline, width=w)

def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path)
    print(name, os.path.getsize(path))

def base_head(d, hair_color, hair_style='short', cap=False, expr='neutral'):
    # neck
    R(d, (475, 300, 555, 365), skin, w=6)
    # head
    E(d, (430, 160, 600, 335), skin, w=8)
    # hair base
    if hair_style == 'short':
        d.ellipse((415, 130, 615, 250), fill=hair_color, outline=ink)
        d.rectangle((430, 200, 600, 250), fill=skin, outline=None)
        E(d, (430, 160, 600, 335), skin, w=8)  # redraw outline
        # fringe/texture
        for (cx, cy, rx, ry) in [(460,150,30,16),(510,145,34,16),(560,155,26,14),(480,180,20,10),(540,180,20,10)]:
            d.ellipse((cx-rx,cy-ry,cx+rx,cy+ry), fill=hair_color)
    elif hair_style == 'cap':
        # hair peeking
        d.ellipse((420,150,610,260), fill=hair_color, outline=ink)
        d.rectangle((430,210,600,260), fill=skin)
        E(d,(430,160,600,335),skin,w=8)
        # cap (flat brim 2000s)
        cap_c=(35,35,40,255); brim=(25,25,30,255)
        d.ellipse((400,110,630,220), fill=cap_c, outline=ink)
        d.rounded_rectangle((380,185,650,215), radius=10, fill=brim, outline=ink)
        d.rectangle((410,170,620,205), fill=cap_c, outline=ink)
    # ears
    E(d,(418,230,448,270),skin,w=5); E(d,(582,230,612,270),skin,w=5)
    # face features
    # brows
    by = 232 if expr!='frustrated' else 236
    tilt_l = 205 if expr=='frustrated' else (195 if expr=='determined' else 200)
    tilt_r = 335 if expr=='frustrated' else (345 if expr=='determined' else 340)
    d.arc((462,by-10,500,by+8), start=tilt_l, end=340, fill=(70,50,40,255), width=5)
    d.arc((530,by-10,568,by+8), start=200, end=tilt_r, fill=(70,50,40,255), width=5)
    # eyes
    eye_open = 10 if expr!='triumph' else 8
    for cx in [485,545]:
        E(d,(cx-16,242,cx+16,242+eye_open*2),(248,248,245,255),w=4)
        py = 247 if expr!='determined' else 245
        E(d,(cx-6,py,cx+6,py+10),(70,55,45,255),w=3)
        E(d,(cx-3,py+3,cx+3,py+7),(20,18,18,255),w=0)
    if expr=='determined':
        # slight focused lids
        d.line((469,242,501,246),(45,30,25,255),3)
        d.line((529,246,561,242),(45,30,25,255),3)
    # nose
    d.line((515,255,515,282), fill=(200,160,140,255), width=4)
    d.line((508,282,522,282), fill=(200,160,140,255), width=3)
    # mouth
    if expr in ('neutral','determined'):
        d.arc((492,285,538,305), start=20, end=160, fill=(170,110,110,255), width=4)
    elif expr=='frustrated':
        d.arc((492,292,538,312), start=200, end=340, fill=(170,110,110,255), width=4)
    elif expr=='triumph':
        d.arc((486,282,544,312), start=15, end=165, fill=(170,110,110,255), width=5)
        d.line((492,298,538,298), fill=(230,210,210,255), width=3)

def chester(expr='neutral'):
    img=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(img)
    hair=(80,55,40,255)
    tank=(30,30,34,255); pants=(35,35,40,255)
    # legs
    R(d,(420,650,495,910),pants); R(d,(535,650,610,910),pants)
    E(d,(405,880,505,940),(35,30,30,255),w=6); E(d,(525,880,625,940),(35,30,30,255),w=6)
    # arms
    R(d,(350,380,430,640),skin,w=8); R(d,(600,380,680,640),skin,w=8)
    # stylized tattoos on arms (2D ink lines/shapes)
    for y in [420,450,480,510,540,570]:
        d.arc((355,y,420,y+25), start=200, end=340, fill=(40,30,30,220), width=3)
        d.arc((610,y,675,y+25), start=200, end=340, fill=(40,30,30,220), width=3)
    d.line((370,430,410,520), fill=(40,30,30,220), width=3)
    d.line((620,440,660,530), fill=(40,30,30,220), width=3)
    # hands
    E(d,(345,620,430,690),skin,w=6); E(d,(600,620,685,690),skin,w=6)
    # torso tank
    R(d,(430,360,600,660),tank,w=8)
    # straps
    d.line((455,360,455,410), fill=(45,45,50,255), width=10)
    d.line((575,360,575,410), fill=(45,45,50,255), width=10)
    # mic stand (iconic)
    d.line([(690, 690), (690, 250)], fill=(120, 120, 130, 255), width=8)
    d.line([(690, 250), (640, 230)], fill=(120, 120, 130, 255), width=7)
    E(d,(610,210,650,250),(80,80,90,255),w=5)
    base_head(d,hair,'short',expr=expr)
    name = f"chester_{expr}.png" if expr!='neutral' else 'chester.png'
    save(img,name)

def mike(expr='neutral'):
    img=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(img)
    hair=(40,35,30,255)
    hoodie=(70,70,78,255); pants=(45,50,60,255)
    R(d,(420,650,495,910),pants); R(d,(535,650,610,910),pants)
    E(d,(405,880,505,940),(35,30,30,255),w=6); E(d,(525,880,625,940),(35,30,30,255),w=6)
    R(d,(340,385,430,650),skin,w=8); R(d,(600,385,690,650),skin,w=8)
    E(d,(335,630,420,700),skin,w=6); E(d,(610,630,695,700),skin,w=6)
    # hoodie/shirt baggy
    R(d,(420,360,610,660),hoodie,w=8,r=20)
    # hood detail
    d.arc((455,345,575,400), start=20, end=160, fill=(55,55,62,255), width=5)
    # headphones around neck
    d.arc((440,330,590,430), start=30, end=150, fill=(30,30,35,255), width=10)
    E(d,(430,360,470,400),(45,45,50,255),w=5)
    E(d,(560,360,600,400),(45,45,50,255),w=5)
    base_head(d,hair,'cap',expr=expr)
    name = f"mike_{expr}.png" if expr!='neutral' else 'mike.png'
    save(img,name)

def executive():
    img=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(img)
    hair=(70,60,55,255)
    suit=(45,50,65,255); shirt=(235,235,240,255); pants=(40,45,58,255)
    R(d,(425,650,495,910),pants); R(d,(535,650,610,910),pants)
    E(d,(410,880,505,940),(30,28,28,255),w=6); E(d,(525,880,620,940),(30,28,28,255),w=6)
    # arms crossed
    R(d,(360,380,470,560),suit,w=8); R(d,(560,380,670,560),suit,w=8)
    R(d,(420,470,610,560),suit,w=6)
    E(d,(350,540,430,610),skin,w=6); E(d,(600,540,680,610),skin,w=6)
    # torso suit
    R(d,(430,360,600,660),suit,w=8)
    # shirt + tie
    d.polygon([(490,360),(540,360),(515,470)], fill=shirt, outline=ink)
    d.polygon([(505,380),(525,380),(515,455)], fill=(120,40,50,255), outline=ink)
    # head
    R(d,(475,300,555,365),skin,w=6)
    E(d,(430,160,600,335),skin,w=8)
    # hair neat
    d.ellipse((420,135,610,230), fill=hair, outline=ink)
    d.rectangle((430,195,600,240), fill=skin)
    E(d,(430,160,600,335),skin,w=8)
    # glasses
    d.rectangle((455,235,505,265), outline=(40,40,45,255), width=4)
    d.rectangle((525,235,575,265), outline=(40,40,45,255), width=4)
    d.line((505,250,525,250), fill=(40,40,45,255), width=4)
    # skeptical expression
    d.arc((462,228,500,244), start=200, end=330, fill=(60,45,40,255), width=5)
    d.arc((530,228,568,244), start=210, end=340, fill=(60,45,40,255), width=5)
    for cx in [480,550]:
        E(d,(cx-12,242,cx+12,260),(248,248,245,255),w=4)
        E(d,(cx-5,247,cx+5,255),(80,70,60,255),w=3)
    d.line((515,258,515,280), fill=(200,160,140,255), width=4)
    d.line((495,295,535,292), fill=(160,100,100,255), width=4) # slight frown
    save(img,'executive.png')

os.makedirs(OUT, exist_ok=True)
# Chester variants
chester('neutral'); chester('frustrated'); chester('determined'); chester('triumph')
# Mike variants
mike('neutral'); mike('determined'); mike('triumph')
# Executive
executive()
