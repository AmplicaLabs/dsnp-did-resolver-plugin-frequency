import { options } from "@frequency-chain/api-augment";
import { WsProvider, ApiPromise } from "@polkadot/api";

// Environment Variables
let providerUri: string | null = null;
let frequencyNetwork: string | null = null;

export function init(options: {
  providerUri: string;
  frequencyNetwork: string;
}) {
  providerUri = options.providerUri;

  if (!providerUri) {
    throw new Error("providerUri is required");
  }

  frequencyNetwork = options.frequencyNetwork;
  if (
    !frequencyNetwork ||
    !["local", "testnet", "mainnet"].includes(frequencyNetwork)
  ) {
    throw new Error(
      'frequencyNetwork must be one of: "local", "testnet", "mainnet"',
    );
  }
}

export const getNetwork = () => {
  if (!frequencyNetwork) {
    throw new Error("please call init() first");
  }
  return frequencyNetwork as "local" | "testnet" | "mainnet";
};

// Reset
export const disconnectApi = async () => {
  if (_singletonApi === null) return;
  const api = await getApi();
  await api.disconnect();
  _singletonApi = null;
};

let _singletonApi: null | Promise<ApiPromise> = null;

export const getApi = (): Promise<ApiPromise> => {
  if (_singletonApi !== null) {
    return _singletonApi;
  }

  if (!providerUri) {
    throw new Error("please call init() first");
  }

  const provider = new WsProvider(providerUri);
  _singletonApi = ApiPromise.create({
    provider,
    throwOnConnect: true,
    ...options,
  });

  return _singletonApi;
};

export enum ChainType {
  Local,
  Testnet,
  Mainnet,
}

export const getChainType = (): ChainType => {
  switch (getNetwork()) {
    case "local":
      return ChainType.Local;
    case "testnet":
      return ChainType.Testnet;
    case "mainnet":
      return ChainType.Mainnet;
  }
};
