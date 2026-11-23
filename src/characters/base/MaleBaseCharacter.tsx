import React from "react";

export type MouthShape = "neutral" | "smile" | "open" | "sad";
export type HairVariant = "default" | "spiky" | "spiky-top" | "bald" | "short" | "feminine-long";
export type HeadAccessory = "none" | "cap";

export type MaleBaseCharacterProps = {
  /** Width of the SVG element. Height scales by viewBox aspect ratio. */
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  /** Color overrides. CSS custom properties are also supported on the root SVG. */
  colors?: {
    skin?: string;
    hair?: string;
    hairDark?: string;
    hairHighlight?: string;
    shirt?: string;
    shorts?: string;
    shoe?: string;
    shoeSole?: string;
    shoeDetail?: string;
    eyeWhite?: string;
    pupil?: string;
    mouth?: string;
    outline?: string;
    goatee?: string;
    cap?: string;
    capDetail?: string;
    tattoo?: string;
  };
  /** Show small goatee. */
  goatee?: boolean;
  /** Optional arm tattoos (stylized). */
  tattoos?: boolean;
  /** Optional id prefix to avoid collisions when rendering multiple characters. */
  idPrefix?: string;
  /** Hair style variant. */
  hairVariant?: HairVariant;
  /** Optional head accessory. */
  headAccessory?: HeadAccessory;
  /** Animation/pose props (degrees / px / 0-1). */
  pose?: {
    headX?: number;
    headY?: number;
    headRotate?: number;
    bodyY?: number;
    armLeftRotate?: number;
    armRightRotate?: number;
    legLeftRotate?: number;
    legRightRotate?: number;
    /** 1 = open, 0 = closed/blink. */
    eyeOpen?: number;
    mouthShape?: MouthShape;
  };
};

const DEFAULT_COLORS = {
  skin: "#F0C29A",
  hair: "#2B2118",
  hairDark: "#1A130E",
  hairHighlight: "#F7C948",
  shirt: "#1E1E22",
  shorts: "#5A6472",
  shoe: "#1B1B1F",
  shoeSole: "#F2F2F2",
  shoeDetail: "#F2F2F2",
  eyeWhite: "#FFFFFF",
  pupil: "#171717",
  mouth: "#B35A5A",
  outline: "#241A16",
  goatee: "#2B2118",
  cap: "#2D3748",
  capDetail: "#1A202C",
  tattoo: "#C0392B",
};

type C = typeof DEFAULT_COLORS;

/**
 * Male base character - front-facing SVG.
 * Designed for code animation (blink, mouth, smile, head sway, arm movement).
 *
 * Main groups: hair-back, legs, arms, body, head, hair-front.
 * Head contains: face, eyes (eye-white separated), eyebrows, mouth, goatee.
 */
export const MaleBaseCharacter: React.FC<MaleBaseCharacterProps> = ({
  width = 420,
  height = 560,
  className,
  style,
  colors: colorOverrides,
  goatee = true,
  tattoos = false,
  idPrefix = "mbc",
  hairVariant = "default",
  headAccessory = "none",
  pose = {},
}) => {
  const c: C = { ...DEFAULT_COLORS, ...colorOverrides };
  const cssVars: React.CSSProperties = {
    ["--char-skin" as any]: c.skin,
    ["--char-hair" as any]: c.hair,
    ["--char-hair-dark" as any]: c.hairDark,
    ["--char-hair-highlight" as any]: c.hairHighlight,
    ["--char-shirt" as any]: c.shirt,
    ["--char-shorts" as any]: c.shorts,
    ["--char-shoe" as any]: c.shoe,
    ["--char-shoe-sole" as any]: c.shoeSole,
    ["--char-shoe-detail" as any]: c.shoeDetail,
    ["--char-eye-white" as any]: c.eyeWhite,
    ["--char-pupil" as any]: c.pupil,
    ["--char-mouth" as any]: c.mouth,
    ["--char-outline" as any]: c.outline,
    ["--char-goatee" as any]: c.goatee,
    ["--char-cap" as any]: c.cap,
    ["--char-cap-detail" as any]: c.capDetail,
    ["--char-tattoo" as any]: c.tattoo,
    ...style,
  };

  const v = (name: keyof C, cssName: string) => `var(--char-${cssName}, ${c[name]})`;
  const outline = v("outline", "outline");
  const skin = v("skin", "skin");
  const hair = v("hair", "hair");
  const hairDark = v("hairDark", "hair-dark");
  const hairHighlight = v("hairHighlight", "hair-highlight");
  const shirt = v("shirt", "shirt");
  const shorts = v("shorts", "shorts");
  const shoe = v("shoe", "shoe");
  const shoeSole = v("shoeSole", "shoe-sole");
  const shoeDetail = v("shoeDetail", "shoe-detail");
  const eyeWhite = v("eyeWhite", "eye-white");
  const mouth = v("mouth", "mouth");
  const goateeColor = v("goatee", "goatee");
  const capColor = v("cap", "cap");
  const capDetail = v("capDetail", "cap-detail");
  const tattoo = v("tattoo", "tattoo");

  const gid = (id: string) => `${idPrefix}-${id}`;

  const headX = pose.headX ?? 0;
  const headY = pose.headY ?? 0;
  const headRotate = pose.headRotate ?? 0;
  const bodyY = pose.bodyY ?? 0;
  const armLeftRotate = pose.armLeftRotate ?? 0;
  const armRightRotate = pose.armRightRotate ?? 0;
  const legLeftRotate = pose.legLeftRotate ?? 0;
  const legRightRotate = pose.legRightRotate ?? 0;
  const eyeOpen = Math.max(0, Math.min(1, pose.eyeOpen ?? 1));
  const mouthShape = pose.mouthShape ?? "neutral";

  const eyeH = 32 * eyeOpen;
  const eyeY = 162 + (32 - eyeH) / 2;
  const eyeRx = Math.min(10, eyeH / 2);

  const mouthPath =
    mouthShape === "smile"
      ? "M170 230 C182 244, 218 244, 230 230"
      : mouthShape === "open"
        ? "M185 228 C190 222, 210 222, 215 228 C210 242, 190 242, 185 228 Z"
        : mouthShape === "sad"
          ? "M170 238 C182 228, 218 228, 230 238"
          : "M170 232 C182 242, 218 242, 230 232";
  const mouthFill = mouthShape === "open" ? "#6B2D2D" : "none";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 560"
      width={width}
      height={height}
      className={className}
      style={cssVars}
      role="img"
      aria-label="Male base character, front-facing"
    >
      <defs>
        <filter id={gid("soft-shadow")} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#000000" floodOpacity="0.12" />
        </filter>
      </defs>

      <ellipse cx="200" cy="520" rx="92" ry="18" fill="#000000" opacity="0.08" />

      <g id={gid("character")} filter={`url(#${gid("soft-shadow")})`}>
        {/* HAIR BACK */}
        <g id={gid("hair-back")} transform={`translate(${headX} ${headY + bodyY}) rotate(${headRotate} 200 180)`}>
          {hairVariant === "bald" || headAccessory === "cap" ? null : hairVariant === "spiky" || hairVariant === "spiky-top" ? (
            <g transform="translate(0,-32)">
              <path d="M114 160 C112 118, 140 84, 200 82 C260 84, 288 118, 286 160 C284 176, 276 188, 268 196 L132 196 C124 188, 116 176, 114 160 Z" fill={hairDark} />
            </g>
          ) : hairVariant === "feminine-long" ? (
            <g>
              <path d="M110 150 C108 112, 140 84, 200 82 C260 84, 292 112, 290 150 L296 360 C296 392, 272 410, 244 410 L156 410 C128 410, 104 392, 104 360 Z" fill={hair} stroke={outline} strokeWidth="4.5" strokeLinejoin="round" />
              <path d="M128 180 C124 240, 126 320, 138 390" fill="none" stroke={hairDark} strokeOpacity="0.25" strokeWidth="5" strokeLinecap="round" />
              <path d="M272 180 C276 240, 274 320, 262 390" fill="none" stroke={hairDark} strokeOpacity="0.25" strokeWidth="5" strokeLinecap="round" />
            </g>
          ) : (
            <path
              d="M118 152 C118 108, 145 82, 200 80 C255 82, 282 108, 282 152 C282 170, 276 184, 268 194 L132 194 C124 184, 118 170, 118 152 Z"
              fill={hairDark}
            />
          )}
        </g>

        {/* LEGS */}
        <g id={gid("legs")}>
          <g id={gid("leg-left")} transform={`rotate(${legLeftRotate} 176 395)`}>
            <rect x="162" y="392" width="28" height="78" rx="14" fill={skin} stroke={outline} strokeWidth="4" />
            <path d="M154 430 L198 430 L204 468 L148 468 Z" fill={shorts} stroke={outline} strokeWidth="4" strokeLinejoin="round" />
            <g id={gid("shoe-left")}>
              <path d="M142 468 C142 458, 150 452, 162 452 L190 452 C202 452, 210 458, 212 468 L216 484 C217 492, 212 498, 204 498 L148 498 C140 498, 135 492, 136 484 Z" fill={shoe} stroke={outline} strokeWidth="4" strokeLinejoin="round" />
              <path d="M140 486 L214 486 L212 498 L142 498 Z" fill={shoeSole} />
              <path d="M160 462 L190 462 L196 476 L154 476 Z" fill={shoeDetail} opacity="0.95" />
              <path d="M150 476 C160 470, 178 470, 190 476" fill="none" stroke={shoeDetail} strokeWidth="4" strokeLinecap="round" />
            </g>
          </g>

          <g id={gid("leg-right")} transform={`rotate(${legRightRotate} 224 395)`}>
            <rect x="210" y="392" width="28" height="78" rx="14" fill={skin} stroke={outline} strokeWidth="4" />
            <path d="M202 430 L246 430 L252 468 L196 468 Z" fill={shorts} stroke={outline} strokeWidth="4" strokeLinejoin="round" />
            <g id={gid("shoe-right")}>
              <path d="M188 468 C190 458, 198 452, 210 452 L238 452 C250 452, 258 458, 258 468 L264 484 C265 492, 260 498, 252 498 L196 498 C188 498, 183 492, 184 484 Z" fill={shoe} stroke={outline} strokeWidth="4" strokeLinejoin="round" />
              <path d="M186 486 L262 486 L260 498 L188 498 Z" fill={shoeSole} />
              <path d="M208 462 L238 462 L244 476 L202 476 Z" fill={shoeDetail} opacity="0.95" />
              <path d="M198 476 C208 470, 226 470, 238 476" fill="none" stroke={shoeDetail} strokeWidth="4" strokeLinecap="round" />
            </g>
          </g>
        </g>

        {/* ARMS */}
        <g id={gid("arms")} transform={`translate(0 ${bodyY})`}>
          <g id={gid("arm-left")} transform={`rotate(${armLeftRotate} 150 305)`}>
            <path d="M144 304 C124 308, 114 324, 118 344 L126 382 C129 394, 140 400, 151 396 C162 392, 168 380, 165 368 L157 336 L160 320" fill={skin} stroke={outline} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {tattoos && (
              <g id={gid("tattoo-left")} opacity="0.9" stroke={tattoo} strokeLinecap="round" strokeLinejoin="round">
                <path d="M126 390 C132 390, 140 390, 150 388" fill="none" strokeWidth="2.4" />
                <path d="M127 386 C125 380, 128 374, 132 370 C134 376, 136 380, 134 386 Z" fill={tattoo} strokeWidth="1.2" />
                <path d="M134 386 C132 379, 135 372, 140 368 C142 374, 144 379, 142 386 Z" fill={tattoo} strokeWidth="1.2" />
                <path d="M141 385 C139 378, 142 371, 147 367 C149 373, 151 378, 149 385 Z" fill={tattoo} strokeWidth="1.2" />
                <path d="M130 372 C131 368, 134 365, 137 366" fill="none" strokeWidth="1.8" />
                <path d="M137 370 C138 366, 141 363, 144 364" fill="none" strokeWidth="1.8" />
              </g>
            )}
            <path d="M142 300 C126 304, 116 317, 118 332 L124 350 L154 342 L152 316 C151 306, 148 301, 142 300 Z" fill={shirt} stroke={outline} strokeWidth="4" strokeLinejoin="round" />
          </g>
          <g id={gid("arm-right")} transform={`rotate(${armRightRotate} 250 305)`}>
            <path d="M256 304 C276 308, 286 324, 282 344 L274 382 C271 394, 260 400, 249 396 C238 392, 232 380, 235 368 L243 336 L240 320" fill={skin} stroke={outline} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {tattoos && (
              <g id={gid("tattoo-right")} opacity="0.9" stroke={tattoo} strokeLinecap="round" strokeLinejoin="round">
                <path d="M274 390 C268 390, 260 390, 250 388" fill="none" strokeWidth="2.4" />
                <path d="M273 386 C275 380, 272 374, 268 370 C266 376, 264 380, 266 386 Z" fill={tattoo} strokeWidth="1.2" />
                <path d="M266 386 C268 379, 265 372, 260 368 C258 374, 256 379, 258 386 Z" fill={tattoo} strokeWidth="1.2" />
                <path d="M259 385 C261 378, 258 371, 253 367 C251 373, 249 378, 251 385 Z" fill={tattoo} strokeWidth="1.2" />
                <path d="M270 372 C269 368, 266 365, 263 366" fill="none" strokeWidth="1.8" />
                <path d="M263 370 C262 366, 259 363, 256 364" fill="none" strokeWidth="1.8" />
              </g>
            )}
            <path d="M258 300 C274 304, 284 317, 282 332 L276 350 L246 342 L248 316 C249 306, 252 301, 258 300 Z" fill={shirt} stroke={outline} strokeWidth="4" strokeLinejoin="round" />
          </g>
        </g>

        {/* BODY */}
        <g id={gid("body")} transform={`translate(0 ${bodyY})`}>
          <rect x="184" y="270" width="32" height="28" rx="10" fill={skin} stroke={outline} strokeWidth="4" />
          <path d="M150 298 C150 286, 160 278, 174 276 L184 292 L200 302 L216 292 L226 276 C240 278, 250 286, 250 298 L250 382 C250 396, 240 406, 226 406 L174 406 C160 406, 150 396, 150 382 Z" fill={shirt} stroke={outline} strokeWidth="4" strokeLinejoin="round" />
          <path d="M184 292 L200 304 L216 292" fill="none" stroke="#F2F2F2" strokeOpacity="0.12" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M156 390 L244 390 L248 438 L152 438 Z" fill={shorts} stroke={outline} strokeWidth="4" strokeLinejoin="round" />
          <path d="M200 390 L200 438" fill="none" stroke={outline} strokeOpacity="0.18" strokeWidth="3" />
        </g>

        {/* HEAD */}
        <g id={gid("head")} transform={`translate(${headX} ${headY + bodyY}) rotate(${headRotate} 200 180)`}>
          <rect id={gid("head-shape")} x="112" y="92" width="176" height="176" rx="52" ry="52" fill={skin} stroke={outline} strokeWidth="5" />
          <ellipse cx="108" cy="184" rx="10" ry="14" fill={skin} stroke={outline} strokeWidth="4" />
          <ellipse cx="292" cy="184" rx="10" ry="14" fill={skin} stroke={outline} strokeWidth="4" />

          <g id={gid("eyebrows")}>
            <path d="M142 150 C152 142, 168 140, 182 144" fill="none" stroke={hairDark} strokeWidth="7" strokeLinecap="round" />
            <path d="M218 144 C232 140, 248 142, 258 150" fill="none" stroke={hairDark} strokeWidth="7" strokeLinecap="round" />
          </g>

          <g id={gid("eyes")}>
            <g id={gid("eye-left")}>
              <rect id={gid("eye-left-white")} x="143" y={eyeY} width="38" height={Math.max(2, eyeH)} rx={eyeRx} fill={eyeWhite} stroke={outline} strokeWidth="4" />
            </g>
            <g id={gid("eye-right")}>
              <rect id={gid("eye-right-white")} x="219" y={eyeY} width="38" height={Math.max(2, eyeH)} rx={eyeRx} fill={eyeWhite} stroke={outline} strokeWidth="4" />
            </g>
          </g>

          <path d="M196 190 C192 198, 192 206, 200 210 C208 206, 208 198, 204 190" fill="none" stroke={outline} strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

          <g id={gid("mouth")}>
            <path id={gid("mouth-shape")} d={mouthPath} fill={mouthFill} stroke={mouth} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {goatee && (
            <g id={gid("goatee")}>
              <path d="M190 244 C194 250, 206 250, 210 244 C210 252, 206 258, 200 262 C194 258, 190 252, 190 244 Z" fill={goateeColor} stroke={outline} strokeWidth="2.5" strokeLinejoin="round" />
            </g>
          )}
        </g>

        {/* HAIR FRONT */}
        <g id={gid("hair-front")} transform={`translate(${headX} ${headY + bodyY}) rotate(${headRotate} 200 180)`}>
          {hairVariant === "bald" ? null : headAccessory === "cap" ? (
            <g>
              {/* hair peeking out under cap */}
              <path d="M120 176 C128 164, 144 158, 160 160 L160 182 C145 182, 130 184, 122 190 Z" fill={hairDark} stroke={outline} strokeWidth="3" strokeLinejoin="round" />
              <path d="M280 176 C272 164, 256 158, 240 160 L240 182 C255 182, 270 184, 278 190 Z" fill={hairDark} stroke={outline} strokeWidth="3" strokeLinejoin="round" />
            </g>
          ) : hairVariant === "spiky" ? (
            <g transform="translate(0,-32)">
              <path d="M120 150 C120 112, 148 90, 200 88 C252 90, 280 112, 280 150 C280 160, 277 168, 272 174 C262 162, 246 156, 228 156 C218 162, 210 166, 200 166 C190 166, 182 162, 172 156 C154 156, 138 162, 128 174 C123 168, 120 160, 120 150 Z" fill={hair} stroke={outline} strokeWidth="4.5" strokeLinejoin="round" />
              <g stroke={outline} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
                <path d="M126 152 L102 138 L134 144 Z" fill={hair} />
                <path d="M138 142 L124 114 L154 134 Z" fill={hair} />
                <path d="M154 134 L150 102 L172 128 Z" fill={hair} />
                <path d="M172 128 L176 94 L194 124 Z" fill={hair} />
                <path d="M192 124 L204 90 L214 124 Z" fill={hair} />
                <path d="M212 126 L230 96 L228 130 Z" fill={hair} />
                <path d="M228 132 L250 106 L246 138 Z" fill={hair} />
                <path d="M246 140 L276 118 L266 148 Z" fill={hair} />
                <path d="M262 150 L298 140 L274 158 Z" fill={hair} />
                <path d="M164 136 L160 112 L182 132 Z" fill={hair} />
                <path d="M220 134 L224 112 L238 136 Z" fill={hair} />
              </g>
              <g fill={hairHighlight} opacity="0.9">
                <path d="M128 147 L112 140 L133 143 Z" />
                <path d="M141 137 L131 120 L152 133 Z" />
                <path d="M157 129 L154 110 L170 127 Z" />
                <path d="M175 123 L179 102 L191 123 Z" />
                <path d="M196 120 L204 100 L211 122 Z" />
                <path d="M215 123 L226 104 L225 128 Z" />
                <path d="M231 130 L244 114 L243 136 Z" />
                <path d="M249 139 L268 124 L262 145 Z" />
                <path d="M264 149 L286 142 L272 156 Z" />
              </g>
            </g>
          ) : hairVariant === "spiky-top" ? (
            <g transform="translate(0,-32)">
              <path d="M124 156 C124 118, 150 96, 200 94 C250 96, 276 118, 276 156 C276 162, 274 168, 270 172 C258 162, 242 158, 226 158 C216 162, 208 164, 200 164 C192 164, 184 162, 174 158 C158 158, 142 162, 130 172 C126 168, 124 162, 124 156 Z" fill={hair} stroke={outline} strokeWidth="4.5" strokeLinejoin="round" />
              <g stroke={outline} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
                <path d="M150 140 L142 108 L166 132 Z" fill={hair} />
                <path d="M168 132 L168 98 L186 126 Z" fill={hair} />
                <path d="M186 126 L192 92 L204 124 Z" fill={hair} />
                <path d="M204 124 L216 92 L222 126 Z" fill={hair} />
                <path d="M222 128 L236 100 L234 134 Z" fill={hair} />
                <path d="M236 136 L258 110 L250 142 Z" fill={hair} />
              </g>
              <g fill={hairHighlight} opacity="0.9">
                <path d="M153 136 L147 116 L164 131 Z" />
                <path d="M171 128 L171 106 L184 125 Z" />
                <path d="M189 123 L195 100 L202 123 Z" />
                <path d="M207 123 L213 100 L219 125 Z" />
                <path d="M225 127 L232 108 L231 132 Z" />
                <path d="M238 134 L251 118 L247 139 Z" />
              </g>
            </g>
          ) : hairVariant === "short" ? (
            <g>
              <path d="M118 154 C118 112, 146 88, 200 86 C254 88, 282 112, 282 154 C282 164, 278 172, 272 178 C260 166, 244 160, 226 158 C216 166, 208 170, 200 170 C192 170, 184 166, 174 158 C156 160, 140 166, 128 178 C122 172, 118 164, 118 154 Z" fill={hair} stroke={outline} strokeWidth="4.5" strokeLinejoin="round" />
              <path d="M140 162 C150 150, 166 146, 180 150" fill="none" stroke={hairDark} strokeWidth="3.5" strokeLinecap="round" opacity="0.35" />
              <path d="M220 150 C234 146, 250 150, 260 162" fill="none" stroke={hairDark} strokeWidth="3.5" strokeLinecap="round" opacity="0.35" />
            </g>
          ) : hairVariant === "feminine-long" ? (
            <g>
              <path d="M114 156 C114 114, 144 88, 200 86 C256 88, 286 114, 286 156 C286 166, 282 174, 276 180 C264 166, 246 158, 228 156 C218 164, 210 170, 200 170 C190 170, 182 164, 172 156 C154 158, 136 166, 124 180 C118 174, 114 166, 114 156 Z" fill={hair} stroke={outline} strokeWidth="4.5" strokeLinejoin="round" />
              <path d="M124 168 C116 190, 114 220, 118 250 C120 262, 128 268, 136 264 C140 240, 142 210, 146 182 Z" fill={hair} stroke={outline} strokeWidth="4" strokeLinejoin="round" />
              <path d="M276 168 C284 190, 286 220, 282 250 C280 262, 272 268, 264 264 C260 240, 258 210, 254 182 Z" fill={hair} stroke={outline} strokeWidth="4" strokeLinejoin="round" />
              <path d="M150 160 C162 148, 178 144, 196 150 C188 156, 180 162, 172 166" fill="none" stroke={hairDark} strokeWidth="3.5" strokeLinecap="round" opacity="0.35" />
              <path d="M250 160 C238 148, 222 144, 204 150 C212 156, 220 162, 228 166" fill="none" stroke={hairDark} strokeWidth="3.5" strokeLinecap="round" opacity="0.35" />
            </g>
          ) : (
            <g>
              <path d="M116 156 C116 112, 146 86, 200 84 C254 86, 284 112, 284 156 C284 164, 282 171, 280 176 C270 164, 250 156, 228 154 C214 164, 206 170, 200 170 C194 170, 186 164, 172 154 C150 156, 130 164, 120 176 C118 171, 116 164, 116 156 Z" fill={hair} stroke={outline} strokeWidth="5" strokeLinejoin="round" />
              <path d="M138 160 C148 144, 162 138, 176 142 C168 150, 160 160, 154 170" fill={hair} stroke={outline} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M176 144 C188 132, 200 128, 212 134 C204 142, 198 152, 194 164" fill={hair} stroke={outline} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M214 136 C228 132, 244 138, 254 150 C244 154, 234 160, 228 170" fill={hair} stroke={outline} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M250 150 C262 150, 272 158, 276 170 C266 166, 254 164, 244 166" fill={hair} stroke={outline} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
        </g>

        {/* HEAD ACCESSORY */}
        {headAccessory === "cap" && (
          <g id={gid("accessory-cap")} transform={`translate(${headX} ${headY + bodyY}) rotate(${headRotate} 200 180)`}>
            <path d="M112 158 C112 114, 144 90, 200 88 C256 90, 288 114, 288 158 C288 168, 284 175, 278 180 L122 180 C116 175, 112 168, 112 158 Z" fill={capColor} stroke={outline} strokeWidth="4.5" strokeLinejoin="round" />
            <path d="M122 174 L278 174 L292 196 C296 202, 292 208, 284 208 L116 208 C108 208, 104 202, 108 196 Z" fill={capDetail} stroke={outline} strokeWidth="4.5" strokeLinejoin="round" />
            <path d="M200 88 L200 178" fill="none" stroke={outline} strokeOpacity="0.12" strokeWidth="3" />
          </g>
        )}
      </g>
    </svg>
  );
};

export default MaleBaseCharacter;
