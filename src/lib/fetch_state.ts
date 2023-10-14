import type { StateApi } from "@radixdlt/babylon-gateway-api-sdk";
import Decimal from "decimal.js";

Decimal.set({ precision: 18 })
const PreciseDecimal = Decimal.clone({ precision: 35 })

const dec = (input: any) => new Decimal(input)
const pdec = (input: any) => new PreciseDecimal(input)


export declare type FetchOptions = {
    useDecimals: boolean
}

const defaultOptions: FetchOptions = { useDecimals: false }

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


export async function fetch_entity_state(entityAddress: string, stateApi: StateApi, options = defaultOptions) {

    let entity = await fetch_entity_state_data(entityAddress, stateApi);

    if (entity === undefined) return undefined;

    let resources: Record<string, number | Decimal> = {};
    let vaults: Record<string, number | Decimal> = {};

    entity.fungible_resources?.items.forEach((item) => {

        if (resources[item.resource_address] === undefined) resources[item.resource_address] = options.useDecimals ? dec(0) : 0;

        const _vaults = (item as any)['vaults']['items'] as any[];

        _vaults.forEach((vault: any) => {

            if (options.useDecimals) {
                (resources[item.resource_address] as Decimal).plus(dec(vault['amount']))
                vaults[vault['vault_address']] = dec(vault['amount'])
            } else {
                (resources[item.resource_address] as number) += parseFloat(vault['amount'])
                vaults[vault['vault_address']] = parseFloat(vault['amount'])
            }

        })

    })

    let values: Record<string, any> = {};

    // Load details

    values['$details'] = entity.details;


    // Load state

    let raw_state = (entity.details as any)?.state;


    if (raw_state !== undefined) {

        let fields = raw_state.fields as any[];

        values = await fetch_element_fields(fields, stateApi, options)

    }

    values['$fungible_resources'] = resources;
    values['$fungible_vaults'] = vaults;

    return values;
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

export async function fetch_element_fields(fields: any[], stateApi: StateApi, options = defaultOptions): Promise<Record<string, any>> {

    let values: Record<string, any> = {};

    if (fields === undefined) return values;

    let tasks = fields.map(async (field) => {
        values[field.field_name as string] = await fetch_field(field, stateApi, options);
    });

    await Promise.all(tasks);

    return values;
}

export async function fetch_field(field: any, stateApi: StateApi, options: FetchOptions = defaultOptions) {

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
                if (field.variant_id === '0' || field.variant_name === 'None') {
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
