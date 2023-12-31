import { GatewayApiClient } from "@radixdlt/babylon-gateway-api-sdk";

export const gatewayApi = GatewayApiClient.initialize({
  basePath: process.env.GATEWAY_API_URL ?? 'https://mainnet.radixdlt.com',
  applicationName: "CDP Indexer"
})