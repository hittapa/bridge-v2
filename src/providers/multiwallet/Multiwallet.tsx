import { RenNetwork } from "@renproject/interfaces";
import { BinanceSmartChainInjectedConnector } from "@renproject/multiwallet-binancesmartchain-injected-connector";
import { EthereumInjectedConnector } from "@renproject/multiwallet-ethereum-injected-connector";
import { EthereumMEWConnectConnector } from "@renproject/multiwallet-ethereum-mewconnect-connector";
import { SolanaConnector } from "@renproject/multiwallet-solana-connector";
import { EthereumWalletConnectConnector } from "@renproject/multiwallet-ethereum-walletconnect-connector";
import { MultiwalletProvider as RenMultiwalletProvider } from "@renproject/multiwallet-ui";
import React, { FunctionComponent } from "react";
import {
  BinanceMetamaskConnectorInfo,
  FantomMetamaskConnectorInfo,
  PolygonMetamaskConnectorInfo,
  AvalancheMetamaskConnectorInfo,
  ArbitrumMetamaskConnectorInfo,
} from "../../features/wallet/components/WalletHelpers";
import { env } from "../../constants/environmentVariables";
import { featureFlags } from "../../constants/featureFlags";
import { RenChain } from "../../utils/assetConfigs";

const networkMapping: Record<number, RenNetwork[]> = {
  1: [RenNetwork.Mainnet],
  42: [RenNetwork.Testnet, RenNetwork.TestnetVDot3],
};

export const renNetworkToEthNetwork = (id: RenNetwork): number | undefined => {
  const entry = Object.entries(networkMapping).find(([_, x]) => x.includes(id));
  if (!entry) return entry;
  return parseInt(entry[0]);
};

export const ethNetworkToRenNetwork = (id: string | number): RenNetwork => {
  return {
    "1": RenNetwork.Mainnet,
    "42": RenNetwork.Testnet,
  }[parseInt(id as string).toString() as "1" | "42"];
};

export const fantomNetworkToRenNetwork = (id: string | number): RenNetwork => {
  return {
    "250": RenNetwork.Mainnet,
    "4002": RenNetwork.Testnet,
  }[parseInt(id as string).toString() as "250" | "4002"];
};
export const polygonNetworkToRenNetwork = (id: string | number): RenNetwork => {
  return {
    "137": RenNetwork.Mainnet,
    "80001": RenNetwork.Testnet,
  }[parseInt(id as string).toString() as "137" | "80001"];
};
export const avalancheNetworkToRenNetwork = (
  id: string | number
): RenNetwork => {
  return {
    "43114": RenNetwork.Mainnet,
    "43113": RenNetwork.Testnet,
  }[parseInt(id as string).toString() as "43114" | "43113"];
};
export const arbitrumNetworkToRenNetwork = (
  id: string | number
): RenNetwork => {
  return {
    "42161": RenNetwork.Mainnet,
    "421611": RenNetwork.Testnet,
  }[parseInt(id as string).toString() as "42161" | "421611"];
};

export const walletPickerModalConfig = (network: RenNetwork) => {
  const targetEthChainId = renNetworkToEthNetwork(network) || 1;
  return {
    chains: {
      [RenChain.ethereum]: [
        {
          name: "Metamask",
          logo: "https://avatars1.githubusercontent.com/u/11744586?s=60&v=4s",
          connector: new EthereumInjectedConnector({
            debug: env.DEV,
            networkIdMapper: ethNetworkToRenNetwork,
          }),
        },
        ...(featureFlags.enableMEWConnect
          ? [
              {
                name: "MEW",
                logo:
                  "https://avatars1.githubusercontent.com/u/24321658?s=60&v=4s",
                connector: new EthereumMEWConnectConnector({
                  debug: env.DEV,
                  rpc: {
                    42: `wss://kovan.infura.io/ws/v3/${env.INFURA_ID}`,
                    1: `wss://mainnet.infura.io/ws/v3/${env.INFURA_ID}`,
                  },
                  chainId: targetEthChainId,
                }),
              },
            ]
          : []),
        ...(featureFlags.enableWalletConnect
          ? [
              {
                name: "WalletConnect",
                logo:
                  "https://avatars0.githubusercontent.com/u/37784886?s=60&v=4",
                connector: new EthereumWalletConnectConnector({
                  rpc: {
                    42: `https://kovan.infura.io/v3/${env.INFURA_ID}`,
                    1: `wss://mainnet.infura.io/ws/v3/${env.INFURA_ID}`,
                  },
                  qrcode: true,
                  debug: true,
                }),
              },
            ]
          : []),
      ],
      [RenChain.fantom]: [
        {
          name: "Metamask",
          logo: "https://avatars2.githubusercontent.com/u/45615063?s=60&v=4",
          info: FantomMetamaskConnectorInfo,
          connector: (() => {
            const connector = new EthereumInjectedConnector({
              networkIdMapper: fantomNetworkToRenNetwork,
              debug: true,
            });
            connector.getProvider = () => (window as any).ethereum;
            return connector;
          })(),
        },
      ],
      [RenChain.polygon]: [
        {
          name: "Metamask",
          logo: "https://avatars2.githubusercontent.com/u/45615063?s=60&v=4",
          info: PolygonMetamaskConnectorInfo,
          connector: (() => {
            const connector = new EthereumInjectedConnector({
              networkIdMapper: polygonNetworkToRenNetwork,
              debug: true,
            });
            connector.getProvider = () => (window as any).ethereum;
            return connector;
          })(),
        },
      ],
      [RenChain.avalanche]: [
        {
          name: "Metamask",
          logo: "https://avatars2.githubusercontent.com/u/45615063?s=60&v=4",
          info: AvalancheMetamaskConnectorInfo,
          connector: (() => {
            const connector = new EthereumInjectedConnector({
              networkIdMapper: avalancheNetworkToRenNetwork,
              debug: true,
            });
            connector.getProvider = () => (window as any).ethereum;
            return connector;
          })(),
        },
      ],
      [RenChain.binanceSmartChain]: [
        {
          name: "BinanceSmartWallet",
          logo: "https://avatars2.githubusercontent.com/u/45615063?s=60&v=4",
          connector: new BinanceSmartChainInjectedConnector({ debug: true }),
        },
        // TODO: move this config into its own connector?

        ...(featureFlags.enableBSCMetamask
          ? [
              {
                name: "Metamask",
                logo:
                  "https://avatars2.githubusercontent.com/u/45615063?s=60&v=4",
                info: BinanceMetamaskConnectorInfo,
                connector: (() => {
                  const connector = new BinanceSmartChainInjectedConnector({
                    debug: true,
                  });
                  connector.getProvider = () => (window as any).ethereum;
                  return connector;
                })(),
              },
            ]
          : []),
      ],
      [RenChain.solana]: [
        {
          name: "Phantom",
          logo: "https://avatars1.githubusercontent.com/u/78782331?s=60&v=4",
          connector: new SolanaConnector({
            debug: true,
            providerURL: (window as any).solana || "https://www.phantom.app",
            clusterURL:
              network === RenNetwork.Mainnet
                ? "https://hoku.rpcpool.com/"
                : undefined,
            network,
          }),
        },
        {
          name: "Sollet.io",
          logo: "https://avatars1.githubusercontent.com/u/69240779?s=60&v=4",
          connector: new SolanaConnector({
            providerURL: "https://www.sollet.io",
            clusterURL:
              network === RenNetwork.Mainnet
                ? "https://hoku.rpcpool.com/"
                : undefined,
            network,
          }),
        },
      ],
      [RenChain.arbitrum]: [
        {
          name: "Metamask",
          logo: "https://avatars2.githubusercontent.com/u/45615063?s=60&v=4",
          info: ArbitrumMetamaskConnectorInfo,
          connector: (() => {
            const connector = new EthereumInjectedConnector({
              networkIdMapper: arbitrumNetworkToRenNetwork,
              debug: true,
            });
            connector.getProvider = () => (window as any).ethereum;
            return connector;
          })(),
        },
      ],
    },
  };
};

export const MultiwalletProvider: FunctionComponent = ({ children }) => {
  return <RenMultiwalletProvider>{children}</RenMultiwalletProvider>;
};
