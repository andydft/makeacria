from PIL import Image, ImageDraw
import os, math

OUT = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\linkin-park-jayz"
W = H = 1024
ink = (28, 20, 18, 255)
skin_c = (236, 198, 168, 255)  # Chester
skin_j = (120, 78, 52, 255)     # Jay-Z dark brown

def E(d, b, fill, outline=ink, w=8):
    d.ellipse(b, fill=fill, outline=outline, width=w)

def R(d, b, fill, outline=ink, w=8, r=18):
    d.rounded_rectangle(b, radius=r, fill=fill, outline=outline, width=w)

def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path)
    print(name, os.path.getsize(path))

# ---- CHESTER (consistent with crawling: brown short/medium messy hair, greenish-brown eyes, stubble, square jaw, black tank, detailed tattoos, mic) ----

def draw_chester_hair(d):
    base = (88, 62, 45, 255)
    tip = (140, 105, 75, 255)
    d.ellipse((415, 135, 615, 255), fill=base, outline=ink)
    d.rectangle((430, 212, 600, 258), fill=skin_c)
    E(d, (430, 160, 600, 335), skin_c, w=8)
    tufts = [(430,230,455,155),(455,220,485,140),(485,215,515,132),(515,215,545,135),(545,220,575,142),(575,230,605,155),(418,245,438,180),(592,245,612,182)]
    for x1,y1,x2,y2 in tufts:
        d.polygon([(x1,y1),(x2,y2),((x1+x2)//2+6,y1-8)], fill=base, outline=ink)
    for x1,y1,x2,y2 in [(455,220,480,148),(515,215,535,142),(575,230,598,162)]:
        d.line([((x1+x2)//2,(y1+y2)//2),(x2,y2)], fill=tip, width=4)
    for sx,sy,ex,ey in [(470,205,488,165),(505,198,512,155),(545,202,560,160),(575,212,590,175)]:
        d.line([(sx,sy),(ex,ey)], fill=(65,45,34,255), width=3)

def draw_chester_tattoos(d):
    tcol = (35, 30, 32, 230); t2 = (55, 48, 50, 210)
    bx, by = 350, 430
    pts = [(bx, by), (bx+22, by-18), (bx+10, by+5), (bx+30, by-2), (bx+14, by+22), (bx+28, by+18), (bx+12, by+38)]
    d.line(pts, fill=tcol, width=5, joint='curve')
    d.line([(bx+6, by+8),(bx+26, by+30),(bx+8, by+46)], fill=t2, width=3)
    d.arc((345, 470, 410, 520), start=210, end=340, fill=tcol, width=4)
    cx, cy = 382, 545
    for r in [10, 16]:
        d.arc((cx-r, cy-r, cx+r, cy+r), start=20, end=200, fill=tcol, width=3)
        d.arc((cx-r, cy-r, cx+r, cy+r), start=210, end=350, fill=t2, width=3)
    d.ellipse((cx-4, cy-4, cx+4, cy+4), fill=tcol)
    d.line([(cx, cy+10),(cx-6, cy+30),(cx, cy+28),(cx+6, cy+38)], fill=t2, width=3)
    bx, by = 610, 435
    d.polygon([(bx+20,by),(bx+40,by+18),(bx+20,by+36),(bx,by+18)], outline=tcol, width=4)
    d.line([(bx+20,by),(bx+20,by+36)], fill=t2, width=3)
    d.line([(bx,by+18),(bx+40,by+18)], fill=t2, width=3)
    d.line([(612,490),(655,505),(618,520),(650,535)], fill=tcol, width=4)
    d.arc((608, 545, 668, 590), start=200, end=340, fill=tcol, width=4)
    d.line([(625,555),(645,575)], fill=t2, width=3)
    d.line([(640,548),(628,575)], fill=t2, width=3)

def chester_head(d, expr='singing', effort=False):
    R(d, (474, 300, 556, 368), skin_c, w=6)
    if effort:
        d.line([(486,318),(482,350)], fill=(190,150,140,255), width=3)
        d.line([(544,320),(548,352)], fill=(190,150,140,255), width=3)
    d.rounded_rectangle((432, 160, 598, 338), radius=55, fill=skin_c, outline=ink, width=8)
    draw_chester_hair(d)
    E(d, (418, 234, 448, 272), skin_c, w=5); E(d, (582, 234, 612, 272), skin_c, w=5)
    # stubble
    for yy in range(292, 326, 5):
        for xx in range(455, 575, 6):
            if ((yy//5 + xx//6) % 2 == 0) and ((xx-515)**2/3600 + (yy-308)**2/400 < 1.2):
                d.point((xx,yy), fill=(170,145,135,120))
    brow_color = (60,42,32,255)
    if expr == 'closed':
        d.arc((458, 230, 502, 246), start=210, end=350, fill=brow_color, width=7)
        d.arc((528, 230, 572, 246), start=190, end=330, fill=brow_color, width=7)
        for cx in [486, 544]:
            d.arc((cx-16, 248, cx+16, 262), start=20, end=160, fill=(70,50,40,255), width=5)
        d.arc((492,292,538,308), start=20, end=160, fill=(170,110,110,255), width=4)
    elif expr == 'triumph':
        d.arc((458, 228, 502, 244), start=210, end=350, fill=brow_color, width=7)
        d.arc((528, 228, 572, 244), start=190, end=330, fill=brow_color, width=7)
        for cx in [486, 544]:
            E(d,(cx-16,245,cx+16,261),(246,246,242,255),w=4)
            E(d,(cx-6,249,cx+6,258),(92,98,72,255),w=3); E(d,(cx-3,251,cx+3,256),(20,18,18,255),w=0)
        d.arc((488,286,542,314), start=15, end=165, fill=(170,110,110,255), width=5)
    else: # singing/intense
        d.arc((458, 228, 502, 246), start=205, end=345, fill=brow_color, width=7)
        d.arc((528, 228, 572, 246), start=195, end=335, fill=brow_color, width=7)
        iris = (92,98,72,255)
        for cx in [486, 544]:
            E(d,(cx-17,244,cx+17,262),(246,246,242,255),w=4)
            E(d,(cx-7,250,cx+7,261),iris,w=3); E(d,(cx-3,253,cx+3,258),(20,18,18,255),w=0)
        E(d,(492,288,538,324),(118,48,54,255),w=4); E(d,(500,296,530,318),(70,30,35,255),w=0)
        d.line([(498,292),(532,292)], fill=(230,225,220,255), width=3)
    # nose/jaw
    d.line([(515,256),(515,284)], fill=(198,158,138,255), width=4)
    d.line([(506,285),(524,285)], fill=(198,158,138,255), width=3)
    d.arc((448,285,582,336), start=25, end=155, fill=(210,170,142,255), width=3)
    if effort and expr == 'singing':
        E(d,(558,275,568,292),(180,220,245,220), w=2); d.ellipse((560,278,566,288), fill=(210,235,250,200))

def chester_pose(expr='singing', effort=False):
    img = Image.new('RGBA', (W, H), (0,0,0,0)); d = ImageDraw.Draw(img)
    tank=(26,26,30,255); pants=(36,36,42,255)
    R(d,(418,660,496,920),pants); R(d,(534,660,612,920),pants)
    E(d,(402,890,506,950),(30,28,28,255),w=6); E(d,(524,890,628,950),(30,28,28,255),w=6)
    R(d,(332,382,422,640),skin_c,w=8,r=22); R(d,(608,382,698,640),skin_c,w=8,r=22)
    draw_chester_tattoos(d)
    E(d,(325,620,420,700),skin_c,w=6); E(d,(610,620,705,700),skin_c,w=6)
    R(d,(422,360,608,665),tank,w=8,r=16)
    d.line([(450,360),(450,420)], fill=(42,42,48,255), width=12)
    d.line([(580,360),(580,420)], fill=(42,42,48,255), width=12)
    d.arc((450,360,580,435), start=20, end=160, fill=(42,42,48,255), width=5)
    d.arc((455,430,515,490), start=200, end=340, fill=(38,38,44,255), width=3)
    d.arc((515,430,575,490), start=200, end=340, fill=(38,38,44,255), width=3)
    # mic
    mic_x, mic_y = 515, 520
    E(d,(mic_x-55,mic_y-110,mic_x+55,mic_y-10),(55,55,60,255),w=6)
    for gy in range(mic_y-100, mic_y-20, 12):
        d.arc((mic_x-48,gy-8,mic_x+48,gy+8), start=200, end=340, fill=(90,92,98,255), width=2)
    for gx in range(mic_x-35, mic_x+36, 14):
        d.line([(gx,mic_y-102),(gx,mic_y-18)], fill=(90,92,98,255), width=2)
    R(d,(mic_x-28,mic_y-12,mic_x+28,mic_y+70),(32,32,36,255),w=6,r=10)
    E(d,(mic_x-70,mic_y+20,mic_x-10,mic_y+80),skin_c,w=5)
    E(d,(mic_x+10,mic_y+20,mic_x+70,mic_y+80),skin_c,w=5)
    chester_head(d, expr=expr, effort=effort)
    return img

# ---- JAY-Z (dark skin, shaved head/cap, goatee, gold chain, oversized jacket over white tee, baggy jeans) ----

def jayz_head(d, expr='confident', cap=True):
    # neck
    R(d,(474,302,556,368), skin_j, w=6)
    # head
    d.rounded_rectangle((432,162,598,338), radius=58, fill=skin_j, outline=ink, width=8)
    # shaved head highlight
    d.arc((450,170,580,250), start=200, end=340, fill=(150,100,70,120), width=4)
    # ears
    E(d,(418,236,448,274), skin_j, w=5); E(d,(582,236,612,274), skin_j, w=5)
    # cap (flat brim, black/navy, tilted slightly back) - logo generic
    if cap:
        cap_c = (28,34,52,255); brim = (22,28,44,255)
        d.ellipse((400,120,630,225), fill=cap_c, outline=ink) # dome
        d.rounded_rectangle((365,186,665,216), radius=10, fill=brim, outline=ink) # brim
        d.rectangle((410,172,620,208), fill=cap_c, outline=ink)
        # generic logo mark
        d.arc((495,145,535,185), start=210, end=330, fill=(70,80,100,255), width=4)
    # goatee (mustache connected to thin chin beard)
    beard=(25,20,18,240)
    d.arc((462,286,568,332), start=20, end=160, fill=beard, width=6) # mustache line
    d.rounded_rectangle((498,304,532,332), radius=6, fill=beard, outline=beard, width=2) # chin
    d.line([(480,298),(498,314)], fill=beard, width=4)
    d.line([(550,298),(532,314)], fill=beard, width=4)
    # brows
    brow=(30,24,22,255)
    if expr == 'skeptical':
        d.line([(460,238),(502,232)], fill=brow, width=6)
        d.arc((528,228,570,244), start=200, end=330, fill=brow, width=6)
    elif expr == 'surprised':
        d.arc((458,224,502,242), start=200, end=340, fill=brow, width=6)
        d.arc((528,224,572,242), start=200, end=340, fill=brow, width=6)
    else: # confident/nod
        d.arc((458,230,502,246), start=210, end=350, fill=brow, width=6)
        d.arc((528,230,572,246), start=190, end=330, fill=brow, width=6)
    # eyes (dark brown), confident/calm
    for cx in [486,544]:
        if expr == 'surprised':
            E(d,(cx-16,242,cx+16,264),(245,242,238,255),w=4)
            E(d,(cx-6,249,cx+6,259),(60,40,28,255),w=3); E(d,(cx-3,251,cx+3,256),(18,14,12,255),w=0)
        else:
            h = 16 if expr!='skeptical' else 14
            E(d,(cx-15,245,cx+15,245+h),(245,242,238,255),w=4)
            E(d,(cx-5,249,cx+5,258),(60,40,28,255),w=3); E(d,(cx-2,251,cx+2,255),(18,14,12,255),w=0)
        if expr == 'confident':
            # slight squint/corner smile eye
            d.arc((cx-14,244,cx+14,256), start=210, end=330, fill=(40,30,24,255), width=3)
    # nose
    d.line([(515,258),(512,284)], fill=(95,60,42,255), width=5)
    d.line([(508,286),(522,286)], fill=(95,60,42,255), width=4)
    # mouth
    if expr == 'confident' or expr == 'nod':
        d.arc((490,292,540,314), start=20, end=140, fill=(160,90,80,255), width=4) # corner smile
        d.arc((528,296,542,308), start=320, end=40, fill=(160,90,80,255), width=3)
    elif expr == 'surprised':
        E(d,(500,292,530,314),(140,70,70,255),w=4)
    else: # skeptical
        d.line([(494,300),(536,298)], fill=(150,85,75,255), width=4)
    # jaw definition
    d.arc((448,288,582,338), start=30, end=150, fill=(100,65,45,255), width=3)

def jayz_pose(expr='confident', with_mic=False, gesture=False):
    img = Image.new('RGBA', (W,H), (0,0,0,0)); d = ImageDraw.Draw(img)
    pants=(34,38,48,255); shoes=(235,235,238,255)
    # legs baggy
    R(d,(410,655,492,918),pants,r=22); R(d,(538,655,620,918),pants,r=22)
    E(d,(395,890,502,948),shoes,w=6); E(d,(528,890,635,948),shoes,w=6)
    # arms
    R(d,(338,388,430,645),skin_j,w=8,r=24); R(d,(600,388,692,645),skin_j,w=8,r=24)
    # one hand in pocket, other gesturing or mic
    E(d,(332,625,422,695),skin_j,w=6)
    if with_mic:
        # mic in right hand up
        mic_x, mic_y = 660, 500
        E(d,(610,625,700,695),skin_j,w=6)
        R(d,(620,480,700,560),skin_j,w=0,r=16); E(d,(620,480,700,560),skin_j,w=6)
        E(d,(mic_x-35,mic_y-70,mic_x+35,mic_y),(55,55,60,255),w=5)
        R(d,(mic_x-18,mic_y-5,mic_x+18,mic_y+50),(32,32,36,255),w=5,r=8)
    elif gesture:
        E(d,(620,560,710,640),skin_j,w=6) # hand gesturing mid
    else:
        E(d,(610,625,700,695),skin_j,w=6)
        # pocket hint on left
        d.arc((430,560,490,620), start=20, end=160, fill=(28,32,42,255), width=4)

    # torso: white t-shirt + oversized open jacket
    tee=(245,245,248,255); jacket=(30,36,52,255)
    R(d,(422,360,608,665),tee,w=8,r=16)
    # jacket sides open
    R(d,(400,360,455,665),jacket,w=8,r=18)
    R(d,(575,360,630,665),jacket,w=8,r=18)
    R(d,(395,360,440,520),jacket,w=6,r=16)
    R(d,(590,360,635,520),jacket,w=6,r=16)
    # jacket lapel/edge lines
    d.line([(455,365),(465,470)], fill=(45,52,70,255), width=5)
    d.line([(575,365),(565,470)], fill=(45,52,70,255), width=5)
    # white tee visible center
    d.polygon([(455,360),(575,360),(555,520),(475,520)], fill=tee, outline=ink)

    # gold chain (thick, shiny) with pendant
    gold=(218,175,60,255); gold_hi=(245,215,110,255)
    d.arc((445,330,585,420), start=25, end=155, fill=gold, width=10)
    d.arc((448,334,582,416), start=30, end=150, fill=gold_hi, width=4)
    # pendant
    d.ellipse((498,395,532,430), fill=gold, outline=ink)
    d.line([(506,405),(524,422)], fill=(80,60,20,255), width=4)
    d.line([(524,405),(506,422)], fill=(80,60,20,255), width=4)

    jayz_head(d, expr=expr, cap=True)
    return img

# ---- MIKE silhouette (simple, with cap) ----
def mike_silhouette():
    img = Image.new('RGBA',(W,H),(0,0,0,0)); d = ImageDraw.Draw(img)
    col = (18,18,24,230)
    # simple silhouette body
    d.ellipse((430,160,600,330), fill=col)
    R(d,(440,320,590,660), col, outline=col, w=0, r=20)
    R(d,(360,360,450,600), col, outline=col, w=0, r=16)
    R(d,(580,360,670,600), col, outline=col, w=0, r=16)
    # cap
    d.ellipse((410,120,620,220), fill=col)
    d.rounded_rectangle((380,185,650,212), radius=8, fill=col)
    save(img,'mike_silhouette.png')

os.makedirs(OUT, exist_ok=True)

# Chester
save(chester_pose('closed', effort=False), 'chester_closed.png')
save(chester_pose('singing', effort=True), 'chester_singing.png')
save(chester_pose('triumph', effort=False), 'chester_triumph.png')

# Jay-Z
save(jayz_pose('skeptical', with_mic=False, gesture=False), 'jayz_skeptical.png')
save(jayz_pose('surprised', with_mic=False, gesture=False), 'jayz_surprised.png')
save(jayz_pose('confident', with_mic=False, gesture=False), 'jayz_confident.png')
save(jayz_pose('confident', with_mic=True, gesture=False), 'jayz_mic.png')
save(jayz_pose('nod', with_mic=False, gesture=True), 'jayz_nod.png')

# Mike silhouette
mike_silhouette()

print('done')
