<script lang="ts">
	import { get_dapp_definition_details, get_lp_details, get_pool_details, get_validator_details, get_weft_price } from '$lib';
	import { format_number } from '$lib/utils';
	import { onMount } from 'svelte';

	const stakerHourlyDistribution = 3411; // Constant
	const lpHourlyDistribution = 1000; // Constant

	// let weft_price_xrd: number; // Astrolencent
	// let weft_price_usd: number; // Astrolencent

	let totalStakedXRD: number;
	let totalPoolUnits: number;
	let pooledWEFT: number;
	let pooledXRD: number;

	let ownPoolUnits: number; // Gateway API
	// const ownStakedXRD = 0; // Gateway API

	$: lp_asset_ratio = (pooledWEFT * weft_price_xrd + pooledXRD) / totalPoolUnits;
	$: lp_apr = (lpHourlyDistribution * weft_price_xrd * 24 * 365 * 100) / ((totalPoolUnits - ownPoolUnits) * lp_asset_ratio);
	$: staker_apr = (stakerHourlyDistribution * weft_price_xrd * 24 * 365 * 100) / totalStakedXRD;
	$: weft_price_xrd = pooledXRD / pooledWEFT;

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

		get_weft_price().then((res) => {
			const weft_token = res['resource_rdx1tk3fxrz75ghllrqhyq8e574rkf4lsq2x5a0vegxwlh3defv225cth3'];
			console.log(weft_token);
			weft_price_xrd = weft_token['tokenPriceXRD'];
			// weft_price_usd = weft_token['tokenPriceUSD'];
		});
	});
</script>

<div class="container">
	<div class="section">
		<div class="section-title">Staking</div>
		<div class="section-content">
			<p>Total staked XRD: {format_number(totalStakedXRD)}</p>
			<p><b>Staking APR: {format_number(staker_apr)} %</b></p>
			<a href="https://dashboard.radixdlt.com/network-staking/validator_rdx1sd6n65sx0thvfzfp6x0jp4qgwxtudpx575wpwqespdlva2wldul9xk">Stake here</a>
		</div>
	</div>

	<div class="section">
		<div class="section-title">Liquidity Mining (OCISWAP)</div>
		<div class="section-content">
			<p>1 WEFT = {format_number(weft_price_xrd)} XRD</p>
			<p>Pooled WEFT: {format_number(pooledWEFT)}</p>
			<p>Pooled XRD: {format_number(pooledXRD)}</p>
			<p><b>LM APR: {format_number(lp_apr)} %</b></p>
			<a href="https://ociswap.com/pool/component_rdx1crvtvnr02f5fl49jvap4rndlepfsgta455wcyteacr7dtfgzvqqw6n/liquidity">Add liquidity here</a>
		</div>
	</div>
	<div class="section">
		<div>Weft Finance reward Hub</div>
		<!-- <div class="section-title">WEFT Price</div> -->

		<a href="https://astrolescent.com">price by Astrolescent</a>
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 2rem;
	}

	.section {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 2rem;
		padding: 1rem;
		background-color: #f5f5f5;
		border-radius: 10px;
		box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
	}

	.section-title {
		font-size: 1.5rem;
		margin-bottom: 1rem;
	}

	.section-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 1rem;
	}

	.section-content p {
		font-size: 1.2rem;
		margin-bottom: 0.5rem;
	}

	.section-content a {
		font-size: 1.2rem;
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background-color: #4caf50;
		color: white;
		border-radius: 5px;
		text-decoration: none;
		transition: background-color 0.2s ease-in-out;
	}

	.section-content a:hover {
		background-color: #388e3c;
	}
</style>
