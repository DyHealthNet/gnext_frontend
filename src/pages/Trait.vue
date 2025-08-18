<template>
  <v-app>
      <v-main>
      <v-container>
        <v-row  class="text-center">
          <v-col cols="12">
            <h1 class="title mt-4">Trait View - {{id}}</h1>
          </v-col>
        </v-row>

        <v-row>
          <v-col class="d-flex justify-center">
            <v-divider class="my-2" thickness="2"></v-divider>
          </v-col>
        </v-row>

        <ManhattanPlot :traitId="id" :key="`manhattan-${id}`" />

        <QQPlot :traitId="id" :key="`qq-${id}`" />

        <v-row>
          <v-col cols="12" style="padding:0px">
            <PhenotypeSNPTable :pheno="id"></PhenotypeSNPTable>
          </v-col>
        </v-row>

      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { useRoute} from 'vue-router';
import ManhattanPlot from "@/components/trait/Manhattan.vue";
import QQPlot from "@/components/trait/QQ.vue";
import { ref, watch } from 'vue';
import PhenotypeSNPTable from "@/components/trait/PhenotypeSNPTable.vue";


export default {
  name: 'Trait',
  components: {
    PhenotypeSNPTable,
    ManhattanPlot,
    QQPlot
  },
  setup() {
    const route = useRoute();
    const id = ref(decodeURIComponent(route.params.id));

    // Watch for route param change
     watch(() => route.params.id, (newId, oldId) => {
      if (newId !== oldId) {
        id.value = decodeURIComponent(newId);
      }
    });

    return{id};
  },
}
</script>