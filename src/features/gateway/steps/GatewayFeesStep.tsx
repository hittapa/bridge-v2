import {
  Box,
  ButtonProps,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  Typography,
} from "@material-ui/core";
import {
  ChainTransactionStatus,
  ContractChain,
  TxSubmitter,
  TxWaiter,
} from "@renproject/utils";
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import {
  ActionButton,
  MultipleActionButtonWrapper,
} from "../../../components/buttons/Buttons";
import { NumberFormatText } from "../../../components/formatting/NumberFormatText";
import { BackArrowIcon } from "../../../components/icons/RenIcons";
import { OutlinedTextField } from "../../../components/inputs/OutlinedTextField";
import {
  HorizontalPadder,
  MediumTopWrapper,
  SmallHorizontalUnpadder,
} from "../../../components/layout/LayoutHelpers";
import {
  PaperActions,
  PaperContent,
  PaperHeader,
  PaperNav,
  PaperTitle,
} from "../../../components/layout/Paper";
import { TooltipWithIcon } from "../../../components/tooltips/TooltipWithIcon";
import {
  AssetInfo,
  SimpleAssetInfo,
} from "../../../components/typography/TypographyHelpers";
import { Debug } from "../../../components/utils/Debug";
import { paths } from "../../../pages/routes";
import { feesDecimalImpact } from "../../../utils/numbers";
import { getAssetConfig, getRenAssetName } from "../../../utils/assetsConfig";
import {
  alterContractChainProviderSigner,
  PartialChainInstanceMap,
} from "../../chain/chainUtils";
import { useCurrentNetworkChains } from "../../network/networkHooks";
import { AddressInfo } from "../../transactions/components/TransactionsHistoryHelpers";
import { useWallet } from "../../wallet/walletHooks";
import { AddressLabel } from "../components/AddressHelpers";
import { BalanceInfo } from "../components/BalanceHelpers";
import { GatewayFees } from "../components/GatewayFees";
import {
  useContractChainAssetBalance,
  useGateway,
  useGatewayFeesWithRates,
  useGatewayMeta,
} from "../gatewayHooks";
import { $gateway } from "../gatewaySlice";
import {
  createGatewayQueryString,
  getGatewayExpiryTime,
  getGatewayNonce,
} from "../gatewayUtils";
import { GatewayStepProps } from "./stepUtils";

export const GatewayFeesStep: FunctionComponent<GatewayStepProps> = ({
  onPrev,
}) => {
  const { t } = useTranslation();
  const history = useHistory();

  const { asset, from, to, amount, toAddress } = useSelector($gateway);
  const { Icon, RenIcon, shortName } = getAssetConfig(asset);
  const renAsset = getRenAssetName(asset);

  const [activeAmount, setActiveAmount] = useState(amount);
  const handleAmountChange = useCallback((event) => {
    const newValue = event.target.value.replace(",", ".");
    if (!isNaN(newValue)) {
      setActiveAmount(newValue);
    }
  }, []);

  const { isMint, isRelease, isFromContractChain, isH2H } = useGatewayMeta(
    asset,
    from,
    to
  );
  const activeChain = isFromContractChain ? from : to;
  const { connected, provider, account } = useWallet(activeChain);

  //why gateway is initialized without amount?
  console.log("amount", activeAmount, activeChain);
  const allChains = useCurrentNetworkChains();
  const [chains, setChains] = useState<PartialChainInstanceMap | null>(null);
  useEffect(() => {
    if (provider) {
      alterContractChainProviderSigner(allChains, activeChain, provider, true);
      setChains(allChains);
    }
  }, [allChains, activeChain, provider]);

  const { gateway } = useGateway(
    {
      asset,
      from,
      to,
      amount: activeAmount,
      toAddress,
    },
    { chains }
  );
  const fees = useGatewayFeesWithRates(gateway, activeAmount);

  const activeChainInstance = isFromContractChain
    ? (gateway?.fromChain as ContractChain)
    : (gateway?.toChain as ContractChain);
  const { balance } = useContractChainAssetBalance(
    activeChainInstance,
    asset,
    account
  );

  const { outputAmount, outputAmountUsd, fromChainFeeAsset, toChainFeeAsset } =
    fees;
  console.log("gateway", gateway);

  const [ackChecked, setAckChecked] = useState(false);
  const handleAckChange = useCallback(() => {
    setAckChecked(!ackChecked);
  }, [ackChecked]);
  const showAck = Boolean(fromChainFeeAsset && toChainFeeAsset);
  const feeAssets = isH2H
    ? [fromChainFeeAsset, toChainFeeAsset]
    : isMint
    ? [toChainFeeAsset]
    : [fromChainFeeAsset];

  const nextEnabled = ackChecked;

  const handleProceed = useCallback(() => {
    if (isMint && isH2H) {
      console.log("h2h mint");
      history.push({
        pathname: paths.MINT__GATEWAY_H2H,
        search:
          "?" +
          createGatewayQueryString({
            asset,
            from,
            to,
            amount,
          }),
      });
    } else if (isMint) {
      console.log("standard mint");
      history.push({
        pathname: paths.MINT__GATEWAY_STANDARD,
        search:
          "?" +
          createGatewayQueryString(
            {
              asset,
              from,
              to,
              nonce: getGatewayNonce(),
            },
            { expiryTime: getGatewayExpiryTime() }
          ),
      });
    } else if (isRelease && isH2H) {
      console.log("h2h release");
      history.push({
        pathname: paths.RELEASE__GATEWAY_H2H,
        search:
          "?" +
          createGatewayQueryString({
            asset,
            from,
            to,
            amount,
          }),
      });
    } else {
      console.log("standard release");
      history.push({
        pathname: paths.RELEASE__GATEWAY_STANDARD,
        search:
          "?" +
          createGatewayQueryString({
            asset,
            from,
            to,
            amount,
            toAddress,
          }),
      });
    }
  }, [
    history,
    isH2H,
    isMint,
    isRelease,
    asset,
    from,
    to,
    toAddress,
    amount,
    // gateway,
  ]);

  const showBalance = isFromContractChain;

  const AssetIcon = isMint ? RenIcon : Icon;
  const assetLabel = isMint ? renAsset : asset;
  const Header = (
    <PaperHeader>
      <PaperNav>
        <IconButton onClick={onPrev}>
          <BackArrowIcon />
        </IconButton>
      </PaperNav>
      <PaperTitle>{t("mint.fees-title")}</PaperTitle>
      <PaperActions />
    </PaperHeader>
  );
  if (!connected) {
    return (
      <>
        {Header}
        <PaperContent bottomPadding>
          <span>Please connect a wallet to proceed</span>
        </PaperContent>
      </>
    );
  }

  return (
    <>
      {Header}
      <PaperContent bottomPadding>
        {showBalance && <BalanceInfo balance={balance} asset={renAsset} />}
        {isMint && (
          <OutlinedTextField
            value={activeAmount}
            onChange={handleAmountChange}
            label="How much will you send?"
            InputProps={{ endAdornment: shortName }}
          />
        )}
        {isRelease && (
          <SimpleAssetInfo
            label={t("release.releasing-label")}
            value={amount}
            asset={renAsset}
          />
        )}
        <MediumTopWrapper>
          <AssetInfo
            label={t("common.receiving-label")}
            value={
              <NumberFormatText
                value={outputAmount}
                spacedSuffix={assetLabel}
                decimalScale={feesDecimalImpact(amount)}
              />
            }
            valueEquivalent={
              outputAmountUsd !== null ? (
                <NumberFormatText
                  prefix=" = $"
                  value={outputAmountUsd}
                  spacedSuffix="USD"
                  decimalScale={2}
                  fixedDecimalScale
                />
              ) : null
            }
            Icon={<AssetIcon fontSize="inherit" />}
          />
        </MediumTopWrapper>
      </PaperContent>
      <Divider />
      <PaperContent topPadding bottomPadding>
        <Typography variant="body2" paragraph>
          Details
        </Typography>
        <GatewayFees {...fees} asset={asset} from={from} to={to} />
        <Box mt={2} mb={5}>
          {isRelease && !isH2H && (
            <SmallHorizontalUnpadder>
              <AddressInfo
                label="Recipient Address"
                address={toAddress}
                addressUrl={gateway?.toChain.addressExplorerLink(toAddress)}
              />
            </SmallHorizontalUnpadder>
          )}
        </Box>
        <HorizontalPadder>
          {showAck && (
            <FormControlLabel
              checked={ackChecked}
              onChange={handleAckChange}
              control={<Checkbox name="ack" color="primary" />}
              label={
                <>
                  <span>
                    {t("fees.tokens-ack-label", {
                      tokens: feeAssets.join(" & "),
                    })}{" "}
                  </span>
                  <TooltipWithIcon
                    title={
                      <span>
                        {feeAssets.length > 1
                          ? t("fees.native-assets-ack-plural-tooltip", {
                              assets: feeAssets.join(" & "),
                            })
                          : t("fees.native-assets-ack-singular-tooltip", {
                              asset: feeAssets[0],
                            })}
                        <span>
                          {" "}
                          {t("fees.native-assets-ack-supplement-tooltip")}
                        </span>
                      </span>
                    }
                  />
                </>
              }
            />
          )}
        </HorizontalPadder>
        <MultipleActionButtonWrapper>
          <ActionButton disabled={!nextEnabled} onClick={handleProceed}>
            {t("common.next-label")}
          </ActionButton>
        </MultipleActionButtonWrapper>
      </PaperContent>
      <Debug it={{ fees, isH2H, isMint, isRelease }} />
    </>
  );
};

type TransactionActionButton = ButtonProps & {
  tx: TxSubmitter | TxWaiter;
  onDone: () => void;
  target?: number;
  autoSubmit?: boolean;
};

export const TxApprovalButton: FunctionComponent<TransactionActionButton> = ({
  tx,
  onDone,
  target,
  autoSubmit,
  disabled,
  ...rest
}) => {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(autoSubmit ? true : false);
  const [waiting, setWaiting] = useState(false);
  const [errorSubmitting, setErrorSubmitting] = useState<Error>();
  const [errorWaiting, setErrorWaiting] = useState<Error>();

  const [confirmations, setConfirmations] = useState<number>();

  const wait = useCallback(async () => {
    setErrorSubmitting(undefined);
    setErrorWaiting(undefined);

    try {
      setWaiting(true);
      await tx.wait(target).on("progress", (status) => {
        setConfirmations(status.confirmations);
      });
      onDone();
    } catch (error: any) {
      console.error(error);
      setErrorWaiting(error);
    }
    setWaiting(false);
  }, [tx, onDone, target]);

  const submit = useCallback(async () => {
    setErrorSubmitting(undefined);
    setErrorWaiting(undefined);

    if (tx.submit && tx.progress.status === ChainTransactionStatus.Ready) {
      try {
        setSubmitting(true);
        await tx.submit({
          txConfig: {
            // gasLimit: 500000,
          },
        });
        wait().catch(console.error);
      } catch (error: any) {
        console.error(error);
        setErrorSubmitting(error);
      }
      setSubmitting(false);
    }
  }, [tx, wait]);

  const isDisabled = disabled || waiting || submitting;

  return (
    <>
      <ActionButton disabled={isDisabled} onClick={submit} {...rest}>
        {waiting || submitting
          ? t("gateway.approving-assets-contracts-label")
          : t("gateway.approve-assets-contracts-label")}
      </ActionButton>
      <Debug
        it={{
          waiting,
          submitting,
          errorSubmitting,
          errorWaiting,
          confirmations,
        }}
      />
    </>
  );
};
