<template>
  <v-container>
    <div class="d-flex justify-space-between align-center">
      <h3 style="padding-bottom: 10px;"><strong>Allele Frequency of {{studyName}}</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{minAF}} - {{maxAF}}</h3>
      <span>Source: VEP</span>
    </div>
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
      <div class="value">{{ value.toFixed(3) }}</div>
    </div>
  </v-container>
</template>

<script>
// TODO: add allele frequency of the variant in the study
// TODO: add link to gnomAD and source information !
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
  },

  data() {
    return {
      studyName: import.meta.env.VITE_STUDY_NAME,
      minAF: null,
      maxAF: null,
    }
  },

  methods: {
     async renderStudyAlleleFrequencies() {
      const query = encodeURIComponent(`variant eq '${this.variantId}'`);
      const res = await fetch(`${API_BASE_URL}/variant_phewas/?filter=${query}`);
      const json = await res.json();
      const afValues = json.data.map(d => d.af);
      this.minAF = Math.min(...afValues);
      this.maxAF = Math.max(...afValues);
    }
  },

  mounted() {
    this.renderStudyAlleleFrequencies();
  },
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