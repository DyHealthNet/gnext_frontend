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
      prev_mode: "",
      prev_pvalCutoff: 0.5,
      showLoading: isLoading,
      downloadName: ""
    }
  },
  methods: {
    async onApplyFilters(filters) {
      setIsLoading(true);
      try {
        if (filters.pvalCutoff < this.prev_pvalCutoff) {
          const negLogCutoff = -Math.log10(filters.pvalCutoff);
          // Filter frontend items
          this.tableItems = this.tableItems.filter(
            row => parseFloat(row.neg_log_pvalue) >= negLogCutoff
          );
          this.prev_pvalCutoff = filters.pvalCutoff;
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
        this.prev_mode = filters.mode;
        this.prev_pvalCutoff = filters.pvalCutoff;

        // Add ID column first
      } catch (err) {
        console.error("Error fetching variants:", err);
      }
      setIsLoading(false);
    }
  },
}


</script>

