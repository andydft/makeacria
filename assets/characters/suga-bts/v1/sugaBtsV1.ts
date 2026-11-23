import type { MaleBaseCharacterProps } from "../base/MaleBaseCharacter";

export const SUGA_BTS_V1: Pick<MaleBaseCharacterProps, "hairVariant" | "headAccessory" | "goatee" | "tattoos" | "eyeStyle" | "colors"> = {
  hairVariant: "short",
  headAccessory: "none",
  goatee: false,
  tattoos: false,
  eyeStyle: "thin",
  colors: {
    skin: "#EECBA8",
    hair: "#111827",
    hairDark: "#030712",
    hairHighlight: "#374151",
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
