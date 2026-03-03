<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row class="text-center">
          <v-col cols="12">
            <h1 class="title mt-4" style="display: inline-flex">
              Trait
              <img
                  :src="theme.global.name.value === 'dyHealthNetThemeDark' ? phenotypeIconWhite : phenotypeIconBlack"
                  style="width: 50px; height: 50px; margin-left: 10px; margin-right: 10px"
              >
              {{ id }}
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
                <v-toolbar-title>GWAS Manhattan Plot</v-toolbar-title>
              </v-toolbar>
              <ManhattanPlot :traitId="id" :key="`manhattan-${id}`"/>
            </v-card>
          </v-col>
        </v-row>

        <v-row v-if="magmaEnabled" justify="space-around" align="stretch">
          <v-col xs="12" md="12" lg="12">
            <v-card id="magma-manhattan-card" outlined class="d-flex flex-column h-100" style="min-height: 500px;">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>MAGMA Manhattan Plot</v-toolbar-title>
              </v-toolbar>
              <MAGMAManhattan :traitId="id" :key="`magma-manhattan-${id}`" :magmaResults="magmaResults"
                              :totalGenes="magmaTotalGenes"/>
            </v-card>
          </v-col>
        </v-row>

        <v-row justify="space-around" align="stretch">
          <v-col xs="12" md="12" lg="12">
            <v-card id="gwas-table-card" outlined class="d-flex flex-column h-100" style="min-height: 500px;">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>GWAS Results Table</v-toolbar-title>
              </v-toolbar>
              <PhenotypeSNPTable :pheno="id"></PhenotypeSNPTable>
            </v-card>
          </v-col>
        </v-row>

        <v-row v-if="magmaEnabled" justify="space-around" align="stretch">
          <v-col xs="12" md="12" lg="12">
            <v-card id="magma-table-card" outlined class="d-flex flex-column h-100" style="min-height: 500px;">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>MAGMA Results Table</v-toolbar-title>
              </v-toolbar>
              <MAGMATable :traitId="id" :key="`magma-table-${id}`" :magmaResults="magmaResults"
                          :magmaColumns="magmaColumns" :totalGenes="magmaTotalGenes"/>
            </v-card>
          </v-col>
        </v-row>

        <v-row justify="space-around" align="stretch">
          <v-col xs="12" :md="magmaEnabled ? 6 : 12" :lg="magmaEnabled ? 6 : 12">
            <v-card id="gwas-qq-card" outlined class="d-flex flex-column h-100" style="min-height: 500px;">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>GWAS QQ Plot</v-toolbar-title>
              </v-toolbar>
              <QQPlot :traitId="id" :key="`qq-${id}`"/>
            </v-card>
          </v-col>
          <v-col v-if="magmaEnabled" xs="12" md="6" lg="6">
            <v-card id="magma-qq-card" outlined class="d-flex flex-column h-100" style="min-height: 500px;">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>MAGMA QQ Plot</v-toolbar-title>
              </v-toolbar>
              <MAGMAQQPlot :traitId="id" :key="`qq-${id}`" :magmaResults="magmaResults"/>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import {useRoute} from 'vue-router';
import ManhattanPlot from "@/components/trait/Manhattan.vue";
import QQPlot from "@/components/trait/QQ.vue";
import MAGMAQQPlot from "@/components/trait/MAGMAQQ.vue";
import PhenotypeSNPTable from "@/components/trait/PhenotypeSNPTable.vue";
import {onMounted, ref, watch, computed} from 'vue';
import TraitProfile from "@/components/trait/TraitProfile.vue";
import {API_BASE_URL, MAGMA_SHOW} from "@/config.js";
import MAGMATable from "@/components/trait/MAGMATable.vue";
import {useTheme} from 'vuetify';
import phenotypeIconWhite from "@/assets/figures/node_phenotype_white.png";
import phenotypeIconBlack from "@/assets/figures/node_phenotype_black.png";
import MAGMAManhattan from "@/components/trait/MAGMAManhattan.vue";

export default {
  name: 'Trait',
  components: {
    PhenotypeSNPTable,
    TraitProfile,
    ManhattanPlot,
    QQPlot,
    MAGMATable,
    MAGMAManhattan,
    MAGMAQQPlot,
  },
  setup() {
    const route = useRoute();
    const id = ref(decodeURIComponent(route.params.id));
    const theme = useTheme();

    const magmaEnabled = MAGMA_SHOW;

    watch(() => route.params.id, (newId, oldId) => {
      if (newId !== oldId) {
        id.value = decodeURIComponent(newId);
        fetchTraitData();
        getMAGMATableData();
      }
    });

    onMounted(() => {
      fetchTraitData();
      getMAGMATableData();
    });

    const description = ref('');
    const category = ref('');
    const external_ref = ref('');
    const nr_samples = ref(0);
    const availableCards = ref([]);
    const magmaResults = ref([]);
    const magmaTotalGenes = ref(0);
    const magmaColumns = ref([]);

    availableCards.value = [
      {id: "manhattan-card", label: "GWAS Manhattan Plot", short: "GM", enabled: true},
      {id: "gwas-table-card", label: "GWAS Results Table", short: "GT", enabled: true},
      {id: "gwas-qq-card", label: "GWAS QQ Plot", short: "GQQ", enabled: true},
    ];

    // Add MAGMA cards if enabled
    if (magmaEnabled) {
      availableCards.value.splice(1, 0,
          {id: 'magma-manhattan-card', label: 'MAGMA Manhattan Plot', short: 'MM', enabled: true}
      )
      availableCards.value.splice(3, 0,
          {id: 'magma-table-card', label: 'MAGMA Results Table', short: 'MT', enabled: true}
      )
      availableCards.value.splice(5, 0,
          {id: 'magma-qq-card', label: 'MAGMA QQ Plot', short: 'MQQ', enabled: true}
      )
    }

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

    const getMAGMATableData = () => {
      const query = encodeURIComponent(id.value);
      fetch(`${API_BASE_URL}/trait_get_magma_results/?id=${query}`)
          .then(response => response.json())
          .then(data => {
            magmaResults.value = data.rows;
            magmaColumns.value = data.header;
            magmaTotalGenes.value = data.num_rows;
          })
          .catch(error => console.error("Error fetching MAGMA table data:", error));
    };

    const scrollTo = (id) => {
      const element = document.getElementById(id);
      if (element) {
        const yOffset = -120;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({top: y, behavior: 'smooth'});
      }
    };
    return {
      id,
      description,
      category,
      external_ref,
      phenotypeIconWhite,
      phenotypeIconBlack,
      nr_samples,
      availableCards,
      scrollTo,
      theme,
      magmaResults,
      magmaTotalGenes,
      magmaColumns,
      magmaEnabled
    };
  },
}
</script>