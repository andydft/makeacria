from PIL import Image, ImageDraw
import os, math

OUT_DIR = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\queen-stadium"
W = H = 1024

ink = (28, 20, 18, 255)
skin = (242, 205, 170, 255)
skin_sh = (228, 185, 150, 255)
hair = (35, 28, 26, 255)
hair_h = (55, 45, 40, 255)
white = (245, 245, 240, 255)
white_sh = (220, 220, 215, 255)
jeans = (45, 60, 90, 255)
jeans_h = (60, 80, 115, 255)
must = (40, 30, 28, 255)
eye_w = (248, 248, 245, 255)
eye_c = (90, 70, 55, 255)
pupil = (20, 18, 18, 255)


def draw_freddie(expr="confident"):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def E(b, fill, outline=ink, w=8):
        d.ellipse(b, fill=fill, outline=outline, width=w)

    def R(b, fill, outline=ink, w=8):
        d.rounded_rectangle(b, radius=18, fill=fill, outline=outline, width=w)

    # legs (jeans, tight dark)
    R((410, 620, 490, 900), jeans, w=8)
    R((534, 620, 614, 900), jeans, w=8)
    # seam hints
    d.line((450, 640, 450, 890), fill=jeans_h, width=3)
    d.line((574, 640, 574, 890), fill=jeans_h, width=3)
    # shoes
    E((395, 870, 500, 930), (40, 35, 35, 255), w=6)
    E((524, 870, 629, 930), (40, 35, 35, 255), w=6)

    # arms
    # left arm down
    R((330, 360, 430, 650), skin, w=8)
    E((335, 630, 425, 700), skin, w=6)
    # right arm: confident/triumph slight out, worried/eureka similar
    if expr in ("triumph", "eureka"):
        # right arm raised a bit outward
        R((585, 330, 685, 560), skin, w=8)
        E((590, 300, 680, 370), skin, w=6)
        # fist gesture area simple
    else:
        R((594, 360, 694, 650), skin, w=8)
        E((599, 630, 689, 700), skin, w=6)

    # torso - white tank top (iconic)
    R((420, 350, 604, 640), white, w=8)
    # straps
    R((435, 320, 485, 385), white, w=6)
    R((539, 320, 589, 385), white, w=6)
    # chest shadow
    d.arc((455, 385, 569, 455), start=20, end=160, fill=white_sh, width=4)
    d.line((430, 620, 594, 620), fill=jeans_h, width=6)

    # neck
    R((470, 285, 554, 345), skin, w=6)

    # head
    E((420, 150, 604, 320), skin, w=8)
    d.arc((440, 235, 584, 315), start=20, end=160, fill=skin_sh, width=5)

    # hair - dark, voluminous, slightly wavy (rockstar)
    d.ellipse((398, 108, 626, 232), fill=hair, outline=ink)
    d.ellipse((392, 150, 455, 305), fill=hair, outline=ink)
    d.ellipse((569, 150, 632, 305), fill=hair, outline=ink)
    # back/top volume bumps
    d.ellipse((430, 95, 510, 160), fill=hair, outline=None)
    d.ellipse((514, 92, 594, 158), fill=hair, outline=None)
    # wave highlights
    for (cx, cy, rx, ry) in [(460, 140, 40, 18), (520, 132, 38, 16), (560, 145, 34, 16), (470, 176, 30, 12), (542, 172, 28, 12), (505, 155, 26, 10)]:
        d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=hair_h)

    # ears
    E((408, 212, 438, 252), skin, w=5)
    E((586, 212, 616, 252), skin, w=5)

    # eyebrows by expression
    brow_lift = 0
    brow_slant = 0
    if expr == "worried":
        brow_lift = -4
        brow_slant = 6
    elif expr == "eureka":
        brow_lift = -10
        brow_slant = -2
    elif expr == "triumph":
        brow_lift = -6
    # left brow
    d.arc((452, 192 + brow_lift, 496, 214 + brow_lift - brow_slant//2), start=200, end=340, fill=(50, 35, 30, 255), width=6)
    # right brow
    d.arc((528, 192 + brow_lift - brow_slant//2, 572, 214 + brow_lift), start=200, end=340, fill=(50, 35, 30, 255), width=6)

    # eyes
    eye_open = 1.0
    pupil_dx = 0
    if expr == "worried":
        eye_open = 1.05
        pupil_dx = -2
    elif expr == "eureka":
        eye_open = 1.15
    elif expr == "triumph":
        eye_open = 0.95
    for cx in [475, 549]:
        ry = int(15 * eye_open)
        E((cx - 22, 230 - ry, cx + 22, 230 + ry), eye_w, w=5)
        E((cx - 11 + pupil_dx, 230 - int(10*eye_open), cx + 11 + pupil_dx, 230 + int(10*eye_open)), eye_c, w=4)
        E((cx - 5 + pupil_dx, 225, cx + 5 + pupil_dx, 235), pupil, w=0)
        d.ellipse((cx - 1 + pupil_dx, 222, cx + 6 + pupil_dx, 229), fill=(255, 255, 255, 220))
    # upper lids
    for cx in [475, 549]:
        d.arc((cx - 22, 210, cx + 22, 235), start=200, end=340, fill=ink, width=3)

    # nose
    d.line((512, 236, 512, 268), fill=(200, 160, 140, 255), width=5)
    d.arc((500, 258, 524, 278), start=20, end=160, fill=(200, 160, 140, 255), width=4)

    # iconic mustache (short, defined, Freddie style)
    d.rounded_rectangle((460, 272, 564, 297), radius=10, fill=must, outline=ink)
    d.arc((468, 267, 512, 292), start=20, end=160, fill=(55, 40, 35, 255), width=4)
    d.arc((512, 267, 556, 292), start=20, end=160, fill=(55, 40, 35, 255), width=4)
    d.line((512, 268, 512, 274), fill=skin_sh, width=2)

    # mouth/teeth by expression (under mustache hint visible)
    if expr == "worried":
        # tense/open slight
        d.ellipse((492, 293, 532, 308), fill=(120, 60, 60, 255), outline=ink)
        d.line((496, 296, 528, 296), fill=(240, 235, 230, 255), width=3)
    elif expr == "eureka":
        # open "aha"
        d.ellipse((488, 292, 536, 314), fill=(120, 60, 60, 255), outline=ink)
        d.line((494, 296, 530, 296), fill=(240, 235, 230, 255), width=3)
    elif expr == "triumph":
        # big smile
        d.arc((478, 280, 546, 312), start=15, end=165, fill=(120, 60, 60, 255), width=6)
        d.line((490, 299, 534, 299), fill=(240, 235, 230, 255), width=4)
    else:
        # confident slight smile
        d.arc((486, 286, 538, 306), start=20, end=160, fill=(180, 110, 110, 255), width=4)
        d.line((496, 297, 528, 297), fill=(240, 235, 230, 255), width=3)

    # chin
    d.arc((486, 300, 538, 318), start=20, end=160, fill=skin_sh, width=3)

    # microphone stand element for confident/triumph (subtle prop hint near right side)
    if expr in ("confident", "triumph"):
        mx, my = 660, 300
        d.line([(mx, my), (mx, 820)], fill=(70, 70, 75, 255), width=6)
        d.ellipse((mx - 18, my - 28, mx + 18, my + 8), fill=(180, 180, 185, 255), outline=ink)

    return img


os.makedirs(OUT_DIR, exist_ok=True)
for expr, name in [
    ("confident", "freddie.png"),
    ("confident", "freddie_confident.png"),
    ("worried", "freddie_worried.png"),
    ("eureka", "freddie_eureka.png"),
    ("triumph", "freddie_triumph.png"),
]:
    im = draw_freddie(expr)
    path = os.path.join(OUT_DIR, name)
    im.save(path)
    print(name, os.path.getsize(path))
