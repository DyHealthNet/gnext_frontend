<template>
  <v-container>
    <div class="d-flex justify-space-between align-center">
      <h3 style="padding-bottom: 10px;"><strong>Allele frequency range of this study</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ studyAF }}
      </h3>
      <span>Source: VEP</span>
    </div>
    <div v-if="frequencies && Object.keys(frequencies).length">
      <div v-for="(value, label) in frequencies"
           :key="label"
           class="row">
        <div class="label">{{ label }}</div>
        <div class="bar-container">
          <div
              class="bar"
              :style="{ width: value * 100 + '%'}"
          ></div>
        </div>
        <div class="value">{{ value.toFixed(4) }}</div>
      </div>
    </div>
    <div v-else class="no-freq">
      <p class="text-body-1 mb-4">
        For this variant, no allele frequencies were extracted from VEP.
      </p>
    </div>
  </v-container>
</template>

<script>
import {API_BASE_URL} from "@/config.js";

export default {
  name: 'VariantPopulationFrequencies',
  props: {
    variantId: {
      type: String,
      required: true
    },
    frequencies: {
      type: Object,
      required: true
    },
    minAF: {
      type: Number,
      required: true
    },
    maxAF: {
      type: Number,
      required: true
    }
  },

  data() {
    return {
      studyName: import.meta.env.VITE_STUDY_NAME,
    }
  },

  computed: {
    studyAF() {
      if (this.minAF === this.maxAF) {
        return this.minAF
      }
      return `${this.minAF} - ${this.maxAF}`
    }
  }
};
</script>

<style scoped>

.row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.label {
  width: 200px;
  font-size: 0.9rem;
}

.bar-container {
  flex: 1;
  height: 8px;
  background-color: #e0e0e0;
  margin: 0 10px;
  border-radius: 2px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background-color: rgb(var(--v-theme-primary));
}

.value {
  width: 50px;
  font-size: 0.9rem;
  text-align: right;
}
</style>