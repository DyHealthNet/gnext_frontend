<!-- AutocompleteResult.vue -->
<template>
  <v-list v-if="currentRefinement" class="mt-2">
    <template v-if="indices.length && indices[0].hits.length">
      <v-list-item
        v-for="hit in indices[0].hits.filter(h => h.type === 'variant')"
        :key="hit.objectID"
        @click="selectRsid(hit, refine)"
        class="clickable"
      >
        <v-row no-gutters align="center">
          <v-col cols="auto">
            <v-avatar size="40">
              <v-img
                :src="variantIcon"
                alt="Variant Icon"
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
              <span v-html="hit._highlightResult.external_ref.value"></span>
            </v-list-item-subtitle>
          </v-col>
        </v-row>
      </v-list-item>
    </template>
    <template v-else>
      <v-list-item>
        <v-list-item-title>No results found!</v-list-item-title>
      </v-list-item>
    </template>
  </v-list>
</template>

<script>
import {ref} from "vue";
import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";
import {TYPESENSE_HOST, TYPESENSE_PORT} from "@/config.js";
import variantIcon from "@/assets/figures/genetic_variants.png"

export default {
  props: ["currentRefinement", "indices", "refine", "rsid", "varid"],
  data() {
    return {
      variantIcon: variantIcon,
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
      selectRsid(hit, refine) {
        if (hit.type === "variant") {
          // populate the rsid field with external_ref (or hit.id)
          this.$emit('update-variant', { rsid: hit.external_ref, varid: hit.id });
          refine(''); // clear the search box suggestions
        }
      },
    },
  };
</script>