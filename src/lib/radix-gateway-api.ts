import { GatewayApiClient } from "@radixdlt/babylon-gateway-api-sdk";

export const gatewayApi = GatewayApiClient.initialize({
  basePath: 'https://mainnet.radixdlt.com',
  applicationName: "CDP Indexer"
})