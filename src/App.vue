<template>
	<div class="app height-all-screen display-flex-column flex-main-container">
		<div class="display-flex flex-main-container pad-lr-s pad-tb-s">
			<RoutingTableApp />
		</div>
	</div>
</template>

<script setup lang="ts">
import RoutingTableApp from './apps/routing-table-app.vue';
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
	cursor: pointer;

	i {
		font-size: 20px;
	}
}
</style>
