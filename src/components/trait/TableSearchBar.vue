<template>
  <v-container>
    <!-- Tabs for selecting search mode -->
    <v-row class="mb-2 align-center">
      <v-col cols="12" class="d-flex align-center">
        <v-tabs v-model="searchMode" align-tabs="center">
          <v-tab value="rsid">By SNP ID</v-tab>
          <v-tab value="chromosome">By Chromosome Range</v-tab>
        </v-tabs>
      </v-col>
    </v-row>

    <!-- Tab contents -->
    <v-window v-model="searchMode">
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
                density="comfortable"
                variant="outlined"
                :rules="[
                v => !!v || 'Required',
                v => {
                  if (/^[0-9]+$/.test(v)) {
                    const n = parseInt(v, 10);
                    return n >= 1 && n <= 22 || 'Must be a valid chromosome number (1-22)';
                  }
                  return /^[XY]$/i.test(v) || 'Must be a valid chromosome char (X, Y)';
                }
              ]"
                persistent-placeholder
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
                v-model="startPos"
                label="Start Position"
                type="number"
                density="comfortable"
                variant="outlined"
                :rules="[
                v => !!v || 'Required',
                v => v > 0 || 'Must be greater than 0',
                v => !endPos || v < endPos || 'Must be less than End Position',
                v => v > currentBounds.min || `Min possible value is ${currentBounds.min}`,
                v => v < currentBounds.max || `Max possible value is ${currentBounds.max}`,
              ]"
                persistent-placeholder
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
                v-model="endPos"
                label="End Position"
                type="number"
                density="comfortable"
                variant="outlined"
                :rules="[
                v => !!v || 'Required',
                v => !startPos || v > startPos || 'Must be greater than Start Position',
                v => v > currentBounds.min || `Min possible value is ${currentBounds.min}`,
                v => v < currentBounds.max || `Max possible value is ${currentBounds.max}`,
              ]"
                persistent-placeholder
            />
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>

    <!-- P-value cutoff -->
    <v-row class="pt-4">
      <v-col cols="12" md="6">
        <v-text-field
            v-model="pvalCutoff"
            label="P-Value Cutoff"
            type="number"
            step="0.01"
            :rules="[value => (value >= 0 && value <= 1) || 'Must be between 0 and 1']"
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
import {ref} from "vue";
import {API_BASE_URL, GENOME_BUILD} from "@/config.js";   // 👈 import once


import AutocompleteVariant from "@/components/trait/AutocompleteVariant.vue";
import {setIsLoading} from "@/components/constants.js";


export default {
  name: "TraitSearchBar",
  components: {AutocompleteVariant},
  emits: ["apply-filters"],
  props: {
    pheno: {type: String, required: true},
  },
  data() {
    return {
      searchMode: "rsid",
      rsid: "",
      varid: "",
      neighborRange: 5000,
      chr: null,
      startPos: null,
      endPos: null,
      pvalCutoff: 1.0,
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
  },
  methods: {
    applyFilters() {
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
        console.log("chromosome bounds are updated")
        console.log("these bounds: ", this.chromosomeBounds["1"])
      } catch (err) {
        console.error("Error fetching chromosome bounds:", err);
      }
    }
  },
  computed: {
    currentBounds() {
      if (!this.chr) {
        return {min: 0, max: 0};
      }
      console.log("these bounds: ", this.chromosomeBounds[this.chr])
      return this.chromosomeBounds[this.chr];
    }
  },
};
</script>