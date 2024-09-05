import {
  Box,
  Button,
  Heading,
  Hide,
  HStack,
  Image,
  Show,
  Skeleton,
  Text,
  VStack,
  useToast,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useState, useMemo } from "react";
import QRCode from "qrcode";

import { DeleteIcon, LinkIcon, NFTIcon } from "@/components/dashboard/icons";
import {
  type ColumnItem,
  type DataItem,
} from "@/components/dashboard/table/types";
import { DataTable } from "@/components/dashboard/table";
import { useAppContext } from "@/contexts/AppContext";
import { CLOUDFLARE_IPFS, TOKEN_FACTORY_CONTRACT } from "@/constants/common";
import { NotFound404 } from "@/components/dashboard/NotFound404";
import useDeletion from "@/components/dashboard/appModal/useDeletion";
import { performDeletionLogic } from "@/components/dashboard/appModal/PerformDeletion";
import { truncateAddress } from "@/utils/truncateAddress";
import { formatTokensAvailable } from "@/utils/formatTokensAvailable";
import eventHelperInstance from "@/lib/event";

import { CreateDropModal } from "@/components/dashboard/CreateDropModal/CreateDropModal";
import QRViewerModal from "@/components/dashboard/QRViewerModal";
import { Wallet } from "@near-wallet-selector/core";
import { useAuthWalletContext } from "@/contexts/AuthWalletContext";
import { AppModal } from "@/components/dashboard/appModal/AppModal";

export interface ScavengerHunt {
  piece: string;
  description: string;
}

export interface ConferenceDropBase {
  scavenger_hunt?: ScavengerHunt[];
  name: string;
  image: string;
  num_claimed: number;
  id: string;
}

export interface CreatedNFTConferenceDrop {
  base: ConferenceDropBase;
  series_id: number;
}

export interface CreatedTokenConferenceDrop {
  base: ConferenceDropBase;
  amount: string;
}

function isTokenDrop(
  item: CreatedConferenceDrop,
): item is CreatedTokenConferenceDrop {
  return (item as CreatedTokenConferenceDrop).amount !== undefined;
}

export type GetTicketDataFn = (
  data: CreatedConferenceDrop[],
  handleDelete: (pubKey: string) => Promise<void>,
) => DataItem[];

export type CreatedConferenceDrop =
  | CreatedNFTConferenceDrop
  | CreatedTokenConferenceDrop;

const eventTableColumns: ColumnItem[] = [
  {
    id: "dropName",
    title: "Name",
    selector: (row) => row.name,
    loadingElement: <Skeleton height="30px" />,
  },
  {
    id: "dropType",
    title: "Type",
    selector: (row) => row.type,
    loadingElement: <Skeleton height="30px" />,
  },
  {
    id: "numClaimed",
    title: "Claims",
    selector: (row) => row.numClaimed,
    loadingElement: <Skeleton height="30px" />,
  },
  {
    id: "rewards",
    title: "Reward",
    selector: (row) => row.reward,
    loadingElement: <Skeleton height="30px" />,
  },
  {
    id: "scavengers",
    title: "Scavenger Pieces",
    selector: (row) => row.numPieces,
    loadingElement: <Skeleton height="30px" />,
  },
  {
    id: "action",
    title: "",
    selector: (row) => row.action,
    loadingElement: <Skeleton height="30px" />,
  },
];

const capitalizeFirstLetter = (string) => {
  if (!string) return string;
  return `${string.charAt(0).toUpperCase() as string}${string.slice(1).toString() as string}`;
};

export function Dashboard() {
  const { setAppModal } = useAppContext();
  const { selector, account } = useAuthWalletContext();

  const [isLoading, setIsLoading] = useState(true);
  const [isErr, setIsErr] = useState(false);
  const [isCreateDropModalOpen, setIsCreateDropModalOpen] = useState(false);
  const [tokensAvailable, setTokensAvailable] = useState<string>();
  //const [accountId, setAccountId] = useState<string>();
  const [dropsCreated, setDropsCreated] = useState<CreatedConferenceDrop[]>([]);
  const [dropType, setDropType] = useState<"nft" | "token">("token");
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [qrCodeUrls, setQrCodeUrls] = useState<string[]>([]);
  const [wallet, setWallet] = useState<Wallet>();

  useEffect(() => {
    async function fetchWallet() {
      if (!selector) return;
      try {
        const wallet = await selector.wallet();
        setWallet(wallet);
      } catch (error) {
        console.error("Error fetching wallet:", error);
      }
    }

    fetchWallet();
  }, [selector]);

  const getAccountInformation = async () => {
    try {
      const recoveredAccount = await eventHelperInstance.viewCall({
        contractId: TOKEN_FACTORY_CONTRACT,
        methodName: "recover_account",
        args: { key_or_account_id: account?.public_key },
      });

      const tokens = await eventHelperInstance.viewCall({
        contractId: TOKEN_FACTORY_CONTRACT,
        methodName: "ft_balance_of",
        args: { account_id: recoveredAccount.account_id },
      });
      setTokensAvailable(eventHelperInstance.yoctoToNearWith4Decimals(tokens));

      const drops = await eventHelperInstance.viewCall({
        contractId: TOKEN_FACTORY_CONTRACT,
        methodName: "get_drops_created_by_account",
        args: { account_id: recoveredAccount.account_id },
      });
      setDropsCreated(drops);
    } catch (e) {
      console.error(e);
      setIsErr(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!account) return;
    getAccountInformation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const handleDeleteClick = async (dropId) => {
    console.log("deleting", dropId);
    const deletionArgs = {
      wallet,
      dropId,
      setAppModal,
      getAccountInformation,
    };

    openConfirmationModal(
      deletionArgs,
      "Are you sure you want to delete this drop?",
      performDeletionLogic,
    );
  };

  const openConfirmationModal = useDeletion({
    setAppModal,
  }).openConfirmationModal;

  const getTableRows: GetTicketDataFn = (data, handleDeleteClick) => {
    if (!data) return [];

    return data.map((item) => ({
      id: item.base.id,
      name: (
        <HStack spacing={4}>
          <Image
            alt={`Event image for ${item.base.id}`}
            borderRadius="12px"
            boxSize="48px"
            objectFit="contain"
            src={`${CLOUDFLARE_IPFS}/${item.base.image}`}
          />
          <VStack align="left">
            <Heading
              fontFamily="body"
              fontSize={{ md: "lg" }}
              fontWeight="bold"
            >
              {truncateAddress(`${item.base.name}`, "end", 16)}
            </Heading>
          </VStack>
        </HStack>
      ),
      type: isTokenDrop(item) ? "Token" : "NFT",
      numClaimed: item.base.num_claimed,
      numPieces: item.base.scavenger_hunt
        ? item.base.scavenger_hunt.length
        : "None",
      reward: isTokenDrop(item) ? (
        eventHelperInstance.yoctoToNearWith4Decimals(item.amount)
      ) : (
        <Image
          alt={`Event image for ${item.base.id}`}
          borderRadius="12px"
          boxSize="48px"
          objectFit="contain"
          src={`${CLOUDFLARE_IPFS}/${item.base.image}`}
        />
      ),
      action: (
        <HStack justify="right" spacing={8} w="100%">
          <Button
            size="md"
            variant="primary"
            maxWidth={"max-content"}
            onClick={(e) => {
              e.stopPropagation();
              generateQRCode(
                item.base.id,
                isTokenDrop(item) ? "token" : "nft",
                item.base.scavenger_hunt,
              );
              onOpen();
            }}
          >
            Get QR Code
          </Button>
          <Button
            variant="icon"
            background={"red.400"}
            height={"48px"}
            width={"48px"}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(item.base.id);
            }}
          >
            <DeleteIcon color="white" />
          </Button>
        </HStack>
      ),
    }));
  };

  const generateQRCode = async (
    dropId: string,
    type: "nft" | "token",
    scavengerHunt?: ScavengerHunt[],
  ) => {
    try {
      if (scavengerHunt && scavengerHunt.length > 0) {
        const qrCodes = await Promise.all(
          scavengerHunt.map(({ piece }) =>
            QRCode.toDataURL(`${type}:${dropId}:${piece}`),
          ),
        );
        setQrCodeUrls(qrCodes);
      } else {
        const url = await QRCode.toDataURL(`${type}:${dropId}`);
        setQrCodeUrls([url]);
      }
      onOpen();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadQrCode = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = "qr-code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAllQrCodes = (urls: string[]) => {
    urls.forEach((url, index) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = `qr-code-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const data = useMemo(
    () => getTableRows(dropsCreated, handleDeleteClick),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dropsCreated],
  );

  const handleCreateDropClose = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dropCreated: any,
    isScavengerHunt: boolean,
    scavengerHunt: Array<{ piece: string; description: string }>,
    setIsModalLoading: (loading: boolean) => void,
  ) => {
    if (dropCreated) {
      setIsModalLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { dropId, completeScavengerHunt }: any =
          await eventHelperInstance.createConferenceDrop({
            wallet: wallet!,
            createdDrop: dropCreated,
            isScavengerHunt,
            scavengerHunt,
          });
        toast({
          title: "Drop created successfully.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        await getAccountInformation(); // Refresh the drop list
        const type = isTokenDrop(dropCreated) ? "token" : "nft";
        if (isScavengerHunt) {
          generateQRCode(dropId, type, completeScavengerHunt);
        } else {
          generateQRCode(dropId, type);
        }
      } catch (e) {
        console.error("Error creating drop:", e);
        toast({
          title: "Drop creation unsuccessful. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
      setIsModalLoading(false);
    }

    setIsCreateDropModalOpen(false);
  };

  if (isErr) {
    return (
      <NotFound404
        cta="Return to homepage"
        header="Account Unauthorized"
        subheader="Check the signed in account and try again later."
      />
    );
  }

  return (
    <Box
      position={"relative"}
      width="100%"
      minHeight="100dvh"
      bg="black"
      zIndex={5}
      _before={{
        content: '""',
        position: "absolute",
        opacity: 0.5,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: "url(/assets/background.webp)",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
        zIndex: -1,
      }}
    >
      <Box p={8}>
        <CreateDropModal
          isOpen={isCreateDropModalOpen}
          modalType={dropType}
          onClose={handleCreateDropClose}
        />
        <AppModal />
        {isLoading ? (
          <Skeleton height="40px" mb="4" width="200px" />
        ) : (
          <Heading fontFamily={"mono"} color={"white"} textAlign={"center"}>
            Welcome{" "}
            {account?.display_name
              ? capitalizeFirstLetter(account.display_name)
              : "user"}
          </Heading>
        )}
        {isLoading ? (
          <Skeleton height="80px" mb="4" width="100%" />
        ) : (
          <TokensAvailableSection tokensAvailable={tokensAvailable} />
        )}
        <DropActionsSection
          setDropType={setDropType}
          onCreateDrop={() => {
            setIsCreateDropModalOpen(true);
          }}
        />
        <DataTable
          columns={eventTableColumns}
          data={data}
          excludeMobileColumns={[]}
          loading={isLoading}
          showColumns={true}
          showMobileTitles={["price", "numTickets"]}
          type="conference-drops"
        />
        <QRViewerModal
          isOpen={isOpen}
          onClose={onClose}
          qrCodeUrls={qrCodeUrls}
          onDownload={(url) => handleDownloadQrCode(url)}
          onDownloadAll={(urls) => handleDownloadAllQrCodes(urls)}
        />
      </Box>
    </Box>
  );
}

const TokensAvailableSection = ({ tokensAvailable }) => (
  <VStack align="left" paddingTop="4" spacing="6">
    <VStack align="left" w="50%">
      <Box
        bg="border.box"
        border="2px solid transparent"
        borderRadius="12"
        borderWidth="2px"
        p={4}
        w="100%"
      >
        <HStack align="center" spacing={4}>
          <Text
            color="brand.400"
            fontSize="lg"
            fontWeight="medium"
            fontFamily={"mono"}
          >
            Tokens Available
          </Text>
          <Heading fontWeight={"400"}>
            {formatTokensAvailable(tokensAvailable)}
          </Heading>
        </HStack>
      </Box>
    </VStack>
  </VStack>
);

const DropActionsSection = ({ onCreateDrop, setDropType }) => (
  <>
    <Show above="md">
      <HStack justify="space-between" p={4}>
        <Heading paddingBottom="0" paddingTop="4">
          All Drops
        </Heading>
        <Menu>
          <MenuButton as={Button} variant="primary" maxWidth={"max-content"}>
            Create Drop
          </MenuButton>
          <MenuList
            background={"black"}
            borderRadius={"md"}
            border={"1px solid var(--chakra-colors-brand-400)"}
            fontFamily={"mono"}
          >
            <MenuItem
              background="black"
              color="white"
              _hover={{
                background: "black",
                color: "brand.400",
              }}
              key="token"
              icon={<LinkIcon h="4" w="4" />}
              onClick={() => {
                setDropType("token");
                onCreateDrop();
              }}
            >
              Token Drop
            </MenuItem>
            <MenuItem
              background="black"
              color="white"
              _hover={{
                background: "black",
                color: "brand.400",
              }}
              key="nft"
              icon={<NFTIcon h="4" w="4" />}
              onClick={() => {
                setDropType("nft");
                onCreateDrop();
              }}
            >
              NFT Drop
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Show>
    <Hide above="md">
      <Heading paddingTop="20px" size="2xl" textAlign="left" w="full">
        All Drops
      </Heading>
    </Hide>
  </>
);
