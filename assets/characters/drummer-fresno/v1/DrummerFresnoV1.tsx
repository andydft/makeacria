import React from "react";

export type DrummerFresnoV1Props = {
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

export const DrummerFresnoV1: React.FC<DrummerFresnoV1Props> = ({ width = 512, height = 768, className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width={width} height={height} className={className} style={{ "--char-skin":"#E0B894","--char-hair":"#2A211C","--char-hair-dark":"#1A1411","--char-hair-highlight":"#4A3A32","--char-shirt":"#22252C","--char-shorts":"#2F3542","--char-shoe":"#18181C","--char-shoe-sole":"#F2F2F2","--char-shoe-detail":"#F2F2F2","--char-eye-white":"#FFFFFF","--char-pupil":"#171717","--char-mouth":"#B35A5A","--char-outline":"#241A16", ...style } as React.CSSProperties} role="img" aria-label="Baterista Fresno, front-facing">
    <defs>
      <filter id="df1-soft-shadow" x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#000000" floodOpacity="0.12" />
      </filter>
    </defs>
    <ellipse cx="200" cy="520" rx="92" ry="18" fill="#000000" opacity="0.08" />
    <g id="df1-character" filter="url(#df1-soft-shadow)">
      <g id="df1-hair-back" transform="translate(0 0) rotate(0 200 180)">
        <path d="M120 156 C120 116, 148 92, 200 90 C252 92, 280 116, 280 156 C278 170, 272 180, 264 186 L136 186 C128 180, 122 170, 120 156 Z" fill="var(--char-hair-dark, #1A1411)" />
      </g>
      <g id="df1-legs">
        <g id="df1-leg-left">
          <rect x="162" y="392" width="28" height="78" rx="14" fill="var(--char-skin, #E0B894)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
          <path d="M154 430 L198 430 L204 468 L148 468 Z" fill="var(--char-shorts, #2F3542)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          <g>
            <path d="M142 468 C142 458, 150 452, 162 452 L190 452 C202 452, 210 458, 212 468 L216 484 C217 492, 212 498, 204 498 L148 498 C140 498, 135 492, 136 484 Z" fill="var(--char-shoe, #18181C)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
            <path d="M140 486 L214 486 L212 498 L142 498 Z" fill="var(--char-shoe-sole, #F2F2F2)" />
          </g>
        </g>
        <g id="df1-leg-right">
          <rect x="210" y="392" width="28" height="78" rx="14" fill="var(--char-skin, #E0B894)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
          <path d="M202 430 L246 430 L252 468 L196 468 Z" fill="var(--char-shorts, #2F3542)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          <g>
            <path d="M188 468 C190 458, 198 452, 210 452 L238 452 C250 452, 258 458, 258 468 L264 484 C265 492, 260 498, 252 498 L196 498 C188 498, 183 492, 184 484 Z" fill="var(--char-shoe, #18181C)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
            <path d="M186 486 L262 486 L260 498 L188 498 Z" fill="var(--char-shoe-sole, #F2F2F2)" />
          </g>
        </g>
      </g>
      <g id="df1-arms" transform="translate(0 0)">
        <g id="df1-arm-left" transform="rotate(-18 150 305)">
          <path d="M144 304 C124 308, 114 324, 118 344 L126 382 C129 394, 140 400, 151 396 C162 392, 168 380, 165 368 L157 336 L160 320" fill="var(--char-skin, #E0B894)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M142 300 C122 305, 113 320, 117 342 L124 374 L162 366 L154 320 C152 308, 148 301, 142 300 Z" fill="var(--char-shirt, #22252C)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          <rect x="120" y="388" width="8" height="70" rx="3" transform="rotate(-20 124 423)" fill="#D7C3A3" stroke="var(--char-outline, #241A16)" strokeWidth="2" />
        </g>
        <g id="df1-arm-right" transform="rotate(18 250 305)">
          <path d="M256 304 C276 308, 286 324, 282 344 L274 382 C271 394, 260 400, 249 396 C238 392, 232 380, 235 368 L243 336 L240 320" fill="var(--char-skin, #E0B894)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M258 300 C278 305, 287 320, 283 342 L276 374 L238 366 L246 320 C248 308, 252 301, 258 300 Z" fill="var(--char-shirt, #22252C)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          <rect x="272" y="388" width="8" height="70" rx="3" transform="rotate(20 276 423)" fill="#D7C3A3" stroke="var(--char-outline, #241A16)" strokeWidth="2" />
        </g>
      </g>
      <g id="df1-body" transform="translate(0 0)">
        <rect x="184" y="270" width="32" height="28" rx="10" fill="var(--char-skin, #E0B894)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
        <path d="M150 298 C150 286, 160 278, 174 276 L184 294 L200 304 L216 294 L226 276 C240 278, 250 286, 250 298 L250 382 C250 396, 240 406, 226 406 L174 406 C160 406, 150 396, 150 382 Z" fill="var(--char-shirt, #22252C)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
        <path d="M156 390 L244 390 L248 438 L152 438 Z" fill="var(--char-shorts, #2F3542)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
      </g>
      <g id="df1-head" transform="translate(0 0) rotate(0 200 180)">
        <rect x="112" y="92" width="176" height="176" rx="52" ry="52" fill="var(--char-skin, #E0B894)" stroke="var(--char-outline, #241A16)" strokeWidth="5" />
        <ellipse cx="108" cy="184" rx="10" ry="14" fill="var(--char-skin, #E0B894)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
        <ellipse cx="292" cy="184" rx="10" ry="14" fill="var(--char-skin, #E0B894)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
        <g id="df1-eyebrows">
          <path d="M142 150 C152 143, 168 142, 182 146" fill="none" stroke="var(--char-hair, #2A211C)" strokeWidth="7" strokeLinecap="round" />
          <path d="M218 146 C232 142, 248 143, 258 150" fill="none" stroke="var(--char-hair, #2A211C)" strokeWidth="7" strokeLinecap="round" />
        </g>
        <g id="df1-eyes">
          <rect x="143" y="162" width="38" height="32" rx="10" fill="var(--char-eye-white, #FFFFFF)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
          <rect x="219" y="162" width="38" height="32" rx="10" fill="var(--char-eye-white, #FFFFFF)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
        </g>
        <path d="M196 190 C192 198, 192 206, 200 210 C208 206, 208 198, 204 190" fill="none" stroke="var(--char-outline, #241A16)" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M174 232 C184 238, 216 238, 226 232" fill="none" stroke="var(--char-mouth, #B35A5A)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g id="df1-hair-front" transform="translate(0 0) rotate(0 200 180)">
        <path d="M116 156 C116 112, 146 86, 200 84 C254 86, 284 112, 284 156 C284 164, 282 171, 280 176 C270 164, 250 156, 228 154 C214 164, 206 170, 200 170 C194 170, 186 164, 172 154 C150 156, 130 164, 120 176 C118 171, 116 164, 116 156 Z" fill="var(--char-hair, #2A211C)" stroke="var(--char-outline, #241A16)" strokeWidth="5" strokeLinejoin="round" />
        <path d="M138 160 C148 144, 162 138, 176 142 C168 150, 160 160, 154 170" fill="var(--char-hair, #2A211C)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M176 144 C188 132, 200 128, 212 134 C204 142, 198 152, 194 164" fill="var(--char-hair, #2A211C)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M214 136 C228 132, 244 138, 254 150 C244 154, 234 160, 228 170" fill="var(--char-hair, #2A211C)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);
export default DrummerFresnoV1;
