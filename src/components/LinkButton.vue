<template>
  <v-btn
    :href="url"
    target="_blank"
    color="primary"
    variant="elevated"
  >
    <v-icon :icon="icon" start />
    <p class="custom-text">{{ title }}</p>
  </v-btn>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  url: { type: String, required: true },
  icon: { type: String, default: 'mdi-open-in-new' }, // e.g. mdi-web, mdi-github
  disabled: { type: Boolean, default: false }
})
</script>

<style scoped>
.custom-text {
  text-transform: none !important;
}
</style>