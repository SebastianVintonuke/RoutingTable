<template>
	<div class="routing-table-app display-flex-column flex-main-container align-items-center gap-xl" >
		<div class="display-flex-column align-items-center gap-l">
			<label class="title text-wrap-nowrap">Routing Table</label>
			<RoutingTableComponent :handler="routingTableHandler"/>
			<Button :handler="buttonHandler"/>
		</div>
        <div v-for="(row, index) in optimizationResults" :key="index" class="display-flex-column align-items-center gap-md">
			<hr class="pad-b-md">
			<div class="display-flex-column align-items-center gap-s">
				<label>{{ logFirstLabel(row.optimization.type) }}</label>
				<RoutingTableComponent :handler="{ entries: toEntryRowArray(row.optimization.affectedEntries as Array<RoutingTableEntry>), readonly: true }"/>
				<div v-if="row.optimization.consecutivesExtraInfo" class="display-flex-column">
					<BinarySegmentMask :handler="{ directionIp: row.optimization.consecutivesExtraInfo.binaryDestinationIp1, maskLength: row.optimization.consecutivesExtraInfo.subnetMaskLength }"/>
					<BinarySegmentMask :handler="{ directionIp: row.optimization.consecutivesExtraInfo.binaryDestinationIp2, maskLength: row.optimization.consecutivesExtraInfo.subnetMaskLength }"/>
				</div>
				<label>{{ logSecondLabel(row.optimization.type) }}</label>
				<RoutingTableComponent :handler="{ entries: toEntryRowArray([row.optimization.resultEntry as RoutingTableEntry]), readonly: true }"/>
				<div v-if="row.optimization.containedExtraInfo" class="display-flex-column align-items-center text-align-center gap-s">
					<div class="display-flex-column align-items-center text-align-center gap-xs">
						<label> {{ 'Range of outer entry' }} </label>
						<label> {{ row.optimization.containedExtraInfo.outerEntryStart + ' - ' + row.optimization.containedExtraInfo.outerEntryEnd }} </label>
					</div>
					<div class="display-flex-column align-items-center text-align-center gap-xs">
						<label> {{ 'Range of inner entry' }} </label>
						<label> {{ row.optimization.containedExtraInfo.innerEntryStart + ' - ' + row.optimization.containedExtraInfo.innerEntryEnd }} </label>
					</div>
					<label> And there isn't any other entry in between with a different output interface </label>
				</div>
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
	// Example ejercicio
	{
        destinationIp: '163.9.172.0',
        subnetMask: '255.255.252.0',
        outputInterface: '1',
        nextHop: '163.9.163.69',
    },
	{
        destinationIp: '163.9.160.0',
        subnetMask: '255.255.248.0',
        outputInterface: '1',
        nextHop: '163.9.163.69',
    },
	{
        destinationIp: '163.9.168.0',
        subnetMask: '255.255.252.0',
        outputInterface: '1',
        nextHop: '163.9.163.69',
    },
	{
        destinationIp: '163.9.162.27',
        subnetMask: '255.255.255.255',
        outputInterface: '2',
        nextHop: 'On-link',
    },
	{
        destinationIp: '163.9.162.0',
        subnetMask: '255.255.254.0',
        outputInterface: '3',
        nextHop: '10.119.240.13',
    },
	{
        destinationIp: '163.9.160.0',
        subnetMask: '255.255.224.0',
        outputInterface: '3',
        nextHop: '10.119.240.13',
    },
	{
        destinationIp: '0.0.0.0',
        subnetMask: '0.0.0.0',
        outputInterface: '3',
        nextHop: '10.119.240.13',
    },
	// Example parcial
	/*{
        destinationIp: '186.33.221.0',
        subnetMask: '255.255.255.0',
        outputInterface: '1',
        nextHop: '10.57.192.85',
    },
	{
        destinationIp: '186.33.220.0',
        subnetMask: '255.255.252.0',
        outputInterface: '1',
        nextHop: '10.57.192.85',
    },
	{
        destinationIp: '186.33.216.0',
        subnetMask: '255.255.252.0',
        outputInterface: '1',
        nextHop: '10.57.192.85',
    },
	{
        destinationIp: '186.33.212.0',
        subnetMask: '255.255.252.0',
        outputInterface: '1',
        nextHop: '10.57.192.85',
    },
	{
        destinationIp: '186.33.208.0',
        subnetMask: '255.255.252.0',
        outputInterface: '1',
        nextHop: '10.57.192.85',
    },
	{
        destinationIp: '186.33.0.0',
        subnetMask: '255.255.0.0',
        outputInterface: '2',
        nextHop: '10.57.22.10',
    },
	{
        destinationIp: '0.0.0.0',
        subnetMask: '0.0.0.0',
        outputInterface: '2',
        nextHop: '10.57.22.10',
    },
	// Example consecutives
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
    },
	// Example nested consecutives
	{
        destinationIp: '192.168.2.0',
        subnetMask: '255.255.254.0',
        outputInterface: '1',
        nextHop: '1.1.1.1',
    },
	{ // Example contained
		destinationIp: '100.100.0.0',
		subnetMask: '255.255.0.0',
		outputInterface: '0',
		nextHop: '0.0.0.0',
	},
	// Example contained with conflict
	{
		destinationIp: '10.0.0.0',
		subnetMask: '255.0.0.0',
		outputInterface: '2', 
		nextHop: '2.2.2.2',
	},
	{
		destinationIp: '10.1.0.0',
		subnetMask: '255.255.0.0',
		outputInterface: '0',
		nextHop: '0.0.0.0',
	},
	// Example redundant
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
	allowRemoveRow: true,
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
	return entries.sort((a, b) => a.outputInterface - b.outputInterface).map(entry => toEntryRow(entry));
};

function toRoutingTableEntryArray(entries: Array<EntryRow>): Array<RoutingTableEntry> {
	return entries.map(entry => toRoutingTableEntry(entry)).sort((a, b) => a.outputInterface - b.outputInterface);
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

function logFirstLabel(optimizationType: 'consecutives' | 'redundant' | 'contained'): string {
	switch (optimizationType) {
		case 'consecutives':
		case 'redundant':
			return 'This two entries are '.concat(optimizationType);
		case 'contained':
			return 'This entry';
		default:
			return '';
	}
}

function logSecondLabel(optimizationType: 'consecutives' | 'redundant' | 'contained'): string {
	switch (optimizationType) {
		case 'consecutives':
		case 'redundant':
			return 'Can be merged as';
		case 'contained':
			return 'is contained in';
		default:
			return '';
	}
}
</script>

<style scoped lang="scss">	
</style>
