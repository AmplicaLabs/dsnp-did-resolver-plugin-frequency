import { options } from "@frequency-chain/api-augment";
import { WsProvider, ApiPromise } from "@polkadot/api";

// Environment Variables
const providerUri = process.env.FREQUENCY_NODE;
const frequencyNetwork = process.env.FREQUENCY_NETWORK;

if (!providerUri) {
  throw new Error("FREQUENCY_NODE env variable is required");
}

if (
  !frequencyNetwork ||
  !["local", "testnet", "mainnet"].includes(frequencyNetwork)
) {
  throw new Error(
    'FREQUENCY_NETWORK env variable must be one of: "local", "testnet", "mainnet"',
  );
}

export const getNetwork = () =>
  frequencyNetwork as "local" | "testnet" | "mainnet";

// Reset
export const disconnectApi = async () => {
  if (_singletonApi === null) return;

  const api = await getApi();
  await api.disconnect();
  _singletonApi = null;
  return;
};

let _singletonApi: null | Promise<ApiPromise> = null;

export const getApi = (): Promise<ApiPromise> => {
  if (_singletonApi !== null) {
    return _singletonApi;
  }

  if (!providerUri) {
    throw new Error("FREQUENCY_NODE env variable is required");
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
