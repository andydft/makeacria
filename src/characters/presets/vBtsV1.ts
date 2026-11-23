import type { MaleBaseCharacterProps } from "../base/MaleBaseCharacter";

export const V_BTS_V1: Pick<MaleBaseCharacterProps, "hairVariant" | "headAccessory" | "goatee" | "tattoos" | "eyeStyle" | "colors"> = {
  hairVariant: "curly",
  headAccessory: "none",
  goatee: false,
  tattoos: false,
  eyeStyle: "thin",
  colors: {
    skin: "#E8C4A0",
    hair: "#4B2E2B",
    hairDark: "#2F1B19",
    hairHighlight: "#6B4540",
    shirt: "#8B5CF6",
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
