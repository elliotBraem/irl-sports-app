import { VStack } from "@chakra-ui/react";

import { LatestAlert } from "@/components/alerts/latest-alert";
import { PageHeading } from "@/components/ui/page-heading";
import { WalletActions } from "@/components/wallet/wallet-actions";
import { useAccountData } from "@/hooks/useAccountData";
import { useEventCredentials } from "@/stores/event-credentials";
import eventHelperInstance from "@/lib/event";

const formatUserName = (name: string) => {
  if (name.length > 10) {
    const tryFirstName = name.split(" ")[0];
    if (tryFirstName.length > 13) {
      return tryFirstName.slice(0, 10).trimEnd() + "...";
    }
    return tryFirstName;
  }
  return name;
};

export default function Me() {
  const { userData } = useEventCredentials();
  const { data, isLoading, isError, error } = useAccountData();

  const displayName = isLoading || isError ? "------" : data?.displayAccountId;

  if (isError) {
    eventHelperInstance.debugLog(
      `Error loading account data: ${error}`,
      "error",
    );
  }

  return (
    <VStack spacing={4} pt={4}>
      <PageHeading
        title={`Welcome ${formatUserName(userData.name)}`}
        titleSize="24px"
        description={`Username: @${displayName}`}
      />
      <WalletActions />
      <LatestAlert />
    </VStack>
  );
}
