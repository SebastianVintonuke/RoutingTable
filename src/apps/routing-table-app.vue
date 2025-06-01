<template>
	<div class="routing-table-app display-flex-column flex-main-container align-items-center gap-xl" >
		<div class="display-flex-column align-items-center gap-l">
			<label class="title text-wrap-nowrap">Routin Table</label>
			<RoutingTableComponent :handler="routingTableHandler"/>
			<Button :handler="buttonHandler"/>
		</div>
        <div v-for="(row, index) in optimizationResults" :key="index" class="display-flex-column align-items-center gap-md">
			<hr class="pad-b-md">
			<div class="display-flex-column align-items-center gap-s">
				<label>{{ 'This two entries are '.concat(row.optimization.type) }}</label>
				<RoutingTableComponent :handler="{ entries: toEntryRowArray(row.optimization.affectedEntries as Array<RoutingTableEntry>), readonly: true }"/>
				<div v-if="row.optimization.extraInfo" class="display-flex-column">
					<BinarySegmentMask :handler="{ directionIp: row.optimization.extraInfo.binaryDestinationIp1, maskLength: row.optimization.extraInfo.subnetMaskLength }"/>
					<BinarySegmentMask :handler="{ directionIp: row.optimization.extraInfo.binaryDestinationIp2, maskLength: row.optimization.extraInfo.subnetMaskLength }"/>
				</div>
				<label>Can be merged as</label>
				<RoutingTableComponent :handler="{ entries: toEntryRowArray([row.optimization.resultEntry as RoutingTableEntry]), readonly: true }"/>
			</div>
			<div class="display-flex-column align-items-center gap-s">
				<label>The table result is</label>
				<RoutingTableComponent :handler="{ entries: toEntryRowArray(row.result as Array<RoutingTableEntry>), readonly: true, displayHeader: true }"/>
			</div>
        </div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Ref } from 'vue';

import IpDirection from '../objects/IpDirection/IpDirection';
import RoutingTable from '../objects/RoutingTable/RoutingTable';
import type { OptimizacionResult, RoutingTableEntry } from '../objects/RoutingTable/RoutingTable';	

import RoutingTableComponent from '../components/routing-table/routing-table.vue';
import type { RoutingTableHandler, EntryRow } from '../components/routing-table/routing-table.vue';
import Button from '../components/button/button.vue';
import type { ButtonHandler } from '../components/button/button.vue';
import BinarySegmentMask from '../components/binary-segment-mask/binary-segment-mask.vue';

const DEFAULT_ENTRIES = [
    {
        destinationIp: '192.168.0.0',
        subnetMask: '255.255.255.0',
        outputInterface: '1',
        nextHop: '1.1.1.1',
    },
	{
        destinationIp: '192.168.1.0',
        subnetMask: '255.255.255.0',
        outputInterface: '1',
        nextHop: '1.1.1.1',
    }/*,
	{
        destinationIp: '192.168.2.0',
        subnetMask: '255.255.254.0',
        outputInterface: '1',
        nextHop: '1.1.1.1',
    },
	{
        destinationIp: '0.0.0.0',
        subnetMask: '0.0.0.0',
        outputInterface: '0',
        nextHop: '0.0.0.0',
    },
	{
        destinationIp: '0.0.0.0',
        subnetMask: '0.0.0.0',
        outputInterface: '0',
        nextHop: '0.0.0.0',
    }*/
];

const buttonHandler: Ref<ButtonHandler> = ref<ButtonHandler>({
	label: 'Optimize',
	disabled: () => {
		const routingTable = new RoutingTable();

		try {
			routingTableHandler.value.entries.forEach(entry => {
				if (!/^[0-9]+$/.test(entry.outputInterface)) throw new Error();
				routingTable.setAnInterface(
					IpDirection.fromString(entry.destinationIp),
					IpDirection.fromString(entry.subnetMask),
					Number.parseInt(entry.outputInterface),
					IpDirection.fromString(entry.nextHop),
				);
			});
		} catch (e) {
			return true;
		}

		return false;
	},
	onClick: () => onOptimize(),
});

const routingTableHandler: Ref<RoutingTableHandler> = ref<RoutingTableHandler>({
	entries: DEFAULT_ENTRIES,
	displayHeader: true,
	allowAddRow: true,
	readonly: false,
});

const optimizationResults = ref<OptimizacionResult[]>([]);
const onOptimize = () => {
	const routingTable = new RoutingTable();

	routingTableHandler.value.entries.forEach(entry => {
		routingTable.setAnInterface(
			IpDirection.fromString(entry.destinationIp),
			IpDirection.fromString(entry.subnetMask),
			Number.parseInt(entry.outputInterface),
			IpDirection.fromString(entry.nextHop),
		);
	});

	optimizationResults.value = [];
	requestAnimationFrame(() => {
		optimizationResults.value = routingTable.optimize();
	});
};

function toEntryRowArray(entries: Array<RoutingTableEntry>): Array<EntryRow> {
	return entries.sort((a, b) => b.outputInterface - a.outputInterface).map(entry => toEntryRow(entry));
};

function toRoutingTableEntryArray(entries: Array<EntryRow>): Array<RoutingTableEntry> {
	return entries.map(entry => toRoutingTableEntry(entry)).sort((a, b) => b.outputInterface - a.outputInterface);
};

function toEntryRow(entry: RoutingTableEntry): EntryRow {
	return {
		destinationIp: entry.destinationIp.toString(),
		subnetMask: entry.subnetMask.toString(),
		outputInterface: entry.outputInterface.toString(),
		nextHop: entry.nextHop.toString(),
	};
};

function toRoutingTableEntry(entry: EntryRow): RoutingTableEntry {
	return {
		destinationIp: IpDirection.fromString(entry.destinationIp),
		subnetMask: IpDirection.fromString(entry.subnetMask),
		outputInterface: Number.parseInt(entry.outputInterface),
		nextHop: IpDirection.fromString(entry.nextHop),
	};
};
</script>

<style scoped lang="scss">	
</style>
