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
        <v-row class="pt-4 mb-2">
          <v-col cols="12">
            Showing all Top Loci of the current Trait.
          </v-col>
        </v-row>
      </v-window-item>

      <!-- pval tab -->
      <v-window-item value="pval">
        <v-row class="pt-4">
          <v-col cols="12">
            Showing variants that pass the P-Value Cutoff (max. 10,000 variants)
          </v-col>
        </v-row>
      </v-window-item>

      <!-- rsID tab -->
      <v-window-item value="rsid">
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
                type="number"
                density="comfortable"
                variant="outlined"
                persistent-placeholder
            />
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Chromosome range tab -->
      <v-window-item value="chromosome">
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
            type="number"
            step="0.01"
            :max="maxPvalForMode"
            :rules="[v => (v >= 0 && v <= maxPvalForMode) || `Must be between 0 and ${maxPvalForMode}`]"
            density="comfortable"
            variant="outlined"
            persistent-placeholder
        />
      </v-col>
    </v-row>

    <!-- Submit button -->
    <v-row>
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
      chromosomeBounds: {
        "1": {"min": 11063, "max": 249239495},
        "2": {"min": 10181, "max": 243185846},
        "3": {"min": 60197, "max": 197931768},
        "4": {"min": 11663, "max": 191041711},
        "5": {"min": 11882, "max": 180900286},
        "6": {"min": 151226, "max": 171046503},
        "7": {"min": 27916, "max": 159128550},
        "8": {"min": 34440, "max": 146303560},
        "9": {"min": 11425, "max": 141109216},
        "10": {"min": 60523, "max": 135523249},
        "11": {"min": 103365, "max": 134946451},
        "12": {"min": 70117, "max": 133840247},
        "13": {"min": 19020095, "max": 115109852},
        "14": {"min": 19003034, "max": 107289436},
        "15": {"min": 20001226, "max": 102515926},
        "16": {"min": 60455, "max": 90291868},
        "17": {"min": 302, "max": 81189546},
        "18": {"min": 11275, "max": 78017073},
        "19": {"min": 218215, "max": 59118704},
        "20": {"min": 61098, "max": 62963628},
        "21": {"min": 9412934, "max": 48119634},
        "22": {"min": 16051249, "max": 51238349},
        "X": {"min": 2699555, "max": 154930487}
      }
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
      if (!this.$refs.startField || !this.$refs.endField || !this.$refs.chrField) {
        // Refs not ready yet, skip validation for now
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
        return;
      }
      // check if any rules fail / if there are any rules displayed -> if so deny query
      const startValid = (await this.$refs.startField.validate()).length === 0;
      const endValid   = (await this.$refs.endField.validate()).length === 0;
      const chrValid   = (await this.$refs.chrField.validate()).length === 0;

      if (!startValid || !endValid || !chrValid) return;

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