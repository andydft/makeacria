import type { MaleBaseCharacterProps } from "../base/MaleBaseCharacter";

export const JUNGKOOK_BTS_V1: Pick<MaleBaseCharacterProps, "hairVariant" | "headAccessory" | "goatee" | "tattoos" | "eyeStyle" | "colors"> = {
  hairVariant: "short",
  headAccessory: "none",
  goatee: false,
  tattoos: true,
  eyeStyle: "thin",
  colors: {
    skin: "#E8C4A0",
    hair: "#1F2937",
    hairDark: "#111827",
    hairHighlight: "#4B5563",
    shirt: "#111827",
    shorts: "#374151",
    shoe: "#F5F5F5",
    shoeSole: "#D1D5DB",
    shoeDetail: "#9CA3AF",
    eyeWhite: "#FFFFFF",
    pupil: "#2D3748",
    mouth: "#B85C5C",
    outline: "#2D3748",
  },
};
