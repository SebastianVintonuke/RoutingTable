<template>
	<div class="display-flex">
		<template v-for="(segment, index) in getBinarySegments(handler.directionIp, handler.maskLength)" :key="index">
			<template v-for="(bit, bitIndex) in segment.bits" :key="bitIndex">
				<label :class="{ mask: segment.inMask && bitIndex < segment.maskBits }">{{ bit }}</label>
			</template>
			<label v-if="index < 3">.</label>
		</template>
	</div>
</template>

<script setup lang="ts">
export type BinarySegmentMaskHandler = {
    directionIp: string;
    maskLength: number;
};

const props = defineProps<{
    handler: BinarySegmentMaskHandler;
}>();

const { handler } = props;

interface BinarySegment {
	bits: string[];
	inMask: boolean;
	maskBits: number;
}

function getBinarySegments(binaryIp: string, maskLength: number): BinarySegment[] {
	const segments: BinarySegment[] = [];
	for (let i = 0; i < 4; i++) {
		const start = i * 8;
		const end = start + 8;
		const bits = binaryIp.slice(start, end).split('');
		const remainingMask = Math.max(0, maskLength - start);
		const maskBits = Math.min(remainingMask, 8);

		segments.push({
			bits,
			inMask: maskBits > 0,
			maskBits,
		});
	}
	return segments;
}
</script>

<style scoped>
.mask {
	color: red;
}
</style>
