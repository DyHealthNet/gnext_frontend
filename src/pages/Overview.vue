<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row  class="text-center">
          <v-col cols="12">
            <h1 class="title mt-4">Overview of Variants and Traits</h1>
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
                <p class="text-body-2 mb-4">
                  This table shows only the peaks with a p-value
                  &lt; 10<span style="vertical-align:super">-6</span>.
                  Variants are hidden if any variant within 500kb in the same phenotype has a smaller p-value.
                  Only the top 500 variants of each phenotype are considered.
                  The table is limited to the top 10000 hits.
                </p>

                <VariantsGwasAnnotation
                  :headers="tableHeader"
                  :rows="tableItems"
                  :downloadName="downloadName"
                  :priorityOrder="priorityOrder"
                  :globalFilterFields="['pvalue', 'neg_log_pvalue']"
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
import VariantsGwasAnnotation from "@/components/trait/VariantsGWASAnnotation.vue";
import {isLoading, setIsLoading} from "@/components/constants.js";

export default {
  name: 'Overview',
  components: {VariantsGwasAnnotation},
  data() {
    return {
      tableHeader: [],
      tableItems: [],
      showLoading: isLoading,
      downloadName: "",
      priorityOrder:  ["description", "top_variant", "pvalue", "neg_log_pvalue"],
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
        console.log("this.tableHeader", this.tableHeader)
        const desiredHeaders = [
          "description",
          "top_variant",
          "pvalue",
          "neg_log_pvalue",
          "phenocode",
          "category"
        ];
        this.tableHeader = desiredHeaders.filter(h => Object.keys(json[0]).includes(h));
        this.tableItems = json;
        // Add ID column first
      } catch (err) {
        console.error("Error fetching variants:", err);
      }
      setIsLoading(false);
    }
  },
  mounted() {
    this.get_top_hits_data();
  }
}


</script>


