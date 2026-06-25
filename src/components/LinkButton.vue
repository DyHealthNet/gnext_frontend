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
/**
 * Presentational button that opens an external URL in a new tab, showing a
 * leading icon and a label. Used throughout the profile cards for links to
 * external databases (NCBI, Ensembl, etc.).
 */
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