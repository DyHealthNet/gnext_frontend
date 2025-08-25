<template>
  <v-app>
    <v-main>
      <v-container class="justify-center mt-4">
        <v-row class="text-center">
          <v-col cols="12">
            <h1 class="title mt-4" style="display: inline-flex">
              Variant - {{id}}
              <img
              src="@/assets/figures/genetic_variants.png"
              style="width: 50px; height: 50px; margin-left: 10px"
            >
            </h1>
          </v-col>
        </v-row>

        <v-row>
          <v-col class="d-flex justify-center">
            <v-divider class="my-2" thickness="2"></v-divider>
          </v-col>
        </v-row>

        <v-row justify="space-around" align="stretch">
          <v-col xs="12" md="12" lg="6">
            <v-card outlined class="d-flex flex-column h-100" style="min-height: 300px;">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>Variant Profile</v-toolbar-title>
              </v-toolbar>
              <VariantProfile :variantId="id"
                              :externalIds="externalIds"
                              :location="location"
                              :refAllele="refAllele"
                              :altAllele="altAllele"
                              :mostSevereConsequence="mostSevereConsequence"
                              :mostSevereConsequenceImpact="mostSevereConsequenceImpact"
              ></VariantProfile>
            </v-card>
          </v-col>

          <v-col xs="12" md="12" lg="6">
            <v-card outlined class="d-flex flex-column h-100" style="min-height: 300px;">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>Population Allele Frequencies</v-toolbar-title>
              </v-toolbar>
              <VariantPopulationFrequencies :frequencies="alleleFrequencies" :variantId="id"></VariantPopulationFrequencies>
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


          <v-col cols="12" v-if="isCardEnabled('closest-genes')">
            <v-card outlined id="closest-genes">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>Closest Genes</v-toolbar-title>
              </v-toolbar>
              <VariantClosestGene :symbols="closestGene" :variantId="id"></VariantClosestGene>
            </v-card>
          </v-col>


          <v-col cols="12" v-if="isCardEnabled('transcript-consequences')">
            <v-card outlined id="transcript-consequences">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>Predicted Transcript Consequences</v-toolbar-title>
              </v-toolbar>
              <VariantConsequences
                  :variantId="id"
                  :headers="transcriptConsequences.headers"
                  :rows="transcriptConsequences.rows"
                  type="transcript"
              ></VariantConsequences>
            </v-card>
          </v-col>

          <v-col cols="12" v-if="isCardEnabled('regulatory-consequences')">
            <v-card outlined id="regulatory-consequences">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>Predicted Regulatory Consequences</v-toolbar-title>
              </v-toolbar>
              <VariantConsequences
                  :variantId="id"
                  :headers="regulatoryConsequences.headers"
                  :rows="regulatoryConsequences.rows"
                  type="regulatory"
              ></VariantConsequences>
            </v-card>
          </v-col>


          <v-col cols="12" v-if="isCardEnabled('motif-consequences')">
            <v-card outlined id="motif-consequences">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>Predicted Motif Consequences</v-toolbar-title>
              </v-toolbar>
              <VariantConsequences
                  :variantId="id"
                  :headers="motifConsequences.headers"
                  :rows="motifConsequences.rows"
                  type="motif"
              ></VariantConsequences>
            </v-card>
          </v-col>

        </v-row>

        <v-row class="fill-height" justify="space-around" align="stretch" id="coolrow">
          <v-col cols="12">
            <v-card outlined id="phewas">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>PheWAS Results</v-toolbar-title>
              </v-toolbar>
              <PheWas :variantId="id" ></PheWas>

            </v-card>
          </v-col>
        </v-row>

      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import {useRoute} from 'vue-router';
import PheWas from '@/components/variant/Variant_PheWas.vue';
import VariantProfile from "@/components/variant/VariantProfile.vue";
import {API_BASE_URL} from "@/config.js";
import VariantPopulationFrequencies from "@/components/variant/VariantPopulationFrequencies.vue";
import VariantClosestGene from "@/components/variant/VariantClosestGene.vue";
import VariantConsequences from "@/components/variant/VariantConsequences.vue";
import {ref, reactive, onMounted, watch} from 'vue';

export default {
  name: 'Variant',
  components: {
    VariantPopulationFrequencies,
    PheWas,
    VariantProfile,
    VariantClosestGene,
    VariantConsequences
  },
  setup() {
    const route = useRoute();
    const id = ref(decodeURIComponent(route.params.id));

    const externalIds = ref("");
    const alleleFrequencies = reactive({});
    const mostSevereConsequence = ref('');
    const mostSevereConsequenceImpact = ref('');
    const refAllele = ref('');
    const altAllele = ref('');
    const location = ref('');
    const AF = ref("0");
    const availableCards = ref([]);
    const transcriptConsequences = reactive({
      headers: [],
      rows: []
    });
    const regulatoryConsequences = reactive({
      headers: [],
      rows: []
    });
    const motifConsequences = reactive({
      headers: [],
      rows: []
    });
    const closestGene = ref([]);

    const fetchAnnotationData = () => {
      const query = encodeURIComponent(id.value);
      fetch(`${API_BASE_URL}/variant_annotation/?id=${query}`)
          .then(response => response.json())
          .then(data => {
            externalIds.value = data.external_ids.join(", ");
            location.value = data.location;
            refAllele.value = data.ref;
            altAllele.value = data.alt;
            mostSevereConsequence.value = data.msc;
            mostSevereConsequenceImpact.value = data.msc_impact;
            AF.value = data.AF;
            Object.assign(alleleFrequencies, data.allele_frequencies || {});
            Object.assign(transcriptConsequences, data.transcript_consequences || null);
            Object.assign(regulatoryConsequences, data.regulatory_consequences || null);
            Object.assign(motifConsequences, data.motif_consequences || null);
            closestGene.value = data.closest_gene;
            // check if there is a gene stored in closest gene
            let enable_closestGene = true
            if (closestGene.value.length === 1 && closestGene.value[0] === "") {
              enable_closestGene = false
            }
            // check similar for the consequences
            let enable_transcript = true
            if (transcriptConsequences.rows.length === 0) {
              enable_transcript = false
            }
            let enable_regulatory = true
            if (regulatoryConsequences.rows.length === 0) {
              enable_regulatory = false
            }
            let enable_motif = true
            if (motifConsequences.rows.length === 0) {
              enable_motif = false
            }
            availableCards.value = [
              {id: 'closest-genes', label: 'Closest Genes', short: 'CG', enabled: enable_closestGene}, //TODO: add functionality that this is enabled/disabled depending on the api response
              {
                id: 'transcript-consequences',
                label: 'Transcript Consequences',
                short: 'TC',
                enabled: enable_transcript
              },
              {
                id: 'regulatory-consequences',
                label: 'Regulatory Consequences',
                short: 'RC',
                enabled: enable_regulatory
              },
              {
                id: 'motif-consequences',
                label: 'Motif Consequences',
                short: 'MC',
                enabled: enable_motif
              },
              {id: 'phewas', label: 'PheWAS', short: 'PW', enabled: true}];
          })
          .catch(error => console.error('Error fetching annotation data:', error));
    };

    const scrollTo = (id) => {
      const element = document.getElementById(id);
      if (element) {
        const yOffset = -120; // Adjust this to match your nav bar height
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({top: y, behavior: 'smooth'});
      }
    };

    const isCardEnabled = (id) => {
      const card = availableCards.value.find(card => card.id === id);
      return card ? card.enabled : true;
    }

    watch(() => route.params.id, (newId, oldId) => {
      if (newId !== oldId) {
        id.value = decodeURIComponent(newId);
        fetchAnnotationData();
      }
    });

    onMounted(() => {
      fetchAnnotationData();
    });

    return {
      id,
      externalIds,
      alleleFrequencies,
      AF,
      mostSevereConsequence,
      mostSevereConsequenceImpact,
      refAllele,
      altAllele,
      location,
      availableCards,
      scrollTo,
      isCardEnabled,
      closestGene,
      transcriptConsequences,
      motifConsequences,
      regulatoryConsequences
    };
  }
};
</script>

<style>

</style>