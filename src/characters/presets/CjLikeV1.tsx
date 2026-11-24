import React from "react";
import { MaleBaseCharacter, type MaleBaseCharacterProps } from "../base/MaleBaseCharacter";

export type CjLikeV1Props = Partial<MaleBaseCharacterProps> & {
  eyeOpen?: number;
  mouthShape?: "neutral" | "smile" | "open" | "sad";
};

export const CjLikeV1: React.FC<CjLikeV1Props> = ({ eyeOpen = 1, mouthShape = "neutral", pose, ...rest }) => (
  <MaleBaseCharacter
    {...rest}
    hairVariant="bald"
    headAccessory="cap"
    goatee={false}
    tattoos={true}
    colors={{
      skin: "#9C6644",
      hair: "#2B2118",
      hairDark: "#1A130E",
      shirt: "#F3F4F6",
      shorts: "#3B82C4",
      shoe: "#F8FAFC",
      shoeSole: "#E5E7EB",
      shoeDetail: "#1F2937",
      outline: "#241A16",
      cap: "#1F2937",
      capDetail: "#111827",
      tattoo: "#1F2937",
      ...(rest.colors ?? {}),
    }}
    pose={{ ...pose, eyeOpen, mouthShape }}
  />
);

export default CjLikeV1;
