import {
  Box,
  Chip,
  Fade,
  Tooltip,
  Typography,
  useTheme,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import { RenNetwork } from "@renproject/interfaces";
import { GatewaySession, OpenedGatewaySession } from "@renproject/ren-tx";
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
  ActionButtonWrapper,
  SmallActionButton,
} from "../../components/buttons/Buttons";
import { AssetDropdown } from "../../components/dropdowns/AssetDropdown";
import { BlockIcon } from "../../components/icons/RenIcons";
import {
  BigTopWrapper,
  BigWrapper,
  CenteringSpacedBox,
  Hide,
  MediumWrapper,
} from "../../components/layout/LayoutHelpers";
import { Link } from "../../components/links/Links";
import {
  SimplePagination,
  SimplestPagination,
} from "../../components/pagination/SimplePagination";
import { PulseIndicator } from "../../components/progress/ProgressHelpers";
import {
  TransactionsHeader,
  TransactionsPaginationWrapper,
} from "../../components/transactions/TransactionsGrid";
import { Debug } from "../../components/utils/Debug";
import { WalletConnectionProgress } from "../wallet/components/WalletHelpers";
import { featureFlags } from "../../constants/featureFlags";
import { paths } from "../../pages/routes";
import {
  BridgeChain,
  BridgeCurrency,
  getChainConfig,
  supportedLockCurrencies,
  supportedMintDestinationChains,
  toMintedCurrency,
} from "../../utils/assetConfigs";
import { getFormattedDateTime, getFormattedHMS } from "../../utils/dates";
import {
  CircledProgressWithContent,
  getDepositStatusIcon,
} from "../mint/components/MultipleDepositsHelpers";
import {
  useDepositPagination,
  useIntervalCountdown,
  useMintMachine,
} from "../mint/mintHooks";
import { $mint, setMintCurrency } from "../mint/mintSlice";
import {
  areAllDepositsCompleted,
  createMintTransaction,
  GATEWAY_EXPIRY_OFFSET_MS,
  getDepositParams,
  getLockAndMintBasicParams,
  getRemainingGatewayTime,
} from "../mint/mintUtils";
import { $renNetwork } from "../network/networkSlice";
import { useSelectedChainWallet } from "../wallet/walletHooks";
import {
  $wallet,
  setChain,
  setWalletPickerOpened,
} from "../wallet/walletSlice";
import {
  ErrorChip,
  SuccessChip,
  WideDialog,
  WarningChip,
  WarningLabel,
} from "./components/TransactionHistoryHelpers";
import {
  $currentSession,
  $txHistoryOpened,
  setTxHistoryOpened,
} from "./transactionsSlice";
import {
  createTxQueryString,
  DepositEntryStatus,
  DepositPhase,
  GatewayStatus,
} from "./transactionsUtils";

export const MintTransactionHistory: FunctionComponent = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { chain } = useSelector($wallet);
  const { walletConnected, account } = useSelectedChainWallet();
  const { currency } = useSelector($mint);
  const network = useSelector($renNetwork);
  const opened = useSelector($txHistoryOpened);
  const { txId: activeTxId } = useSelector($currentSession);
  const [page, setPage] = useState(0);

  const [pending, setPending] = useState(false);
  useEffect(() => {
    setPending(true);
    setTimeout(() => {
      setPending(false);
    }, 1000);
  }, [currency, chain, page]);

  const chainConfig = getChainConfig(chain);

  const handleCurrencyChange = useCallback(
    (event) => {
      setPage(0);
      dispatch(setMintCurrency(event.target.value));
    },
    [dispatch]
  );
  const handleChainChange = useCallback(
    (event) => {
      setPage(0);
      dispatch(setChain(event.target.value));
    },
    [dispatch]
  );

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleWalletPickerOpen = useCallback(() => {
    // dispatch(setWalletPickerOpened(true));
  }, [dispatch]);

  const handleTxHistoryClose = useCallback(() => {
    dispatch(setTxHistoryOpened(false));
  }, [dispatch]);

  const rowsPerPage = 3;
  const startDay = rowsPerPage * page;
  return (
    <WideDialog
      open={opened}
      onEscapeKeyDown={handleTxHistoryClose}
      onBackdropClick={handleTxHistoryClose}
    >
      <TransactionsHeader title={t("history.header")}>
        <AssetDropdown
          condensed
          assetLabel={t("common.asset-label")}
          available={supportedLockCurrencies}
          value={currency}
          onChange={handleCurrencyChange}
        />
        <Box mx={2}>{t("history.header-separator")}</Box>
        <AssetDropdown
          mode="chain"
          blockchainLabel={t("common.blockchain-label")}
          condensed
          available={supportedMintDestinationChains}
          value={chain}
          onChange={handleChainChange}
        />
      </TransactionsHeader>
      {!walletConnected && (
        <BigTopWrapper>
          {!walletConnected && (
            <>
              <MediumWrapper>
                <Typography variant="body1" align="center">
                  {t("history.please-connect-wallet", {
                    chain: chainConfig.full,
                  })}
                </Typography>
              </MediumWrapper>
              <BigWrapper>
                <MediumWrapper>
                  <CenteringSpacedBox>
                    <WalletConnectionProgress />
                  </CenteringSpacedBox>
                </MediumWrapper>
                <ActionButtonWrapper>
                  <ActionButton onClick={handleWalletPickerOpen}>
                    {t("wallet.connect")}
                  </ActionButton>
                </ActionButtonWrapper>
              </BigWrapper>
            </>
          )}
        </BigTopWrapper>
      )}
      {walletConnected && (
        <>
          {[0, 1, 2].map((offset) => (
            <GatewayEntryResolver
              key={startDay + offset}
              dayOffset={startDay + offset}
              currency={currency}
              chain={chain}
              account={account}
              network={network}
              activeTxId={activeTxId}
              pending={pending}
            />
          ))}
          <Debug it={{ activeTxId }} />
          <Hide when={!featureFlags.enableTxHistoryExploration}>
            <TransactionsPaginationWrapper>
              <SimplePagination
                count={rowsPerPage * 2}
                rowsPerPage={rowsPerPage}
                page={page}
                onChangePage={handleChangePage}
              />
            </TransactionsPaginationWrapper>
          </Hide>
        </>
      )}
    </WideDialog>
  );
};

type GatewayResolverProps = {
  dayOffset: number;
  currency: BridgeCurrency;
  chain: BridgeChain;
  account: string;
  network: RenNetwork;
  pending: boolean;
  activeTxId: string;
};

const GatewayEntryResolver: FunctionComponent<GatewayResolverProps> = ({
  dayOffset,
  currency,
  chain,
  network,
  account,
  pending,
  activeTxId,
}) => {
  const tx = useMemo(
    () =>
      createMintTransaction({
        currency: currency,
        destAddress: account,
        mintedCurrency: toMintedCurrency(currency),
        mintedCurrencyChain: chain,
        userAddress: account,
        network: network,
        dayOffset: dayOffset,
      }),
    [currency, account, chain, network, dayOffset]
  );

  const isActive = activeTxId === tx.id;
  if (isActive) {
    return <GatewayEntry tx={tx} isActive />;
  }
  if (pending) {
    return <GatewayEntry tx={tx} pending />;
  }
  return <GatewayEntryMachine tx={tx} />;
};

export type GatewayEntryProps = {
  tx: GatewaySession<any>;
  service?: any;
  pending?: boolean;
  isActive?: boolean;
  onContinue?: ((depositHash?: string) => void) | (() => void);
};

export const GatewayEntryMachine: FunctionComponent<GatewayEntryProps> = ({
  tx,
}) => {
  const [current, , service] = useMintMachine(tx);
  useEffect(
    () => () => {
      service.stop();
    },
    [service]
  );
  return <GatewayEntry service={service} tx={current.context.tx} />;
};

const standardPaddings = {
  paddingLeft: 40,
  paddingRight: 50,
};

const standardShadow = `0px 0px 4px rgba(0, 27, 58, 0.1)`;

export const useGatewayEntryStyles = makeStyles((theme) => ({
  root: {
    background: theme.palette.common.white,
    borderTop: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    marginTop: 8,
    boxShadow: standardShadow,
  },
  gateway: {
    ...standardPaddings,
    paddingTop: 8,
    paddingBottom: 8,
    display: "flex",
    justifyContent: "stretch",
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  gatewayInfo: {
    flexGrow: 2,
  },
  gatewayLabel: {},
  gatewayAddress: {
    paddingTop: 1,
  },
  gatewayLink: {
    marginLeft: 8,
  },
  gatewayCounter: {
    minWidth: 180,
    display: "flex",
    justifyContent: "flex-end",
  },
  multiple: {
    ...standardPaddings,
    height: 32,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  multipleLabel: {
    marginRight: 16,
  },
  multiplePagination: {},
  deposit: {
    paddingLeft: standardPaddings.paddingLeft,
    paddingTop: 6,
    paddingBottom: 6,
    minHeight: 64,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  details: {
    width: 360,
    display: "flex",
    alignItems: "center",
  },
  detailsTitleAndDate: {
    flexGrow: 2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailsTitle: {
    fontSize: 14,
  },
  detailsDate: {
    fontSize: 12,
  },
  links: {},
  link: {
    fontSize: 12,
    display: "inline-block",
    marginRight: 16,
    "&:last-child": {
      marginRight: 0,
    },
  },
  statusAndActions: {
    display: "flex",
    flexGrow: 2,
  },
  status: {
    display: "flex",
    alignItems: "center",
  },
  indicator: {
    width: 40,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    flexGrow: 1,
    paddingRight: 10,
  },
}));

const GatewayEntry: FunctionComponent<GatewayEntryProps> = ({
  tx,
  isActive,
  service,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useGatewayEntryStyles();
  const dispatch = useDispatch();
  const history = useHistory();

  const [resolving, setResolving] = useState(true);

  const {
    handleNext,
    handlePrev,
    currentIndex,
    currentHash,
    total,
  } = useDepositPagination(tx);

  const {
    lockChainConfig,
    lockCurrencyConfig,
    mintCurrencyConfig,
    mintChainConfig,
    depositsCount,
    gatewayStatus,
  } = getLockAndMintBasicParams(tx);

  const deposit = tx.transactions[currentHash];
  const depositTime = getFormattedDateTime(Number(deposit?.detectedAt));
  const {
    lockConfirmations,
    lockTargetConfirmations,
    lockTxLink,
    lockTxAmount,
    mintTxLink,
    depositStatus,
    depositPhase,
  } = getDepositParams(tx, deposit);
  const hasDeposits = depositsCount > 0;

  const StatusIcon = getDepositStatusIcon({
    depositStatus,
    depositPhase,
    mintChainConfig,
    lockChainConfig,
  });

  const handlePageChange = useCallback(
    (event: any, newPage: number) => {
      newPage > currentIndex ? handleNext() : handlePrev();
    },
    [currentIndex, handleNext, handlePrev]
  );

  const handleContinue = useCallback(() => {
    const qsTx = { ...tx, depositHash: currentHash };
    history.push({
      pathname: paths.MINT_TRANSACTION,
      search: "?" + createTxQueryString(qsTx),
      state: {
        txState: {
          reloadTx: true,
        },
      },
    });
    dispatch(setTxHistoryOpened(false));
  }, [dispatch, history, tx, currentHash]);

  const timeToGatewayExpiration = useIntervalCountdown(
    getRemainingGatewayTime(tx.expiryTime)
  );

  const [timer, setTimer] = useState<NodeJS.Timeout>();
  const gatewayAddress = (tx as OpenedGatewaySession<any>).gatewayAddress;
  useEffect(() => {
    if (gatewayAddress) {
      if (hasDeposits) {
        //
        //service?.stop();
        if (timer) {
          clearTimeout(timer);
        }
        setResolving(false);
      } else {
        if (!timer) {
          setTimer(
            setTimeout(() => {
              service?.stop();
              setResolving(false);
            }, 25000)
          );
        }
      }
    }
  }, [service, gatewayAddress, timer, hasDeposits]);

  const allCompleted = areAllDepositsCompleted(tx);
  const completed =
    depositStatus === DepositEntryStatus.COMPLETED ||
    depositStatus === DepositEntryStatus.COMPLETING;
  const confirmationProps = completed
    ? {}
    : {
        confirmations: lockConfirmations,
        targetConfirmations: lockTargetConfirmations,
      };
  return (
    <>
      <div className={styles.root}>
        <div className={styles.gateway}>
          <div className={styles.gatewayInfo}>
            <div className={styles.gatewayAddress}>
              {(tx as OpenedGatewaySession<any>).gatewayAddress ? (
                <GatewayAddress
                  address={(tx as OpenedGatewaySession<any>).gatewayAddress}
                  status={gatewayStatus}
                  onClick={handleContinue}
                />
              ) : (
                <Skeleton width={270} />
              )}
            </div>
          </div>
          <div className={styles.gatewayCounter}>
            {(gatewayStatus === GatewayStatus.CURRENT ||
              (hasDeposits && !allCompleted)) && (
              <Fade in={true}>
                <GatewayStatusChip
                  status={gatewayStatus}
                  timeToGatewayExpiration={timeToGatewayExpiration}
                />
              </Fade>
            )}
          </div>
        </div>
        {depositsCount > 1 && (
          <div className={styles.multiple}>
            <WarningLabel className={styles.multipleLabel}>
              Multiple Transactions
            </WarningLabel>
            <SimplestPagination
              className={styles.multiplePagination}
              count={total}
              rowsPerPage={1}
              page={currentIndex}
              onChangePage={handlePageChange}
            />
          </div>
        )}
        <div className={styles.deposit}>
          <div className={styles.details}>
            <div className={styles.detailsTitleAndDate}>
              {hasDeposits && (
                <>
                  <Typography className={styles.detailsTitle} component="div">
                    {t("history.mint-entry-label", {
                      amount: lockTxAmount,
                      currency: mintCurrencyConfig.short,
                      chain: mintChainConfig.full,
                    })}
                    <div className={styles.links}>
                      {Boolean(lockTxLink) && (
                        <Link
                          href={lockTxLink}
                          external
                          color="primary"
                          underline="hover"
                          className={styles.link}
                        >
                          {lockChainConfig.full} {t("common.transaction")}
                        </Link>
                      )}
                      {Boolean(mintTxLink) && (
                        <Link
                          href={mintTxLink}
                          external
                          color="primary"
                          underline="hover"
                          className={styles.link}
                        >
                          {mintChainConfig.full} {t("common.transaction")}
                        </Link>
                      )}
                    </div>
                  </Typography>
                  {Boolean(deposit) && Boolean(deposit?.detectedAt) && (
                    <Typography
                      color="textSecondary"
                      component="span"
                      variant="inherit"
                      className={styles.detailsDate}
                    >
                      <Tooltip
                        title={`${depositTime.date} ${depositTime.time} `}
                        placement="top"
                      >
                        <span>{depositTime.date}</span>
                      </Tooltip>
                    </Typography>
                  )}
                </>
              )}
              {!hasDeposits && (
                <>
                  {resolving ? (
                    <Skeleton width={200} />
                  ) : (
                    <Typography className={styles.detailsTitle}>
                      {t("history.no-deposits-message")}
                    </Typography>
                  )}
                </>
              )}
            </div>
          </div>
          <div className={styles.statusAndActions}>
            <div className={styles.actions}>
              {isActive && (
                <Typography color="primary" variant="caption">
                  Close window to view
                </Typography>
              )}
              {!isActive && hasDeposits && (
                <>
                  {depositStatus === DepositEntryStatus.ACTION_REQUIRED && (
                    <SmallActionButton onClick={handleContinue}>
                      {t("history.action-required-label")}
                    </SmallActionButton>
                  )}
                  {depositStatus === DepositEntryStatus.PENDING &&
                    lockConfirmations < lockTargetConfirmations && (
                      <Typography color="textPrimary" variant="caption">
                        {t("history.mint-entry-confirmations", {
                          confirmations: lockConfirmations,
                          targetConfirmations: lockTargetConfirmations,
                        })}
                      </Typography>
                    )}
                </>
              )}
            </div>
            <div className={styles.status}>
              {resolving && (
                <Skeleton variant="circle" width={42} height={42} />
              )}
              {!resolving && hasDeposits && (
                <CircledProgressWithContent
                  color={
                    completed
                      ? theme.customColors.blue
                      : lockCurrencyConfig.color
                  }
                  {...confirmationProps}
                  processing={depositPhase === DepositPhase.NONE}
                  size={34}
                >
                  <StatusIcon />
                </CircledProgressWithContent>
              )}
            </div>
            <div className={styles.indicator}>
              {hasDeposits &&
                depositStatus === DepositEntryStatus.ACTION_REQUIRED && (
                  <PulseIndicator pulsing size={12} />
                )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

type GatewayStatusChipProps = {
  status: GatewayStatus;
  timeToGatewayExpiration?: number;
};

export const GatewayStatusChip: FunctionComponent<GatewayStatusChipProps> = ({
  status,
  timeToGatewayExpiration = 0,
}) => {
  const { t } = useTranslation();
  const label = t("history.time-remaining-label") + ": ";
  switch (status) {
    case GatewayStatus.CURRENT:
      return (
        <SuccessChip
          label={
            <span>
              {label}
              <strong>
                {getFormattedHMS(
                  timeToGatewayExpiration + GATEWAY_EXPIRY_OFFSET_MS
                )}
              </strong>
            </span>
          }
        />
      );
    case GatewayStatus.PREVIOUS:
      return (
        <WarningChip
          label={
            <span>
              {label}
              <strong>
                {getFormattedHMS(
                  timeToGatewayExpiration + GATEWAY_EXPIRY_OFFSET_MS
                )}
              </strong>
            </span>
          }
        />
      );
    case GatewayStatus.EXPIRING:
      return (
        <ErrorChip
          label={
            <span>
              {label}
              <strong>
                {getFormattedHMS(
                  timeToGatewayExpiration + GATEWAY_EXPIRY_OFFSET_MS
                )}
              </strong>
            </span>
          }
        />
      );
    case GatewayStatus.EXPIRED:
      return <Chip label={t("history.gateway-expired-label")} />;
    default:
      return null;
  }
};

type GatewayAddressProps = {
  status: GatewayStatus;
  address: string;
  onClick: () => void;
};

const useGatewayAddressStyles = makeStyles(() => ({
  icon: {
    marginBottom: -1,
  },
  disabled: {
    userSelect: "none",
  },
}));
export const GatewayAddress: FunctionComponent<GatewayAddressProps> = ({
  status,
  onClick,
  address,
}) => {
  const styles = useGatewayAddressStyles();
  if (status === GatewayStatus.CURRENT) {
    return (
      <Typography variant="caption">
        <Link color="primary" underline="hover" onClick={onClick}>
          {address}
        </Link>
      </Typography>
    );
  }
  return (
    <Typography
      className={styles.disabled}
      color="textSecondary"
      variant="caption"
    >
      <BlockIcon className={styles.icon} fontSize="inherit" /> {address}
    </Typography>
  );
};
