<template>
  <span :class="['location-tag', `location-${location.toLowerCase()}`]">
    {{location}}
  </span>
</template>

<script>
/**
 * Small colored badge for a variant's location relative to a gene
 * (e.g. within_gene / upstream / downstream). The location string also selects
 * the badge color via a CSS class. Used inside the gene/variant result tables.
 */
export default {
  name: 'GeneLocationTag',
  props: {
    location: {
      type: String,
      required: true,
    }
  },

};
</script>

<style scoped>
.location-tag {
  display: inline-block;
  padding: 0.3em 0.8em;
  border-radius: 6px;
  font-weight: bold;
  font-size: 0.9rem;
  border: 2px solid;
  margin-right: 0.5rem;
}

/* Colors for different impact levels */
.location-within_gene {
  color: #3d5b7f;
  border-color: #3d5b7f;
}

.location-upstream {
  color: #ab72aa;
  border-color: #ab72aa;
}

.location-downstream {
  color: #388e3c;
  border-color: #388e3c;
}

</style>