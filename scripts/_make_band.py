from PIL import Image, ImageDraw
import os

OUT_DIR = r"C:\Users\Pichau\cartoon-short\jimi-broom-short\public\queen-stadium"
W = H = 1024
ink = (28, 20, 18, 255)
skin = (242, 205, 170, 255)


def E(d, b, fill, outline=ink, w=8):
    d.ellipse(b, fill=fill, outline=outline, width=w)


def R(d, b, fill, outline=ink, w=8, r=18):
    d.rounded_rectangle(b, radius=r, fill=fill, outline=outline, width=w)


def save(img, name):
    path = os.path.join(OUT_DIR, name)
    img.save(path)
    print(name, os.path.getsize(path))


def brian():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    hair = (40, 28, 24, 255)
    hair_h = (60, 45, 38, 255)
    shirt = (35, 35, 40, 255)
    jeans = (40, 55, 85, 255)
    # legs
    R(d, (420, 640, 495, 900), jeans)
    R(d, (535, 640, 610, 900), jeans)
    E(d, (405, 870, 505, 930), (40, 35, 35, 255), w=6)
    E(d, (525, 870, 625, 930), (40, 35, 35, 255), w=6)
    # arms
    R(d, (340, 380, 435, 640), skin, w=8)
    R(d, (585, 400, 680, 640), skin, w=8)
    E(d, (345, 620, 430, 690), skin, w=6)
    E(d, (590, 620, 675, 690), skin, w=6)
    # torso
    R(d, (430, 360, 600, 650), shirt, w=8)
    # neck
    R(d, (475, 295, 555, 360), skin, w=6)
    # head
    E(d, (430, 165, 600, 330), skin, w=8)
    # long curly dark hair (distinctive)
    d.ellipse((395, 120, 635, 360), fill=hair, outline=ink)
    d.ellipse((380, 180, 450, 360), fill=hair, outline=ink)
    d.ellipse((580, 180, 650, 360), fill=hair, outline=ink)
    d.ellipse((410, 300, 480, 380), fill=hair, outline=ink)
    d.ellipse((550, 300, 620, 380), fill=hair, outline=ink)
    for (cx, cy, rx, ry) in [
        (450, 170, 28, 18), (520, 160, 30, 18), (570, 180, 24, 16),
        (430, 230, 22, 14), (500, 210, 22, 14), (580, 240, 20, 14),
        (460, 300, 18, 12), (540, 300, 18, 12),
    ]:
        d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=hair_h)
    # face
    E(d, (450, 190, 580, 315), skin, w=0)
    for cx in [490, 540]:
        E(d, (cx - 14, 235, cx + 14, 255), (248, 248, 245, 255), w=4)
        E(d, (cx - 6, 240, cx + 6, 250), (80, 60, 50, 255), w=3)
        E(d, (cx - 3, 242, cx + 3, 248), (20, 18, 18, 255), w=0)
    d.arc((476, 228, 504, 244), start=200, end=340, fill=(45, 30, 25, 255), width=4)
    d.arc((526, 228, 554, 244), start=200, end=340, fill=(45, 30, 25, 255), width=4)
    d.line((515, 250, 515, 275), fill=(200, 160, 140, 255), width=4)
    d.arc((495, 275, 535, 292), start=20, end=160, fill=(170, 110, 110, 255), width=3)
    # Red Special guitar (brown/red, iconic)
    body = (160, 70, 60, 255)
    neck = (90, 60, 40, 255)
    d.line([(640, 420), (820, 220)], fill=neck, width=18)
    d.line([(640, 420), (820, 220)], fill=ink, width=3)
    d.rectangle((800, 190, 860, 250), fill=(35, 30, 28, 255), outline=ink)
    E(d, (560, 380, 720, 520), body, w=6)
    E(d, (520, 430, 640, 560), body, w=6)
    E(d, (610, 440, 660, 490), (30, 25, 22, 255), w=4)
    d.line([(600, 470), (760, 280)], fill=(230, 220, 200, 255), width=2)
    save(img, "brian.png")


def roger():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    hair = (210, 185, 120, 255)
    hair_h = (235, 215, 150, 255)
    shirt = (230, 230, 225, 255)
    jeans = (45, 55, 80, 255)
    # legs (seated/drummer)
    R(d, (420, 560, 495, 780), jeans)
    R(d, (535, 560, 610, 780), jeans)
    E(d, (405, 750, 505, 810), (40, 35, 35, 255), w=6)
    E(d, (525, 750, 625, 810), (40, 35, 35, 255), w=6)
    # arms with sticks
    R(d, (360, 360, 440, 560), skin, w=8)
    R(d, (590, 360, 670, 560), skin, w=8)
    E(d, (340, 540, 420, 610), skin, w=6)
    E(d, (610, 540, 690, 610), skin, w=6)
    d.line([(380, 560), (300, 480)], fill=(230, 210, 170, 255), width=8)
    d.line([(650, 560), (730, 480)], fill=(230, 210, 170, 255), width=8)
    # torso
    R(d, (430, 340, 600, 580), shirt, w=8)
    R(d, (475, 285, 555, 350), skin, w=6)
    # head
    E(d, (435, 165, 595, 325), skin, w=8)
    # blond medium hair
    d.ellipse((410, 125, 620, 240), fill=hair, outline=ink)
    d.ellipse((410, 170, 470, 320), fill=hair, outline=ink)
    d.ellipse((560, 170, 620, 320), fill=hair, outline=ink)
    for (cx, cy, rx, ry) in [(470, 150, 28, 16), (520, 145, 30, 16), (560, 155, 24, 14), (450, 210, 18, 12), (560, 210, 18, 12)]:
        d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=hair_h)
    # face
    for cx in [490, 540]:
        E(d, (cx - 14, 235, cx + 14, 255), (248, 248, 245, 255), w=4)
        E(d, (cx - 6, 240, cx + 6, 250), (70, 90, 120, 255), w=3)
        E(d, (cx - 3, 242, cx + 3, 248), (20, 18, 18, 255), w=0)
    d.arc((476, 228, 504, 244), start=200, end=340, fill=(150, 120, 70, 255), width=4)
    d.arc((526, 228, 554, 244), start=200, end=340, fill=(150, 120, 70, 255), width=4)
    d.line((515, 250, 515, 275), fill=(200, 160, 140, 255), width=4)
    d.arc((492, 280, 538, 300), start=20, end=160, fill=(170, 110, 110, 255), width=4)
    # drum kit
    E(d, (360, 620, 680, 900), (220, 215, 210, 255), w=8)
    E(d, (420, 670, 620, 850), (200, 60, 60, 255), w=6)
    R(d, (300, 560, 460, 620), (220, 220, 220, 255), w=6, r=12)
    d.line([(300, 360), (420, 520)], fill=(120, 120, 130, 255), width=8)
    d.ellipse((220, 320, 380, 360), fill=(220, 200, 120, 255), outline=ink)
    save(img, "roger.png")


def john():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    hair = (90, 70, 55, 255)
    hair_h = (115, 90, 70, 255)
    shirt = (70, 80, 120, 255)
    jeans = (45, 60, 90, 255)
    R(d, (420, 640, 495, 900), jeans)
    R(d, (535, 640, 610, 900), jeans)
    E(d, (405, 870, 505, 930), (40, 35, 35, 255), w=6)
    E(d, (525, 870, 625, 930), (40, 35, 35, 255), w=6)
    R(d, (340, 380, 435, 640), skin, w=8)
    R(d, (585, 390, 680, 640), skin, w=8)
    E(d, (345, 620, 430, 690), skin, w=6)
    E(d, (590, 620, 675, 690), skin, w=6)
    R(d, (430, 360, 600, 650), shirt, w=8)
    R(d, (475, 295, 555, 360), skin, w=6)
    E(d, (435, 165, 595, 325), skin, w=8)
    # straight brown hair (discreet)
    d.ellipse((415, 130, 615, 240), fill=hair, outline=ink)
    d.rounded_rectangle((415, 170, 455, 330), radius=12, fill=hair, outline=ink)
    d.rounded_rectangle((575, 170, 615, 330), radius=12, fill=hair, outline=ink)
    for (cx, cy, rx, ry) in [(470, 150, 26, 14), (520, 145, 28, 14), (565, 155, 22, 12), (440, 240, 14, 20), (590, 240, 14, 20)]:
        d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=hair_h)
    for cx in [490, 540]:
        E(d, (cx - 14, 235, cx + 14, 255), (248, 248, 245, 255), w=4)
        E(d, (cx - 6, 240, cx + 6, 250), (80, 70, 60, 255), w=3)
        E(d, (cx - 3, 242, cx + 3, 248), (20, 18, 18, 255), w=0)
    d.arc((476, 228, 504, 244), start=200, end=340, fill=(70, 50, 40, 255), width=4)
    d.arc((526, 228, 554, 244), start=200, end=340, fill=(70, 50, 40, 255), width=4)
    d.line((515, 250, 515, 275), fill=(200, 160, 140, 255), width=4)
    d.arc((495, 282, 535, 296), start=20, end=160, fill=(170, 110, 110, 255), width=3)
    # bass guitar
    body = (40, 40, 45, 255)
    neck = (90, 65, 45, 255)
    d.line([(600, 430), (760, 260)], fill=neck, width=16)
    d.rectangle((740, 230, 800, 280), fill=(30, 30, 30, 255), outline=ink)
    E(d, (560, 400, 700, 520), body, w=6)
    E(d, (540, 450, 650, 560), body, w=6)
    save(img, "john.png")


os.makedirs(OUT_DIR, exist_ok=True)
brian()
roger()
john()
