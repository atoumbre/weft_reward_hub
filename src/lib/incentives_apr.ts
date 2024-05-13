import { GatewayApiClient, StateApi } from "@radixdlt/babylon-gateway-api-sdk";
import Decimal from "decimal.js";

Decimal.set({ precision: 50, rounding: Decimal.ROUND_DOWN })
const dec = (input: any) => new Decimal(input)

const astroPriceApi = 'https://api.astrolescent.com/partner/R96v1uADor/prices';

const WEFT = 'resource_rdx1tk3fxrz75ghllrqhyq8e574rkf4lsq2x5a0vegxwlh3defv225cth3';

const XRD = 'resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd';
const XUSDC = 'resource_rdx1t4upr78guuapv5ept7d7ptekk9mqhy605zgms33mcszen8l9fac8vf';

const XRD_DU = 'resource_rdx1th2hexq3yrz8sj0nn3033gajnj7ztl0erp4nn9mcl5rj9au75tum0u';
const XUSDC_DU = 'resource_rdx1tk7kstht8turpzcagqyd4qmzc0gshmm6h0m5cw0rzr8q52t99yxrfn';

const OCI_POOL = 'pool_rdx1ck5w5vnm6qwrmcp4way3wtyjztk7armjea3xc5xaktlk9r4gq6s3ee';

const DFP_POOL = 'pool_rdx1c56ws8tmvw2ggk8hpfq4uvn9vthhv4g2cqs4htj3tc6r9w835te3fs';

const WEFT_VALIDATOR = 'validator_rdx1sd6n65sx0thvfzfp6x0jp4qgwxtudpx575wpwqespdlva2wldul9xk';

const XRD_LENDING_POOL = 'component_rdx1cq8mm5z49x6lyet44a0jd7zq52flrmykwwxszq65uzfn6pk3mvm0k4';
const XUSDC_LENDING_POOL = 'component_rdx1cq7qd9vnmmu5sjlnarye09rwep2fhnq9ghj6eafj6tj08y7358z5pu';

const LENDING_MARKET = 'component_rdx1cpuzsp2aqkjzg504s8h8hxg57wnaqpcp9r802jjcly5x3j5nape40l';

const STAKING_POOL = 'component_rdx1cqzle2pft0y09kwzaxy07maczpwmka9xknl88glwc4ka6a7xavsltd'

const stakerHourlyDistribution = 1137;
const lpHourlyDistribution = 2400;
const lendingHourlyDistribution = 1400;
const borrowingHourlyDistribution = 700;
const weftStakingHourlyDistribution = 905.7971;

const gatewayApi = GatewayApiClient.initialize({
    basePath: 'https://mainnet.radixdlt.com',
    applicationName: "CDP Indexer"
});

export async function getAprs() {
    let totalStakedXRD = 0;
    let totalStakedWEFT = 0;

    let astroPrices: any;
    let dfpPuPriceInfo: any;
    let ociPuPriceInfo: any;

    let xusdcPoolDetails = { liquidity: 0, loans: 0, unitRatio: 0, duAmount: 0, collateral: 0, lending: 0 };
    let xrdPoolDetails = { liquidity: 0, loans: 0, unitRatio: 0, duAmount: 0, collateral: 0, lending: 0 };

    // let stakingPoolDtails = { }

    await Promise.all([
        getEntityDetails(WEFT_VALIDATOR).then((res) => {
            totalStakedXRD = res!['$fungible_vaults']['internal_vault_rdx1tq3w690mzr34ws2n6svg40yjzym5lgl099fy4980mm20syl2mly77l'];
        }),

        getEntityDetails(STAKING_POOL).then((res) => {
            totalStakedWEFT = res!['$fungible_resources'][WEFT];
        }),

        fetch(astroPriceApi)
            .then((res) => res.json())
            .then((json) => {
                astroPrices = json;
            }),

        getEntityDetails(XRD_LENDING_POOL).then((res) => {
            xrdPoolDetails.liquidity = res!['$fungible_resources'][XRD];
            xrdPoolDetails.loans = res!['external_liquidity_amount'];
            xrdPoolDetails.unitRatio = res!['unit_to_asset_ratio'];
        }),

        getEntityDetails(XUSDC_LENDING_POOL).then((res) => {
            xusdcPoolDetails.liquidity = res!['$fungible_resources'][XUSDC];
            xusdcPoolDetails.loans = res!['external_liquidity_amount'];
            xusdcPoolDetails.unitRatio = res!['unit_to_asset_ratio'];
        }),

        getEntityDetails(LENDING_MARKET).then((res) => {
            xrdPoolDetails.duAmount = res!['$fungible_resources'][XRD_DU];
            xusdcPoolDetails.duAmount = res!['$fungible_resources'][XUSDC_DU];
        })

    ]);

    await Promise.all([
        getPoolPriceInfo(astroPrices, DFP_POOL).then((res) => {
            dfpPuPriceInfo = res;
        }),
        getPoolPriceInfo(astroPrices, OCI_POOL).then((res) => {
            ociPuPriceInfo = res;
        })
    ]);

    // WEFT Price

    const weftPriceXrd = astroPrices[WEFT]['tokenPriceXRD'];

    // XRD Staking APR

    const xrdStakerApr = (stakerHourlyDistribution * weftPriceXrd * 24 * 365 * 100) / totalStakedXRD;

    // WEFT Staking APR

    const weftStakingApr = weftStakingHourlyDistribution * 24 * 365 * 100 / totalStakedWEFT;

    // LP APR

    const ociTvlInXrd = ociPuPriceInfo.poolValue;

    const dfpTvlInXrd = dfpPuPriceInfo.poolValue;

    const lpApr = (lpHourlyDistribution * weftPriceXrd * 24 * 365 * 100) / (ociTvlInXrd + dfpTvlInXrd);

    // Lending and Borrowing APR

    xrdPoolDetails.collateral = xrdPoolDetails.duAmount / xrdPoolDetails.unitRatio;
    xrdPoolDetails.lending = xrdPoolDetails.liquidity + xrdPoolDetails.loans - xrdPoolDetails.collateral;

    xusdcPoolDetails.collateral = xusdcPoolDetails.duAmount / xusdcPoolDetails.unitRatio;
    xusdcPoolDetails.lending = xusdcPoolDetails.liquidity + xusdcPoolDetails.loans - xusdcPoolDetails.collateral;

    let totalXusdcLendInXrd = xusdcPoolDetails.lending * astroPrices[XUSDC]['tokenPriceXRD'];
    let lendingApr = (lendingHourlyDistribution * weftPriceXrd * 24 * 365 * 100) / totalXusdcLendInXrd;

    let totalBorrowInXrd = (xrdPoolDetails.loans + xusdcPoolDetails.loans * astroPrices[XUSDC]['tokenPriceXRD']) * astroPrices[XRD]['tokenPriceXRD'];
    let borrowingApr = (borrowingHourlyDistribution * weftPriceXrd * 24 * 365 * 100) / totalBorrowInXrd;


    // Return Data

    let returnedData = {
        weftPrice: weftPriceXrd,
        xrdStaking: {
            stakerApr: xrdStakerApr + 5.9,
            totalStaked: totalStakedXRD,
        },
        weftStaking: {
            stakerApr: weftStakingApr,
            totalStaked: totalStakedWEFT
        },
        lp: {
            ociTvlInXrd,
            dfpTvlInXrd,
            lpApr
        },
        lending: {
            lendingApr,
            totalXusdcLendInXrd,
        },
        borrowing: {
            borrowingApr,
            totalBorrowInXrd
        }

    };

    console.log(returnedData);

    return returnedData;
}

/// HELPER FUNCTIONS ///

async function getPoolPriceInfo(astroPrices: any, poolAddress: any) {
    const poolState = await fetch_entity_state(poolAddress, gatewayApi.state.innerClient);

    let poolValue = 0;

    let pooledAssets: any = {};

    Object.keys(poolState!.$fungible_resources).forEach((key) => {
        pooledAssets[key] = parseFloat(poolState!.$fungible_resources[key]);
        poolValue += parseFloat(poolState!.$fungible_resources[key]) * astroPrices[key]['tokenPriceXRD'];
    });

    const puResAddress = poolState!.$details.state.pool_unit_resource_address;

    const puSupply = parseFloat((await fetch_entity_state(puResAddress, gatewayApi.state.innerClient))!['$details']['total_supply']);

    return { price: poolValue / puSupply, poolValue, pooledAssets };
}

async function getEntityDetails(address: string) {
    let lpResourceState = await fetch_entity_state(address, gatewayApi.state.innerClient, { useDecimals: false });
    return lpResourceState;
}


/// EMBEDDED FETCH STATE /// 

declare type FetchOptions = {
    useDecimals: boolean
}

const defaultOptions: FetchOptions = { useDecimals: false }

async function fetch_entity_state(entityAddress: string, stateApi: StateApi, options = defaultOptions) {

    let entity = await fetch_entity_state_data(entityAddress, stateApi);

    if (entity === undefined) return undefined;


    let resources: Record<string, number | Decimal> = {};
    let nfts: Record<string, number | Decimal> = {};
    let vaults: Record<string, number | Decimal> = {};

    entity.fungible_resources?.items.forEach((item) => {

        if (resources[item.resource_address] === undefined) resources[item.resource_address] = options.useDecimals ? dec(0) : 0;

        const _vaults = (item as any)['vaults']['items'] as any[];

        _vaults.forEach((vault: any) => {

            if (options.useDecimals) {
                resources[item.resource_address] = (resources[item.resource_address] as Decimal).plus(dec(vault['amount']))
                vaults[vault['vault_address']] = dec(vault['amount'])
            } else {
                (resources[item.resource_address] as number) += parseFloat(vault['amount'])
                vaults[vault['vault_address']] = parseFloat(vault['amount'])
            }

        })

    })

    entity.non_fungible_resources?.items.forEach((item) => {

        if (nfts[item.resource_address] === undefined) nfts[item.resource_address] = 0;

        const _vaults = (item as any)['vaults']['items'] as any[];

        _vaults.forEach((vault: any) => {
            (nfts[item.resource_address] as number) += parseInt(vault['total_count'])
        })

    })


    let raw_state = (entity.details as any)?.state;

    let values: Record<string, any> = {};

    if (raw_state !== undefined && raw_state.fields !== undefined) {


        let fields = raw_state.fields as any[];

        values = await fetch_element_fields(fields, stateApi, options)
    }

    let nft_keys = Object.keys(nfts);
    nft_keys.forEach((key) => {
        if (nfts[key] === 0) delete nfts[key];
    })

    values['$fungible_resources'] = resources;
    values['$fungible_vaults'] = vaults;
    values['$non_fungible_resources'] = nfts;
    values['$details'] = entity.details

    return values;
}

async function fetch_entity_state_data(entityAddress: string, stateApi: StateApi) {

    let result = await stateApi.stateEntityDetails({
        stateEntityDetailsRequest: {
            addresses: [entityAddress],
            aggregation_level: 'Vault'
        }
    })

    if (result.items.length === 0) return;

    let entity = result.items[0];
    if (entity === undefined) return undefined;

    return entity;

}

async function fetch_internal_state(entityAddress: string, stateApi: StateApi, options = defaultOptions) {

    let result = await stateApi.stateEntityDetails({
        stateEntityDetailsRequest: {
            addresses: [entityAddress],
            aggregation_level: 'Vault'
        }
    })

    if (result.items.length === 0) return;
    let details = result.items[0]?.details as any
    let raw_state = details.state;

    if (!raw_state) return undefined;

    let fields = raw_state.fields as any[];

    let values = await fetch_element_fields(fields, stateApi, options)

    return values;
}

async function fetch_element_fields(fields: any[], stateApi: StateApi, options = defaultOptions): Promise<Record<string, any> | any[]> {

    if (fields.length == 0) return {}


    if (fields.length === 1) {

        if (fields[0]?.field_name === undefined) {
            return await fetch_field(fields[0], stateApi, options)
        } else {
            return { [fields[0]?.field_name]: await fetch_field(fields[0], stateApi, options) }
        }

        // return await fetch_field(fields[0], stateApi, options)
    }

    const isArray = fields[0]?.field_name === undefined;

    if (!isArray) {
        let values: Record<string, any> = {};
        let tasks = fields.map(async (field) => {
            values[field.field_name as string] = await fetch_field(field, stateApi, options);
        });

        await Promise.all(tasks);

        return values;
    } else {

        let values: any[] = [];

        let tasks = fields.map(async (field) => {
            let value = await fetch_field(field, stateApi, options);
            values.push(value);
        });

        await Promise.all(tasks);

        return values;
    }

}

async function fetch_field(field: any, stateApi: StateApi, options: FetchOptions = defaultOptions) {

    let value: any = undefined;

    switch (field.kind) {
        case 'String':
        case 'NonFungibleLocalId':
            value = field.value;
            break;

        case 'Decimal':
            // value = dec(element.value);
            value = options.useDecimals ? dec(field.value) : parseFloat(field.value);
            break;

        case 'PreciseDecimal':
            // value = pdec(element.value);
            value = parseFloat(field.value);
            break;

        case 'Map':

            let temp_map: Record<string, any> = {};

            let map_tasks = field.entries.map(async (entry: any) => {
                temp_map[entry.key.value] = await fetch_field(entry.value, stateApi, options);
            });

            await Promise.all(map_tasks);

            value = temp_map;
            break;

        case 'Array':

            let temp_array: Record<string, any> = [];

            let array_tasks = field.elements.map(async (entry: any) => {
                temp_array.push(await fetch_field(entry, stateApi, options));
            });

            await Promise.all(array_tasks);

            value = temp_array;
            break;



        case 'Reference':
            value = field.value;
            break;

        case 'U8':
        case 'U64':
        case 'I64':
            value = parseInt(field.value);
            break;

        case 'Enum':

            if (field.type_name == 'Option') {

                if (field.variant_id === 0 || field.variant_name === 'None') {
                    value = undefined;
                    break;
                }

                if (field.fields.length === 1 && field.fields[0].field_name === undefined) {
                    value = await fetch_field(field.fields[0], stateApi, options);
                    break;
                }

                value = (field.variant_id === '0' || field.variant_name === 'None') ? undefined : await fetch_element_fields(field.fields, stateApi, options);
                break;
            }




            if (field.type_name == 'CDPType') {

                if (field.variant_id === 1 || field.variant_id === 2) {
                    value = await fetch_element_fields(field.fields, stateApi, options);
                    break;
                }


                value = undefined;
                break;
            }



            break;

        case 'Tuple':
            value = await fetch_element_fields(field.fields, stateApi, options);
            break;

        case 'Own':
            if (field.type_name == 'KeyValueStore' || field.type_name == 'Vault') {
                value = field.value;
            } else {
                value = await fetch_internal_state(field.value, stateApi);
            }

            break;

        default:


            value = field
            break;
    }

    return value
}

