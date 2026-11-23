import type { MaleBaseCharacterProps } from "../base/MaleBaseCharacter";

export const RM_BTS_V1: Pick<MaleBaseCharacterProps, "hairVariant" | "headAccessory" | "goatee" | "tattoos" | "eyeStyle" | "colors"> = {
  hairVariant: "short",
  headAccessory: "none",
  goatee: false,
  tattoos: false,
  eyeStyle: "thin",
  colors: {
    skin: "#E8C4A0",
    hair: "#6B4F3A",
    hairDark: "#4A3528",
    hairHighlight: "#8B6A52",
    shirt: "#3B82F6",
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
