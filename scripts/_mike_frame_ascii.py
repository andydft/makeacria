import subprocess, sys
import numpy as np

vid = sys.argv[1] if sys.argv[1].endswith(".mp4") else r"out/mike-shinoda-render/video-final.mp4"
W, H = 64, 92
ramp = " .:-=+*#%@"

for f in [int(x) for x in sys.argv[1:] if x.isdigit()]:
    raw = subprocess.run([
        "ffmpeg", "-v", "error", "-i", vid, "-vf", f"select=eq(n\\,{f}),scale={W}:{H}",
        "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"
    ], capture_output=True).stdout
    if len(raw) < W * H * 3:
        print(f"frame {f}: NO DATA")
        continue
    a = np.frombuffer(raw, np.uint8).reshape(H, W, 3).astype(np.float32) / 255
    lum = a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    print(f"\n===== frame {f}  mean={lum.mean():.3f} p95={np.percentile(lum,95):.3f} max={lum.max():.3f} rgb={a.reshape(-1,3).mean(0).round(3)} =====")
    for row in lum:
        print("".join(ramp[min(len(ramp)-1, int(v * len(ramp)))] for v in row))
