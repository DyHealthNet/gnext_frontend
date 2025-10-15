<template>
  <v-container>
    <v-row>
      <v-col xs="12" sm="12" md="12" lg="4">
        <h3><strong>Trait ID</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{traitId}}</h3>
        <h3><strong>Trait Label</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{traitDescription}}</h3>
        <h3><strong>Trait Group</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{traitCategory}}</h3>
      </v-col>
      <v-col xs="12" sm="12" md="12" lg="4">
        <h3><strong>Number of Samples</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{traitNumberSamples}}</h3>
      </v-col>
      <v-col xs="12" sm="12" md="12" lg="4">
        <h3><strong>External Reference</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</h3><LinkButton :title="traitExternalRef" :url="`${BASE_URL}${traitExternalRef}`" :disabled="!traitExternalRef"/>
      </v-col>
    </v-row>
  </v-container>
</template>


<script>

import LinkButton from "@/components/LinkButton.vue";
import {TRAIT_EXTERNAL_REF_URL} from "@/config.js";


export default {
  name: "TraitProfile",
  components: {LinkButton},
  props: {
    traitId: {
      type: String,
      required: true,
    },
    traitDescription: {
      type: String,
      required: true,
    },
    traitCategory: {
      type: String,
      required: true,
    },
    traitExternalRef: {
      type: String,
      required: false
    },
    traitNumberSamples: {
      type: Number,
      required: false
    }
  },
  data(){
    return {
      BASE_URL: TRAIT_EXTERNAL_REF_URL
    }
  }
}
</script>

<style scoped>
.grid-three {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
</style>