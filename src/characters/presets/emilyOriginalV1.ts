import type { MaleBaseCharacterProps } from "../base/MaleBaseCharacter";

export const EMILY_ORIGINAL_V1: Pick<MaleBaseCharacterProps, "hairVariant" | "headAccessory" | "goatee" | "tattoos" | "colors"> = {
  hairVariant: "feminine-long",
  headAccessory: "none",
  goatee: false,
  tattoos: false,
  colors: {
    skin: "#F4CCA8",
    hair: "#E8C96A",
    hairDark: "#C9A84C",
    hairHighlight: "#FFF3A3",
    shirt: "#F4D21B",
    shorts: "#2D3748",
    shoe: "#F5F5F5",
    shoeSole: "#D1D5DB",
    shoeDetail: "#9CA3AF",
    eyeWhite: "#FFFFFF",
    pupil: "#2D3748",
    mouth: "#B85C5C",
    outline: "#2D3748",
  },
};
