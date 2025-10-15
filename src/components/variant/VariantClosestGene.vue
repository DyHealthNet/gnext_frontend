<template>
  <v-container class="d-flex flex-column align-start ga-2">

    <p class="text-body-1 mb-4">
      Predicted gene(s) potentially affected by {{ this.variantId }}, based on annotations from the Ensembl Variant Effect Predictor.
      Transcripts are ranked by predicted impact, from high to low (including modifiers), and the associated genes are ordered accordingly.
    </p>
    <v-row dense>
      <v-col
          v-for="gene in symbols"
          :key="gene"
          cols="auto"
          class="mb-2">
        <v-btn
            href=""
            target="_blank"
            color="primary"
            variant="elevated">
          <span>
           {{ gene }}
          </span>
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>

export default {
  name: 'VariantClosestGene',
  props: {
    variantId: {
      type: String,
      required: true
    },
    symbols: {
      type: Array,
      required: true
    },
  },
};
</script>

<style scoped>


</style>