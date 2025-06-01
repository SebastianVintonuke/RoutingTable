<template>
    <div class="button-icon display-flex align-items-center justify-content-center" :class="{ 'disabled': handler.disabled?.() }" :title="handler.title || undefined" @click="() => { if (!handler.disabled?.()) handler.onClick(); }">
        <i :class="handler.icon"></i>
    </div>
</template>

<script setup lang="ts">
export type ButtonIconHandler = {
    icon: string;
	title?: string;
    disabled?: () => boolean;
    onClick: () => void;
};

const props = defineProps<{
    handler: ButtonIconHandler;
}>();

const { handler } = props;
</script>

<style scoped lang="scss">
.button-icon {
	width: 50px;
	height: 50px;
	border: 1px solid #000000;
	background-color: #FFFFFF;
	cursor: pointer;
	transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
	i {
		font-size: 24px;
	}
}
.button-icon:hover {
	background-color: #000000;
	i {
		color: #FFFFFF;
	}
}
</style>
