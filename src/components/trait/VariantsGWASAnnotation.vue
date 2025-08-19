<template>
  <v-container>
    <v-row>
      <v-data-table
          :headers="headers"
          :items="items"
          :items-per-page="5"
          item-value="ID"
          class="elevation-1"
      >
      </v-data-table>
    </v-row>
  </v-container>
</template>

<script>

export default {
  name: "VariantsGWASAnnotation",
  props: {
    headers: {
      type: Array,
      required: true,
      default: () => []   // ensure table has an array
    },
    items: {
      type: Array,
      required: true,
      default: () => []   // ensure table has an array
    }
  },
}


</script>

