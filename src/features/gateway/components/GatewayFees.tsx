import { Box } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { Asset, Chain } from "@renproject/chains";
import { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import { NumberFormatText } from "../../../components/formatting/NumberFormatText";
import { Link } from "../../../components/links/Links";
import { InlineSkeleton } from "../../../components/progress/ProgressHelpers";
import { LabelWithValue } from "../../../components/typography/TypographyHelpers";
import { getChainConfig } from "../../../utils/chainsConfig";
import { assetsConfig, getAssetConfig } from "../../../utils/tokensConfig";
import { useGatewayFeesWithRates, useGatewayMeta } from "../gatewayHooks";

type GatewayFeesProps = ReturnType<typeof useGatewayFeesWithRates> & {
  asset: Asset;
  from: Chain;
  to: Chain;
  needsApproval?: boolean;
  approvalTxUrl?: string;
  approved?: boolean;
};

export const GatewayFees: FunctionComponent<GatewayFeesProps> = ({
  asset,
  from,
  to,
  renVMFeeAmount,
  renVMFeeAmountUsd,
  renVMFeePercent,
  fromChainFeeAmount,
  fromChainFeeAsset,
  variableFeePercent,
  fromChainFeeAmountUsd,
  toChainFeeAmount,
  toChainFeeAsset,
  toChainFeeAmountUsd,
  needsApproval = false,
  approvalTxUrl,
  approved = false,
}) => {
  const { isMint, isH2H, isRelease } = useGatewayMeta(asset, from, to);
  const { t } = useTranslation();
  const assetConfig = getAssetConfig(asset);
  const fromChainConfig = getChainConfig(from);
  const toChainConfig = getChainConfig(to);

  let fromChainFeeLabel = "",
    toChainFeeLabel = "";

  if (fromChainFeeAsset && toChainFeeAsset) {
    if (isH2H) {
      fromChainFeeLabel = t("fees.contract-chain-fee-label", {
        chain: fromChainConfig.fullName,
      });
      toChainFeeLabel = t("fees.contract-chain-fee-label", {
        chain: toChainConfig.fullName,
      });
    } else if (isMint) {
      fromChainFeeLabel = t("fees.deposit-chain-miner-fee-label", {
        chain: fromChainConfig.fullName,
      });
      toChainFeeLabel = t("fees.contract-chain-fee-label", {
        chain: toChainConfig.fullName,
      });
    } else if (isRelease) {
      fromChainFeeLabel = t("fees.contract-chain-fee-label", {
        chain: fromChainConfig.fullName,
      });
      toChainFeeLabel = t("fees.deposit-chain-miner-fee-label", {
        chain: toChainConfig.fullName,
      });
    }
  }

  return (
    <>
      {renVMFeePercent !== null || renVMFeeAmount ? (
        <LabelWithValue
          label={t("fees.ren-fee-label")}
          value={
            renVMFeeAmount ? (
              <NumberFormatText
                value={renVMFeeAmount}
                spacedSuffix={assetConfig.shortName}
                decimalScale={8}
              />
            ) : renVMFeePercent !== null ? (
              <span>{renVMFeePercent}%</span>
            ) : (
              <InlineSkeleton width={100} height={17} />
            )
          }
          valueEquivalent={
            renVMFeeAmountUsd !== null ? (
              <NumberFormatText
                value={renVMFeeAmountUsd}
                prefix="$"
                decimalScale={2}
                fixedDecimalScale
              />
            ) : (
              ""
            )
          }
        />
      ) : (
        <FeeSkeleton />
      )}
      {Boolean(fromChainFeeLabel) ? (
        <LabelWithValue
          label={fromChainFeeLabel}
          value={
            fromChainFeeAmount !== null && fromChainFeeAsset !== null ? (
              <NumberFormatText
                value={fromChainFeeAmount}
                spacedSuffix={assetsConfig[fromChainFeeAsset].shortName}
              />
            ) : (
              <InlineSkeleton width={120} height={17} />
            )
          }
          valueEquivalent={
            fromChainFeeAmountUsd !== null ? (
              <NumberFormatText
                value={fromChainFeeAmountUsd}
                prefix="$"
                decimalScale={2}
                fixedDecimalScale
              />
            ) : (
              ""
            )
          }
        />
      ) : (
        <FeeSkeleton />
      )}
      {Boolean(toChainFeeLabel) ? (
        <LabelWithValue
          label={toChainFeeLabel}
          value={
            toChainFeeAmount !== null && toChainFeeAsset !== null ? (
              <NumberFormatText
                value={toChainFeeAmount}
                spacedSuffix={assetsConfig[toChainFeeAsset].shortName}
              />
            ) : (
              <InlineSkeleton width={110} height={17} />
            )
          }
          valueEquivalent={
            toChainFeeAmountUsd !== null ? (
              <NumberFormatText
                value={toChainFeeAmountUsd}
                prefix="$"
                decimalScale={2}
                fixedDecimalScale
              />
            ) : (
              ""
            )
          }
        />
      ) : (
        <FeeSkeleton />
      )}
      {needsApproval && (
        <LabelWithValue
          label={t("fees.assets-contracts-label")}
          value={
            approved ? (
              <Link href={approvalTxUrl} color="primary" external>
                {t("fees.assets-contracts-approved")}
              </Link>
            ) : (
              t("fees.assets-contracts-need-approval")
            )
          }
        />
      )}
    </>
  );
};

const FeeSkeleton: FunctionComponent = () => (
  <Box mb={1}>
    <Skeleton width="100%" height={17} />
  </Box>
);
