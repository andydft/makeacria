import React from "react";
import { Composition, staticFile } from "remotion";
import { Scene, myCompSchema } from "./Scene";
import { getMediaMetadata } from "./helpers/get-media-metadata";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { JimiShort, JIMI_DURATION } from "./videos/jimi/JimiShort";
import { Jimi3DShort, JIMI3D_DURATION } from "./videos/jimi3d/Jimi3D";
import { GatoBanheiro, GATO_FRAMES, GATO_FPS } from "./videos/gatoBanheiro/GatoBanheiro";
import { QueenStadium, QUEEN_FRAMES, QUEEN_FPS } from "./videos/queenStadium/QueenStadium";
import { LinkinParkAnthem, LP_FRAMES, LP_FPS } from "./videos/linkinParkAnthem/LinkinParkAnthem";
import { LinkinParkCrawling, CRAWL_FRAMES, CRAWL_FPS } from "./videos/linkinParkCrawling/LinkinParkCrawling";
import { LinkinParkJayz, JAYZ_FRAMES, JAYZ_FPS } from "./videos/linkinParkJayz/LinkinParkJayz";
import { ChesterCrawling, CHESTER_CRAWL_FRAMES, CHESTER_CRAWL_FPS } from "./videos/chesterCrawling/ChesterCrawling";
import { MikeShinoda, MIKE_FRAMES, MIKE_FPS } from "./videos/mikeShinoda/MikeShinoda";
import { LinkinParkChesterTapeShort, CHESTER_TAPE_FRAMES, CHESTER_TAPE_FPS } from "./videos/linkinParkChesterTape/LinkinParkChesterTape";
import { LinkinParkOneMoreLightShort, OML_FRAMES, OML_FPS } from "./videos/linkinParkOneMoreLight/LinkinParkOneMoreLight";
import { BreakingTheHabitOriginShort, BTH_FRAMES, BTH_FPS } from "./videos/breakingTheHabitOrigin/BreakingTheHabitOrigin";
import { EmilyArmstrongLinkinParkOriginShort, EML_FRAMES, EML_FPS } from "./videos/emilyArmstrongLinkinParkOrigin/EmilyArmstrongLinkinParkOrigin";
import { LinkinParkEmilyFirstIntroductionShort, LPEI_FRAMES, LPEI_FPS } from "./videos/linkinParkEmilyFirstIntroduction/LinkinParkEmilyFirstIntroduction";
import { MendigagemDigitalSegueAiShort, MDSA_FRAMES, MDSA_FPS } from "./videos/mendigagemDigitalSegueAi/MendigagemDigitalSegueAi";
import { OneMoreLightStoryShort, OMLS_FRAMES, OMLS_FPS } from "./videos/oneMoreLightStory/OneMoreLightStory";
import { ChesterStagePoc, CHESTER_STAGE_POC_DURATION, CHESTER_STAGE_POC_FPS } from "./characters/poc/ChesterStagePoc";
import { OneStepCloserNaruto, OSCN_FRAMES, OSCN_FPS } from "./videos/oneStepCloserNaruto/OneStepCloserNaruto";
import { EmilyArmstrongLinkinParkOriginV2Short, EML2_FRAMES, EML2_FPS } from "./videos/emilyArmstrongLinkinParkOriginV2/EmilyArmstrongLinkinParkOriginV2";
import { LinkinParkChesterTapeV2Short, CPT2_FRAMES, CPT2_FPS } from "./videos/linkinParkChesterTapeV2/LinkinParkChesterTapeV2";
import { ChesterShutUpTest, SUT_FRAMES, SUT_FPS } from "./videos/chesterShutUpTest/ChesterShutUpTest";
import { EmilySingerStoryV2Short, ESS2_FRAMES, ESS2_FPS } from "./videos/emilySingerStoryV2/EmilySingerStoryV2";
import { MikeMoreThanRapperV2Short, MMR2_FRAMES, MMR2_FPS } from "./videos/mikeMoreThanRapperV2/MikeMoreThanRapperV2";
import { BandRehearsalReunionV2Short, BRR2_FRAMES, BRR2_FPS } from "./videos/bandRehearsalReunionV2/BandRehearsalReunionV2";
import { BandCrawlingChorusShow, BCCS_FRAMES, BCCS_FPS } from "./videos/bandCrawlingChorusShow/BandCrawlingChorusShow";
import { BandCrawlingChorusShowV2, BCCS2_FRAMES, BCCS2_FPS } from "./videos/bandCrawlingChorusShow/BandCrawlingChorusShowV2";
import { BandEmptinessMachineEmily, BEME_FRAMES, BEME_FPS } from "./videos/bandEmptinessMachineEmily/BandEmptinessMachineEmily";
import { BtsCuriosity1Debut, BCD1_FRAMES, BCD1_FPS } from "./videos/btsCuriosity1Debut/BtsCuriosity1Debut";
import { BtsCuriosity2ArmyKindness, BCD2_FRAMES, BCD2_FPS } from "./videos/btsCuriosity2ArmyKindness/BtsCuriosity2ArmyKindness";
import { BtsCuriosity3PurpleOcean, BCD3_FRAMES, BCD3_FPS } from "./videos/btsCuriosity3PurpleOcean/BtsCuriosity3PurpleOcean";
import { BtsCuriosity4Records, BCD4_FRAMES, BCD4_FPS } from "./videos/btsCuriosity4Records/BtsCuriosity4Records";
import { BtsCuriosity5IPurpleYou, BCD5_FRAMES, BCD5_FPS } from "./videos/btsCuriosity5IPurpleYou/BtsCuriosity5IPurpleYou";
import { FresnoShowDesdeQuando, FSDQ_FRAMES, FSDQ_FPS } from "./videos/fresnoShowDesdeQuando/FresnoShowDesdeQuando";
import { FresnoShowAlguemQueTeFazSorrir, FSAQ_FRAMES, FSAQ_FPS } from "./videos/fresnoShowAlguemQueTeFazSorrir/FresnoShowAlguemQueTeFazSorrir";
import { BobMarleyCuriosity2Football, BMC2_FRAMES, BMC2_FPS } from "./videos/bobMarleyCuriosity2Football/BobMarleyCuriosity2Football";
import { BobMarleyCuriosity3ThreeLittleBirds, BMC3_FRAMES, BMC3_FPS } from "./videos/bobMarleyCuriosity3ThreeLittleBirds/BobMarleyCuriosity3ThreeLittleBirds";
import { BobMarleyShowBuffaloSoldier, BMSBS_FRAMES, BMSBS_FPS } from "./videos/bobMarleyShowBuffaloSoldier/BobMarleyShowBuffaloSoldier";
import { BobMarleyStoryNoWomanNoCry, BMNW_FRAMES, BMNW_FPS } from "./videos/bobMarleyStoryNoWomanNoCry/BobMarleyStoryNoWomanNoCry";
import { BobMarleyStoryLoveMessage, BMLM_FRAMES, BMLM_FPS } from "./videos/bobMarleyStoryLoveMessage/BobMarleyStoryLoveMessage";
import { SkylabStory1FakeDeath, SKY1_FRAMES, SKY1_FPS } from "./videos/skylabStory1FakeDeath/SkylabStory1FakeDeath";
import { SkylabStory2JoSoares, SKY2_FRAMES, SKY2_FPS } from "./videos/skylabStory2JoSoares/SkylabStory2JoSoares";
import { SkylabStory3Snoring, SKY3_FRAMES, SKY3_FPS } from "./videos/skylabStory3Snoring/SkylabStory3Snoring";
import { LinkinParkFormationV2Short, LPF2_FRAMES, LPF2_FPS } from "./videos/linkinParkFormationV2/LinkinParkFormationV2";
import { OneMoreLightTributeV2Short, OML2_FRAMES, OML2_FPS } from "./videos/oneMoreLightTributeV2/OneMoreLightTributeV2";
import { ChesterAccidentProneV2Short, CAP2_FRAMES, CAP2_FPS } from "./videos/chesterAccidentProneV2/ChesterAccidentProneV2";
import { ChesterTattoosIdentity, CTI_FRAMES, CTI_FPS } from "./videos/chesterTattoosIdentity/ChesterTattoosIdentity";
import { LpDjJoeHahnOrigin, LPDJ_FRAMES, LPDJ_FPS } from "./videos/lpDjJoeHahnOrigin/LpDjJoeHahnOrigin";
import { LpNewDivideBillion, LP_NEW_DIVIDE_FRAMES, LP_NEW_DIVIDE_FPS } from "./videos/lpNewDivideBillion/LpNewDivideBillion";
import { LpInTheEndRefrain, LP_ITE_FRAMES, LP_ITE_FPS } from "./videos/lpInTheEndRefrain/LpInTheEndRefrain";
import { GameplayFarmStory, GFS_FRAMES, GFS_FPS } from "./videos/gameplayFarmStory/GameplayFarmStory";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ChesterStagePoc"
        component={ChesterStagePoc}
        fps={CHESTER_STAGE_POC_FPS}
        durationInFrames={CHESTER_STAGE_POC_DURATION}
        width={1080}
        height={1920}
      />
      <Composition
        id="OneMoreLightStoryShort"
        component={OneMoreLightStoryShort}
        fps={OMLS_FPS}
        durationInFrames={OMLS_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="OneStepCloserNarutoShort"
        component={OneStepCloserNaruto}
        fps={OSCN_FPS}
        durationInFrames={OSCN_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="EmilyArmstrongLinkinParkOriginV2Short"
        component={EmilyArmstrongLinkinParkOriginV2Short}
        fps={EML2_FPS}
        durationInFrames={EML2_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="LinkinParkChesterTapeV2Short"
        component={LinkinParkChesterTapeV2Short}
        fps={CPT2_FPS}
        durationInFrames={CPT2_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="ChesterShutUpTest"
        component={ChesterShutUpTest}
        fps={SUT_FPS}
        durationInFrames={SUT_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="ChesterTattoosIdentityShort"
        component={ChesterTattoosIdentity}
        fps={CTI_FPS}
        durationInFrames={CTI_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="LpDjJoeHahnOriginShort"
        component={LpDjJoeHahnOrigin}
        fps={LPDJ_FPS}
        durationInFrames={LPDJ_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="LpNewDivideBillionShort"
        component={LpNewDivideBillion}
        fps={LP_NEW_DIVIDE_FPS}
        durationInFrames={LP_NEW_DIVIDE_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="LpInTheEndRefrainShort"
        component={LpInTheEndRefrain}
        fps={LP_ITE_FPS}
        durationInFrames={LP_ITE_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="GameplayFarmStoryShort"
        component={GameplayFarmStory}
        fps={GFS_FPS}
        durationInFrames={GFS_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="EmilySingerStoryV2Short"
        component={EmilySingerStoryV2Short}
        fps={ESS2_FPS}
        durationInFrames={ESS2_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="MikeMoreThanRapperV2Short"
        component={MikeMoreThanRapperV2Short}
        fps={MMR2_FPS}
        durationInFrames={MMR2_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="BandRehearsalReunionV2Short"
        component={BandRehearsalReunionV2Short}
        fps={BRR2_FPS}
        durationInFrames={BRR2_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="BandCrawlingChorusShow"
        component={BandCrawlingChorusShow}
        fps={BCCS_FPS}
        durationInFrames={BCCS_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="BandCrawlingChorusShowV2"
        component={BandCrawlingChorusShowV2}
        fps={BCCS2_FPS}
        durationInFrames={BCCS2_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="BandEmptinessMachineEmily"
        component={BandEmptinessMachineEmily}
        fps={BEME_FPS}
        durationInFrames={BEME_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="BtsCuriosity1Debut"
        component={BtsCuriosity1Debut}
        fps={BCD1_FPS}
        durationInFrames={BCD1_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="BtsCuriosity2ArmyKindness"
        component={BtsCuriosity2ArmyKindness}
        fps={BCD2_FPS}
        durationInFrames={BCD2_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="BtsCuriosity3PurpleOcean"
        component={BtsCuriosity3PurpleOcean}
        fps={BCD3_FPS}
        durationInFrames={BCD3_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="BtsCuriosity4Records"
        component={BtsCuriosity4Records}
        fps={BCD4_FPS}
        durationInFrames={BCD4_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="BtsCuriosity5IPurpleYou"
        component={BtsCuriosity5IPurpleYou}
        fps={BCD5_FPS}
        durationInFrames={BCD5_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="FresnoShowDesdeQuando"
        component={FresnoShowDesdeQuando}
        fps={FSDQ_FPS}
        durationInFrames={FSDQ_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="FresnoShowAlguemQueTeFazSorrir"
        component={FresnoShowAlguemQueTeFazSorrir}
        fps={FSAQ_FPS}
        durationInFrames={FSAQ_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="BobMarleyCuriosity2Football"
        component={BobMarleyCuriosity2Football}
        fps={BMC2_FPS}
        durationInFrames={BMC2_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="BobMarleyCuriosity3ThreeLittleBirds"
        component={BobMarleyCuriosity3ThreeLittleBirds}
        fps={BMC3_FPS}
        durationInFrames={BMC3_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="BobMarleyShowBuffaloSoldier"
        component={BobMarleyShowBuffaloSoldier}
        fps={BMSBS_FPS}
        durationInFrames={BMSBS_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="BobMarleyStoryNoWomanNoCry"
        component={BobMarleyStoryNoWomanNoCry}
        fps={BMNW_FPS}
        durationInFrames={BMNW_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="BobMarleyStoryLoveMessage"
        component={BobMarleyStoryLoveMessage}
        fps={BMLM_FPS}
        durationInFrames={BMLM_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition id="SkylabStory1FakeDeath" component={SkylabStory1FakeDeath} fps={SKY1_FPS} durationInFrames={SKY1_FRAMES} width={1080} height={1920} />
      <Composition id="SkylabStory2JoSoares" component={SkylabStory2JoSoares} fps={SKY2_FPS} durationInFrames={SKY2_FRAMES} width={1080} height={1920} />
      <Composition id="SkylabStory3Snoring" component={SkylabStory3Snoring} fps={SKY3_FPS} durationInFrames={SKY3_FRAMES} width={1080} height={1920} />
      <Composition
        id="LinkinParkFormationV2Short"
        component={LinkinParkFormationV2Short}
        fps={LPF2_FPS}
        durationInFrames={LPF2_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="OneMoreLightTributeV2Short"
        component={OneMoreLightTributeV2Short}
        fps={OML2_FPS}
        durationInFrames={OML2_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="ChesterAccidentProneV2Short"
        component={ChesterAccidentProneV2Short}
        fps={CAP2_FPS}
        durationInFrames={CAP2_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="MendigagemDigitalSegueAiShort"
        component={MendigagemDigitalSegueAiShort}
        fps={MDSA_FPS}
        durationInFrames={MDSA_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="LinkinParkEmilyFirstIntroductionShort"
        component={LinkinParkEmilyFirstIntroductionShort}
        fps={LPEI_FPS}
        durationInFrames={LPEI_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="EmilyArmstrongLinkinParkOriginShort"
        component={EmilyArmstrongLinkinParkOriginShort}
        fps={EML_FPS}
        durationInFrames={EML_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="BreakingTheHabitOriginShort"
        component={BreakingTheHabitOriginShort}
        fps={BTH_FPS}
        durationInFrames={BTH_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="LinkinParkOneMoreLightShort"
        component={LinkinParkOneMoreLightShort}
        fps={OML_FPS}
        durationInFrames={OML_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="LinkinParkChesterTapeShort"
        component={LinkinParkChesterTapeShort}
        fps={CHESTER_TAPE_FPS}
        durationInFrames={CHESTER_TAPE_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="MikeShinodaShort"
        component={MikeShinoda}
        fps={MIKE_FPS}
        durationInFrames={MIKE_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="ChesterCrawlingShort"
        component={ChesterCrawling}
        fps={CHESTER_CRAWL_FPS}
        durationInFrames={CHESTER_CRAWL_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="LinkinParkJayzShort"
        component={LinkinParkJayz}
        fps={JAYZ_FPS}
        durationInFrames={JAYZ_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="LinkinParkCrawlingShort"
        component={LinkinParkCrawling}
        fps={CRAWL_FPS}
        durationInFrames={CRAWL_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="LinkinParkAnthemShort"
        component={LinkinParkAnthem}
        fps={LP_FPS}
        durationInFrames={LP_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="QueenStadiumShort"
        component={QueenStadium}
        fps={QUEEN_FPS}
        durationInFrames={QUEEN_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="GatoBanheiro"
        component={GatoBanheiro}
        fps={GATO_FPS}
        durationInFrames={GATO_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="JimiShort"
        component={JimiShort}
        fps={30}
        durationInFrames={JIMI_DURATION}
        width={1080}
        height={1920}
      />
      <Composition
        id="Jimi3DShort"
        component={Jimi3DShort}
        fps={30}
        durationInFrames={JIMI3D_DURATION}
        width={1080}
        height={1920}
      />
      <Composition
        id="BridgeShort"
        component={BridgeShort}
        fps={30}
        durationInFrames={BRIDGE_FRAMES}
        width={1080}
        height={1920}
      />
      <Composition
        id="Scene"
        component={Scene}
        fps={30}
        durationInFrames={300}
        width={1280}
        height={720}
        schema={myCompSchema}
        defaultProps={{
          deviceType: "phone",
          phoneColor: "rgb(110, 152, 191)" as const,
          baseScale: 1,
          mediaMetadata: null,
          videoSrc: null,
        }}
        calculateMetadata={async ({ props }) => {
          const videoSrc =
            props.deviceType === "phone"
              ? staticFile("phone.mp4")
              : staticFile("tablet.mp4");

          const mediaMetadata = await getMediaMetadata(videoSrc);

          return {
            props: {
              ...props,
              mediaMetadata,
              videoSrc,
            },
          };
        }}
      />
    </>
  );
};


