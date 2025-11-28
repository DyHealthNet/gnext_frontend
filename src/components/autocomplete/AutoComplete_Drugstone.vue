<template>
  <v-container width="100%" style="background:rgb(var(--v-theme-surface)); border-radius: 10px; padding: 20px;">
    <ais-instant-search :search-client="searchClient" index-name="autocomplete">
      <ais-autocomplete>
        <template #default="{ currentRefinement, refine, indices, indicesAreEmpty }">
          <v-text-field
              v-model="searchQuery"
              ref="searchActivator"
              label="Search for a gene"
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
                            :src="geneIcon"
                            alt="Icon"
                            max-width="32"
                            max-height="32"
                            contain
                        />

                      </v-avatar>
                    </v-col>
                    <v-col>
                      <v-list-item-title>
                        <span v-html="hit._highlightResult.id.value"/>
                      </v-list-item-title>
                      <v-list-item-subtitle>
                         <span v-html="hit._highlightResult.external_ref.value"></span> -
                        <span v-html="hit._highlightResult.description.value"></span>
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
import {ref, computed} from "vue";

import geneIconBlack from "@/assets/figures/node_gene_black.png"
import geneIconWhite from "@/assets/figures/node_gene_white.png"
import {TYPESENSE_API_KEY} from "@/config.js";


import {useRouter} from "vue-router";

const router = useRouter();

// Define props
const props = defineProps({
  typeFilter: {
    type: String,
    required: false,
    default: null,
  },
  trait: {
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
  query_by: "label,description,external_ref,category",
  num_typos: 0,
  drop_tokens_threshold: 1.0,
  filter_by: "type:=gene",
});

const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: TYPESENSE_API_KEY,
    nodes: [
      {
        host: window.location.hostname,
        path: "/typesense",
        port:window.location.port,
        protocol: window.location.protocol.replace(":",""),
      },
    ],
    cacheSearchResultsForSeconds: 120,
  },
  additionalSearchParameters: searchParams.value,
});

const searchClient = typesenseInstantsearchAdapter.searchClient;

function goToHit(hit) {
    // If trait is provided, pass it as a query parameter
    if (props.trait) {
      router.push({
        path: `/gene/${hit.id}`,
        query: { trait: props.trait }
      });
      console.log("Navigating to gene with trait:", props.trait);
    } else {
      router.push(`/gene/${hit.id}`);
    }
    searchQuery.value = "";
    this.hits = [];
};


const geneIcon = computed(() =>
    localStorage.getItem('theme') === 'dyHealthNetThemeDark' ? geneIconWhite : geneIconBlack
);

</script>

<style scoped>
.clickable {
  cursor: pointer;
}
</style>