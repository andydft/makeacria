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


def draw_spiky_hair(d):
    color = (75, 52, 38, 255)  # dark brown
    # fuller spiky hair silhouette (short spiky, early 2000s feel)
    spikes = [
        (420, 235, 468, 148),
        (452, 225, 498, 132),
        (488, 218, 530, 125),
        (525, 218, 565, 128),
        (558, 225, 602, 138),
        (590, 240, 622, 158),
        (408, 248, 444, 172),
    ]
    for x1, y1, x2, y2 in spikes:
        d.polygon([(x1, y1), (x2, y2), ((x1 + x2) // 2 + 10, y1 - 6)], fill=color, outline=ink)
    d.ellipse((418, 140, 612, 250), fill=color, outline=ink)
    # cut bottom to reveal forehead/face edge cleanly
    d.rectangle((430, 210, 600, 255), fill=skin)
    E(d, (430, 160, 600, 335), skin, w=8)
    # inner spike lines
    for sx, sy, ex, ey in [(470, 205, 492, 158), (505, 198, 515, 148), (540, 200, 556, 154), (575, 210, 586, 168)]:
        d.line([(sx, sy), (ex, ey)], fill=(55, 38, 28, 255), width=4)


def base_head_chester(d, expr='neutral'):
    # neck
    R(d, (475, 300, 555, 365), skin, w=6)
    # head
    E(d, (430, 160, 600, 335), skin, w=8)
    draw_spiky_hair(d)
    # ears + small gauge hint
    E(d, (418, 232, 446, 268), skin, w=5)
    E(d, (584, 232, 612, 268), skin, w=5)
    E(d, (422, 244, 438, 256), (60, 60, 65, 255), w=3)
    E(d, (592, 244, 608, 256), (60, 60, 65, 255), w=3)

    # brows
    by = 232
    if expr == 'frustrated':
        by = 236
    elif expr in ('determined', 'singing'):
        by = 231
    elif expr == 'triumph':
        by = 230
    if expr == 'frustrated':
        d.line([(462, 238), (502, 232)], fill=(55, 38, 30, 255), width=6)
        d.line([(528, 232), (568, 238)], fill=(55, 38, 30, 255), width=6)
    elif expr in ('determined', 'singing'):
        d.line([(462, by + 4), (504, by - 2)], fill=(55, 38, 30, 255), width=6)
        d.line([(526, by - 2), (568, by + 4)], fill=(55, 38, 30, 255), width=6)
    else:
        d.line([(462, by), (504, by - 3)], fill=(55, 38, 30, 255), width=6)
        d.line([(526, by - 3), (568, by)], fill=(55, 38, 30, 255), width=6)

    # eyes
    for cx in [485, 545]:
        h = 18
        if expr == 'frustrated':
            h = 14
        elif expr == 'singing':
            h = 12
        elif expr == 'triumph':
            h = 16
        E(d, (cx - 16, 244, cx + 16, 244 + h), (248, 248, 245, 255), w=4)
        px = cx
        py = 250 if h >= 16 else 248
        E(d, (px - 6, py, px + 6, py + 10), (78, 58, 45, 255), w=3)
        E(d, (px - 3, py + 3, px + 3, py + 7), (20, 18, 18, 255), w=0)

    if expr in ('determined', 'singing'):
        d.line([(469, 243), (501, 248)], fill=(45, 30, 25, 255), width=4)
        d.line([(529, 248), (561, 243)], fill=(45, 30, 25, 255), width=4)

    # nose
    d.line([(515, 256), (515, 282)], fill=(200, 160, 140, 255), width=4)
    d.line([(507, 283), (523, 283)], fill=(200, 160, 140, 255), width=3)

    # mouth
    if expr == 'neutral':
        d.arc((492, 288, 538, 306), start=20, end=160, fill=(170, 110, 110, 255), width=4)
    elif expr == 'frustrated':
        d.arc((492, 296, 538, 314), start=200, end=340, fill=(170, 110, 110, 255), width=4)
    elif expr == 'determined':
        d.line([(494, 296), (536, 296)], fill=(160, 100, 100, 255), width=4)
    elif expr == 'triumph':
        d.arc((486, 284, 544, 314), start=15, end=165, fill=(170, 110, 110, 255), width=5)
        d.line([(492, 299), (538, 299)], fill=(230, 210, 210, 255), width=3)
    elif expr == 'singing':
        E(d, (496, 286, 534, 320), (120, 50, 55, 255), w=4)
        E(d, (502, 294, 528, 314), (70, 30, 35, 255), w=0)

    # subtle jaw shadow
    d.arc((445, 270, 585, 330), start=30, end=150, fill=(210, 175, 148, 255), width=3)


def chester(expr='neutral'):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    tank = (28, 28, 32, 255)
    pants = (38, 38, 44, 255)

    # legs
    R(d, (418, 650, 496, 912), pants)
    R(d, (534, 650, 612, 912), pants)
    E(d, (402, 882, 506, 942), (32, 28, 28, 255), w=6)
    E(d, (524, 882, 628, 942), (32, 28, 28, 255), w=6)

    # arms
    R(d, (346, 380, 428, 645), skin, w=8)
    R(d, (602, 380, 684, 645), skin, w=8)

    # tattoos (stylized flame/tribal ink lines)
    tattoo = (35, 28, 28, 230)
    for (bx, by, side) in [
        (350, 420, 1), (606, 420, -1),
        (352, 468, 1), (604, 468, -1),
        (355, 516, 1), (601, 516, -1),
        (360, 562, 1), (598, 562, -1),
    ]:
        pts = [(bx, by), (bx + side * 18, by - 10), (bx + side * 8, by + 8), (bx + side * 24, by + 6), (bx + side * 10, by + 22)]
        d.line(pts, fill=tattoo, width=4, joint='curve')
    d.arc((356, 430, 415, 500), start=210, end=330, fill=tattoo, width=3)
    d.arc((615, 430, 674, 500), start=210, end=330, fill=tattoo, width=3)

    # hands
    E(d, (340, 625, 430, 695), skin, w=6)
    E(d, (600, 625, 690, 695), skin, w=6)

    # torso tank
    R(d, (428, 360, 602, 660), tank, w=8)
    # straps/neckline
    d.line([(452, 360), (452, 415)], fill=(45, 45, 50, 255), width=11)
    d.line([(578, 360), (578, 415)], fill=(45, 45, 50, 255), width=11)
    d.arc((452, 360, 578, 430), start=20, end=160, fill=(45, 45, 50, 255), width=5)

    base_head_chester(d, expr=expr)
    name = f"chester_{expr}.png" if expr != 'neutral' else 'chester.png'
    save(img, name)


def base_head_mike(d, expr='neutral'):
    hair = (38, 34, 30, 255)
    R(d, (475, 300, 555, 365), skin, w=6)
    E(d, (430, 160, 600, 335), skin, w=8)

    # hair peeking under cap
    d.ellipse((420, 150, 610, 260), fill=hair, outline=ink)
    d.rectangle((430, 212, 600, 262), fill=skin)
    E(d, (430, 160, 600, 335), skin, w=8)

    # red flat-brim cap (2000s style)
    cap_c = (170, 40, 45, 255)
    brim = (150, 35, 40, 255)
    d.ellipse((398, 108, 632, 222), fill=cap_c, outline=ink)
    d.rounded_rectangle((375, 182, 655, 214), radius=10, fill=brim, outline=ink)
    d.rectangle((408, 168, 622, 206), fill=cap_c, outline=ink)
    d.line([(515, 130), (515, 168)], fill=(190, 60, 65, 255), width=4)

    # ears
    E(d, (418, 232, 446, 268), skin, w=5)
    E(d, (584, 232, 612, 268), skin, w=5)

    # brows
    by = 233
    if expr == 'determined':
        d.line([(462, by + 2), (502, by - 2)], fill=(50, 40, 35, 255), width=5)
        d.line([(528, by - 2), (568, by + 2)], fill=(50, 40, 35, 255), width=5)
    else:
        d.line([(462, by), (502, by - 1)], fill=(50, 40, 35, 255), width=5)
        d.line([(528, by - 1), (568, by)], fill=(50, 40, 35, 255), width=5)

    # eyes
    for cx in [485, 545]:
        E(d, (cx - 15, 244, cx + 15, 262), (248, 248, 245, 255), w=4)
        E(d, (cx - 5, 249, cx + 5, 258), (60, 50, 45, 255), w=3)
        E(d, (cx - 2, 251, cx + 2, 255), (20, 18, 18, 255), w=0)

    # nose/mouth
    d.line([(515, 258), (515, 282)], fill=(200, 160, 140, 255), width=4)
    d.line([(508, 283), (522, 283)], fill=(200, 160, 140, 255), width=3)
    if expr == 'triumph':
        d.arc((490, 286, 540, 312), start=15, end=165, fill=(170, 110, 110, 255), width=4)
    elif expr == 'determined':
        d.line([(494, 296), (536, 296)], fill=(160, 100, 100, 255), width=4)
    else:
        d.arc((492, 288, 538, 306), start=20, end=160, fill=(170, 110, 110, 255), width=4)


def mike(expr='neutral'):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    hoodie = (65, 68, 78, 255)
    pants = (42, 48, 58, 255)

    R(d, (418, 650, 496, 912), pants)
    R(d, (534, 650, 612, 912), pants)
    E(d, (402, 882, 506, 942), (32, 28, 28, 255), w=6)
    E(d, (524, 882, 628, 942), (32, 28, 28, 255), w=6)

    R(d, (338, 385, 428, 650), skin, w=8)
    R(d, (602, 385, 692, 650), skin, w=8)
    E(d, (332, 630, 420, 700), skin, w=6)
    E(d, (610, 630, 698, 700), skin, w=6)

    R(d, (418, 360, 612, 660), hoodie, w=8, r=22)
    d.arc((455, 345, 575, 402), start=20, end=160, fill=(52, 55, 64, 255), width=5)

    # headphones around neck
    d.arc((438, 330, 592, 432), start=30, end=150, fill=(28, 28, 32, 255), width=11)
    E(d, (428, 360, 470, 402), (42, 42, 48, 255), w=5)
    E(d, (560, 360, 602, 402), (42, 42, 48, 255), w=5)

    base_head_mike(d, expr=expr)
    name = f"mike_{expr}.png" if expr != 'neutral' else 'mike.png'
    save(img, name)


def executive():
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    hair = (70, 60, 55, 255)
    suit = (45, 50, 65, 255)
    shirt = (235, 235, 240, 255)
    pants = (40, 45, 58, 255)

    R(d, (425, 650, 495, 910), pants)
    R(d, (535, 650, 610, 910), pants)
    E(d, (410, 880, 505, 940), (30, 28, 28, 255), w=6)
    E(d, (525, 880, 620, 940), (30, 28, 28, 255), w=6)

    # arms crossed
    R(d, (360, 380, 470, 560), suit, w=8)
    R(d, (560, 380, 670, 560), suit, w=8)
    R(d, (420, 470, 610, 560), suit, w=6)
    E(d, (350, 540, 430, 610), skin, w=6)
    E(d, (600, 540, 680, 610), skin, w=6)

    R(d, (430, 360, 600, 660), suit, w=8)
    # shirt + tie
    d.polygon([(490, 360), (540, 360), (515, 470)], fill=shirt, outline=ink)
    d.polygon([(505, 380), (525, 380), (515, 455)], fill=(120, 40, 50, 255), outline=ink)

    R(d, (475, 300, 555, 365), skin, w=6)
    E(d, (430, 160, 600, 335), skin, w=8)
    d.ellipse((420, 135, 610, 230), fill=hair, outline=ink)
    d.rectangle((430, 195, 600, 240), fill=skin)
    E(d, (430, 160, 600, 335), skin, w=8)

    # glasses
    d.rectangle((455, 235, 505, 265), outline=(40, 40, 45, 255), width=4)
    d.rectangle((525, 235, 575, 265), outline=(40, 40, 45, 255), width=4)
    d.line((505, 250, 525, 250), fill=(40, 40, 45, 255), width=4)

    # skeptical expression
    d.arc((462, 228, 500, 244), start=200, end=330, fill=(60, 45, 40, 255), width=5)
    d.arc((530, 228, 568, 244), start=210, end=340, fill=(60, 45, 40, 255), width=5)
    for cx in [480, 550]:
        E(d, (cx - 12, 242, cx + 12, 260), (248, 248, 245, 255), w=4)
        E(d, (cx - 5, 247, cx + 5, 255), (80, 70, 60, 255), w=3)
    d.line((515, 258, 515, 280), fill=(200, 160, 140, 255), width=4)
    d.line((495, 295, 535, 292), fill=(160, 100, 100, 255), width=4)

    save(img, 'executive.png')


os.makedirs(OUT, exist_ok=True)
# Chester variants
chester('neutral')
chester('frustrated')
chester('determined')
chester('triumph')
chester('singing')
# Mike variants
mike('neutral')
mike('determined')
mike('triumph')
# Executive
executive()
