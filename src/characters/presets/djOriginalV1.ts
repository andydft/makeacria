import type { MaleBaseCharacterProps } from "../base/MaleBaseCharacter";

export const DJ_ORIGINAL_V1: Pick<MaleBaseCharacterProps, "hairVariant" | "headAccessory" | "goatee" | "tattoos" | "colors" | "eyeStyle"> = {
  hairVariant: "short",
  headAccessory: "headphones",
  goatee: false,
  tattoos: false,
  eyeStyle: "almond",
  colors: {
    skin: "#F0C8A0",
    hair: "#1F2937",
    hairDark: "#111827",
    hairHighlight: "#4B5563",
    shirt: "#7C3AED",
    shorts: "#1F2937",
    shoe: "#F5F5F5",
    shoeSole: "#D1D5DB",
    shoeDetail: "#9CA3AF",
    eyeWhite: "#FFFFFF",
    pupil: "#171717",
    mouth: "#B85C5C",
    outline: "#2D3748",
  },
};
