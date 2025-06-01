<template>
	<div class="app height-all-screen display-flex-column flex-main-container">
		<div class="display-flex-reverse pad-lr-xs pad-tb-xs gap-xs">
			<ButtonIcon :handler="{ icon: 'fa-brands fa-github', onClick: onGithubClick, title: 'My Github' }" />
			<ButtonIcon :handler="{ icon: 'fa-solid fa-bug', onClick: onBugClick, title: 'Report a bug' }" />
		</div>
		<div class="display-flex flex-main-container pad-lr-s pad-tb-s">
			<RoutingTableApp />
		</div>
	</div>
</template>

<script setup lang="ts">
import RoutingTableApp from './apps/routing-table-app.vue';
import ButtonIcon from './components/button-icon/button-icon.vue';

function onGithubClick(): void {
	window.open('https://github.com/SebastianVintonuke', '_blank');
}

function onBugClick(): void {
	window.open('https://github.com/SebastianVintonuke/RoutingTable/issues', '_blank');
}
</script>

<style scoped lang="scss">
</style>
