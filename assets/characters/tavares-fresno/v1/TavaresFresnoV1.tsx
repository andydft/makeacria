import React from "react";

export type TavaresFresnoV1Props = {
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

export const TavaresFresnoV1: React.FC<TavaresFresnoV1Props> = ({ width = 512, height = 768, className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width={width} height={height} className={className} style={{ "--char-skin":"#EBC09A","--char-hair":"#1B191E","--char-hair-dark":"#121115","--char-hair-highlight":"#33303A","--char-shirt":"#1A1B1F","--char-shorts":"#2F3542","--char-shoe":"#18181C","--char-shoe-sole":"#F2F2F2","--char-shoe-detail":"#F2F2F2","--char-eye-white":"#FFFFFF","--char-pupil":"#171717","--char-mouth":"#B35A5A","--char-outline":"#241A16","--char-goatee":"#211C1A","--char-tattoo-red":"#B83A2D","--char-tattoo-gold":"#D99B38","--char-tattoo-blue":"#3E6B89","--char-tattoo-ink":"#242126", ...style } as React.CSSProperties} role="img" aria-label="Tavares, front-facing">
    <defs>
      <filter id="tv1-soft-shadow" x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#000000" floodOpacity="0.12" />
      </filter>
    </defs>
    <ellipse cx="200" cy="520" rx="92" ry="18" fill="#000000" opacity="0.08" />
    <g id="tv1-character" filter="url(#tv1-soft-shadow)">
      <g id="tv1-hair-back" transform="translate(0 0) rotate(0 200 180)">
        <path d="M126 156 C126 116, 152 94, 200 92 C248 94, 274 116, 274 156 C272 170, 266 180, 258 186 L142 186 C134 180, 128 170, 126 156 Z" fill="var(--char-hair-dark, #121115)" />
      </g>
      <g id="tv1-legs">
        <g id="tv1-leg-left" transform="rotate(0 176 395)">
          <rect x="162" y="392" width="28" height="78" rx="14" fill="var(--char-skin, #EBC09A)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
          <path d="M154 430 L198 430 L204 468 L148 468 Z" fill="var(--char-shorts, #2F3542)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          <g id="tv1-shoe-left">
            <path d="M142 468 C142 458, 150 452, 162 452 L190 452 C202 452, 210 458, 212 468 L216 484 C217 492, 212 498, 204 498 L148 498 C140 498, 135 492, 136 484 Z" fill="var(--char-shoe, #18181C)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
            <path d="M140 486 L214 486 L212 498 L142 498 Z" fill="var(--char-shoe-sole, #F2F2F2)" />
            <path d="M160 462 L190 462 L196 476 L154 476 Z" fill="var(--char-shoe-detail, #F2F2F2)" opacity="0.95" />
            <path d="M150 476 C160 470, 178 470, 190 476" fill="none" stroke="var(--char-shoe-detail, #F2F2F2)" strokeWidth="4" strokeLinecap="round" />
          </g>
        </g>
        <g id="tv1-leg-right" transform="rotate(0 224 395)">
          <rect x="210" y="392" width="28" height="78" rx="14" fill="var(--char-skin, #EBC09A)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
          <path d="M202 430 L246 430 L252 468 L196 468 Z" fill="var(--char-shorts, #2F3542)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          <g id="tv1-shoe-right">
            <path d="M188 468 C190 458, 198 452, 210 452 L238 452 C250 452, 258 458, 258 468 L264 484 C265 492, 260 498, 252 498 L196 498 C188 498, 183 492, 184 484 Z" fill="var(--char-shoe, #18181C)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
            <path d="M186 486 L262 486 L260 498 L188 498 Z" fill="var(--char-shoe-sole, #F2F2F2)" />
            <path d="M208 462 L238 462 L244 476 L202 476 Z" fill="var(--char-shoe-detail, #F2F2F2)" opacity="0.95" />
            <path d="M198 476 C208 470, 226 470, 238 476" fill="none" stroke="var(--char-shoe-detail, #F2F2F2)" strokeWidth="4" strokeLinecap="round" />
          </g>
        </g>
      </g>
      <g id="tv1-arms" transform="translate(0 0)">
        <g id="tv1-arm-left" transform="rotate(0 150 305)">
          <path d="M144 304 C124 308, 114 324, 118 344 L126 382 C129 394, 140 400, 151 396 C162 392, 168 380, 165 368 L157 336 L160 320" fill="var(--char-skin, #EBC09A)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <g id="tv1-tattoo-left" opacity="0.88" stroke="var(--char-tattoo-ink, #242126)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M124 324 C120 336, 122 354, 128 368 C134 358, 134 340, 130 322 Z" fill="var(--char-tattoo-gold, #D99B38)" />
            <path d="M132 332 C136 346, 136 364, 132 378 C138 368, 140 350, 138 334 Z" fill="var(--char-tattoo-red, #B83A2D)" />
            <circle cx="128" cy="316" r="6" fill="var(--char-tattoo-blue, #3E6B89)" />
            <path d="M126 376 C132 380, 142 380, 148 374" fill="none" stroke="var(--char-tattoo-ink, #242126)" strokeWidth="2" />
          </g>
        </g>
        <g id="tv1-arm-right" transform="rotate(0 250 305)">
          <path d="M256 304 C276 308, 286 324, 282 344 L274 382 C271 394, 260 400, 249 396 C238 392, 232 380, 235 368 L243 336 L240 320" fill="var(--char-skin, #EBC09A)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <g id="tv1-tattoo-right" opacity="0.88" stroke="var(--char-tattoo-ink, #242126)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M276 324 C280 336, 278 354, 272 368 C266 358, 266 340, 270 322 Z" fill="var(--char-tattoo-red, #B83A2D)" />
            <path d="M268 332 C264 346, 264 364, 268 378 C262 368, 260 350, 262 334 Z" fill="var(--char-tattoo-gold, #D99B38)" />
            <circle cx="272" cy="316" r="6" fill="var(--char-tattoo-blue, #3E6B89)" />
            <path d="M252 374 C258 380, 268 380, 274 376" fill="none" stroke="var(--char-tattoo-ink, #242126)" strokeWidth="2" />
          </g>
        </g>
      </g>
      <g id="tv1-body" transform="translate(0 0)">
        <rect x="184" y="270" width="32" height="28" rx="10" fill="var(--char-skin, #EBC09A)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
        <path d="M150 298 C154 288, 162 280, 174 276 L184 294 L200 304 L216 294 L226 276 C238 280, 246 288, 250 298 L248 392 L152 392 Z" fill="var(--char-shirt, #1A1B1F)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
        <g id="tv1-tattoo-chest" opacity="0.72" fill="none" stroke="var(--char-tattoo-ink, #242126)" strokeWidth="1.8" strokeLinecap="round">
          <path d="M180 282 Q190 286 196 282" />
          <path d="M204 282 Q210 286 220 282" />
          <path d="M156 296 C160 288, 168 284, 172 288" stroke="var(--char-tattoo-red, #B83A2D)" />
          <path d="M228 288 C232 284, 240 288, 244 296" stroke="var(--char-tattoo-gold, #D99B38)" />
        </g>
        <path d="M156 390 L244 390 L248 438 L152 438 Z" fill="var(--char-shorts, #2F3542)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
        <path d="M200 390 L200 438" fill="none" stroke="var(--char-outline, #241A16)" strokeOpacity="0.18" strokeWidth="3" />
      </g>
      <g id="tv1-head" transform="translate(0 0) rotate(0 200 180)">
        <rect id="tv1-head-shape" x="112" y="92" width="176" height="176" rx="52" ry="52" fill="var(--char-skin, #EBC09A)" stroke="var(--char-outline, #241A16)" strokeWidth="5" />
        <ellipse cx="108" cy="184" rx="10" ry="14" fill="var(--char-skin, #EBC09A)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
        <ellipse cx="292" cy="184" rx="10" ry="14" fill="var(--char-skin, #EBC09A)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
        <g id="tv1-beard">
          <path d="M116 196 C116 240, 148 268, 200 268 C252 268, 284 240, 284 196 L275 196 C270 226, 244 246, 200 246 C156 246, 130 226, 125 196 Z" fill="var(--char-goatee, #211C1A)" opacity="0.9" />
          <path d="M168 224 C180 213, 194 213, 200 218 C206 213, 220 213, 232 224 C222 227, 208 225, 200 224 C192 225, 178 227, 168 224 Z" fill="var(--char-goatee, #211C1A)" stroke="var(--char-outline, #241A16)" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M188 242 C194 248, 206 248, 212 242 C212 252, 206 259, 200 263 C194 259, 188 252, 188 242 Z" fill="var(--char-goatee, #211C1A)" stroke="var(--char-outline, #241A16)" strokeWidth="2.2" strokeLinejoin="round" />
        </g>
        <g id="tv1-eyebrows">
          <path d="M138 150 C152 142, 168 142, 184 147" fill="none" stroke="var(--char-hair, #1B191E)" strokeWidth="8" strokeLinecap="round" />
          <path d="M216 147 C232 142, 248 142, 262 150" fill="none" stroke="var(--char-hair, #1B191E)" strokeWidth="8" strokeLinecap="round" />
        </g>
        <g id="tv1-eyes">
          <g id="tv1-eye-left">
            <rect id="tv1-eye-left-white" x="143" y="162" width="38" height="32" rx="10" fill="var(--char-eye-white, #FFFFFF)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
          </g>
          <g id="tv1-eye-right">
            <rect id="tv1-eye-right-white" x="219" y="162" width="38" height="32" rx="10" fill="var(--char-eye-white, #FFFFFF)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
          </g>
        </g>
        <path d="M196 190 C192 198, 192 206, 200 210 C208 206, 208 198, 204 190" fill="none" stroke="var(--char-outline, #241A16)" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <g id="tv1-mouth">
          <path id="tv1-mouth-shape" d="M174 232 C184 239, 216 239, 226 232" fill="none" stroke="var(--char-mouth, #B35A5A)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      <g id="tv1-hair-front" transform="translate(0 0) rotate(0 200 180)">
        <g transform="translate(0,-28)">
          <path d="M126 148 C126 116, 150 96, 182 94 L176 74 L192 92 L202 62 L212 92 L228 70 L222 96 C250 100, 274 118, 274 148 C254 134, 228 130, 200 132 C172 130, 146 134, 126 148 Z" fill="var(--char-hair, #1B191E)" stroke="var(--char-outline, #241A16)" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M182 78 L170 64 M202 66 L204 48 M224 76 L238 62" fill="none" stroke="var(--char-hair, #1B191E)" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M148 128 C166 116, 192 114, 218 118 C236 121, 250 128, 258 136" fill="none" stroke="var(--char-hair-highlight, #33303A)" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
    </g>
  </svg>
);
export default TavaresFresnoV1;
