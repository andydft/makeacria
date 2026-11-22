from PIL import Image, ImageDraw, ImageFilter
import os, math

OUT = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\linkin-park-crawling"
W = H = 1024
ink = (28, 20, 18, 255)
skin = (236, 198, 168, 255)
skin_shadow = (220, 180, 150, 255)


def E(d, b, fill, outline=ink, w=8):
    d.ellipse(b, fill=fill, outline=outline, width=w)


def R(d, b, fill, outline=ink, w=8, r=18):
    d.rounded_rectangle(b, radius=r, fill=fill, outline=outline, width=w)


def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path)
    print(name, os.path.getsize(path))


def draw_tattoos(d):
    # detailed stylized tattoos: tribal, rose, geometric (black/dark gray), 3-4 designs, no stripes
    tcol = (35, 30, 32, 230)
    t2 = (55, 48, 50, 210)
    # right arm (viewer left side of image) - tribal flame
    bx, by = 350, 430
    pts = [(bx, by), (bx+22, by-18), (bx+10, by+5), (bx+30, by-2), (bx+14, by+22), (bx+28, by+18), (bx+12, by+38)]
    d.line(pts, fill=tcol, width=5, joint='curve')
    d.line([(bx+6, by+8),(bx+26, by+30),(bx+8, by+46)], fill=t2, width=3)
    d.arc((345, 470, 410, 520), start=210, end=340, fill=tcol, width=4)
    # rose-ish
    cx, cy = 382, 545
    for r in [10, 16]:
        d.arc((cx-r, cy-r, cx+r, cy+r), start=20, end=200, fill=tcol, width=3)
        d.arc((cx-r, cy-r, cx+r, cy+r), start=210, end=350, fill=t2, width=3)
    d.ellipse((cx-4, cy-4, cx+4, cy+4), fill=tcol)
    d.line([(cx, cy+10),(cx-6, cy+30),(cx, cy+28),(cx+6, cy+38)], fill=t2, width=3)

    # left arm (viewer right) - geometric + symbol
    bx, by = 610, 435
    d.polygon([(bx+20,by),(bx+40,by+18),(bx+20,by+36),(bx,by+18)], outline=tcol, width=4)
    d.line([(bx+20,by),(bx+20,by+36)], fill=t2, width=3)
    d.line([(bx,by+18),(bx+40,by+18)], fill=t2, width=3)
    # geometric bands/shapes (not stripes: angular)
    d.line([(612,490),(655,505),(618,520),(650,535)], fill=tcol, width=4)
    d.arc((608, 545, 668, 590), start=200, end=340, fill=tcol, width=4)
    d.line([(625,555),(645,575)], fill=t2, width=3)
    d.line([(640,548),(628,575)], fill=t2, width=3)


def draw_hair(d):
    # brown short/medium, slightly messy, lighter tips
    base = (88, 62, 45, 255)
    tip = (140, 105, 75, 255)
    # main mass
    d.ellipse((415, 135, 615, 255), fill=base, outline=ink)
    d.rectangle((430, 212, 600, 258), fill=skin)
    E(d, (430, 160, 600, 335), skin, w=8)
    # messy tufts
    tufts = [
        (430,230,455,155),(455,220,485,140),(485,215,515,132),(515,215,545,135),(545,220,575,142),(575,230,605,155),(418,245,438,180),(592,245,612,182)
    ]
    for x1,y1,x2,y2 in tufts:
        d.polygon([(x1,y1),(x2,y2),((x1+x2)//2+6,y1-8)], fill=base, outline=ink)
    # lighter tips on some strands
    for x1,y1,x2,y2 in [(455,220,480,148),(515,215,535,142),(575,230,598,162)]:
        d.line([( (x1+x2)//2, (y1+y2)//2 ), (x2,y2)], fill=tip, width=4)
    # texture lines
    for sx,sy,ex,ey in [(470,205,488,165),(505,198,512,155),(545,202,560,160),(575,212,590,175)]:
        d.line([(sx,sy),(ex,ey)], fill=(65,45,34,255), width=3)


def head(d, expr='focused', effort=False):
    # neck with subtle veins on effort
    R(d, (474, 300, 556, 368), skin, w=6)
    if effort:
        d.line([(486,318),(482,350)], fill=(190,150,140,255), width=3)
        d.line([(544,320),(548,352)], fill=(190,150,140,255), width=3)
    # head - slightly squared jaw
    d.rounded_rectangle((432, 160, 598, 338), radius=55, fill=skin, outline=ink, width=8)
    draw_hair(d)
    # ears
    E(d, (418, 234, 448, 272), skin, w=5)
    E(d, (582, 234, 612, 272), skin, w=5)
    # stubble (light beard shadow)
    for yy in range(292, 326, 5):
        for xx in range(455, 575, 6):
            if ((yy//5 + xx//6) % 2 == 0) and ((xx-515)**2/3600 + (yy-308)**2/400 < 1.2):
                d.point((xx,yy), fill=(170,145,135,120))

    # brows thick
    brow_color = (60,42,32,255)
    if expr in ('focused','closed','exhausted'):
        by = 234
        d.arc((458, by-8, 502, by+10), start=210, end=350, fill=brow_color, width=7)
        d.arc((528, by-8, 572, by+10), start=190, end=330, fill=brow_color, width=7)
    elif expr == 'singing':
        d.arc((458, 228, 502, 246), start=205, end=345, fill=brow_color, width=7)
        d.arc((528, 228, 572, 246), start=195, end=335, fill=brow_color, width=7)
    elif expr == 'intense':
        d.line([(460,238),(502,231)], fill=brow_color, width=7)
        d.line([(528,231),(570,238)], fill=brow_color, width=7)
    else:
        d.arc((458, 230, 502, 246), start=210, end=350, fill=brow_color, width=7)
        d.arc((528, 230, 572, 246), start=190, end=330, fill=brow_color, width=7)

    # eyes big expressive, iris brown-greenish
    iris = (92, 98, 72, 255)
    for cx in [486, 544]:
        if expr in ('closed','exhausted') and expr != 'singing':
            # closed eyes
            if expr == 'exhausted':
                d.arc((cx-16, 246, cx+16, 264), start=20, end=160, fill=(70,50,40,255), width=5)
                d.arc((cx-14, 250, cx+14, 262), start=200, end=340, fill=(70,50,40,255), width=3)
            else:
                d.arc((cx-16, 248, cx+16, 262), start=20, end=160, fill=(70,50,40,255), width=5)
        elif expr == 'half':
            E(d, (cx-16, 248, cx+16, 260), (246,246,242,255), w=4)
            E(d, (cx-6, 250, cx+6, 258), iris, w=3)
            E(d, (cx-3, 252, cx+3, 256), (20,18,18,255), w=0)
            d.line([(cx-16,248),(cx+16,248)], fill=skin, width=4)
        else: # open/focused/intense/singing
            h = 18 if expr!='intense' else 20
            E(d, (cx-17, 244, cx+17, 244+h), (246,246,242,255), w=4)
            py = 250
            E(d, (cx-7, py, cx+7, py+11), iris, w=3)
            E(d, (cx-3, py+3, cx+3, py+8), (20,18,18,255), w=0)
            # highlight
            d.ellipse((cx-5, py+1, cx-2, py+4), fill=(240,245,235,255))
        if expr == 'intense' or expr == 'singing':
            d.line([(cx-17,243),(cx+17,248)], fill=(55,38,30,255), width=3)

    # nose
    d.line([(515,256),(515,284)], fill=(198,158,138,255), width=4)
    d.line([(506,285),(524,285)], fill=(198,158,138,255), width=3)

    # mouth
    if expr in ('focused','closed','half','exhausted'):
        if expr == 'exhausted':
            d.arc((494,298,536,314), start=200, end=340, fill=(170,110,110,255), width=4)
        else:
            d.arc((492,292,538,308), start=20, end=160, fill=(170,110,110,255), width=4)
    elif expr == 'singing':
        E(d, (492,288,538,324), (118,48,54,255), w=4)
        E(d, (500,296,530,318), (70,30,35,255), w=0)
        # upper teeth hint
        d.line([(498,292),(532,292)], fill=(230,225,220,255), width=3)
    elif expr == 'intense':
        E(d, (496,290,534,316), (130,55,60,255), w=4)
        E(d, (503,296,527,310), (80,35,40,255), w=0)

    # defined jaw shadow
    d.arc((448,285,582,336), start=25, end=155, fill=(210,170,142,255), width=3)
    d.line([(448,300),(460,318)], fill=(210,170,142,255), width=3)
    d.line([(582,300),(570,318)], fill=(210,170,142,255), width=3)

    # sweat drop for intense/singing effort
    if effort and expr in ('singing','intense'):
        E(d,(558,275,568,292),(180,220,245,220), w=2)
        d.ellipse((560,278,566,288), fill=(210,235,250,200))


def chester_pose(expr='focused', effort=False, hand_on_chest=False):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    tank = (26, 26, 30, 255)
    pants = (36, 36, 42, 255)

    # legs (partly visible)
    R(d, (418, 660, 496, 920), pants)
    R(d, (534, 660, 612, 920), pants)
    E(d, (402, 890, 506, 950), (30, 28, 28, 255), w=6)
    E(d, (524, 890, 628, 950), (30, 28, 28, 255), w=6)

    # muscular arms
    R(d, (332, 382, 422, 640), skin, w=8, r=22)
    R(d, (608, 382, 698, 640), skin, w=8, r=22)
    # bicep/forearm definition
    d.arc((335,410,395,470), start=300, end=60, fill=skin_shadow, width=3)
    d.arc((635,410,695,470), start=120, end=240, fill=skin_shadow, width=3)

    draw_tattoos(d)

    # hands
    # left hand up holding mic area
    E(d, (325, 620, 420, 700), skin, w=6)
    # right hand
    if hand_on_chest:
        E(d, (560, 520, 640, 590), skin, w=6)
        R(d, (545, 500, 650, 560), skin, w=0, r=18)
        E(d, (560, 520, 640, 590), skin, w=6)
    else:
        E(d, (610, 620, 705, 700), skin, w=6)

    # torso - tight black tank
    R(d, (422, 360, 608, 665), tank, w=8, r=16)
    # neckline and straps
    d.line([(450,360),(450,420)], fill=(42,42,48,255), width=12)
    d.line([(580,360),(580,420)], fill=(42,42,48,255), width=12)
    d.arc((450,360,580,435), start=20, end=160, fill=(42,42,48,255), width=5)
    # chest/pec hint
    d.arc((455,430,515,490), start=200, end=340, fill=(38,38,44,255), width=3)
    d.arc((515,430,575,490), start=200, end=340, fill=(38,38,44,255), width=3)

    # studio microphone (large, black, metallic grille) held in front of chest/mouth
    mic_x, mic_y = 515, 520
    # grille head
    E(d, (mic_x-55, mic_y-110, mic_x+55, mic_y-10), (55,55,60,255), w=6)
    # grille mesh lines
    for gy in range(mic_y-100, mic_y-20, 12):
        d.arc((mic_x-48, gy-8, mic_x+48, gy+8), start=200, end=340, fill=(90,92,98,255), width=2)
    for gx in range(mic_x-35, mic_x+36, 14):
        d.line([(gx, mic_y-102),(gx, mic_y-18)], fill=(90,92,98,255), width=2)
    # body
    R(d, (mic_x-28, mic_y-12, mic_x+28, mic_y+70), (32,32,36,255), w=6, r=10)
    # hand overlap hint
    E(d, (mic_x-70, mic_y+20, mic_x-10, mic_y+80), skin, w=5)
    E(d, (mic_x+10, mic_y+20, mic_x+70, mic_y+80), skin, w=5)

    # studio headphones (large, black, thick pads) covering ears
    # band over head
    d.arc((420,120,610,240), start=200, end=340, fill=(30,30,34,255), width=14)
    # ear cups
    R(d, (400,210,440,290), (28,28,32,255), w=6, r=14)
    R(d, (590,210,630,290), (28,28,32,255), w=6, r=14)
    R(d, (405,218,435,282), (45,45,50,255), w=4, r=10)
    R(d, (595,218,625,282), (45,45,50,255), w=4, r=10)

    head(d, expr=expr, effort=effort)
    return img


os.makedirs(OUT, exist_ok=True)

save(chester_pose('closed', effort=False), 'chester_prep.png')        # eyes closed breathing
save(chester_pose('focused', effort=False), 'chester_start.png')      # focused starting
save(chester_pose('singing', effort=True), 'chester_singing.png')     # intensity singing, vein/sweat
save(chester_pose('intense', effort=True), 'chester_intense.png')     # intense
save(chester_pose('exhausted', effort=False, hand_on_chest=True), 'chester_exhausted.png')  # exausted
save(chester_pose('half', effort=False), 'chester_final.png')         # eyes half/open looking out
save(chester_pose('closed', effort=False), 'chester_silence.png')     # head low silence
print('done')
