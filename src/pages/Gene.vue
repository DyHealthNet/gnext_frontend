<template>
  <v-app>
    <v-main>
      <v-container class="justify-center mt-4">
        <v-row class="text-center">
          <v-col cols="12">
            <h1 class="title mt-4" style="display: inline-flex">
              Gene
              <img
                  :src="theme.global.name.value === 'dyHealthNetThemeDark' ? geneIconWhite : geneIconBlack"
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
              <GeneProfile :geneId="id"
                           :geneSymbol="symbol"
                           :geneChr="chromosome"
                           :geneStart="start"
                           :geneEnd="end"
                           :geneStrand="strand"
              ></GeneProfile>
            </v-card>
          </v-col>
        </v-row>

        <v-row justify="space-around" align="stretch">
          <v-col xs="12" md="12" lg="12">
            <v-card outlined class="d-flex flex-column h-100" style="min-height: 100px;">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>Top Signals in Gene</v-toolbar-title>
              </v-toolbar>

              <v-card-text>
                <p class="text-body-1 mb-4">
                  This table shows the most significant variant associated with each trait within the gene region. For variant to gene mapping, variants located within the gene body as well as variants located within  {{ window_up }} kb upstream or {{ window_down }} kb downstream of the gene are considered.
                  Click on a row to view the LocusZoom plot for that trait.
                </p>

                <p class="text-body-1 mb-4">
                  Location Legend:
                  <GeneLocationTag
                    :location="'within_gene'"
                />
                <GeneLocationTag
                    :location="'upstream'"
                />
                <GeneLocationTag
                    :location="'downstream'"
                />
                </p>

                <TableSkeleton
                  :headers="header"
                  :rows="rows"
                  :downloadName="downloadName"
                  :priorityOrder="priorityOrder"
                  :globalFilterFields="header"
                  :selection="true"
                  @row-selected="handleRowSelected"
                ></TableSkeleton>

                <p class="text-body-1 mb-4"><b>Selected Trait:</b> {{ selectedTrait }}</p>

                <!-- Display selected row info for debugging -->
                <LocusZoomPlot
                    :geneChr="chromosome"
                    :geneStart="start"
                    :geneEnd="end"
                    :geneStrand="strand"
                    :traitId="selectedTrait"
                    :ldRefVariant="rows.find(row => row.trait_id === selectedTrait)?.top_variant"
                ></LocusZoomPlot>

              </v-card-text>

            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import {useRoute} from 'vue-router';
import geneIconBlack from "@/assets/figures/node_gene_black.png"
import geneIconWhite from "@/assets/figures/node_gene_white.png"
import {ref, reactive, onMounted, watch, computed} from 'vue';
import {useTheme} from 'vuetify';
import GeneProfile from "@/components/gene/GeneProfile.vue";
import {API_BASE_URL} from "@/config.js";
import TableSkeleton from "@/components/TableSkeleton.vue";
import LocusZoomPlot from "@/components/gene/LocusZoomPlot.vue";
import GeneLocationTag from "@/components/gene/GeneLocationTag.vue";

export default {
  name: 'Gene',
  components: {
    TableSkeleton,
    GeneProfile,
    LocusZoomPlot,
    GeneLocationTag
  },
  setup() {
    const route = useRoute();
    const id = ref(decodeURIComponent(route.params.id));
    const theme = useTheme();

    const chromosome = ref('');
    const symbol = ref('');
    const start = ref(0);
    const end = ref(0);
    const strand = ref('');

    const rows = ref([]);
    const header = ref([]);
    const selectedTrait = ref(null);

    const window_up = ref(0);
    const window_down = ref(0);

    const priorityOrder = [
      "trait_id",
      "trait_label",
      "trait_category",
      "top_variant",
      "beta",
      "stderr_beta",
      "alt_allele_freq",
      "pvalue",
      "neg_log_pvalue",
      "location",
      "distance"
    ];

    const downloadName = computed(() => {
      return `Gene_${id.value}_Top_Signals.csv`;
    });

    const fetchGeneData = async () => {
      const query = encodeURIComponent(id.value);
      const res = await fetch(`${API_BASE_URL}/gene_get_info/?id=${query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      chromosome.value = json.chromosome
      symbol.value = json.symbol
      start.value = json.start
      end.value = json.end
      strand.value = json.strand
    };

    const fetchGeneSignals = async () => {
      const query = encodeURIComponent(id.value);
      const res = await fetch(`${API_BASE_URL}/gene_get_top_signals/?id=${query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      rows.value = json.rows;
      header.value = json.header;
    };

    const fetchConfig = async () => {
      const cached = localStorage.getItem('configs')
      if (cached) {
        const data = JSON.parse(cached)
        window_up.value = data.window_up;
        window_down.value = data.window_down;
      } else {
        // Otherwise fetch from API
        fetch(`${API_BASE_URL}/overview_get_config`)
            .then(res => res.json())
            .then(data => {
              localStorage.setItem('configs', JSON.stringify(data))
              window_up.value = data.window_up;
              window_down.value = data.window_down;
            })
            .catch(err => console.error('Error fetching config:', err))
      }

    };

    const handleRowSelected = (rowData) => {
      selectedTrait.value = rowData["trait_id"];
      console.log("Selected trait ID:", selectedTrait.value);
    };

    onMounted(() => {
      fetchGeneData();
      fetchGeneSignals();
      fetchConfig();
    });

    return {
      id,
      theme,
      geneIconBlack,
      geneIconWhite,
      chromosome,
      symbol,
      start,
      end,
      strand,
      rows,
      header,
      priorityOrder,
      downloadName,
      selectedTrait,
      handleRowSelected,
      window_up,
      window_down
    };
  }
};
</script>