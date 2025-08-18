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
                    label="rsID"
                    density="comfortable"
                    variant="outlined"
                    @input="refine(rsid)"
                    persistent-placeholder
                    style="color:rgb(var(--v-theme-primary-darken-1))"
                  />
                  <!--prepend-inner-icon="mdi-magnify"-->

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
          label="P-value cutoff"
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

import { TYPESENSE_HOST, TYPESENSE_PORT } from "@/config.js";
import AutocompleteVariant from "@/components/trait/AutocompleteVariant.vue";


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
};
</script>