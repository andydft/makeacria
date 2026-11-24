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
    headAccessory="none"
    goatee={false}
    tattoos={false}
    colors={{
      skin: "#A86B45",
      hair: "#2B2118",
      hairDark: "#1A130E",
      shirt: "#F5F5F5",
      shorts: "#4F83CC",
      shoe: "#E8E8E8",
      shoeSole: "#D1D5DB",
      shoeDetail: "#4F83CC",
      outline: "#241A16",
      ...(rest.colors ?? {}),
    }}
    pose={{ ...pose, eyeOpen, mouthShape }}
  />
);

export default CjLikeV1;
