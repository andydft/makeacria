import React from "react";

export type LucasFresnoV1Props = {
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

export const LucasFresnoV1: React.FC<LucasFresnoV1Props> = ({ width = 512, height = 768, className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width={width} height={height} className={className} style={{ "--char-skin":"#EBC09A","--char-hair":"#1F1D22","--char-hair-dark":"#141316","--char-hair-highlight":"#35323B","--char-shirt":"#1B1C20","--char-shorts":"#2E333D","--char-shoe":"#18181C","--char-shoe-sole":"#F2F2F2","--char-shoe-detail":"#F2F2F2","--char-eye-white":"#FFFFFF","--char-pupil":"#171717","--char-mouth":"#B35A5A","--char-outline":"#241A16","--char-goatee":"#231E1C","--char-tattoo":"#2B3832", ...style } as React.CSSProperties} role="img" aria-label="Lucas Silveira (Fresno), front-facing">
    <defs>
      <filter id="lf1-soft-shadow" x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#000000" floodOpacity="0.12" />
      </filter>
    </defs>
    <ellipse cx="200" cy="520" rx="92" ry="18" fill="#000000" opacity="0.08" />
    <g id="lf1-character" filter="url(#lf1-soft-shadow)">
      <g id="lf1-hair-back" transform="translate(0 0) rotate(0 200 180)">
        <path d="M104 166 C98 118, 128 74, 200 72 C272 74, 302 118, 296 166 C292 184, 282 196, 272 204 L128 204 C118 196, 108 184, 104 166 Z" fill="var(--char-hair-dark, #141316)" stroke="var(--char-outline, #241A16)" strokeWidth="4.5" strokeLinejoin="round" />
      </g>
      <g id="lf1-legs">
        <g id="lf1-leg-left" transform="rotate(0 176 395)">
          <rect x="162" y="392" width="28" height="78" rx="14" fill="var(--char-skin, #EBC09A)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
          <path d="M154 430 L198 430 L204 468 L148 468 Z" fill="var(--char-shorts, #2E333D)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          <g id="lf1-shoe-left">
            <path d="M142 468 C142 458, 150 452, 162 452 L190 452 C202 452, 210 458, 212 468 L216 484 C217 492, 212 498, 204 498 L148 498 C140 498, 135 492, 136 484 Z" fill="var(--char-shoe, #18181C)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
            <path d="M140 486 L214 486 L212 498 L142 498 Z" fill="var(--char-shoe-sole, #F2F2F2)" />
            <path d="M160 462 L190 462 L196 476 L154 476 Z" fill="var(--char-shoe-detail, #F2F2F2)" opacity="0.95" />
            <path d="M150 476 C160 470, 178 470, 190 476" fill="none" stroke="var(--char-shoe-detail, #F2F2F2)" strokeWidth="4" strokeLinecap="round" />
          </g>
        </g>
        <g id="lf1-leg-right" transform="rotate(0 224 395)">
          <rect x="210" y="392" width="28" height="78" rx="14" fill="var(--char-skin, #EBC09A)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
          <path d="M202 430 L246 430 L252 468 L196 468 Z" fill="var(--char-shorts, #2E333D)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          <g id="lf1-shoe-right">
            <path d="M188 468 C190 458, 198 452, 210 452 L238 452 C250 452, 258 458, 258 468 L264 484 C265 492, 260 498, 252 498 L196 498 C188 498, 183 492, 184 484 Z" fill="var(--char-shoe, #18181C)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
            <path d="M186 486 L262 486 L260 498 L188 498 Z" fill="var(--char-shoe-sole, #F2F2F2)" />
            <path d="M208 462 L238 462 L244 476 L202 476 Z" fill="var(--char-shoe-detail, #F2F2F2)" opacity="0.95" />
            <path d="M198 476 C208 470, 226 470, 238 476" fill="none" stroke="var(--char-shoe-detail, #F2F2F2)" strokeWidth="4" strokeLinecap="round" />
          </g>
        </g>
      </g>
      <g id="lf1-arms" transform="translate(0 0)">
        <g id="lf1-arm-left" transform="rotate(0 150 305)">
          <path d="M144 304 C124 308, 114 324, 118 344 L126 382 C129 394, 140 400, 151 396 C162 392, 168 380, 165 368 L157 336 L160 320" fill="var(--char-skin, #EBC09A)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M142 300 C122 305, 113 320, 117 342 L124 374 L162 366 L154 320 C152 308, 148 301, 142 300 Z" fill="var(--char-shirt, #1B1C20)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
        </g>
        <g id="lf1-arm-right" transform="rotate(0 250 305)">
          <path d="M256 304 C276 308, 286 324, 282 344 L274 382 C271 394, 260 400, 249 396 C238 392, 232 380, 235 368 L243 336 L240 320" fill="var(--char-skin, #EBC09A)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M258 300 C278 305, 287 320, 283 342 L276 374 L238 366 L246 320 C248 308, 252 301, 258 300 Z" fill="var(--char-shirt, #1B1C20)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
        </g>
      </g>
      <g id="lf1-body" transform="translate(0 0)">
        <rect x="184" y="268" width="32" height="30" rx="10" fill="var(--char-skin, #EBC09A)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
        <g id="lf1-tattoo-neck" opacity="0.78" stroke="var(--char-tattoo, #2B3832)" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M188 276 Q200 284 212 276" />
          <path d="M190 283 Q200 291 210 283" />
          <path d="M195 274 L193 292 M205 274 L207 292" />
        </g>
        <path d="M150 298 C150 286, 160 278, 174 276 L184 294 L200 304 L216 294 L226 276 C240 278, 250 286, 250 298 L250 382 C250 396, 240 406, 226 406 L174 406 C160 406, 150 396, 150 382 Z" fill="var(--char-shirt, #1B1C20)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
        <path d="M168 278 C176 296, 190 306, 200 306 C210 306, 224 296, 232 278 L222 272 C214 286, 206 292, 200 292 C194 292, 186 286, 178 272 Z" fill="#272930" stroke="var(--char-outline, #241A16)" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M156 390 L244 390 L248 438 L152 438 Z" fill="var(--char-shorts, #2E333D)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
        <path d="M200 390 L200 438" fill="none" stroke="var(--char-outline, #241A16)" strokeOpacity="0.18" strokeWidth="3" />
      </g>
      <g id="lf1-head" transform="translate(0 0) rotate(0 200 180)">
        <rect id="lf1-head-shape" x="112" y="92" width="176" height="176" rx="52" ry="52" fill="var(--char-skin, #EBC09A)" stroke="var(--char-outline, #241A16)" strokeWidth="5" />
        <ellipse cx="108" cy="184" rx="10" ry="15" fill="var(--char-skin, #EBC09A)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
        <circle cx="108" cy="190" r="5" fill="#141417" stroke="var(--char-outline, #241A16)" strokeWidth="2.2" />
        <ellipse cx="292" cy="184" rx="10" ry="15" fill="var(--char-skin, #EBC09A)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
        <circle cx="292" cy="190" r="5" fill="#141417" stroke="var(--char-outline, #241A16)" strokeWidth="2.2" />
        <g id="lf1-beard">
          <path d="M116 196 C116 238, 146 266, 200 266 C254 266, 284 238, 284 196 L276 196 C272 224, 246 244, 200 244 C154 244, 128 224, 124 196 Z" fill="var(--char-goatee, #231E1C)" opacity="0.88" />
          <path d="M172 224 C182 214, 194 214, 200 218 C206 214, 218 214, 228 224 C220 226, 208 224, 200 223 C192 224, 180 226, 172 224 Z" fill="var(--char-goatee, #231E1C)" stroke="var(--char-outline, #241A16)" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M191 241 C195 246, 205 246, 209 241 C209 250, 205 256, 200 260 C195 256, 191 250, 191 241 Z" fill="var(--char-goatee, #231E1C)" stroke="var(--char-outline, #241A16)" strokeWidth="2.2" strokeLinejoin="round" />
        </g>
        <g id="lf1-eyebrows">
          <path d="M140 152 C152 145, 168 144, 184 148" fill="none" stroke="var(--char-hair, #1F1D22)" strokeWidth="7.5" strokeLinecap="round" />
          <path d="M216 148 C232 144, 248 145, 260 152" fill="none" stroke="var(--char-hair, #1F1D22)" strokeWidth="7.5" strokeLinecap="round" />
        </g>
        <g id="lf1-eyes">
          <g id="lf1-eye-left">
            <rect id="lf1-eye-left-white" x="143" y="162" width="38" height="32" rx="10" fill="var(--char-eye-white, #FFFFFF)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
          </g>
          <g id="lf1-eye-right">
            <rect id="lf1-eye-right-white" x="219" y="162" width="38" height="32" rx="10" fill="var(--char-eye-white, #FFFFFF)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
          </g>
        </g>
        <path d="M196 190 C192 198, 192 206, 200 210 C208 206, 208 198, 204 190" fill="none" stroke="var(--char-outline, #241A16)" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <g id="lf1-mouth">
          <path id="lf1-mouth-shape" d="M174 231 C184 238, 216 238, 226 231" fill="none" stroke="var(--char-mouth, #B35A5A)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      <g id="lf1-hair-front" transform="translate(0 0) rotate(0 200 180)">
        <path d="M110 166 C102 146, 106 124, 120 112 C114 96, 126 78, 146 80 C152 64, 174 58, 192 68 C206 56, 232 60, 242 76 C262 72, 282 86, 278 106 C294 116, 298 140, 288 162 C282 146, 274 138, 266 140 C272 158, 264 176, 246 184 C248 168, 242 156, 230 150 C224 166, 210 176, 192 178 C198 164, 196 150, 186 140 C170 144, 152 144, 136 138 C126 146, 118 156, 110 166 Z" fill="var(--char-hair, #1F1D22)" stroke="var(--char-outline, #241A16)" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M142 92 C156 80, 178 82, 190 94 M204 82 C222 76, 242 84, 250 100 M198 124 C218 132, 236 148, 244 172 M224 114 C244 124, 258 142, 260 166" fill="none" stroke="var(--char-hair-highlight, #35323B)" strokeWidth="3.2" strokeLinecap="round" />
      </g>
    </g>
  </svg>
);
export default LucasFresnoV1;
