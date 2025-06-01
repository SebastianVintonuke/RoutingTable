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
    background-color: #FFFFFF;
    font-size: 18px;
    text-wrap: nowrap;
    cursor: pointer;
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
.button:hover:not(.disabled) {
    background-color: #000000;
    color: #FFFFFF;
}

.button.disabled {
    color: #ff0000;
    border-color: #ff0000;
    cursor: not-allowed;
    background-color: #FFFFFF;
}
</style>
