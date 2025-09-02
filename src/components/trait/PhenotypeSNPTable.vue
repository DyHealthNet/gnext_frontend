<template>
  <v-container>
    <v-row>
      <v-col>
      <TableSearchBar :pheno="pheno" @apply-filters="onApplyFilters"></TableSearchBar>
        </v-col>
    </v-row>

    <v-row>
      <v-divider class="my-2" thickness="2"></v-divider>
    </v-row>

    <v-row class="mt-6 ml-2">
      <v-col>
        <div v-if="tableItems.length > 0">
          <v-chip color="primary-darken-1" text-color="white" small :ripple="false" class="filter-chip mr-2">
           Mode: {{
            {
              default: "P-Value",
              rsid: "SNP ID",
              chromosome: "Chromosome Range"
            }[prevFilters.mode] || prevFilters.mode
          }}
          </v-chip>
          <v-chip color="primary-darken-1" text-color="white" small :ripple="false" class="filter-chip mr-2">
            P-Value Cutoff: {{ prevFilters.pvalCutoff }}
          </v-chip>
          <v-chip v-if="prevFilters.mode === 'rsid'" color="primary-darken-1" text-color="white" small :ripple="false" class="filter-chip mr-2">
            Variant: {{ prevFilters.rsid || prevFilters.varid }}
          </v-chip>
          <v-chip v-if="prevFilters.mode === 'rsid'" color="primary-darken-1" text-color="white" small :ripple="false" class="filter-chip mr-2">
            Neighbor Range: {{ prevFilters.neighborRange }}
          </v-chip>
          <v-chip v-if="prevFilters.mode === 'chromosome'" color="primary-darken-1" text-color="white" small :ripple="false" class="filter-chip mr-2">
            Chr: {{ prevFilters.chr }}
          </v-chip>
          <v-chip v-if="prevFilters.mode === 'chromosome'" color="primary-darken-1" text-color="white" small :ripple="false" class="filter-chip mr-2">
            Start: {{ prevFilters.start }}
          </v-chip>
          <v-chip v-if="prevFilters.mode === 'chromosome'" color="primary-darken-1" text-color="white" small :ripple="false" class="filter-chip mr-2">
            End: {{ prevFilters.end }}
          </v-chip>
        </div>
      </v-col>
    </v-row>


    <v-row>
      <v-col>
      <v-overlay v-model="showLoading" scroll-strategy="none" contained
                 class="d-flex justify-center align-center">
        <v-progress-circular
            indeterminate
            color="primary"
            size="60"
        ></v-progress-circular>
      </v-overlay>
      <VariantsGwasAnnotation :headers="tableHeader" :rows="tableItems" :downloadName="downloadName"
                              :globalFilterFields="['rsid', 'chrom', 'pos']"></VariantsGwasAnnotation>
        </v-col>
    </v-row>

  </v-container>
</template>

<script>
import 'locuszoom/dist/locuszoom.css'
import {API_BASE_URL} from "@/config.js";
import VariantsGwasAnnotation from "@/components/trait/VariantsGWASAnnotation.vue";
import TableSearchBar from "@/components/trait/TableSearchBar.vue";
import {isLoading, setIsLoading} from "@/components/constants.js";


export default {
  name: "PhenotypeSNPTable",
  components: {VariantsGwasAnnotation, TableSearchBar},
  props: {
    pheno: {
      type: String,
      required: true,
    }
  },
  data() {
    return {
      tableHeader: [],
      tableItems: [],
      prevFilters: {},
      showLoading: isLoading,
      downloadName: ""
    }
  },
  methods: {
    async onApplyFilters(filters) {
      setIsLoading(true);
      try {
        if (this.prevFilters.mode === "default" && filters.pvalCutoff < this.prevFilters.pvalCutoff) {
          const negLogCutoff = -Math.log10(filters.pvalCutoff);
          // Filter frontend items
          this.tableItems = this.tableItems.filter(
            row => parseFloat(row.neg_log_pvalue) >= negLogCutoff
          );
          this.prevFilters = filters;
          setIsLoading(false);
          return; // no backend call
        }

        let url = "";
        if (filters.mode === "default") {
          // get all variants that pass p-value cutoff also default with cutoff 0.05
          this.downloadName = `${this.pheno}_${filters.pvalCutoff}`;
          url = `${API_BASE_URL}/trait_get_variants/?trait=${encodeURIComponent(this.pheno)}&pval_cutoff=${encodeURIComponent(filters.pvalCutoff)}`;
        } else if (filters.mode === "rsid") {
          // get all variants in range of given variant that pass pval cutoff
          this.downloadName = `${this.pheno}_${filters.varid}_${filters.neighborRange}_${filters.pvalCutoff}`;
          url = `${API_BASE_URL}/trait_get_variants/?trait=${encodeURIComponent(this.pheno)}&varid=${encodeURIComponent(filters.varid)}&range=${encodeURIComponent(filters.neighborRange)}&pval_cutoff=${encodeURIComponent(filters.pvalCutoff)}`;
        } else if (filters.mode === "chromosome") {
          // get all variants in given chromosome range that pass pval cutoff
          this.downloadName = `${this.pheno}_${filters.chr}_${filters.start}_${filters.end}_${filters.pvalCutoff}`;
          url = `${API_BASE_URL}/trait_get_variants/?trait=${encodeURIComponent(this.pheno)}&chr=${encodeURIComponent(filters.chr)}&start=${encodeURIComponent(filters.start)}&end=${encodeURIComponent(filters.end)}&pval_cutoff=${encodeURIComponent(filters.pvalCutoff)}`;
        }

        const res = await fetch(url);
        const json = await res.json();
        this.tableItems = Object.values(json.rows).map((row, index) => ({
          ...row,
        }));
        this.tableHeader = json.header;
        this.prevFilters = filters;

        // Add ID column first
      } catch (err) {
        console.error("Error fetching variants:", err);
      }
      setIsLoading(false);
    }
  },
}


</script>
<style scoped>

</style>

