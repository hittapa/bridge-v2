import {
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@material-ui/core";
import { Solana } from "@renproject/chains-solana";
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import {
  ActionButton,
  MultipleActionButtonWrapper,
} from "../../../components/buttons/Buttons";
import { NumberFormatText } from "../../../components/formatting/NumberFormatText";
import { BackArrowIcon } from "../../../components/icons/RenIcons";
import { CheckboxWrapper } from "../../../components/inputs/InputHelpers";
import {
  PaperActions,
  PaperContent,
  PaperHeader,
  PaperNav,
  PaperTitle,
} from "../../../components/layout/Paper";
import { CenteredProgress } from "../../../components/progress/ProgressHelpers";
import { TooltipWithIcon } from "../../../components/tooltips/TooltipWithIcon";
import {
  AssetInfo,
  LabelWithValue,
  MiddleEllipsisText,
  SmallSpacedDivider,
  SpacedDivider,
} from "../../../components/typography/TypographyHelpers";
import { Debug } from "../../../components/utils/Debug";
import { paths } from "../../../pages/routes";
import {
  BridgeChain,
  getChainConfig,
  getCurrencyConfig,
  toMintedCurrency,
} from "../../../utils/assetConfigs";
import { useFetchFees } from "../../fees/feesHooks";
import { getTransactionFees } from "../../fees/feesUtils";
import { $exchangeRates } from "../../marketData/marketDataSlice";
import { findExchangeRate } from "../../marketData/marketDataUtils";
import { $renNetwork } from "../../network/networkSlice";
import { TransactionFees } from "../../transactions/components/TransactionFees";
import { setCurrentTxId } from "../../transactions/transactionsSlice";
import {
  createTxQueryString,
  getReleaseAssetDecimals,
  LocationTxState,
  TxConfigurationStepProps,
  TxType,
} from "../../transactions/transactionsUtils";
import { useShakePaper } from "../../ui/uiHooks";
import { useSelectedChainWallet } from "../../wallet/walletHooks";
import { $wallet, setWalletPickerOpened } from "../../wallet/walletSlice";
import { SolanaTokenAccountModal } from "../components/SolanaAccountChecker";
import { $mint } from "../mintSlice";
import {
  createMintTransaction,
  preValidateMintTransaction,
} from "../mintUtils";

export const MintFeesStep: FunctionComponent<TxConfigurationStepProps> = ({
  onPrev,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const history = useHistory();
  const { walletConnected, account, provider } = useSelectedChainWallet();
  const [mintingInitialized, setMintingInitialized] = useState(false);
  const { currency } = useSelector($mint);
  const [amountValue, setAmountValue] = useState("");
  const { chain } = useSelector($wallet);
  const network = useSelector($renNetwork);
  const exchangeRates = useSelector($exchangeRates);
  const currencyUsdRate = findExchangeRate(exchangeRates, currency);
  const handleAmountChange = useCallback((event) => {
    const newValue = event.target.value.replace(",", ".");
    if (!isNaN(newValue)) {
      setAmountValue(newValue);
    }
  }, []);

  const lockCurrencyConfig = getCurrencyConfig(currency);
  const decimals = getReleaseAssetDecimals(
    lockCurrencyConfig.sourceChain,
    currency
  );
  const amount = Number(amountValue);
  const hasAmount = amount !== 0;
  const amountUsd = amount * currencyUsdRate;
  const { fees, pending } = useFetchFees(currency, TxType.MINT);
  const { conversionTotal } = getTransactionFees({
    amount,
    fees,
    type: TxType.MINT,
    decimals,
  });
  const conversionFormatted = conversionTotal;

  const targetCurrencyAmountUsd = conversionFormatted * currencyUsdRate;
  const destinationChainConfig = getChainConfig(chain);
  const destinationChainNativeCurrencyConfig = getCurrencyConfig(
    destinationChainConfig.nativeCurrency
  );
  const mintedCurrency = toMintedCurrency(currency);
  const mintedCurrencyConfig = getCurrencyConfig(mintedCurrency);
  const { MainIcon } = mintedCurrencyConfig;

  const [ackChecked, setAckChecked] = useState(false);
  const [touched, setTouched] = useState(false);
  const showAckError = !ackChecked && touched;
  const handleAckCheckboxChange = useCallback((event) => {
    setTouched(true);
    setAckChecked(event.target.checked);
  }, []);
  useShakePaper(showAckError);

  const tx = useMemo(
    () =>
      createMintTransaction({
        currency: currency,
        destAddress: account,
        mintedCurrency: toMintedCurrency(currency),
        mintedCurrencyChain: chain,
        userAddress: account,
        network: network,
      }),
    [currency, account, chain, network]
  );
  const txValid = preValidateMintTransaction(tx);
  const canInitializeMinting = ackChecked && txValid;

  const [showSolanaModal, setShowSolanaModal] = useState(false);
  const [checkingSolana, setCheckingSolana] = useState(false);
  const [hasSolanaTokenAccount, setSolanaTokenAccount] = useState<any>();

  const onSolanaAccountCreated = useCallback(
    (a) => {
      setSolanaTokenAccount(a);
    },
    [setSolanaTokenAccount]
  );

  // FIXME: we might want to extract the solana logic in a nicer manner
  useEffect(() => {
    if (chain === BridgeChain.SOLC && canInitializeMinting) {
      if (hasSolanaTokenAccount) {
        setMintingInitialized(true);
        return;
      }
      if (hasSolanaTokenAccount === false && !showSolanaModal) {
        setShowSolanaModal(true);
        setMintingInitialized(false);
      }
    }
  }, [
    canInitializeMinting,
    checkingSolana,
    showSolanaModal,
    chain,
    hasSolanaTokenAccount,
    setMintingInitialized,
    setShowSolanaModal,
  ]);

  const handleConfirm = useCallback(async () => {
    if (walletConnected) {
      setTouched(true);
      if (canInitializeMinting) {
        if (chain === BridgeChain.SOLC) {
          setCheckingSolana(true);
          if (!hasSolanaTokenAccount) {
            setSolanaTokenAccount(
              await new Solana(provider, network).getAssociatedTokenAccount(
                currency
              )
            );
          }
          setCheckingSolana(false);
        } else {
          setMintingInitialized(true);
        }
      } else {
        setMintingInitialized(false);
      }
    } else {
      setTouched(false);
      setMintingInitialized(false);
      // dispatch(setWalletPickerOpened(true));
    }
  }, [
    dispatch,
    chain,
    walletConnected,
    canInitializeMinting,
    network,
    provider,
    currency,
    hasSolanaTokenAccount,
    setSolanaTokenAccount,
    setMintingInitialized,
  ]);

  const onMintTxCreated = useCallback(
    async (tx) => {
      history.push({
        pathname: paths.MINT_TRANSACTION,
        search: "?" + createTxQueryString(tx),
        state: {
          txState: { newTx: true },
        } as LocationTxState,
      });
      dispatch(setCurrentTxId(tx.id));
    },
    [dispatch, history]
  );

  // there is a dependency loop, because we depend on the number
  // of txes to determine the dayIndex, which updates when we create
  // a new tx, leading to multiple txes being created for the same
  // parameters.
  // This flag prevents that
  const [creatingMintTx, setCreatingMintTx] = useState(false);

  useEffect(() => {
    if (mintingInitialized && !creatingMintTx) {
      setCreatingMintTx(true);
      onMintTxCreated(tx).catch(console.error).finally();
    }
  }, [onMintTxCreated, mintingInitialized, tx, creatingMintTx]);

  return (
    <>
      {showSolanaModal && (
        <SolanaTokenAccountModal
          currency={currency}
          provider={provider}
          network={network}
          onCreated={onSolanaAccountCreated}
        />
      )}
      <PaperHeader>
        <PaperNav>
          <IconButton onClick={onPrev}>
            <BackArrowIcon />
          </IconButton>
        </PaperNav>
        <PaperTitle>{t("mint.fees-title")}</PaperTitle>
        <PaperActions />
      </PaperHeader>
      <PaperContent bottomPadding>
        <Grid container alignItems="flex-end">
          <Grid item xs={7}>
            <Typography variant="body1" gutterBottom>
              {t("fees.calculator-label")}
            </Typography>
          </Grid>
          <Grid item xs={5}>
            <TextField
              label={t("fees.calculator-amount-label")}
              variant="filled"
              color="primary"
              value={amountValue || ""}
              onChange={handleAmountChange}
            />
          </Grid>
        </Grid>
        <SmallSpacedDivider />
        <Typography variant="body1" gutterBottom>
          {t("mint.details-label")}
        </Typography>
        <LabelWithValue
          label={t("mint.sending-label")}
          labelTooltip={t("mint.sending-tooltip")}
          value={
            hasAmount ? (
              <NumberFormatText value={amount} spacedSuffix={currency} />
            ) : (
              currency
            )
          }
          valueEquivalent={
            hasAmount ? (
              <NumberFormatText
                value={amountUsd}
                spacedSuffix="USD"
                decimalScale={2}
                fixedDecimalScale
              />
            ) : (
              ""
            )
          }
        />
        <LabelWithValue
          label={t("mint.to-label")}
          labelTooltip={t("mint.to-tooltip")}
          value={destinationChainConfig.full}
        />
        <LabelWithValue
          label={t("mint.recipient-address-label")}
          labelTooltip={t("mint.recipient-address-tooltip")}
          value={
            <MiddleEllipsisText hoverable>{tx.userAddress}</MiddleEllipsisText>
          }
        />
        <SpacedDivider />
        <Typography variant="body1" gutterBottom>
          {t("fees.label")}
        </Typography>
        <TransactionFees
          chain={chain}
          amount={amount}
          currency={currency}
          type={TxType.MINT}
        />
      </PaperContent>
      <Debug it={{ amount, hasAmount, mintingInitialized }} />
      <Divider />
      <PaperContent darker topPadding bottomPadding>
        {walletConnected &&
          (pending ? (
            <CenteredProgress />
          ) : (
            <div>
              <AssetInfo
                label={t("mint.receiving-label")}
                value={
                  <NumberFormatText
                    value={conversionFormatted}
                    spacedSuffix={mintedCurrencyConfig.short}
                  />
                }
                valueEquivalent={
                  <NumberFormatText
                    prefix=" = $"
                    value={targetCurrencyAmountUsd}
                    spacedSuffix="USD"
                    decimalScale={2}
                    fixedDecimalScale
                  />
                }
                Icon={<MainIcon fontSize="inherit" />}
              />
            </div>
          ))}
        <CheckboxWrapper>
          <FormControl error={showAckError}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={ackChecked}
                  onChange={handleAckCheckboxChange}
                  name="ack"
                  color="primary"
                />
              }
              label={
                <FormLabel htmlFor="ack" component={Typography}>
                  <Typography
                    variant="caption"
                    color={showAckError ? "inherit" : "textPrimary"}
                  >
                    {t("mint.fees-ack-message", {
                      currency: destinationChainNativeCurrencyConfig.short,
                    })}
                    <TooltipWithIcon
                      title={
                        <>
                          {t("mint.fees-ack-tooltip", {
                            chain: destinationChainConfig.full,
                            currency:
                              destinationChainNativeCurrencyConfig.short,
                          })}
                        </>
                      }
                    />
                  </Typography>
                </FormLabel>
              }
            />
          </FormControl>
        </CheckboxWrapper>
        <MultipleActionButtonWrapper>
          <ActionButton
            onClick={handleConfirm}
            disabled={
              (walletConnected ? !ackChecked || mintingInitialized : false) ||
              checkingSolana ||
              hasSolanaTokenAccount === false
            }
          >
            {!walletConnected
              ? t("wallet.connect")
              : t("mint.view-gateway-button-label", {
                  currency: lockCurrencyConfig.short,
                })}
          </ActionButton>
        </MultipleActionButtonWrapper>
      </PaperContent>
      <Debug it={{ tx }} />
    </>
  );
};
