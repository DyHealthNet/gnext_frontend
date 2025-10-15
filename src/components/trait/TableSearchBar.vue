<template>
  <v-container>
    <!-- Tabs for selecting search mode -->
    <v-row class="mb-2 align-center">
      <v-col cols="12" class="d-flex align-center">
        <v-tabs v-model="searchMode" align-tabs="center">
          <v-tab value="loci">All Top Loci</v-tab>
          <v-tab value="pval">By P-Value</v-tab>
          <v-tab value="rsid">By SNP ID</v-tab>
          <v-tab value="chromosome">By Chromosome Range</v-tab>
        </v-tabs>
      </v-col>
    </v-row>

    <!-- Tab contents -->
    <!-- loci tab -->
    <v-window v-model="searchMode">
      <!-- loci tab -->
      <v-window-item value="loci">
        Showing all top loci of the current trait. Only peaks with a p-value < 10⁻⁶ will be returned.
            Variants are excluded if another variant within 500kb of the same trait has a smaller p-value.
      </v-window-item>

      <!-- pval tab -->
      <v-window-item value="pval">
        Showing variants that pass the p-value cutoff (max. 10,000 variants)
      </v-window-item>

      <!-- rsID tab -->
      <v-window-item value="rsid">
        Showing variants that match the selected SNP ID, variants within the specified neighbor range (bp) and pass the p-value cutoff.

        <v-row class="pt-4">
          <v-col cols="12" md="6">
            <AutocompleteVariant
                @update-variant="({ rsid, varid }) => {
                this.rsid = rsid;
                this.varid = varid;
              }"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
                v-model="neighborRange"
                label="Neighbor Range (bp)"
                ref="rangeField"
                type="number"
                density="comfortable"
                variant="outlined"
                :rules="rangeRules()"
                persistent-placeholder
            />
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Chromosome range tab -->
      <v-window-item value="chromosome">
        Showing variants on the specified chromosome and position range that pass the p-value cutoff.
        <v-row class="pt-4">
          <v-col cols="12" md="4">
            <v-text-field
                v-model="chr"
                label="Chromosome"
                ref="chrField"
                density="comfortable"
                variant="outlined"
                :rules="chrRules()"
                persistent-placeholder
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
                v-model="startPos"
                label="Start Position"
                ref="startField"
                type="number"
                density="comfortable"
                variant="outlined"
                :rules="startRules()"
                persistent-placeholder
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
                v-model="endPos"
                label="End Position"
                ref="endField"
                type="number"
                density="comfortable"
                variant="outlined"
                :rules="endRules()"
                persistent-placeholder
            />
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>

    <!-- P-value cutoff -->
    <v-row v-if="searchMode !== 'loci'" class="pt-4">
      <v-col cols="12" md="6">
        <v-text-field
            v-model="pvalCutoff"
            label="P-Value Cutoff"
            ref="pvalField"
            type="number"
            step="0.01"
            :max="maxPvalForMode"
            :rules="pvalRules()"
            density="comfortable"
            variant="outlined"
            persistent-placeholder
        />
      </v-col>
    </v-row>

    <!-- Submit button -->
    <v-row v-if="searchMode !== 'loci'">
  <v-col>
    <v-btn color="primary" @click="applyFilters">
      Submit Query
    </v-btn>
  </v-col>
</v-row>
  </v-container>
</template>

<script>
import {API_BASE_URL, GENOME_BUILD} from "@/config.js";
import AutocompleteVariant from "@/components/trait/AutocompleteVariant.vue";
import {setIsLoading} from "@/components/constants.js";
import {compressChromosomes} from "@/utils/utils.js"


export default {
  name: "TraitSearchBar",
  components: {AutocompleteVariant},
  emits: ["apply-filters"],
  props: {
    pheno: {type: String, required: true},
  },
  data() {
    return {
      searchMode: "loci",
      rsid: "",
      varid: "",
      neighborRange: 5000,
      chr: null,
      startPos: null,
      endPos: null,
      pvalCutoff: 0.05,
    };
  },
  mounted() {
    this.getChromosomeBounds();
    try {
      this.applyFilters();
    } catch (err) {
      console.error("Error applying filters during component mount:", err);
    }
  },
  watch: {
    pheno() {
      this.applyFilters();
    },
    searchMode() {
      const max = this.maxPvalForMode;
      if (this.pvalCutoff > max) {
        this.pvalCutoff = max;
      }
      if (this.pvalCutoff < 0) {
        this.pvalCutoff = 0;
      }
    },
  },
  methods: {
    pvalRules() {
      return [
          v => !!v || 'Required',
        v => (Number(v) >= 0 && Number(v) <= this.maxPvalForMode) ? true : `Must be between 0 and ${this.maxPvalForMode}`
      ];
    },
    rangeRules() {
      return [
        v => !!v || 'Required',
        v => Number(v) >= 0 || 'Must be greater than 0',
        v => Number(v) <= 100000000 || 'Must be smaller than 100,000,000',
      ];
    },
    chrRules() {
      const validChroms = Object.keys(this.chromosomeBounds);
      const display = compressChromosomes(validChroms);
      return [
        v => !!v || 'Required',
         v => validChroms.includes(v) ? true : `Must be one of: ${display}`,
      ];
    },
    startRules() {
      return [
        v => !!v || 'Required',
        v => (Number(v) > 0) ? true : 'Must be greater than 0',
        v => (!this.endPos || Number(v) < this.endPos) ? true : 'Must be less than End Position',
        v => (Number(v) >= this.currentBounds.min) ? true : `Min possible value is ${this.currentBounds.min}`,
        v => (Number(v) <= this.currentBounds.max) ? true : `Max possible value is ${this.currentBounds.max}`,
      ];
    },
    endRules() {
      return [
        v => !!v || 'Required',
        v => (!this.startPos || Number(v) > this.startPos) ? true : 'Must be greater than Start Position',
        v => (Number(v) >= this.currentBounds.min) ? true : `Min possible value is ${this.currentBounds.min}`,
        v => (Number(v) <= this.currentBounds.max) ? true : `Max possible value is ${this.currentBounds.max}`,
      ];
    },
    async applyFilters() {
      // Map each mode to the refs/validation fields it cares about
      const modeValidations = {
        chromosome: ['startField', 'endField', 'chrField', 'pvalField'],
        rsid: ['rangeField', 'pvalField'],
        pval: ['pvalField'],
        loci: [], // no validation
      };

      const refsToCheck = modeValidations[this.searchMode] || [];

      let allValid = true;
      for (const refName of refsToCheck) {
        const ref = this.$refs[refName];
        if (!ref) {
          // Refs not ready yet → skip validation for now
          allValid = true;
          break;
        }
        const result = await ref.validate();
        if (Array.isArray(result) && result.length > 0) {
          allValid = false;
          break;
        }
      }

      if (!allValid) return; // stop if validation fails
      if (this.searchMode === "rsid" && !this.varid) return; // stop if entered snp is not selected with typesense and therefore invalid

      // Emit once for all modes
      this.$emit("apply-filters", {
        mode: this.searchMode,
        rsid: this.rsid,
        varid: this.varid,
        neighborRange: this.neighborRange,
        chr: this.chr,
        start: this.startPos,
        end: this.endPos,
        pvalCutoff: this.pvalCutoff,
      });
    },
    async getChromosomeBounds() {
      try {
        let url = `${API_BASE_URL}/trait_get_chromosomeBounds/?trait=${encodeURIComponent(this.pheno)}`;

        const res = await fetch(url);
        const json = await res.json();
        this.chromosomeBounds = json;
      } catch (err) {
        console.error("Error fetching chromosome bounds:", err);
      }
    }
  },
  computed: {
    currentBounds() {
      return this.chromosomeBounds[this.chr] || { min: 0, max: 0 };
    },
    maxPvalForMode() {
      return this.searchMode === "pval" ? 0.05 : 1;
    },
  },
};
</script>