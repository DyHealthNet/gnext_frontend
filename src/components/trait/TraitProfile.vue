<template>
  <v-container>
    <v-row>
      <v-col xs="12" sm="12" md="12" lg="4">
        <h3><strong>Trait ID</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{traitId}}</h3>
        <h3><strong>Trait Label</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{traitDescription}}</h3>
        <h3><strong>Trait Group</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{traitCategory}}</h3>

      </v-col>
      <v-col xs="12" sm="12" md="12" lg="4">
        <h3 v-if="traitNumberSamples && traitNumberSamples !== 0"><strong>Number of Samples</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{traitNumberSamples}}</h3>
        <h3 v-if="traitExternalRef"><strong>External Reference</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</h3><LinkButton v-if="traitExternalRef" :title="traitExternalRef" :url="`${BASE_URL}${traitExternalRef}`" :disabled="!traitExternalRef"/>
      </v-col>

      <v-col v-if="showMAGMAParams" xs="12" sm="12" md="12" lg="4">
        <h3><strong>MAGMA Flank Window</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{MAGMA_window_up}} kb upstream, and {{MAGMA_window_down}} kb downstream</h3>
        <h3><strong>MAGMA Reference Population</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{MAGMA_ref_pop}}</h3>
        <h3><strong>MAGMA Gene Location</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{MAGMA_gene_loc}}</h3>
      </v-col>

    </v-row>
  </v-container>
</template>


<script>

import LinkButton from "@/components/LinkButton.vue";
import {TRAIT_EXTERNAL_REF_URL, MAGMA_SHOW, API_BASE_URL} from "@/config.js";


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
      BASE_URL: TRAIT_EXTERNAL_REF_URL,
      showMAGMAParams: MAGMA_SHOW,
      MAGMA_window_up: 0,
      MAGMA_window_down: 0,
      MAGMA_ref_pop: "",
      MAGMA_gene_loc: ""
    }
  },

  mounted(){
    this.getMAGMAParams()
  },

  methods: {
    getMAGMAParams() {
      const cached = localStorage.getItem('configs')
      if (cached) {
        const data = JSON.parse(cached)
        this.MAGMA_window_up = data.window_up;
        this.MAGMA_window_down = data.window_down;
        this.MAGMA_ref_pop = data.magma_ref_pop;
        this.MAGMA_gene_loc = data.magma_ref_gene_loc;
      } else {
        // Otherwise fetch from API
        fetch(`${API_BASE_URL}/overview_get_config`)
            .then(res => res.json())
            .then(data => {
              localStorage.setItem('configs', JSON.stringify(data))
              this.MAGMA_window_up = data.window_up;
              this.MAGMA_window_down = data.window_down;
              this.MAGMA_ref_pop = data.magma_ref_pop;
              this.MAGMA_gene_loc = data.magma_ref_gene_loc;
            })
            .catch(err => console.error('Error fetching config:', err))
      }
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