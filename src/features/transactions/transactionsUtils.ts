import { RenNetwork } from "@renproject/interfaces";
import { BurnSession, GatewaySession } from "@renproject/ren-tx";
import { TFunction } from "i18next";
import queryString from "query-string";
import { useLocation } from "react-router-dom";
import {
  chainsClassMap,
  mintChainClassMap,
  releaseChainClassMap,
} from "../../services/rentx";
import {
  BridgeChain,
  BridgeCurrency,
  getChainConfig,
  getCurrencyConfig,
  getCurrencyConfigByRentxName,
} from "../../utils/assetConfigs";
import { toPercent } from "../../utils/converters";

export enum TxEntryStatus {
  PENDING = "pending",
  ACTION_REQUIRED = "action_required",
  COMPLETED = "completed",
  EXPIRED = "expired",
  NONE = "",
}

export enum TxPhase {
  LOCK = "lock",
  MINT = "mint",
  BURN = "burn",
  RELEASE = "release",
  NONE = "",
}

export type TxMeta = {
  status: TxEntryStatus;
  phase: TxPhase;
  createdTimestamp: number;
  transactionsCount: number;
};

export enum GatewayStatus {
  CURRENT = "current",
  PREVIOUS = "previous",
  EXPIRING = "expiring",
  EXPIRED = "expired",
  NONE = "",
}

export enum DepositPhase {
  LOCK = "lock",
  MINT = "mint",
  NONE = "",
}

export enum DepositEntryStatus {
  PENDING = "pending",
  ACTION_REQUIRED = "action_required",
  COMPLETING = "completing",
  COMPLETED = "completed",
  EXPIRED = "expired",
}

export type DepositMeta = {
  status: DepositEntryStatus;
  phase: DepositPhase;
};

export enum TxType {
  MINT = "mint",
  BURN = "burn",
}

export enum TxConfigurationStep {
  INITIAL = "initial",
  FEES = "fees",
}

export type TxConfigurationStepProps = {
  onPrev?: () => void;
  onNext?: () => void;
};

export type LocationTxState = {
  txState?: {
    newTx?: boolean;
    reloadTx?: boolean;
  };
};

export const useTxParam = () => {
  const location = useLocation();
  const tx = parseTxQueryString(location.search);
  const locationState = location.state as LocationTxState;

  return { tx, txState: locationState?.txState };
};

export const bufferReplacer = (name: any, val: any) => {
  if (val && val.type === "Buffer") {
    return "";
  }
  return val;
};

export const createTxQueryString = (
  tx: GatewaySession<any> | BurnSession<any, any>
) => {
  const { customParams, transactions, transaction, ...sanitized } = tx as any;

  // These were broken previously and should not be part of the tx object
  delete sanitized.meta;
  delete sanitized.created;
  delete sanitized.updated;

  const stringResult = queryString.stringify({
    ...sanitized,
    transaction: JSON.stringify(transaction, bufferReplacer),
    customParams: JSON.stringify(customParams),
    transactions: JSON.stringify(transactions, bufferReplacer),
  } as any);

  if (stringResult.includes("Object")) {
    throw new Error("Failed to serialize tx");
  }
  return stringResult;
};

const parseNumber = (value: any) => {
  if (typeof value === "undefined") {
    return undefined;
  }
  return Number(value);
};

export const isTxExpired = (tx: GatewaySession<any>) => {
  return Date.now() > tx.expiryTime;
};

export const cloneTx = (tx: any) => JSON.parse(JSON.stringify(tx)) as any;

type ParsedGatewaySession = GatewaySession<any> & {
  depositHash?: string;
};

export const parseTxQueryString: (
  query: string
) => Partial<ParsedGatewaySession> | null = (query: string) => {
  if (query.includes("Object")) {
    throw new Error("Malformed query string");
  }
  const parsed = queryString.parse(query);
  if (!parsed) {
    return null;
  }
  const {
    expiryTime,
    suggestedAmount,
    targetAmount,
    transactions,
    transaction,
    customParams,
    createdAt,
    ...rest
  } = parsed;

  const res: any = {
    ...rest,
    transactions: JSON.parse((transactions as string) || "{}"),
    transaction: JSON.parse((transaction as string) || "{}"),
    customParams: JSON.parse((customParams as string) || "{}"),
    expiryTime: parseNumber(expiryTime),
    createdAt: parseNumber(createdAt),
  };

  if (suggestedAmount) {
    res.suggestedAmount = parseNumber(suggestedAmount);
  }

  if (targetAmount) {
    res.targetAmount = parseNumber(targetAmount);
  }

  return res;
};

export const getMintAssetDecimals = (
  chain: BridgeChain,
  asset: string,
  provider: any,
  network: any
) => {
  if (!asset) {
    return 8;
  }
  const chainConfig = getChainConfig(chain);
  return mintChainClassMap[
    chainConfig.rentxName as keyof typeof mintChainClassMap
  ](provider, network).assetDecimals(asset.toUpperCase());
};

export const getReleaseAssetDecimals = (
  chain: BridgeChain,
  asset: string
): number => {
  if (!asset) {
    return 8;
  }
  const chainConfig = getChainConfig(chain);
  // @ts-expect-error
  return releaseChainClassMap[
    chainConfig.rentxName as keyof typeof releaseChainClassMap
  ]().assetDecimals(asset.toUpperCase());
};

const arbiscanUrl = "https://arbiscan.io";
const arbiscanTestnetUrl = "https://testnet.arbiscan.io";

const getArbiscanAddressExplorerUrl = (
  network: RenNetwork | "testnet" | "mainnet",
  address: string
) => {
  return `${
    network === "mainnet" ? arbiscanUrl : arbiscanTestnetUrl
  }/address/${address}`;
};

const getArbiscanChainExplorerUrl = (
  network: RenNetwork | "testnet" | "mainnet",
  txId: string
) => {
  return `${
    network === "mainnet" ? arbiscanUrl : arbiscanTestnetUrl
  }/tx/${txId}`;
};

export const getChainExplorerLink = (
  chain: BridgeChain,
  network: RenNetwork | "testnet" | "mainnet",
  txId: string
) => {
  if (!txId) {
    return "";
  }
  if (chain === BridgeChain.ARBITRUMC) {
    return getArbiscanChainExplorerUrl(network, txId);
  }
  const chainConfig = getChainConfig(chain);
  return (chainsClassMap as any)[
    chainConfig.rentxName
  ].utils.transactionExplorerLink(txId, network);
};

export const getAddressExplorerLink = (
  chain: BridgeChain,
  network: RenNetwork | "testnet" | "mainnet",
  address: string
) => {
  if (!address) {
    return "";
  }
  if (chain === BridgeChain.ARBITRUMC) {
    return getArbiscanAddressExplorerUrl(network, address);
  }
  const chainConfig = getChainConfig(chain);
  return (chainsClassMap as any)[
    chainConfig.rentxName
  ].utils.addressExplorerLink(address, network);
};

export const getRenExplorerLink = (
  network: RenNetwork | "testnet" | "mainnet",
  depositHash: string
) => {
  const networkSubdomain =
    network === "testnet" ? "explorer-testnet" : "explorer";
  const txPart =
    depositHash !== "" && depositHash !== "gateway"
      ? `#/tx/${depositHash}`
      : "";
  return '';
};

type GetFeeTooltipsArgs = {
  mintFee: number;
  releaseFee: number;
  sourceCurrency: BridgeCurrency;
  chain: BridgeChain;
};

export const getFeeTooltips = (
  { mintFee, releaseFee, sourceCurrency, chain }: GetFeeTooltipsArgs,
  t: TFunction
) => {
  const sourceCurrencyConfig = getCurrencyConfig(sourceCurrency);
  const sourceCurrencyChainConfig = getChainConfig(
    sourceCurrencyConfig.sourceChain
  );
  const renCurrencyChainConfig = getChainConfig(chain);
  const renNativeChainCurrencyConfig = getCurrencyConfig(
    renCurrencyChainConfig.nativeCurrency
  );
  return {
    renVmFee: t("fees.ren-fee-tooltip", {
      mintFee: toPercent(mintFee),
      releaseFee: toPercent(releaseFee),
    }),
    sourceChainMinerFee: t("fees.chain-miner-fee-tooltip", {
      chain: sourceCurrencyChainConfig.full,
      currency: sourceCurrencyConfig.short,
    }),
    renCurrencyChainFee: t("fees.ren-currency-chain-fee-tooltip", {
      chainFull: renCurrencyChainConfig.full,
      chainShort: renCurrencyChainConfig.short,
      chainNative: renNativeChainCurrencyConfig.short,
    }),
  };
};

export const getMintTxPageTitle = (tx: any) => {
  const asset = getCurrencyConfigByRentxName(tx.sourceAsset).short;
  const date = new Date(getTxCreationTimestamp(tx)).toISOString();
  return `Mint - ${asset} - ${date}`;
};

export const getReleaseTxPageTitle = (tx: any) => {
  const amount = tx.targetAmount;
  const asset = getCurrencyConfigByRentxName(tx.sourceAsset).short;
  return `Release - ${amount} ${asset}`;
};

export const getTxCreationTimestamp = (
  tx: GatewaySession<any> | BurnSession<any, any>
) => {
  if (tx.createdAt) {
    return tx.createdAt;
  } else if ((tx as GatewaySession<any>).expiryTime) {
    return (tx as GatewaySession<any>).expiryTime - 24 * 3600 * 1000 * 3;
  }
  return Date.now();
};

export const getPaymentLink = (chain: BridgeChain, address: string) => {
  const chainConfig = getChainConfig(chain);
  if (chain === BridgeChain.ZECC) {
    return `zcash:${address}`;
  }
  return `${chainConfig.rentxName}://${address}`;
};

export const isMinimalAmount = (
  amount: number,
  receiving: number,
  type: TxType
) => {
  if (type === TxType.BURN) {
    return receiving > 0;
  }
  return receiving / amount >= 0.5;
};
