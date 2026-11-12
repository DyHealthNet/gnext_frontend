<template>
  <ais-instant-search :search-client="searchClient" index-name="autocomplete">
    <ais-autocomplete>
      <template #default="{ currentRefinement, refine, indices }">
        <v-text-field
            v-model="searchQuery"
            ref="searchActivator"
            :label="label"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            :disabled="disabled"
            :hint="hint"
            persistent-hint
            @input="onInput(refine)"
            @focus="menu = true"
            @click="menu = true"
        ></v-text-field>

        <v-menu
            v-model="menu"
            :activator="searchActivator"
            :open-on-click="false"
            offset-y
            transition="scale-transition"
            attach="body"
        >
          <v-list>
            <template v-if="indices.length && indices[0].hits.length">
              <v-list-item
                  v-for="hit in indices[0].hits"
                  :key="hit.objectID"
                  :disabled="excludeIds.includes(hit.id)"
                  @click="selectHit(hit)"
                  class="clickable"
              >
                <v-row no-gutters align="center">
                  <v-col cols="auto">
                    <v-avatar size="40">
                      <v-img :src="phenotypeIcon" alt="Trait" max-width="32" max-height="32" contain/>
                    </v-avatar>
                  </v-col>
                  <v-col>
                    <v-list-item-title>
                      <span v-html="hit._highlightResult.id.value"/>
                      <span v-if="excludeIds.includes(hit.id)" class="text-caption"> (selected)</span>
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      <span v-html="hit._highlightResult.description.value"></span> -
                      <span v-html="hit._highlightResult.category.value"></span>
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
</template>

<script setup>
/**
 * Trait-only search autocomplete (Typesense + Algolia InstantSearch) for
 * picking traits, e.g. on the Trait Overview page.
 *
 * Same search setup and look as the navbar / Network Medicine search boxes,
 * but restricted to `type:=trait`, and instead of navigating it emits
 * `select` with `{id, description, category}` and clears itself. Traits in
 * `excludeIds` (already picked) are shown but disabled.
 */
import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";
import {ref, computed} from "vue";
import phenotypeIconWhite from "@/assets/figures/node_phenotype_white.png"
import phenotypeIconBlack from "@/assets/figures/node_phenotype_black.png"
import {TYPESENSE_API_KEY} from "@/config.js";

defineProps({
  label: {type: String, default: "Search for a trait"},
  disabled: {type: Boolean, default: false},
  hint: {type: String, default: ""},
  /** Trait IDs that are already selected (listed but not selectable). */
  excludeIds: {type: Array, default: () => []},
});
const emit = defineEmits(["select"]);

const searchQuery = ref("");
const menu = ref(false);
const searchActivator = ref(null);

const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: TYPESENSE_API_KEY,
    nodes: [
      {
        host: window.location.hostname,
        path: "/typesense",
        port: window.location.port,
        protocol: window.location.protocol.replace(":", ""),
      },
    ],
    cacheSearchResultsForSeconds: 120,
  },
  additionalSearchParameters: {
    query_by: "label,description,category",
    num_typos: 0,
    drop_tokens_threshold: 1.0,
    filter_by: "type:=trait",
  },
});

const searchClient = typesenseInstantsearchAdapter.searchClient;

/**
 * Runs the search and opens the results menu. The menu opens on focus/click
 * (showing trait suggestions for the empty query, like the navbar search) and
 * on typing -- the latter so a second trait can be searched right after a
 * pick, when the field keeps focus and no new click happens.
 * @param {Function} refine - InstantSearch refine callback.
 */
function onInput(refine) {
  refine(searchQuery.value);
  menu.value = true;
}

/** Emits the picked trait and resets the search box. @param {object} hit - Selected trait hit. */
function selectHit(hit) {
  emit("select", {id: hit.id, description: hit.description, category: hit.category});
  searchQuery.value = "";
  menu.value = false;
}

const phenotypeIcon = computed(() =>
    localStorage.getItem('theme') === 'dyHealthNetThemeDark' ? phenotypeIconWhite : phenotypeIconBlack
);
</script>

<style scoped>
.clickable {
  cursor: pointer;
}
</style>
