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
  border-color: #f8bbd0;
  background-color: #fde0e0;
}

.impact-moderate {
  color: #f57c00;
  border-color: #ffe0b2;
  background-color: #fff3e0;
}

.impact-low {
  color: #388e3c;
  border-color: #c8e6c9;
  background-color: #e8f5e9;
}

.impact-modifier {
  color: #546e7a;
  border-color: #cfd8dc;
  background-color: #eceff1;
}
</style>