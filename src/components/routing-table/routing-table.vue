<template>
    <div class="grid">
        <div v-if="handler.displayHeader" class='cell header'>Destination</div>
        <div v-if="handler.displayHeader" class='cell header'>Mask</div>
        <div v-if="handler.displayHeader" class='cell header'>Interface</div>
        <div v-if="handler.displayHeader" class='cell header'>Next Hop</div>

        <template v-for="(row, index) in handler.entries" :key="index">
            <div class="cell">
                <input
                    class="input"
                    :class="{ 'input-error': !isValidDestination(row.destinationIp) }"
                    v-model="row.destinationIp"
                    type="text"
                    placeholder="..."
                    :disabled="!handler.editable"
                />
            </div>
            <div class="cell">
                <input
                    class="input"
                    :class="{ 'input-error': !isValidMask(row.subnetMask) }"
                    v-model="row.subnetMask"
                    type="text"
                    placeholder="..."
                    :disabled="!handler.editable"
                />
            </div>
            <div class="cell">
                <input
                    class="input"
                    :class="{ 'input-error': !isValidInterface(row.outputInterface, row.nextHop) }"
                    v-model="row.outputInterface"
                    type="text"
                    placeholder="..."
                    :disabled="!handler.editable"
                />
            </div>
            <div class="cell">
                <input
                    class="input"
                    :class="{ 'input-error': !isValidNextHop(row.nextHop, row.outputInterface) }"
                    v-model="row.nextHop"
                    type="text"
                    placeholder="..."
                    :disabled="!handler.editable"
                />
            </div>
        </template>

        <div v-if="handler.allowAddRow" class="cell add-row" @click="addRow">+</div>
    </div>
</template>

<script setup lang="ts">

export type RoutingTableHandler = {
    entries: EntryRow[];
    displayHeader?: boolean;
    allowAddRow?: boolean;
    editable?: boolean;
};

const props = defineProps<{
    handler: RoutingTableHandler;
}>();
const { handler } = props;

export interface EntryRow {
    destinationIp: string;
    subnetMask: string;
    outputInterface: string;
    nextHop: string;
}

const addRow = () => {
    const newEntry: EntryRow = {
        destinationIp: '',
        subnetMask: '',
        outputInterface: '',
        nextHop: '',
    };
    handler.entries.push(newEntry);
};

function isValidDestination(destinationIp: string) {
    return isValidIP(destinationIp);
}
function isValidMask(subnetMask: string) {
    return isValidSubnetMask(subnetMask);
}

function isValidInterface(outputInterface: string, nextHop: string) {
    return /^\d+$/.test(outputInterface) && !handler.entries.some(entry => entry.nextHop === nextHop && entry.outputInterface !== outputInterface);
}

function isValidNextHop(nextHop: string, outputInterface: string) {
    return (nextHop === 'on-link' || isValidIP(nextHop)) && !handler.entries.some(entry => entry.outputInterface === outputInterface && entry.nextHop !== nextHop);
}

function isValidIP(ip: string): boolean {
    if (!ip) return true;
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    for (const part of parts) {
        if (!/^\d+$/.test(part)) return false;
        const num = Number(part);
        if (num < 0 || num > 255) return false;
    }
    return true;
}

function isValidSubnetMask(subnetMask: string): boolean {
    if (!isValidIP(subnetMask)) return false;

    const binaryStr = subnetMask
        .split('.')
        .map(octet => parseInt(octet, 10).toString(2).padStart(8, '0'))
        .join('');

    const firstZero = binaryStr.indexOf('0');
    if (firstZero === -1) return true;

    const afterFirstZero = binaryStr.slice(firstZero);
    return !afterFirstZero.includes('1');
}

</script>

<style scoped lang="scss">
.grid {
    display: grid;
    grid-auto-rows: 50px;
    grid-column-gap: 0px;
    grid-row-gap: 0px;

    font-size: 18px;
    grid-template-columns: repeat(4, minmax(80px, 180px));
}

@media (max-width: 770px) {
    .grid {
        font-size: 10px;
    }
}

.header {
    font-weight: bold;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.cell {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    border-right: 1px solid #000000;
    border-bottom: 1px solid #000000;
}

.cell:nth-child(4n + 1) {
    border-left: 1px solid #000000;
}

.cell:nth-child(-n + 4) {
    border-top: 1px solid #000000;
}

.add-row {
    grid-column: 1 / 5;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    border-left: 1px solid #000000;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    cursor: pointer;
    font-weight: bold;
}

.input {
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
    background: transparent;
    padding: 0 4px;
    box-sizing: border-box;
    font-size: inherit;
    text-align: center;
}

.input:disabled {
    color: #000000;
}

.input-error {
    color: #ff0000;
}
</style>
