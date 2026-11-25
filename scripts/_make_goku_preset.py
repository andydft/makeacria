from pathlib import Path
svg = Path('public/dbgt-goku-gt-simple.svg').read_text(encoding='utf-8')
start = svg.index('>') + 1
end = svg.rindex('</svg>')
inner = svg[start:end].strip()
inner = inner.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
out = '''import React from "react";

export type SonGokuGtV1Props = {
  width?: number;
  height?: number;
};

export const SonGokuGtV1: React.FC<SonGokuGtV1Props> = ({ width = 512, height = 768 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 400 560"
    width={width}
    height={height}
    style={{
      ["--char-skin" as any]: "#F2C49B",
      ["--char-hair" as any]: "#1B1A1E",
      ["--char-hair-dark" as any]: "#121114",
      ["--char-hair-highlight" as any]: "#34323A",
      ["--char-shirt" as any]: "#2B78C5",
      ["--char-shirt-dark" as any]: "#1E5792",
      ["--char-shorts" as any]: "#F2C94C",
      ["--char-sash" as any]: "#F2F2F2",
      ["--char-wristband" as any]: "#E88D96",
      ["--char-sock" as any]: "#F2F2F2",
      ["--char-shoe" as any]: "#1A1A1E",
      ["--char-shoe-sole" as any]: "#E0E4E8",
      ["--char-shoe-detail" as any]: "#D4AF37",
      ["--char-eye-white" as any]: "#FFFFFF",
      ["--char-pupil" as any]: "#171717",
      ["--char-mouth" as any]: "#B35A5A",
      ["--char-outline" as any]: "#241A16",
      ["--char-tail" as any]: "#6E472B",
    }}
    role="img"
    aria-label="Son Goku GT, front-facing"
    dangerouslySetInnerHTML={{ __html: `''' + inner + '''` }}
  />
);

export default SonGokuGtV1;
'''
Path('src/characters/presets/SonGokuGtV1.tsx').write_text(out, encoding='utf-8')
print('ok')
