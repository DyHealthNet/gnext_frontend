<template>
  <v-container class="ma-0">
    <h1>Welcome to My Site</h1>
    <p>This is the home page.</p>
  </v-container>


  <v-container fluid>
    <ais-instant-search :search-client="searchClient" index-name="nodes">
      <ais-autocomplete>
        <template #default="{ currentRefinement, refine, indices, indicesAreEmpty }">
          <v-text-field
              v-model="searchQuery"
              label="Search variants or phenotypes"
              prepend-inner-icon="mdi-magnify"
              outlined
              dense
              class="full-width"
              @input="refine(searchQuery)"
          ></v-text-field>

          <v-list v-if="currentRefinement" class="mt-2">
            <template v-if="indices.length && indices[0].hits.length">
              <v-list-item
                v-for="hit in indices[0].hits"
                :key="hit.objectID"
                @click="goToHit(hit)"
                class="clickable"
              >
                <v-row no-gutters align="center">
                  <v-col cols="auto">
                    <v-avatar size="40">
                      <v-img
                        v-if="hit.type === 'protein'"
                        :src="proteinIcon"
                        alt="Protein"
                        max-width="32"
                        max-height="32"
                        contain
                      />
                      <v-img
                        v-else-if="hit.type === 'variant'"
                        :src="variantIcon"
                        alt="Variant"
                        max-width="32"
                        max-height="32"
                        contain
                      />
                      <v-img
                        v-else
                        :src="phenotypeIcon"
                        alt="Phenotype"
                        max-width="32"
                        max-height="32"
                        contain
                      />
                    </v-avatar>
                  </v-col>
                  <v-col>
                    <v-list-item-title v-html="hit._highlightResult.label.value" />
                    <v-list-item-subtitle>
                      <template v-if="hit.type === 'protein'">
                        <span v-html="hit._highlightResult.description.value"></span> -
                        <span v-html="hit._highlightResult.gene_symbol.value"></span>
                      </template>
                      <template v-else-if="hit.type === 'variant'">
                        <span v-html="hit._highlightResult.internal_id.value"></span>
                      </template>
                    </v-list-item-subtitle>
                  </v-col>
                </v-row>
              </v-list-item>
            </template>
            <template v-else-if="currentRefinement && (!indices.length || !indices[0].hits.length)">
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>No results found !</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-list>
        </template>
      </ais-autocomplete>
    </ais-instant-search>
  </v-container>


</template>

<script setup>
import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";

const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: "xyz",
    nodes: [
      {
        host: "localhost",
        path: "",
        port: "8108",
        protocol: "http",
      },
    ],
    cacheSearchResultsForSeconds: 120,
  },
  additionalSearchParameters: {
    query_by: "label,description,gene_symbol,internal_id",
    num_typos:0,
    drop_tokens_threshold: 1.0,
  },
});

const searchClient = typesenseInstantsearchAdapter.searchClient;

</script>

<script>
import proteinIcon from "@/assets/figures/proteins.png"
import variantIcon from "@/assets/figures/genetic_variants.png"
import phenotypeIcon from "@/assets/figures/phenotypes.png"

export default {
  methods: {
    goToHit(hit) {
      // Change this to your actual navigation logic
      this.$router.push({name: 'HitDetail', params: {id: hit.objectID}});
    }
  }
}
</script>

<style scoped>
.clickable {
  cursor: pointer;
}
</style>
