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
                              :priorityOrder="priorityOrder"
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
      showLoading: isLoading,
      downloadName: "",
      priorityOrder:  ["rsid", "variant_id", "chrom", "pos", "ref", "alt"],
    }
  },
  methods: {
    async onApplyFilters(filters) {
      setIsLoading(true);
      try {
        let url = "";

        if (filters.mode === "rsid") {
          this.downloadName = `${this.pheno}_${filters.varid}_${filters.neighborRange}_${filters.pvalCutoff}`;
          // Case 1: Query by rsID + neighbor range
          url = `${API_BASE_URL}/trait_get_variants/?trait=${encodeURIComponent(this.pheno)}&varid=${encodeURIComponent(filters.varid)}&range=${encodeURIComponent(filters.neighborRange)}&pval_cutoff=${encodeURIComponent(filters.pvalCutoff)}`;
        } else if (filters.mode === "chromosome") {
          this.downloadName = `${this.pheno}_${filters.chr}_${filters.start}_${filters.end}_${filters.pvalCutoff}`;
          // Case 2: Query by chromosome range
          url = `${API_BASE_URL}/trait_get_variants/?trait=${encodeURIComponent(this.pheno)}&chr=${encodeURIComponent(filters.chr)}&start=${encodeURIComponent(filters.start)}&end=${encodeURIComponent(filters.end)}&pval_cutoff=${encodeURIComponent(filters.pvalCutoff)}`;
        }

        const res = await fetch(url);
        const json = await res.json();
        this.tableItems = Object.values(json.rows).map((row, index) => ({
          ...row,
        }));
        this.tableHeader = json.header;

        // Add ID column first
      } catch (err) {
        console.error("Error fetching variants:", err);
      }
      setIsLoading(false);
    }
  },
}


</script>

