<template>
  <v-container>
    <v-card outlined class="d-flex flex-column h-100 pa-4" style="min-height: 300px;">
      <!-- pa-4 adds padding around the card content -->
      <v-toolbar color="primary-darken-1" density="compact">
        <v-toolbar-title>Variant Information</v-toolbar-title>
      </v-toolbar>

      <v-row>
        <v-col cols="12">
          <TableSearchBar @apply-filters="onApplyFilters" ></TableSearchBar>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <VariantsGwasAnnotation :headers="tableHeader" :items="tableItems"></VariantsGwasAnnotation>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script>
import 'locuszoom/dist/locuszoom.css'
import {API_BASE_URL} from "@/config.js";
import VariantsGwasAnnotation from "@/components/trait/VariantsGWASAnnotation.vue";
import TableSearchBar from "@/components/trait/TableSearchBar.vue";


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
    }
  },
  methods: {
    async onApplyFilters(filters) {
      try {
        let url = "";

        if (filters.mode === "rsid") {
          // Case 1: Query by rsID + neighbor range
          const query = encodeURIComponent(filters.rsid);
          url = `${API_BASE_URL}/trait_get_variants/?trait=${this.pheno}&varid=${filters.varid}&range=${filters.neighborRange}&pval_cutoff=${filters.pvalCutoff}`;
        } else if (filters.mode === "chromosome") {
          // Case 2: Query by chromosome range
          url = `${API_BASE_URL}/trait_get_variants/?trait=${this.pheno}&chr=${filters.chr}&start=${filters.start}&end=${filters.end}&pval_cutoff=${filters.pvalCutoff}`;
        }

        const res = await fetch(url);
        const json = await res.json();
        this.tableItems = json.rows.map((row, index) => ({
          ...row,
          ID: index + 1, // Use index as a unique identifier
        }));
        this.tableHeader = json.header.map((key) => ({
          title: key,
          key: key
        }));

        // Add ID column first
        //this.tableHeader.unshift({ title: "ID", key: "ID" });
      } catch (err) {
        console.error("Error fetching variants:", err);
      }
    }
  },
}


</script>

