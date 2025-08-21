<template>
  <span :class="['impact-tag', impactClass]">
    {{impact}}
  </span>
</template>

<script>
export default {
  name: 'VariantImpactTag',
  props: {
    impact: {
      type: String,
      required: true,
    }
  },
  computed: {
    impactClass() {
      return this.impact ? `impact-${this.impact.toLowerCase()}`: '';
    }
  }
};
</script>

<style scoped>
.impact-tag {
  display: inline-block;
  padding: 0.3em 0.8em;
  border-radius: 6px;
  font-weight: bold;
  font-size: 0.9rem;
  border: 2px solid;
  margin-right: 0.5rem;
}

/* Colors for different impact levels */
.impact-high {
  color: #d32f2f;
  border-color: #d32f2f;
}

.impact-moderate {
  color: #f57c00;
  border-color: #f57c00;
}

.impact-low {
  color: #388e3c;
  border-color: #388e3c;
}

.impact-modifier {
  color: #546e7a;
  border-color: #546e7a;
}
</style>