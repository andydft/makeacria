import type { MaleBaseCharacterProps } from "../base/MaleBaseCharacter";

export const DRUMMER_ORIGINAL_V1: Pick<MaleBaseCharacterProps, "hairVariant" | "headAccessory" | "goatee" | "tattoos" | "colors"> = {
  hairVariant: "short",
  headAccessory: "none",
  goatee: false,
  tattoos: false,
  colors: {
    skin: "#D4A574",
    hair: "#3B2F2F",
    hairDark: "#241A1A",
    hairHighlight: "#6B5B4F",
    shirt: "#B91C1C",
    shorts: "#1F2937",
    shoe: "#F5F5F5",
    shoeSole: "#D1D5DB",
    shoeDetail: "#9CA3AF",
    eyeWhite: "#FFFFFF",
    pupil: "#2D3748",
    mouth: "#B85C5C",
    outline: "#2D3748",
  },
};
