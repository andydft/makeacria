import type { MaleBaseCharacterProps } from "../base/MaleBaseCharacter";

export const JIMIN_BTS_V1: Pick<MaleBaseCharacterProps, "hairVariant" | "headAccessory" | "goatee" | "tattoos" | "eyeStyle" | "colors"> = {
  hairVariant: "short",
  headAccessory: "none",
  goatee: false,
  tattoos: false,
  eyeStyle: "thin",
  colors: {
    skin: "#F2D0B5",
    hair: "#E8D5A3",
    hairDark: "#C8B07A",
    hairHighlight: "#FFF1C1",
    shirt: "#93C5FD",
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
