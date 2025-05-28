<template>
	<div class="app height-all-screen display-flex-column flex-main-container">
		<div class="info-placeholder"></div>
		
		<div class="display-flex flex-main-container pad-lr-s pad-tb-s">
			<RoutingTableApp />
		</div>

		<div class="info display-flex align-items-center justify-content-center" @mouseenter="expand = true" @mouseleave="expand = false" @transitionend="handleTransitionEnd">
			<i v-if="!expand || !transitionDone" class="fa-sharp fa-solid fa-info"></i>
			<div v-else class="display-flex-column align-items-center justify-content-center gap-xs">
				<label>Sebastian M. Vintoñuke</label>
				<div class="display-flex gap-xs">
					<a href="https://github.com/SebastianVintonuke" target="_blank">My GitHub</a>
					<label>|</label>
					<a href="https://github.com">Report a Bug</a>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import RoutingTableApp from './apps/routing-table-app.vue';

const expand = ref(false);
const transitionDone = ref(false);

const handleTransitionEnd = (event: TransitionEvent) => {
	if (event.propertyName === 'height') {
		transitionDone.value = expand.value;
	}
};
</script>

<style scoped lang="scss">
.info-placeholder {
	width: 100%;
	height: 66px;
}

.info {
	position: fixed;
	top: 16px;
	right: 16px;
	width: 50px;
	height: 50px;
	border: 1px solid #000000;
	background-color: #FFFFFF;
	z-index: 1000; 
	transition: width 0.3s ease, height 0.3s ease;

	i {
		font-size: 20px;
	}
}

.info:hover {
	width: 335px;
	height: 135px;
}
</style>
