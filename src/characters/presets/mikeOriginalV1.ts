import type { MaleBaseCharacterProps } from "../base/MaleBaseCharacter";

export const MIKE_ORIGINAL_V1: Pick<MaleBaseCharacterProps, "hairVariant" | "headAccessory" | "goatee" | "tattoos" | "colors"> = {
  hairVariant: "short",
  headAccessory: "cap",
  goatee: true,
  tattoos: false,
  colors: {
    skin: "#EFC39B",
    hair: "#2B2118",
    hairDark: "#1A130E",
    shirt: "#3B4A66",
    shorts: "#2D3748",
    cap: "#B91C1C",
    capDetail: "#7F1D1D",
    hairHighlight: "#4A3A2E",
  },
};
