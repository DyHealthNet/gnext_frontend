<template>
  <v-container class="d-flex flex-column align-start ga-2">

    <span>The nearest gene(s) to {{ this.variantId }}, as predicted by the Ensembl Variant Effect Predictor. Click on the gene to go to its Gene page.</span>
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