<script lang="ts">
	import { get_dapp_definition_details, get_lp_details, get_pool_details, get_validator_details } from '$lib';
	import { format_number } from '$lib/utils';
	import { onMount } from 'svelte';

	const stakerHourlyDistribution = 3411; // Constant
	const lpHourlyDistribution = 1000; // Constant

	const xrd_price_usd = 0.04; // Astrolencent
	const weft_price_xrd = 0.4; // Astrolencent

	let totalStakedXRD: number;
	let totalPoolUnits: number;
	let pooledWEFT: number;
	let pooledXRD: number;

	let ownPoolUnits: number; // Gateway API
	// const ownStakedXRD = 0; // Gateway API

	$: lp_asset_ratio = (pooledWEFT * weft_price_xrd + pooledXRD) / totalPoolUnits;
	$: lp_apr = (lpHourlyDistribution * weft_price_xrd * 24 * 365 * 100) / ((totalPoolUnits - ownPoolUnits) * lp_asset_ratio);
	$: staker_apr = (stakerHourlyDistribution * weft_price_xrd * 24 * 365 * 100) / totalStakedXRD;

	onMount(() => {
		get_lp_details().then((res) => {
			totalPoolUnits = parseFloat(res!['$details']['total_supply']);
		});

		get_validator_details().then((res) => {
			totalStakedXRD = res!['$fungible_vaults']['internal_vault_rdx1tq3w690mzr34ws2n6svg40yjzym5lgl099fy4980mm20syl2mly77l'];
		});

		get_pool_details().then((res) => {
			pooledXRD = res!['$fungible_resources']['resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd'];
			pooledWEFT = res!['$fungible_resources']['resource_rdx1tk3fxrz75ghllrqhyq8e574rkf4lsq2x5a0vegxwlh3defv225cth3'];
		});

		get_dapp_definition_details().then((res) => {
			ownPoolUnits = res!['$fungible_resources']['resource_rdx1th5slwxk8x8xs7438ek6kp7kvrz5lxuu823tql4dqvd92q2fzxr3aq'];
		});
	});
</script>

<h1>Weft Finance reward Hub</h1>

<p>Price of XRD: {xrd_price_usd}</p>
<p>Price of WEFT: {weft_price_xrd * xrd_price_usd}</p>

STAKING

<p>Total staked XRD: {format_number(totalStakedXRD)}</p>
<p>Staker APR: {format_number(staker_apr)} %</p>

<p>
	<a href="https://dashboard.radixdlt.com/network-staking/validator_rdx1sd6n65sx0thvfzfp6x0jp4qgwxtudpx575wpwqespdlva2wldul9xk">Stake here</a>
</p>
LIQUIDITY MINING (OCISWAP)

<p>Pooled WEFT: {format_number(pooledWEFT)}</p>
<p>Pooled XRD: {format_number(pooledXRD)}</p>
<p>LP APR: {format_number(lp_apr)} %</p>

<p>
	<a href="https://ociswap.com/pool/component_rdx1crvtvnr02f5fl49jvap4rndlepfsgta455wcyteacr7dtfgzvqqw6n/liquidity">Add liquidity here</a>
</p>
