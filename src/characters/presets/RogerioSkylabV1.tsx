import React from "react";

export type RogerioSkylabV1Props = {
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  eyeOpen?: number;
  mouthShape?: "neutral" | "open" | "smile";
};

export const RogerioSkylabV1: React.FC<RogerioSkylabV1Props> = ({
  width = 512,
  height = 768,
  className,
  style,
  eyeOpen = 1,
  mouthShape = "neutral",
}) => {
  const eo = Math.max(0, Math.min(1, eyeOpen));
  const leftEyeH = 24 * eo;
  const leftEyeY = 166 + (24 - leftEyeH) / 2;
  const rightEyeH = 28 * eo;
  const rightEyeY = 164 + (28 - rightEyeH) / 2;
  const eyeRxL = Math.min(8, leftEyeH / 2);
  const eyeRxR = Math.min(9, rightEyeH / 2);
  const mouthPath =
    mouthShape === "open"
      ? "M176 232 C186 244, 214 244, 224 232 C220 240, 212 244, 200 244 C188 244, 180 240, 176 232 Z"
      : mouthShape === "smile"
      ? "M174 231 C186 240, 214 240, 226 231"
      : "M174 234 C186 231, 214 231, 226 234";
  const mouthFill = mouthShape === "open" ? "#FFFFFF" : "none";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 560"
      width={width}
      height={height}
      className={className}
      style={{
        ["--char-skin" as any]: "#DFB090",
        ["--char-hair" as any]: "#5C5248",
        ["--char-hair-dark" as any]: "#3F3730",
        ["--char-hair-highlight" as any]: "#9E9A95",
        ["--char-shirt" as any]: "#8FA399",
        ["--char-jacket" as any]: "#1C1E22",
        ["--char-jacket-detail" as any]: "#32363E",
        ["--char-shorts" as any]: "#252932",
        ["--char-shoe" as any]: "#1A1A1E",
        ["--char-shoe-sole" as any]: "#F2F2F2",
        ["--char-eye-white" as any]: "#FFFFFF",
        ["--char-pupil" as any]: "#1E1612",
        ["--char-glasses" as any]: "#1A1A1E",
        ["--char-mouth" as any]: "#B35A5A",
        ["--char-outline" as any]: "#241A16",
        ["--char-goatee" as any]: "#4A423B",
        ...style,
      }}
      role="img"
      aria-label="Rogério Skylab"
    >
      <defs>
        <filter id="rsk-soft-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#000000" floodOpacity="0.12" />
        </filter>
      </defs>

      <ellipse cx="200" cy="520" rx="92" ry="18" fill="#000000" opacity="0.08" />

      <g id="rsk-character" filter="url(#rsk-soft-shadow)">
        <g id="rsk-hair-back" transform="translate(0 0) rotate(0 200 180)">
          <path d="M122 142 C96 175, 92 235, 114 282 C118 255, 122 215, 132 188 Z" fill="var(--char-hair-dark, #3F3730)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          <path d="M278 142 C306 175, 310 235, 286 282 C282 255, 278 215, 268 188 Z" fill="var(--char-hair-dark, #3F3730)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          <path d="M104 205 C96 235, 98 262, 108 286" fill="none" stroke="var(--char-hair-highlight, #9E9A95)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M296 205 C304 235, 302 262, 292 286" fill="none" stroke="var(--char-hair-highlight, #9E9A95)" strokeWidth="2.2" strokeLinecap="round" />
        </g>

        <g id="rsk-legs">
          <g id="rsk-leg-left" transform="rotate(0 176 395)">
            <rect x="162" y="392" width="28" height="78" rx="14" fill="var(--char-skin, #DFB090)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
            <path d="M154 430 L198 430 L204 468 L148 468 Z" fill="var(--char-shorts, #252932)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
            <g id="rsk-shoe-left">
              <path d="M142 468 C142 458, 150 452, 162 452 L190 452 C202 452, 210 458, 212 468 L216 484 C217 492, 212 498, 204 498 L148 498 C140 498, 135 492, 136 484 Z" fill="var(--char-shoe, #1A1A1E)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
              <path d="M140 486 L214 486 L212 498 L142 498 Z" fill="var(--char-shoe-sole, #F2F2F2)" />
            </g>
          </g>

          <g id="rsk-leg-right" transform="rotate(0 224 395)">
            <rect x="210" y="392" width="28" height="78" rx="14" fill="var(--char-skin, #DFB090)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
            <path d="M202 430 L246 430 L252 468 L196 468 Z" fill="var(--char-shorts, #252932)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
            <g id="rsk-shoe-right">
              <path d="M188 468 C190 458, 198 452, 210 452 L238 452 C250 452, 258 458, 258 468 L264 484 C265 492, 260 498, 252 498 L196 498 C188 498, 183 492, 184 484 Z" fill="var(--char-shoe, #1A1A1E)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
              <path d="M186 486 L262 486 L260 498 L188 498 Z" fill="var(--char-shoe-sole, #F2F2F2)" />
            </g>
          </g>
        </g>

        <g id="rsk-arms" transform="translate(0 0)">
          <g id="rsk-arm-left" transform="rotate(0 150 305)">
            <path d="M144 304 C124 308, 114 324, 118 344 L126 382 C129 394, 140 400, 151 396 C162 392, 168 380, 165 368 L157 336 L160 320" fill="var(--char-skin, #DFB090)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M142 300 C124 304, 114 318, 116 334 L122 356 L154 348 L152 316 C151 306, 148 301, 142 300 Z" fill="var(--char-jacket, #1C1E22)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
            <path d="M126 316 L136 340" fill="none" stroke="var(--char-jacket-detail, #32363E)" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          <g id="rsk-arm-right" transform="rotate(0 250 305)">
            <path d="M256 304 C276 308, 286 324, 282 344 L274 382 C271 394, 260 400, 249 396 C238 392, 232 380, 235 368 L243 336 L240 320" fill="var(--char-skin, #DFB090)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M258 300 C276 304, 286 318, 284 334 L278 356 L246 348 L248 316 C249 306, 252 301, 258 300 Z" fill="var(--char-jacket, #1C1E22)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
            <path d="M274 316 L264 340" fill="none" stroke="var(--char-jacket-detail, #32363E)" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>

        <g id="rsk-body" transform="translate(0 0)">
          <rect x="184" y="270" width="32" height="28" rx="10" fill="var(--char-skin, #DFB090)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
          <path d="M150 298 C150 286, 160 278, 174 276 L184 292 L200 302 L216 292 L226 276 C240 278, 250 286, 250 298 L250 382 C250 396, 240 406, 226 406 L174 406 C160 406, 150 396, 150 382 Z" fill="var(--char-shirt, #8FA399)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          <path d="M150 298 C150 286, 160 278, 174 276 L184 292 L172 396 L150 382 Z" fill="var(--char-jacket, #1C1E22)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          <path d="M250 298 C250 286, 240 278, 226 276 L216 292 L228 396 L250 382 Z" fill="var(--char-jacket, #1C1E22)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          <path d="M160 318 L174 342" fill="none" stroke="var(--char-jacket-detail, #32363E)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M240 318 L226 342" fill="none" stroke="var(--char-jacket-detail, #32363E)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M156 390 L244 390 L248 438 L152 438 Z" fill="var(--char-shorts, #252932)" stroke="var(--char-outline, #241A16)" strokeWidth="4" strokeLinejoin="round" />
          <path d="M200 390 L200 438" fill="none" stroke="var(--char-outline, #241A16)" strokeOpacity="0.18" strokeWidth="3" />
        </g>

        <g id="rsk-head" transform="translate(0 0) rotate(0 200 180)">
          <rect id="rsk-head-shape" x="112" y="92" width="176" height="176" rx="52" ry="52" fill="var(--char-skin, #DFB090)" stroke="var(--char-outline, #241A16)" strokeWidth="5" />
          <ellipse cx="108" cy="184" rx="10" ry="14" fill="var(--char-skin, #DFB090)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
          <ellipse cx="292" cy="184" rx="10" ry="14" fill="var(--char-skin, #DFB090)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />

          <g id="rsk-eyebrows">
            <path d="M142 152 C154 146, 168 148, 182 154" fill="none" stroke="var(--char-hair, #5C5248)" strokeWidth="6.5" strokeLinecap="round" />
            <path d="M218 150 C232 143, 248 143, 258 148" fill="none" stroke="var(--char-hair, #5C5248)" strokeWidth="6.5" strokeLinecap="round" />
            <path d="M194 148 L194 158 M204 148 L204 158" fill="none" stroke="var(--char-outline, #241A16)" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          <g id="rsk-eyes">
            <g id="rsk-eye-left">
              <rect id="rsk-eye-left-white" x="143" y={leftEyeY} width="38" height={Math.max(2, leftEyeH)} rx={eyeRxL} fill="var(--char-eye-white, #FFFFFF)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
              {eo > 0.25 && <circle cx="162" cy={178} r={Math.min(5, 3 + eo * 2)} fill="var(--char-pupil, #1E1612)" />}
              <path d="M142 166 L182 166 L182 178 L142 178 Z" fill="var(--char-skin, #DFB090)" stroke="var(--char-outline, #241A16)" strokeWidth="3.5" opacity={0.95} />
            </g>

            <g id="rsk-eye-right">
              <rect id="rsk-eye-right-white" x="219" y={rightEyeY} width="38" height={Math.max(2, rightEyeH)} rx={eyeRxR} fill="var(--char-eye-white, #FFFFFF)" stroke="var(--char-outline, #241A16)" strokeWidth="4" />
              {eo > 0.25 && <circle cx="238" cy={178} r={Math.min(6.5, 4 + eo * 2.5)} fill="var(--char-pupil, #1E1612)" />}
              {eo > 0.25 && <circle cx="236" cy="175" r="2" fill="#FFFFFF" />}
            </g>
          </g>

          <path d="M196 184 L190 212 C194 218, 206 218, 210 212 L204 184" fill="none" stroke="var(--char-outline, #241A16)" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

          <g id="rsk-mouth">
            <path id="rsk-mouth-shape" d={mouthPath} fill={mouthFill} stroke="var(--char-mouth, #B35A5A)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          <g id="rsk-goatee">
            <path d="M192 246 C196 251, 204 251, 208 246 C208 253, 204 258, 200 261 C196 258, 192 253, 192 246 Z" fill="var(--char-goatee, #4A423B)" stroke="var(--char-outline, #241A16)" strokeWidth="2.5" strokeLinejoin="round" />
          </g>

          <g id="rsk-glasses">
            <rect x="137" y="160" width="50" height="34" rx="6" fill="#FFFFFF" fillOpacity="0.12" stroke="var(--char-glasses, #1A1A1E)" strokeWidth="4" />
            <rect x="213" y="158" width="50" height="36" rx="6" fill="#FFFFFF" fillOpacity="0.12" stroke="var(--char-glasses, #1A1A1E)" strokeWidth="4" />
            <path d="M187 174 C195 170, 205 170, 213 174" fill="none" stroke="var(--char-glasses, #1A1A1E)" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="122" y1="168" x2="137" y2="168" stroke="var(--char-glasses, #1A1A1E)" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="263" y1="168" x2="278" y2="168" stroke="var(--char-glasses, #1A1A1E)" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        </g>

        <g id="rsk-hair-front" transform="translate(0 0) rotate(0 200 180)">
          <path d="M114 152 C110 104, 146 76, 200 76 C254 76, 290 104, 286 152 C276 116, 248 96, 200 96 C152 96, 124 116, 114 152 Z" fill="var(--char-hair, #5C5248)" stroke="var(--char-outline, #241A16)" strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M148 84 C180 72, 225 74, 256 96" fill="none" stroke="var(--char-hair-highlight, #9E9A95)" strokeWidth="3" strokeLinecap="round" />
          <path d="M120 132 C112 152, 112 172, 116 188" fill="none" stroke="var(--char-hair, #5C5248)" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M280 132 C288 152, 288 172, 284 188" fill="none" stroke="var(--char-hair, #5C5248)" strokeWidth="4.5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
};

export default RogerioSkylabV1;
