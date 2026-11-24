import React from "react";

export type BobMarleyV1Props = {
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  eyeOpen?: number;
  mouthShape?: "neutral" | "open" | "smile";
  shirtColor?: string;
  adidasStripes?: boolean;
  pose?: "stand" | "kick";
};

export const BobMarleyV1: React.FC<BobMarleyV1Props> = ({ width = 512, height = 768, className, style, eyeOpen = 1, mouthShape = "smile", shirtColor, adidasStripes = false, pose = "stand" }) => {
  const eo = Math.max(0, Math.min(1, eyeOpen));
  const eyeH = 32 * eo;
  const eyeY = 162 + (32 - eyeH) / 2;
  const eyeRx = Math.min(10, eyeH / 2);
  const mouthPath = mouthShape === "open"
    ? "M174 223 L226 223 C224 244, 212 252, 200 252 C188 252, 176 244, 174 223 Z"
    : mouthShape === "smile"
    ? "M170 224 C182 242, 218 242, 230 224 L226 224 C220 236, 210 242, 200 242 C190 242, 180 236, 174 224 Z"
    : "M174 228 C184 236, 216 236, 226 228";
  const mouthFill = mouthShape === "open" ? "#FFFFFF" : mouthShape === "smile" ? "#FFFFFF" : "none";
  const mouthStroke = "var(--char-outline, #241A16)";
  return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width={width} height={height} className={className} style={{ "--char-skin":"#B87E56","--char-hair":"#1E1A18","--char-hair-dark":"#141110","--char-hair-highlight":"#362F2B","--char-shirt": shirtColor || "#3E4348","--char-shorts":"#252A30","--char-shoe":"#1A1A1E","--char-shoe-sole":"#F2F2F2","--char-shoe-detail":"#F2F2F2","--char-eye-white":"#FFFFFF","--char-pupil":"#171717","--char-mouth":"#8F443E","--char-outline":"#241A16","--char-goatee":"#1A1614", ...style } as React.CSSProperties} role="img" aria-label="Bob Marley, front-facing">
    <defs>
      <filter id="bm3-soft-shadow" x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#000000" floodOpacity="0.12" />
      </filter>
    </defs>
    <ellipse cx="200" cy="520" rx="92" ry="18" fill="#000000" opacity="0.08" />
    <g id="bm3-character" filter="url(#bm3-soft-shadow)">
      <g id="bm3-hair-back" transform="translate(0 0) rotate(0 200 180)">
        <path d="M98 158 C90 100, 134 62, 200 60 C266 62, 310 100, 302 158 C314 210, 322 284, 314 358 C306 372, 294 374, 286 364 C284 378, 272 384, 260 374 L254 344 L146 344 L140 374 C128 384, 116 378, 114 364 C106 374, 94 372, 86 358 C78 284, 86 210, 98 158 Z" fill="var(--char-hair-dark, #141110)" stroke="var(--char-outline, #241A16)" strokeWidth="4.5" strokeLinejoin="round" />
      </g>
      <g id="bm3-legs">
        <g id="bm3-leg-left" transform="rotate(0 176 395)">
          <rect x="162" y="392" width="28" height="78" rx="14" fill="var(--char-skin, #B87E56)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
          <path d="M154 430 L198 430 L204 468 L148 468 Z" fill="var(--char-shorts, #252A30)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          <g id="bm3-shoe-left">
            <path d="M142 468 C142 458, 150 452, 162 452 L190 452 C202 452, 210 458, 212 468 L216 484 C217 492, 212 498, 204 498 L148 498 C140 498, 135 492, 136 484 Z" fill="var(--char-shoe, #1A1A1E)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
            <path d="M140 486 L214 486 L212 498 L142 498 Z" fill="var(--char-shoe-sole, #F2F2F2)" />
            <path d="M160 462 L190 462 L196 476 L154 476 Z" fill="var(--char-shoe-detail, #F2F2F2)" opacity="0.95" />
            <path d="M150 476 C160 470, 178 470, 190 476" fill="none" stroke="var(--char-shoe-detail, #F2F2F2)" strokeWidth="4" strokeLinecap="round" />
          </g>
        </g>
        <g id="bm3-leg-right" transform={pose === "kick" ? "rotate(-45 224 395)" : "rotate(0 224 395)"}>
          <rect x="210" y="392" width="28" height="78" rx="14" fill="var(--char-skin, #B87E56)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
          <path d="M202 430 L246 430 L252 468 L196 468 Z" fill="var(--char-shorts, #252A30)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          <g id="bm3-shoe-right">
            <path d="M188 468 C190 458, 198 452, 210 452 L238 452 C250 452, 258 458, 258 468 L264 484 C265 492, 260 498, 252 498 L196 498 C188 498, 183 492, 184 484 Z" fill="var(--char-shoe, #1A1A1E)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
            <path d="M186 486 L262 486 L260 498 L188 498 Z" fill="var(--char-shoe-sole, #F2F2F2)" />
            <path d="M208 462 L238 462 L244 476 L202 476 Z" fill="var(--char-shoe-detail, #F2F2F2)" opacity="0.95" />
            <path d="M198 476 C208 470, 226 470, 238 476" fill="none" stroke="var(--char-shoe-detail, #F2F2F2)" strokeWidth="4" strokeLinecap="round" />
          </g>
        </g>
      </g>
      <g id="bm3-arms" transform="translate(0 0)">
        <g id="bm3-arm-left" transform="rotate(0 150 305)">
          <path d="M144 304 C124 308, 114 324, 118 344 L126 382 C129 394, 140 400, 151 396 C162 392, 168 380, 165 368 L157 336 L160 320" fill="var(--char-skin, #B87E56)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M142 300 C124 304, 115 318, 118 336 L124 358 L156 350 L152 316 C151 306, 148 301, 142 300 Z" fill="var(--char-shirt, #3E4348)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          {adidasStripes && <g stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"><line x1="126" y1="322" x2="150" y2="318" /><line x1="128" y1="330" x2="152" y2="326" /><line x1="130" y1="338" x2="154" y2="334" /></g>}
        </g>
        <g id="bm3-arm-right" transform="rotate(0 250 305)">
          <path d="M256 304 C276 308, 286 324, 282 344 L274 382 C271 394, 260 400, 249 396 C238 392, 232 380, 235 368 L243 336 L240 320" fill="var(--char-skin, #B87E56)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M258 300 C276 304, 285 318, 282 336 L276 358 L244 350 L248 316 C249 306, 252 301, 258 300 Z" fill="var(--char-shirt, #3E4348)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          {adidasStripes && <g stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"><line x1="250" y1="318" x2="274" y2="322" /><line x1="248" y1="326" x2="272" y2="330" /><line x1="246" y1="334" x2="270" y2="338" /></g>}
        </g>
      </g>
      <g id="bm3-body" transform="translate(0 0)">
        <rect x="184" y="268" width="32" height="30" rx="10" fill="var(--char-skin, #B87E56)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
        <path d="M150 298 C150 286, 160 278, 174 276 L186 298 L200 318 L214 298 L226 276 C240 278, 250 286, 250 298 L250 382 C250 396, 240 406, 226 406 L174 406 C160 406, 150 396, 150 382 Z" fill="var(--char-shirt, #3E4348)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
        <path d="M174 276 L186 306 L200 318 L184 282 Z" fill="#4C5258" stroke="var(--char-outline, #241A16)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M226 276 L214 306 L200 318 L216 282 Z" fill="#4C5258" stroke="var(--char-outline, #241A16)" strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="200" y1="318" x2="200" y2="390" stroke="var(--char-outline, #241A16)" strokeWidth="2.5" />
        <circle cx="200" cy="334" r="2.5" fill="#D5DCE2" />
        <circle cx="200" cy="356" r="2.5" fill="#D5DCE2" />
        <circle cx="200" cy="378" r="2.5" fill="#D5DCE2" />
        <path d="M156 390 L244 390 L248 438 L152 438 Z" fill="var(--char-shorts, #252A30)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
        <path d="M200 390 L200 438" fill="none" stroke="var(--char-outline, #241A16)" strokeOpacity="0.18" strokeWidth="3" />
      </g>
      <g id="bm3-head" transform="translate(0 0) rotate(0 200 180)">
        <rect id="bm3-head-shape" x="112" y="92" width="176" height="176" rx="52" ry="52" fill="var(--char-skin, #B87E56)" stroke="var(--char-outline, #241A16)" strokeWidth="5" />
        <ellipse cx="108" cy="184" rx="10" ry="14" fill="var(--char-skin, #B87E56)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
        <ellipse cx="292" cy="184" rx="10" ry="14" fill="var(--char-skin, #B87E56)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
        <g id="bm3-beard">
          <path d="M126 218 C132 252, 162 272, 200 274 C238 272, 268 252, 274 218 L266 218 C258 242, 232 254, 200 254 C168 254, 142 242, 134 218 Z" fill="var(--char-goatee, #1A1614)" stroke="var(--char-outline, #241A16)" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M170 218 C180 211, 193 211, 200 214 C207 211, 220 211, 230 218 C220 220, 208 218, 200 218 C192 218, 180 220, 170 218 Z" fill="var(--char-goatee, #1A1614)" stroke="var(--char-outline, #241A16)" strokeWidth="2" strokeLinejoin="round" />
        </g>
        <g id="bm3-eyebrows">
          <path d="M140 152 C152 144, 168 144, 184 149" fill="none" stroke="var(--char-hair, #1E1A18)" strokeWidth="7.5" strokeLinecap="round" />
          <path d="M216 149 C232 144, 248 144, 260 152" fill="none" stroke="var(--char-hair, #1E1A18)" strokeWidth="7.5" strokeLinecap="round" />
        </g>
        <g id="bm3-eyes">
          <g id="bm3-eye-left">
            <rect x="143" y={eyeY} width="38" height={Math.max(2, eyeH)} rx={eyeRx} fill="var(--char-eye-white, #FFFFFF)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
          </g>
          <g id="bm3-eye-right">
            <rect x="219" y={eyeY} width="38" height={Math.max(2, eyeH)} rx={eyeRx} fill="var(--char-eye-white, #FFFFFF)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
          </g>
        </g>
        <path d="M195 190 C191 198, 191 206, 200 210 C209 206, 209 198, 205 190" fill="none" stroke="var(--char-outline, #241A16)" strokeOpacity="0.48" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <g id="bm3-mouth">
          <path d={mouthPath} fill={mouthFill} stroke={mouthStroke} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
          {mouthShape !== "neutral" && <line x1="173" y1="235" x2="227" y2="235" stroke="var(--char-outline, #241A16)" strokeWidth="2" opacity="0.65" />}
        </g>
      </g>
      <g id="bm3-hair-front" transform="translate(0 0) rotate(0 200 180)">
        <path d="M114 166 C110 112, 146 84, 200 84 C254 84, 290 112, 286 166 C296 226, 304 300, 294 374 C286 382, 274 378, 272 366 C266 380, 254 378, 252 364 C258 292, 266 226, 272 168 C272 122, 244 96, 200 96 C156 96, 128 122, 128 168 C134 226, 142 292, 148 364 C146 378, 134 380, 128 366 C126 378, 114 382, 106 374 C96 300, 104 226, 114 166 Z" fill="var(--char-hair, #1E1A18)" stroke="var(--char-outline, #241A16)" strokeWidth="4.5" strokeLinejoin="round" />
        <g fill="none" stroke="var(--char-hair-highlight, #362F2B)" strokeWidth="3" strokeLinecap="round">
          <path d="M138 96 C158 76, 184 74, 206 78" />
          <path d="M194 74 C224 72, 250 82, 268 102" />
          <path d="M116 184 C112 246, 114 310, 118 364" />
          <path d="M126 196 C128 254, 134 312, 138 358" />
          <path d="M284 184 C288 246, 286 310, 282 364" />
          <path d="M274 196 C272 254, 266 312, 262 358" />
        </g>
      </g>
    </g>
  </svg>
  );
};
export default BobMarleyV1;
