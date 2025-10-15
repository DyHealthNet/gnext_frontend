<template>
  <v-app>
      <v-main>
      <v-container>
        <v-row  class="text-center">
          <v-col cols="12">
            <h1 class="title mt-4" style="display: inline-flex">
              Trait
              <img
              :src="phenotypeIcon"
              style="width: 50px; height: 50px; margin-left: 10px; margin-right: 10px"
            >
              {{id}}
            </h1>
          </v-col>
        </v-row>

        <v-row>
          <v-col class="d-flex justify-center">
            <v-divider class="my-2" thickness="2"></v-divider>
          </v-col>
        </v-row>

        <v-row justify="space-around" align="stretch">
          <v-col xs="12" md="12" lg="12">
            <v-card outlined class="d-flex flex-column h-100" style="min-height: 100px;">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>Trait Profile</v-toolbar-title>
              </v-toolbar>
              <TraitProfile :traitId="id"
                              :traitDescription="description"
                              :traitCategory="category"
                              :traitExternalRef="external_ref"
                            :traitNumberSamples="nr_samples"
              ></TraitProfile>
            </v-card>
          </v-col>

           <v-col
            v-for="(section, index) in availableCards"
            :key="index"
          >
            <v-btn
              color="primary-darken-1"
              :base-color="section.enabled ? 'primary' : 'grey'"
              :disabled="!section.enabled"
              variant="outlined"
              class="text-none"
              block
              height="70px"
              @click="scrollTo(section.id)"
              style="border-width: 2px;"
            >
              <v-avatar size="40" class="me-2" color="primary-darken-1" text-color="primary-darken-1">
                <span><strong>{{ section.short }}</strong></span>
              </v-avatar>
              <h3><strong>{{ section.label }}</strong></h3>
            </v-btn>
          </v-col>

          <v-col xs="12" md="12" lg="12">
            <v-card id="manhattan-card" outlined class="d-flex flex-column h-100" style="min-height: 700px;">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>Manhattan Plot</v-toolbar-title>
              </v-toolbar>
              <ManhattanPlot :traitId="id" :key="`manhattan-${id}`" />
            </v-card>
          </v-col>
        </v-row>
           <v-row justify="space-around" align="stretch">

              <v-col xs="12" md="12" lg="12">
            <v-card id="gwas-table-card" outlined class="d-flex flex-column h-100" style="min-height: 500px;">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>GWAS Table</v-toolbar-title>
              </v-toolbar>
              <PhenotypeSNPTable :pheno="id"></PhenotypeSNPTable>
            </v-card>
          </v-col>
        </v-row>

              <v-row justify="space-around" align="stretch">
          <v-col xs="12" md="12" lg="12">
            <v-card id="qq-card" outlined class="d-flex flex-column h-100" style="min-height: 500px;">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>QQ Plot</v-toolbar-title>
              </v-toolbar>
               <QQPlot :traitId="id" :key="`qq-${id}`" />
            </v-card>
          </v-col>
              </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { useRoute} from 'vue-router';
import ManhattanPlot from "@/components/trait/Manhattan_old.vue";
import QQPlot from "@/components/trait/QQ.vue";
import PhenotypeSNPTable from "@/components/trait/PhenotypeSNPTable.vue";
import {onMounted, ref, watch, computed} from 'vue';
import TraitProfile from "@/components/trait/TraitProfile.vue";
import {API_BASE_URL} from "@/config.js";

import phenotypeIconWhite from "@/assets/figures/node_phenotype_white.png";
import phenotypeIconBlack from "@/assets/figures/node_phenotype_black.png";

export default {
  name: 'Trait',
  components: {
    PhenotypeSNPTable,
    TraitProfile,
    ManhattanPlot,
    QQPlot
  },
  setup() {
    const route = useRoute();
    const id = ref(decodeURIComponent(route.params.id));

    const phenotypeIcon = computed(() =>
      localStorage.getItem('theme') === 'dyHealthNetThemeDark' ? phenotypeIconWhite : phenotypeIconBlack
    );

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
    const nr_samples = ref(0);
    const availableCards = ref([]);

    availableCards.value = [
          { id: "manhattan-card", label: "Manhattan Plot", short: "MH", enabled: true },
          { id: "gwas-table-card", label: "GWAS Results Table", short: "GT", enabled: true },
          { id: "qq-card", label: "QQ Plot", short: "QQ", enabled: true },

        ];

    const fetchTraitData = () => {
      const query = encodeURIComponent(id.value);
      fetch(`${API_BASE_URL}/trait_get_info/?id=${query}`)
          .then(response => response.json())
          .then(data => {
            description.value = data["description"]
            category.value = data["category"]
            external_ref.value = data["external_ref"]
            nr_samples.value = data["nr_samples"]

          })
          .catch(error => console.error('Error fetching annotation data:', error));
    };

     const scrollTo = (id) => {
      const element = document.getElementById(id);
      if (element) {
        const yOffset = -120;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    };
    return{id, description, category, external_ref, phenotypeIcon, nr_samples, availableCards, scrollTo};
  },
}
</script>