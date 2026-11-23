import type { MaleBaseCharacterProps } from "../base/MaleBaseCharacter";

export const CHESTER_ORIGINAL_V1: Pick<MaleBaseCharacterProps, "hairVariant" | "headAccessory" | "goatee" | "tattoos" | "colors"> = {
  hairVariant: "spiky",
  headAccessory: "none",
  goatee: true,
  tattoos: true,
  colors: {
    skin: "#F0C29A",
    hair: "#FFD400",
    hairDark: "#C9A000",
    hairHighlight: "#FFF176",
    shirt: "#1E1E22",
    shorts: "#4A5568",
  },
};
