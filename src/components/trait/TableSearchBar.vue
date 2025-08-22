<template>
  <v-container>
    <!-- Tabs for selecting search mode -->
  <v-row class="mb-4 align-center">
    <v-col cols="12" class="d-flex align-center">
        <v-tabs v-model="searchMode" align-tabs="center">
          <v-tab value="rsid">SNP</v-tab>
          <v-tab value="chromosome">Chromosome Range</v-tab>
        </v-tabs>
      </v-col>
    </v-row>

    <!-- Tab contents -->
    <v-window v-model="searchMode">
      <!-- rsID tab -->
      <v-window-item value="rsid">
        <v-row class="pt-4">
          <v-col cols="12" md="6">
            <ais-instant-search :search-client="searchClient" index-name="autocomplete">
              <ais-autocomplete>
                <template #default="{ currentRefinement, refine, indices }">
                  <v-text-field
                    v-model="rsid"
                    label="Variant"
                    density="comfortable"
                    variant="outlined"
                    @input="refine(rsid)"
                    persistent-placeholder
                    style="color:rgb(var(--v-theme-primary-darken-1))"
                  />
                  <AutocompleteVariant
                    :currentRefinement="currentRefinement"
                    :indices="indices"
                    :refine="refine"
                    :rsid="rsid"
                    :varid="varid"
                    @update-variant="({ rsid, varid }) => {
                      this.rsid = rsid;
                      this.varid = varid;
                    }"
                  />
                </template>
              </ais-autocomplete>
            </ais-instant-search>
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
              :min="currentBounds.min"
              :max="currentBounds.max"
              :rules="[
                v => !!v || 'Required',
                v => v > 0 || 'Must be greater than 0',
                v => !endPos || v < endPos || 'Must be less than End Position'
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
              :min="currentBounds.min"
              :max="currentBounds.max"
              :rules="[
                v => !!v || 'Required',
                v => !startPos || v > startPos || 'Must be greater than Start Position'
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
import { ref } from "vue";
import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";
import { GENOME_BUILD } from "@/config.js";   // 👈 import once


import { TYPESENSE_HOST, TYPESENSE_PORT } from "@/config.js";
import AutocompleteVariant from "@/components/trait/AutocompleteVariant.vue";
import process from "locuszoom/.eslintrc.js";


export default {
  name: "TraitSearchBar",
  components: {AutocompleteVariant},
  emits: ["apply-filters"],
  props: {
    variantsIn: { type: Object, required: false },
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
      typesense: null,
      searchClient: null,
      chromosomeBounds: {
        GRCh37: {
          "1": { min: 1, max: 249250621 },
          "2": { min: 1, max: 243199373 },
          "3": { min: 1, max: 198022430 },
          "4": { min: 1, max: 191154276 },
          "5": { min: 1, max: 180915260 },
          "6": { min: 1, max: 171115067 },
          "7": { min: 1, max: 159138663 },
          "8": { min: 1, max: 146364022 },
          "9": { min: 1, max: 141213431 },
          "10": { min: 1, max: 135534747 },
          "11": { min: 1, max: 135006516 },
          "12": { min: 1, max: 133851895 },
          "13": { min: 1, max: 115169878 },
          "14": { min: 1, max: 107349540 },
          "15": { min: 1, max: 102531392 },
          "16": { min: 1, max: 90354753 },
          "17": { min: 1, max: 81195210 },
          "18": { min: 1, max: 78077248 },
          "19": { min: 1, max: 59128983 },
          "20": { min: 1, max: 63025520 },
          "21": { min: 1, max: 48129895 },
          "22": { min: 1, max: 51304566 },
          "X": { min: 1, max: 155270560 },
          "Y": { min: 1, max: 59373566 },
          "M": { min: 1, max: 16571 }
        },
        GRCh38: {
          "1": { min: 1, max: 248956422 },
          "2": { min: 1, max: 242193529 },
          "3": { min: 1, max: 198295559 },
          "4": { min: 1, max: 190214555 },
          "5": { min: 1, max: 181538259 },
          "6": { min: 1, max: 170805979 },
          "7": { min: 1, max: 159345973 },
          "8": { min: 1, max: 145138636 },
          "9": { min: 1, max: 138394717 },
          "10": { min: 1, max: 133797422 },
          "11": { min: 1, max: 135086622 },
          "12": { min: 1, max: 133275309 },
          "13": { min: 1, max: 114364328 },
          "14": { min: 1, max: 107043718 },
          "15": { min: 1, max: 101991189 },
          "16": { min: 1, max: 90338345 },
          "17": { min: 1, max: 83257441 },
          "18": { min: 1, max: 80373285 },
          "19": { min: 1, max: 58617616 },
          "20": { min: 1, max: 64444167 },
          "21": { min: 1, max: 46709983 },
          "22": { min: 1, max: 50818468 },
          "X": { min: 1, max: 156040895 },
          "Y": { min: 1, max: 57227415 },
          "M": { min: 1, max: 16569 }
        }
      }
    };
  },
  created() {
    const searchParams = ref({
      query_by: "description,external_ref,category",
      num_typos: 0,
      drop_tokens_threshold: 1.0,
    });
    this.typesense = new TypesenseInstantSearchAdapter({
      server: {
        apiKey: "xyz",
        nodes: [{ host: TYPESENSE_HOST, port: TYPESENSE_PORT, protocol: "http", path: "" }],
        cacheSearchResultsForSeconds: 120,
      },
      additionalSearchParameters: searchParams.value,
    });
    this.searchClient = this.typesense.searchClient
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
  },
  computed: {
    currentBounds() {
      if (!this.chr) {
        return { min: 0, max: 0 };
      }
      return this.chromosomeBounds[GENOME_BUILD][this.chr];
    }
  },
  watch: {
    chr(newChr) {
      if (!newChr) return;
      const { min, max } = this.currentBounds;
      if (this.startPos == null || this.startPos < min) this.startPos = min;
      if (this.endPos == null || this.endPos > max) this.endPos = max;
    }
  },
};
</script>