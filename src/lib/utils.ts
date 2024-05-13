import { PriceFeed, type PriceInfo } from '@weft-finance/toolkit';
import { fetch_entity_state } from './fetch_state';
import { gatewayApi } from './radix-gateway-api';

export function format_number(
    input: number,
    notation: 'standard' | 'scientific' | 'engineering' | 'compact' | undefined = undefined,
    default_value = ''
) {
    if (input === undefined) return default_value;

    return Number(input.toFixed(10)).toLocaleString('en', {
        notation: notation,
        compactDisplay: 'short'
    });
}

async function get_prices(log: any) {
    let prices: Record<string, PriceInfo> = {}

    // Get prices from internal price feed
    const priceFeed = new PriceFeed(INTERNAL_PRICE_FEED_COMPONENT);
    await priceFeed.load();
    prices = Object.assign(prices, priceFeed.prices);

    const astro_prices_res = await fetch('https://api.astrolescent.com/partner/R96v1uADor/prices')
    const astro_prices = await astro_prices_res.json()

    const dfp_pu_price_info = await get_pool_price_info(astro_prices, 'pool_rdx1c56ws8tmvw2ggk8hpfq4uvn9vthhv4g2cqs4htj3tc6r9w835te3fs');
    const oci_pu_price_info = await get_pool_price_info(astro_prices, 'pool_rdx1ck5w5vnm6qwrmcp4way3wtyjztk7armjea3xc5xaktlk9r4gq6s3ee');

    prices = Object.assign(prices, { ...dfp_pu_price_info, ...oci_pu_price_info })

    log('prices', prices);
    return prices;
}

export async function get_pool_price_info(astro_prices: any, pool_address: string) {
    const pool_state = await fetch_entity_state(pool_address, gatewayApi.state.innerClient);

    let pool_value = 0;

    let pooled_assets: any = {}

    Object.keys(pool_state!.$fungible_resources).forEach((key) => {
        pooled_assets[key] = parseFloat(pool_state!.$fungible_resources[key]);
        pool_value += parseFloat(pool_state!.$fungible_resources[key]) * astro_prices[key]['tokenPriceXRD'];
    });

    const pu_res_address = pool_state!.$details.state.pool_unit_resource_address;

    const pu_supply = parseFloat((await fetch_entity_state(pu_res_address, gatewayApi.state.innerClient))!['$details']['total_supply']);

    return { price: pool_value / pu_supply, pool_value, pooled_assets, }
}