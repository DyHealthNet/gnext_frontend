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

        <v-row justify="space-around" align="stretch">
          <v-col xs="6" md="6" lg="3">
            <v-card outlined class="d-flex flex-column h-100" style="min-height: 500px;">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>Trait Profile</v-toolbar-title>
              </v-toolbar>
              <TraitProfile :traitId="id"
                              :traitDescription="description"
                              :traitCategory="category"
                              :traitExternalRef="external_ref"
              ></TraitProfile>
            </v-card>
          </v-col>

          <v-col xs="12" md="12" lg="9">
            <v-card outlined class="d-flex flex-column h-100" style="min-height: 500px;">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>Manhattan Plot</v-toolbar-title>
              </v-toolbar>
              <ManhattanPlot :traitId="id" :key="`manhattan-${id}`" />
            </v-card>
          </v-col>
        </v-row>

           <v-row justify="space-around" align="stretch">
          <v-col xs="6" md="6" lg="3">
            <v-card outlined class="d-flex flex-column h-100" style="min-height: 500px;">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>QQ Plot</v-toolbar-title>
              </v-toolbar>
               <QQPlot :traitId="id" :key="`qq-${id}`" />
            </v-card>
          </v-col>

              <v-col xs="12" md="12" lg="9">
            <v-card outlined class="d-flex flex-column h-100" style="min-height: 500px;">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>GWAS Table</v-toolbar-title>
              </v-toolbar>
              <ManhattanPlot :traitId="id" :key="`manhattan-${id}`" />
            </v-card>
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
import {onMounted, ref, watch} from 'vue';
import TraitProfile from "@/components/trait/TraitProfile.vue";
import {API_BASE_URL} from "@/config.js";


export default {
  name: 'Trait',
  components: {
    TraitProfile,
    ManhattanPlot,
    QQPlot
  },
  setup() {
    const route = useRoute();
    const id = ref(decodeURIComponent(route.params.id));

    watch(() => route.params.id, (newId, oldId) => {
      if (newId !== oldId) {
        id.value = decodeURIComponent(newId);
        fetchTraitData();
      }
    });

    onMounted(() => {
      fetchTraitData();
    });


    const description = ref('');
    const category = ref('');
    const external_ref = ref('');

    const fetchTraitData = () => {
      const query = encodeURIComponent(id.value);
      fetch(`${API_BASE_URL}/trait_info/?id=${query}`)
          .then(response => response.json())
          .then(data => {
            description.value = data["description"]
            category.value = data["category"]
            external_ref.value = data["external_ref"]

          })
          .catch(error => console.error('Error fetching annotation data:', error));
    };
    return{id, description, category, external_ref};
  },
}
</script>