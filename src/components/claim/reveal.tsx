import { Box, Heading, VStack, Image } from "@chakra-ui/react";
import eventHelperInstance, { ExtClaimedDrop } from "@/lib/event";
import { ImageSplit } from "./reward-image";
import { TokenScavRewardImage } from "../wallet/journeys/token-scav-image";
import { Image as FallbackImage } from "../ui/image";
import { getIpfsImageSrcUrl } from "@/lib/helpers/ipfs";

// Use the GIF files for token and NFT animations
import TokenAnimation from "/assets/token_anim.gif";
import NftAnimation from "/assets/nft_anim.gif";
import BoxesBackground from "/assets/boxes-background.webp";

interface RevealProps {
  foundItem: ExtClaimedDrop;
}

export function Reveal({ foundItem }: RevealProps) {
  const numFound = foundItem.found_scavenger_ids?.length || 1;
  const numRequired = foundItem.needed_scavenger_ids?.length || 1;
  const amountToDisplay = eventHelperInstance.yoctoToNearWithMinDecimals(
    foundItem.token_amount || "0",
  );

  const isScavenger =
    foundItem.needed_scavenger_ids !== undefined &&
    foundItem.needed_scavenger_ids !== null;

  const rewardMessage = () => {
    if (isScavenger) {
      if (numFound === numRequired) {
        return "Claimed";
      }

      return `${numRequired - numFound} Left`;
    }

    return "Claimed";
  };

  const getBackgroundImage = () => {
    if (numFound !== numRequired) {
      return BoxesBackground;
    }

    if (foundItem.type === "token") {
      return TokenAnimation;
    }

    return NftAnimation;
  };

  const rewardComponent = () => {
    // For NFTs we can just use the image split component
    if (
      (foundItem.type === "nft" || foundItem.type === "multichain") &&
      foundItem.nft_metadata
    ) {
      return (
        <Box
          bg="bg.primary"
          p={2}
          paddingTop={4}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <ImageSplit numPieces={numRequired} numFound={numFound}>
            <Box borderRadius="12px" height="100%" width="100%">
              <FallbackImage
                src={getIpfsImageSrcUrl(foundItem.nft_metadata?.media || "")}
                alt="Masked Image"
                width="100%"
                height="100%"
                objectFit="contain"
              />
            </Box>
          </ImageSplit>
          <Heading
            as="h4"
            width={"250px"}
            fontWeight={"normal"}
            textAlign={"center"}
            color={"brand.400"}
            fontSize="18px"
            mt={4}
          >
            {foundItem.nft_metadata.title}
          </Heading>
        </Box>
      );
    }

    // For tokens we can use the token image component
    return <TokenScavRewardImage tokenAmount={amountToDisplay} />;
  };

  return (
    <Box position="relative" p={4}>
      <Box position="relative">
        {/* Update the image source to use the GIF */}
        <Image
          src={getBackgroundImage()}
          width="100%"
          height="100%"
          position="relative"
          minW="100%"
          maxH={"calc(100dvh - 170px)"}
          loading="eager"
        />
      </Box>
      <VStack
        position="absolute"
        top="42%"
        left="50%"
        transform="translate(-50%, -50%)"
        width={"100%"}
        p={4}
        spacing={12}
      >
        {rewardComponent()}

        <VStack alignItems="center" gap={0} width={"100%"} pt={4}>
          {/* Reward message */}
          <Heading
            as="h3"
            fontSize="5xl"
            fontFamily="mono"
            fontWeight="bold"
            color="white"
            bg="bg.primary"
            textAlign="left"
            textTransform={"uppercase"}
            px={4}
          >
            {rewardMessage()}
          </Heading>
        </VStack>
      </VStack>
    </Box>
  );
}
