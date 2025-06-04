<template>
  <v-container>
    <v-data-table
        :headers="headers"
        :items="items"
        :items-per-page="5"
        item-value="ID"
        class="elevation-1"
    >
    </v-data-table>
  </v-container>
</template>

<script>
import LocusZoom from "locuszoom";
import 'locuszoom/dist/locuszoom.css'
import {API_BASE_URL} from "@/config.js";

export default {
  name: "VariantVEPAnnotation",
  props: {
    variantId: {
      type: String,
      required: true,
    }
  },
  data: () => ({
    headers: [],
    items: [],
    //visibleKeys: ["ID", "Allele", "Consequence", "IMPACT", "SYMBOL", "Feature_Type", "Feature", "BIOTYPE"],
    expandedItems: []
  }),
  methods: {
    async renderVEPAnnotationTable() {
      const query = encodeURIComponent(this.variantId);
      const res = await fetch(`${API_BASE_URL}/variant_annotation/?id=${query}`);
      const json = await res.json();
      this.items = json.rows;
      this.items = json.rows.map((row, index) => ({
        ...row,
        ID: index + 1, // Use index as a unique identifier
      }));
      this.headers = ["ID", ...json.header]
          .map(key => ({title: key,key}));
    },

    getHiddenFields(item) {
      const hidden = {};
      for (const key in item) {
        if (!this.visibleKeys.includes(key)) {
          hidden[key] = item[key];
        }
      }
      return hidden;
    },

    isItemExpanded(item) {
      return this.expandedItems.includes(item.ID); // Or use item.id if more appropriate
    },

    toggleItemExpand(item) {
      const index = this.expandedItems.indexOf(item.ID);
      if (index >= 0) {
        this.expandedItems.splice(index, 1);
      } else {
        this.expandedItems.push(item.ID);
      }
    }
  },

  mounted() {
    this.renderVEPAnnotationTable();
  }
}


</script>

