import type { MaleBaseCharacterProps } from "../base/MaleBaseCharacter";

export const GUITARIST_ORIGINAL_V1: Pick<MaleBaseCharacterProps, "hairVariant" | "headAccessory" | "goatee" | "tattoos" | "colors"> = {
  hairVariant: "curly",
  headAccessory: "headphones",
  goatee: false,
  tattoos: false,
  colors: {
    skin: "#D8A47A",
    hair: "#2B2118",
    hairDark: "#1A130E",
    hairHighlight: "#4A3A2E",
    shirt: "#1F2937",
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
