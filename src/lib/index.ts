// place files you want to import through the `$lib` alias in this folder.

import {
    GatewayApiClient
} from '@radixdlt/babylon-gateway-api-sdk';

import { fetch_entity_state } from './fetch_state';

const gatewayApi = GatewayApiClient.initialize({
    basePath: 'https://mainnet.radixdlt.com',
    applicationName: "",
})

export async function get_lp_details() {
    let lpResourceState = await fetch_entity_state('resource_rdx1th5slwxk8x8xs7438ek6kp7kvrz5lxuu823tql4dqvd92q2fzxr3aq', gatewayApi.state.innerClient, { useDecimals: false });
    return lpResourceState;
}

export async function get_validator_details() {
    let validatorState = await fetch_entity_state('validator_rdx1sd6n65sx0thvfzfp6x0jp4qgwxtudpx575wpwqespdlva2wldul9xk', gatewayApi.state.innerClient, { useDecimals: false });
    return validatorState
}

export async function get_pool_details() {
    let poolDetails = await fetch_entity_state('pool_rdx1ck5w5vnm6qwrmcp4way3wtyjztk7armjea3xc5xaktlk9r4gq6s3ee', gatewayApi.state.innerClient, { useDecimals: false });
    return poolDetails
}

export async function get_dapp_definition_details() {
    let poolDetails = await fetch_entity_state('account_rdx168r05zkmtvruvqfm4rfmgnpvhw8a47h6ln7vl3rgmyrlzmfvdlfgcg', gatewayApi.state.innerClient, { useDecimals: false });
    return poolDetails
}