<template>
  <v-container width="30%" style="background:rgb(var(--v-theme-surface)); border-radius: 10px; padding: 20px;">
    <ais-instant-search :search-client="searchClient" index-name="autocomplete">
      <ais-autocomplete>
        <template #default="{ currentRefinement, refine, indices, indicesAreEmpty }">
          <v-text-field
              v-model="searchQuery"
              ref="searchActivator"
              label="Search for a trait or a variant"
              prepend-inner-icon="mdi-magnify"
              outlined
              dense
              hide-details
              @input="refine(searchQuery)"
              style="color:rgb(var(--v-theme-primary-darken-1))"
          ></v-text-field>

          <v-menu
              v-model="menu"
              :activator="searchActivator"
              offset-y
              transition="scale-transition"
              attach="body"
          >
            <v-list>
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
                            :src="hit.type === 'trait' ? phenotypeIcon : variantIcon"
                            alt="Icon"
                            max-width="32"
                            max-height="32"
                            contain
                        />

                      </v-avatar>
                    </v-col>
                    <v-col>
                      <v-list-item-title>
                        <span v-html="hit._highlightResult.description.value"/>
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        <template v-if="hit.type === 'trait'">
                          <span v-html="hit._highlightResult.id.value"></span> -
                          <span v-html="hit._highlightResult.category.value"></span>
                        </template>
                        <template v-else-if="hit.type === 'variant'">
                          <span v-html="hit._highlightResult.external_ref.value"></span>
                        </template>
                      </v-list-item-subtitle>
                    </v-col>
                  </v-row>
                </v-list-item>
              </template>
              <template v-else-if="currentRefinement && (!indices.length || !indices[0].hits.length)">
                <v-list-item>
                  <v-list-item-title>No results found !</v-list-item-title>
                </v-list-item>
              </template>
            </v-list>
          </v-menu>
        </template>
      </ais-autocomplete>
    </ais-instant-search>
  </v-container>
</template>

<script setup>
import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";
import {ref} from "vue";

import phenotypeIcon from "@/assets/figures/phenotypes.png";
import variantIcon from "@/assets/figures/genetic_variants.png"

import {useRouter} from "vue-router";

const router = useRouter();

// Define props
const props = defineProps({
  typeFilter: {
    type: String,
    required: false,
    default: null,
  }
});


const searchQuery = ref("");
const menu = ref(false);
const hits = ref([]);
const searchActivator = ref(null);

// Setup Typesense config object so we can update it reactively
const searchParams = ref({
  query_by: "description,external_ref,category",
  num_typos: 0,
  drop_tokens_threshold: 1.0,
});

const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: "xyz",
    nodes: [
      {
        host: "10.162.163.34",
        path: "",
        port: "8108",
        protocol: "http",
      },
    ],
    cacheSearchResultsForSeconds: 120,
  },
  additionalSearchParameters: searchParams.value,
});

const searchClient = typesenseInstantsearchAdapter.searchClient;

function goToHit(hit) {
  if (hit.type === "variant") {
    router.push(`/variant/${encodeURIComponent(hit.id)}`);
    // remove text from v-text-field
    searchQuery.value = "";
    this.hits = [];
  } else if (hit.type === "trait") {
    router.push(`/trait/${hit.description}`);
    searchQuery.value = "";
    this.hits = [];
  }
};

</script>

<style scoped>
.clickable {
  cursor: pointer;
}
</style>