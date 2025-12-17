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
        <v-col cols="12" sm="5" md="3" lg="2">
          <v-btn color="primary" @click="applyMAGMATableFiltering" :disabled="!isValidPValue" block height="48px"
                 prepend-icon="mdi-send-circle-outline">
            Apply Filtering
          </v-btn>
        </v-col>
        <v-col cols="12" sm="5" md="3" lg="2">
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

        <v-col cols="12" sm="5" md="3" lg="2">
          <v-btn color="primary" @click="addGeneList" :disabled="!isValidGeneListName" block height="48px"
                 prepend-icon="mdi-plus">
            Seed Lists
          </v-btn>
        </v-col>

        <v-col cols="12" sm="5" md="3" lg="2">
               <v-btn color="primary" @click="moveToSeedsPage" block height="48px"
             prepend-icon="mdi-open-in-new">
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
    isValidPValue() {
      return this.pvalCutoff >= 0 && this.pvalCutoff <= 1;
    },

    isValidGeneListName() {
      return this.geneNameList.trim().length > 0 & this.tableItems.length > 0;
    }
  },

  async mounted() {
    await this.loadAvailableChromosomes()
  },

  watch: {
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

    resetMAGMATableFiltering() {
      this.selectedChr = null;
      this.pvalCutoff = 1;
      this.selectedChr = null;
      this.tableItems = this.magmaResults.map((d, i) => ({...d, x: i}));
    },

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