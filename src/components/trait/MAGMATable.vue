<template>
  <v-container>

    <v-container>

      <p class="text-body-1 mb-4">
        Input SNPs were mapped to {{ totalGenes }} protein-coding genes.
      </p>

    </v-container>

    <v-container>
      <v-row>
        <v-col cols="12" sm="6" md="5" lg="3">

          <v-text-field
              v-model="pvalCutoff"
              label="Bonferroni Pvalue Threshold"
              type="number"
              step="0.01"
              :rules="[
          v => (v >= 0 && v <= 1) || 'Must be between 0 and 1'
        ]"
              density="comfortable"
              variant="outlined"
              persistent-placeholder
          />
        </v-col>

        <v-col cols="12" sm="6" md="5" lg="3">
          <v-select
              v-model="selectedChr"
              label="Filter by Chromosome"
              :items="availableChromosomes"
              density="comfortable"
              variant="outlined"
              persistent-placeholder
              multiple
          />
        </v-col>
        <v-col cols="12" sm="5" md="3" lg="3">
          <v-btn color="primary" @click="applyMAGMATableFiltering" :disabled="!isValidPValue" block height="48px"
                 prepend-icon="mdi-send-circle-outline">
            Apply Filtering
          </v-btn>
        </v-col>
        <v-col cols="12" sm="5" md="3" lg="3">
          <v-btn color="primary" @click="resetMAGMATableFiltering" block height="48px" prepend-icon="mdi-undo">
            Reset
          </v-btn>
        </v-col>

      </v-row>
    </v-container>

    <v-row>
      <v-divider class="my-2" thickness="2"></v-divider>
    </v-row>

    <v-row>
      <v-col>
        <TableSkeleton :headers="magmaColumns" :rows="tableItems" :downloadName="downloadName"
                       :priorityOrder="priorityOrder"
                       :globalFilterFields="magmaColumns" :selectedTrait="traitId" :defaultSortField="bonferroni_pvalue"></TableSkeleton>
      </v-col>
    </v-row>

     <v-row>
      <v-divider class="my-2" thickness="2"></v-divider>
    </v-row>

    <v-container>

       <p class="text-body-1 mb-4 mt-4">
        Add {{this.tableItems.length}} genes as list to seed lists
      </p>
      </v-container>
    <v-container>

      <v-row>
        <v-col cols="3">
       <v-text-field
              v-model="geneNameList"
              label="Gene List Name"
              type="String"
              density="comfortable"
              variant="outlined"
              persistent-placeholder
          />
        </v-col>

        <v-col cols="12" sm="5" md="3" lg="3">
          <v-btn color="primary" @click="addGeneList" :disabled="!isValidGeneListName" block height="48px"
                 prepend-icon="mdi-plus">
            Seed Lists
          </v-btn>
        </v-col>

        <v-col cols="12" sm="6" md="5" lg="3">
               <v-btn color="primary" @click="moveToSeedsPage" block height="48px"
             prepend-icon="mdi-open-in-new" style="white-space: normal">
        Network Medicine
      </v-btn>
        </v-col>
    </v-row>
      </v-container>

    <v-snackbar v-model="showAlert" :color="alertType" timeout="2000">
      {{ alertMessage}}
    </v-snackbar>
  </v-container>
</template>

<script>
/**
 * MAGMA gene-level results table for a trait.
 *
 * Displays the per-gene MAGMA results (filterable by Bonferroni p-value and
 * chromosome) in a TableSkeleton, and lets the user save the resulting gene set
 * as a named "seed list" in localStorage for downstream Network Medicine
 * analysis (with a shortcut to navigate there).
 */
import {API_BASE_URL} from '@/config.js'
import TableSkeleton from "@/components/TableSkeleton.vue";
import {ref} from "vue";

export default {
  name: 'MAGMATable',
  components: {TableSkeleton},
  props: {
    traitId: {type: String, required: true},
    magmaResults: {type: Array, required: true},
    magmaColumns: {type: Array, required: true},
    totalGenes: {type: Number, required: true},
  },
  data() {
    return {
      tableItems: [],
      prevFilters: {},
      downloadName: "",
      pvalCutoff: 0.05,
      selectedChr: null,
      geneNameList: this.traitId,
      availableChromosomes: [],
      showAlert: false,
      alertMessage: "",
      alertType: "success",
      priorityOrder: ["gene_id","gene_symbol","chrom", "start", "end", "#SNPs", "zvalue", "pvalue"],
    }
  },

  computed: {
    /** @returns {boolean} Whether the p-value cutoff is within [0, 1]. */
    isValidPValue() {
      return this.pvalCutoff >= 0 && this.pvalCutoff <= 1;
    },

    /** @returns {boolean} Whether a non-empty gene-list name and at least one gene exist. */
    isValidGeneListName() {
      return this.geneNameList.trim().length > 0 & this.tableItems.length > 0;
    }
  },

  /** Loads the trait's available chromosomes (for the filter) on mount. */
  async mounted() {
    await this.loadAvailableChromosomes()
  },

  watch: {
    // Re-filter the table rows by the current p-value cutoff whenever results change.
    magmaResults: {
      immediate: true,
      deep: true,
      handler(newVal) {
        // apply pval cutoff
        this.tableItems = this.magmaResults.filter(row => row['bonferroni_pvalue'] <= this.pvalCutoff)
          .map((d, i) => ({...d, x: i}));
        this.downloadName = `MAGMA_Results_Trait_${this.traitId}.csv`;
      }
    }
  },

  methods: {
    /** Fetches the trait's chromosome bounds to populate the chromosome filter. */
    async loadAvailableChromosomes() {
      try {
        const url = `${API_BASE_URL}/trait_get_chromosomeBounds/?id=${encodeURIComponent(this.traitId)}`
        const res = await fetch(url)
        const json = await res.json()
        this.availableChromosomes = Object.keys(json)
      } catch (err) {
        console.error("Error fetching chromosome bounds:", err)
      }
    },

    /** Filters the table rows by the current Bonferroni p-value cutoff and selected chromosome(s). */
    async applyMAGMATableFiltering() {
      // filter by Bonferroni pvalue and chromosome
      this.tableItems = this.magmaResults.filter(row => {
        const passPval = row['bonferroni_pvalue'] <= this.pvalCutoff;
        const passChr = this.selectedChr
            ? this.selectedChr.map(c => parseInt(c)).includes(parseInt(row['chrom']))
            : true;
        return passPval && passChr;
      }).map((d, i) => ({...d, x: i}));
    },

    /** Clears the chromosome/p-value filters and restores all rows. */
    resetMAGMATableFiltering() {
      this.selectedChr = null;
      this.pvalCutoff = 1;
      this.selectedChr = null;
      this.tableItems = this.magmaResults.map((d, i) => ({...d, x: i}));
    },

    /** Saves the current table's genes as a named seed list in localStorage (rejecting duplicate names). */
    addGeneList() {
      const name = this.geneNameList.trim()
      if (!name) return
      // retrieve existing gene lists from local storage
      const geneLists = JSON.parse(localStorage.getItem('geneLists') || '{}')
      console.log("Gene Lists from local storage:", geneLists.value);
      // check if gene list name already exists
      if (Object.prototype.hasOwnProperty.call(geneLists, name)) {
        this.alertMessage = `Gene list name "${name}" already exists. Please choose a different name.`
        this.alertType = "error"
        this.showAlert = true
        return
      }

      // add list
      geneLists[name] = { "genes": this.tableItems.map(item => item.gene_symbol), "trait_id": this.traitId}
      localStorage.setItem('geneLists', JSON.stringify(geneLists))

      this.alertMessage = `Gene list "${name}" added successfully with ${this.tableItems.length} genes.`
      this.alertType = "success"
      this.showAlert = true

      // optional reset
      this.geneNameList = ""
    },

    /** Navigates to the Network Medicine page. */
    moveToSeedsPage() {
      this.$router.push('/networkmedicine')
    },
  }

}
</script>

<style scoped>
table {
  border-collapse: collapse;
  width: 100%;
}

th, td {
  border: 1px solid #ddd;
  padding: 6px;
}

th {
  background-color: #f2f2f2;
  font-weight: bold;
}
</style>