<template>
  <v-container>
    <v-row>
      <v-col>
      <TableSearchBarGWAS :pheno="pheno" @apply-filters="onApplyFilters"></TableSearchBarGWAS>
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
              loci: "Top Loci",
              pval: "P-Value",
              rsid: "SNP ID",
              chromosome: "Chromosome Range"
            }[prevFilters.mode] || prevFilters.mode
          }}
          </v-chip>
          <v-chip v-if="prevFilters.mode !== 'loci'" color="primary-darken-1" text-color="white" small :ripple="false" class="filter-chip mr-2">
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
      <TableSkeleton :headers="tableHeader" :rows="tableItems" :downloadName="downloadName"
                              :priorityOrder="priorityOrder"
                              :globalFilterFields="tableHeader" :selectedTrait="pheno"></TableSkeleton>
        </v-col>
    </v-row>

  </v-container>
</template>

<script>
import 'locuszoom/dist/locuszoom.css'
import {API_BASE_URL} from "@/config.js";
import TableSkeleton from "@/components/TableSkeleton.vue";
import TableSearchBarGWAS from "@/components/trait/TableSearchBarGWAS.vue";
import {isLoading, setIsLoading} from "@/components/constants.js";


export default {
  name: "PhenotypeSNPTable",
  components: {TableSkeleton, TableSearchBarGWAS},
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
      downloadName: "",
      priorityOrder: ["variant_id", "nearest_genes","beta", "stderr_beta", "alt_allele_freq", "pvalue", "neg_log_pvalue"],
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
        if (filters.mode === "loci") {
          // get all variants that pass p-value cutoff also default with cutoff 0.05
          this.downloadName = `${this.pheno}_top_loci`;
          url = `${API_BASE_URL}/trait_get_variants/?id=${encodeURIComponent(this.pheno)}&mode=${encodeURIComponent(filters.mode)}`;
        } else if (filters.mode === "pval") {
          // get all variants in range of given variant that pass pval cutoff
          this.downloadName = `${this.pheno}_pval_cutoff_${filters.pvalCutoff}`;
          url = `${API_BASE_URL}/trait_get_variants/?id=${encodeURIComponent(this.pheno)}&mode=${encodeURIComponent(filters.mode)}&pval_cutoff=${encodeURIComponent(filters.pvalCutoff)}`;
        } else if (filters.mode === "rsid") {
          // get all variants in range of given variant that pass pval cutoff
          this.downloadName = `${this.pheno}_id_${filters.varid}_range_${filters.neighborRange}_pval_cutoff_${filters.pvalCutoff}`;
          url = `${API_BASE_URL}/trait_get_variants/?id=${encodeURIComponent(this.pheno)}&mode=${encodeURIComponent(filters.mode)}&varid=${encodeURIComponent(filters.varid)}&range=${encodeURIComponent(filters.neighborRange)}&pval_cutoff=${encodeURIComponent(filters.pvalCutoff)}`;
        } else if (filters.mode === "chromosome") {
          // get all variants in given chromosome range that pass pval cutoff
          this.downloadName = `${this.pheno}_chr_${filters.chr}_range_${filters.start}_${filters.end}_pval_cutoff_${filters.pvalCutoff}`;
          url = `${API_BASE_URL}/trait_get_variants/?id=${encodeURIComponent(this.pheno)}&mode=${encodeURIComponent(filters.mode)}&chr=${encodeURIComponent(filters.chr)}&start=${encodeURIComponent(filters.start)}&end=${encodeURIComponent(filters.end)}&pval_cutoff=${encodeURIComponent(filters.pvalCutoff)}`;
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

