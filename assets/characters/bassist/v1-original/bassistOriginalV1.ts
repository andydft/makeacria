import type { MaleBaseCharacterProps } from "../base/MaleBaseCharacter";

export const BASSIST_ORIGINAL_V1: Pick<MaleBaseCharacterProps, "hairVariant" | "headAccessory" | "goatee" | "tattoos" | "colors"> = {
  hairVariant: "short",
  headAccessory: "cap-high",
  goatee: false,
  tattoos: false,
  colors: {
    skin: "#E8B88C",
    hair: "#4A3728",
    hairDark: "#2E2218",
    hairHighlight: "#7A5C45",
    shirt: "#166534",
    shorts: "#1F2937",
    cap: "#1F2937",
    capDetail: "#111827",
    shoe: "#F5F5F5",
    shoeSole: "#D1D5DB",
    shoeDetail: "#9CA3AF",
    eyeWhite: "#FFFFFF",
    pupil: "#2D3748",
    mouth: "#B85C5C",
    outline: "#2D3748",
  },
};
