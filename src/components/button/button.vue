<template>
    <div class="button" :class="{ 'disabled': handler.disabled?.() }" @click="() => { if (!handler.disabled?.()) handler.onClick(); }">
        {{ handler.label }}
    </div>
</template>

<script setup lang="ts">
export type ButtonHandler = {
    label: string;
    disabled?: () => boolean;
    onClick: () => void;
};

const props = defineProps<{
    handler: ButtonHandler;
}>();

const { handler } = props;
</script>

<style scoped lang="scss">
.button {
    width: 180px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    border: 1px solid #000000;
    font-size: 18px;
    text-wrap: nowrap;
    cursor: pointer;
}
.disabled {
    color: #ff0000;
    border-color: #ff0000;
    cursor: not-allowed;
}
</style>
