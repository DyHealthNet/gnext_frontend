<template>
  <v-container class="d-flex flex-column align-start ga-2">

    <p class="text-body-1 mb-4">
      For variant to gene mapping, variants located within the gene body as well as variants located within  {{ window_up }} kb upstream or {{ window_down }} kb downstream of the gene are considered.
    </p>
    <v-row dense>
      <v-col
          v-for="(symbol, ensg_id) in genes"
          :key="ensg_id"
          cols="auto"
          class="mb-2">
        <v-btn
            @click="handleGeneClick(ensg_id)"
            color="primary"
            variant="elevated">
          <span>
           {{ symbol }}
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
    genes: {
      type: Array,
      required: true
    },
  },

  data() {
    return {
      window_up: 0,
      window_down: 0
    };
  },

  methods: {
    handleGeneClick(gene) {
      // Navigate to gene page
      this.$router.push(`/gene/${gene}`);
    },
    
    fetchConfig() {
      const cached = localStorage.getItem('configs')
      if (cached) {
        const data = JSON.parse(cached)
        this.window_up = data.window_up;
        this.window_down = data.window_down;
      } else {
        // Otherwise fetch from API
        fetch(`${API_BASE_URL}/overview_get_config`)
            .then(res => res.json())
            .then(data => {
              localStorage.setItem('configs', JSON.stringify(data))
              this.window_up = data.window_up;
              this.window_down = data.window_down;
            })
            .catch(err => console.error('Error fetching config:', err))
      }
    }
  },
  mounted() {
    this.fetchConfig();
  }
};
</script>

<style scoped>


</style>