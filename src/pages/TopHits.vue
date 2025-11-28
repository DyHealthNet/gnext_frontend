<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row  class="text-center">
          <v-col cols="12">
            <h1 class="title mt-4">Top Hits</h1>
          </v-col>
        </v-row>

        <v-row>
          <v-col class="d-flex justify-center">
            <v-divider class="my-2" thickness="2"></v-divider>
          </v-col>
        </v-row>

        <v-row class="my-4">
          <v-col cols="12">
            <v-card outlined>
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>Top Hits</v-toolbar-title>
              </v-toolbar>

              <v-card-text>
                <p class="text-body-1 mb-4">
                  This table shows only the peaks with a p-value below {{top_hits_pval_thr}} ({{top_hits_pval_thr.toExponential()}}).
                  Variants are hidden if any variant within {{top_hits_peak_sprawl_distance/1000}} kb  in the same phenotype has a smaller p-value.
                  Only the top {{top_hits_peak_max_count}} variants of each phenotype are considered.
                  The table is limited to the top {{top_hits_max_entries}} hits.
                  </p>
                <p class="text-body-1 mb-4">
                  Entries with a reported p-value of 0 but a valid −log₁₀(p-value) correspond to values smaller than approximately 5×10⁻³²⁴, which are below the representable range of double-precision floating-point numbers and therefore underflow to zero.
                </p>

                <TableSkeleton
                  :headers="tableHeaders"
                  :rows="tableItems"
                  :downloadName="downloadName"
                  :defaultTableRows="defaultTableRows"
                  :priorityOrder="priorityOrder"
                  :globalFilterFields="tableHeader"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import 'locuszoom/dist/locuszoom.css'
import {API_BASE_URL} from "@/config.js";
import TableSkeleton from "@/components/TableSkeleton.vue";
import {isLoading, setIsLoading} from "@/components/constants.js";

export default {
  name: 'TopHits',
  components: {TableSkeleton},
  data() {
    return {
      tableItems: [],
      tableHeaders: [],
      showLoading: isLoading,
      downloadName: "",
      priorityOrder:  [
          "trait_id",
          "trait_label",
          "trait_category",
          "top_variant",
          "nearest_genes",
          "beta",
          "stderr_beta",
          "alt_allele_freq",
          "pvalue",
          "neg_log_pvalue"
        ],
      defaultTableRows: 50,
      top_hits_pval_thr: 0,
      top_hits_max_entries: 0,
      top_hits_peak_max_count: 0,
      top_hits_peak_sprawl_distance: 0,
    }
  },
  methods: {
    async get_top_hits_data() {
      setIsLoading(true);
      try {
        let url = `${API_BASE_URL}/overview_get_top_hits/`;
        this.downloadName = `top_hits_table`;

        const res = await fetch(url);
        const json = await res.json();
        const desiredHeaders = [
          "trait_id",
          "trait_label",
          "trait_category",
          "top_variant",
          "nearest_genes",
          "beta",
          "stderr_beta",
          "alt_allele_freq",
          "pvalue",
          "neg_log_pvalue"
        ];
        if (json.length > 0) {
          this.tableHeaders = desiredHeaders.filter(h => Object.keys(json[0]).includes(h));
        } else {
          this.tableHeaders = [];
        }
        this.tableItems = json;
      } catch (err) {
        console.error("Error fetching variants:", err);
      }
      setIsLoading(false);
    },
    async get_top_hits_configs(){
      const cached = localStorage.getItem('configs')
      if (cached) {
        const data = JSON.parse(cached)
        this.top_hits_pval_thr = data.top_hits_pval_cutoff;
        this.top_hits_max_entries = data.top_hits_max_limit;
        this.top_hits_peak_max_count = data.manhattan_peak_max_count;
        this.top_hits_peak_sprawl_distance = data.manhattan_peak_sprawl_dist;
      } else {
        // Otherwise fetch from API
        fetch(`${API_BASE_URL}/overview_get_config`)
            .then(res => res.json())
            .then(data => {
              localStorage.setItem('configs', JSON.stringify(data))
              this.top_hits_pval_thr = data.top_hits_pval_cutoff;
              this.top_hits_max_entries = data.top_hits_max_limit;
              this.top_hits_peak_max_count = data.manhattan_peak_max_count;
              this.top_hits_peak_sprawl_distance = data.manhattan_peak_sprawl_dist;
            })
            .catch(err => console.error('Error fetching config:', err))
      }
    }
  },
  mounted() {
    this.get_top_hits_data();
    this.get_top_hits_configs();
  }
}


</script>


