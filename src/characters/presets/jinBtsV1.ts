import type { MaleBaseCharacterProps } from "../base/MaleBaseCharacter";

export const JIN_BTS_V1: Pick<MaleBaseCharacterProps, "hairVariant" | "headAccessory" | "goatee" | "tattoos" | "eyeStyle" | "colors"> = {
  hairVariant: "short",
  headAccessory: "none",
  goatee: false,
  tattoos: false,
  eyeStyle: "thin",
  colors: {
    skin: "#F2D0B5",
    hair: "#1F2937",
    hairDark: "#111827",
    hairHighlight: "#4B5563",
    shirt: "#F9A8D4",
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
