<template>
  <v-app>
    <v-main>
      <!-- Full-page loading overlay -->
      <v-overlay
        :model-value="pageLoading"
        persistent
        class="align-center justify-center"
        contained="false"
        :z-index="2000"
      >
       <div style="margin-top: 200px;" class="d-flex flex-column align-center">
    <v-progress-circular
      indeterminate
      size="64"
      width="6"
      style="color: rgb(var(--v-theme-primary-darken));"
    ></v-progress-circular>
    <div class="mt-4 text-subtitle-1">Loading variant…</div>
  </div>
      </v-overlay>

      <v-container class="justify-center mt-4">
        <v-row class="text-center">
          <v-col cols="12">
            <h1 class="title mt-4" style="display: inline-flex">
              Variant - {{ id }}
              <img
                :src="variantIcon"
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
              <VariantProfile
                :variantId="id"
                :externalIds="externalIds"
                :location="location"
                :refAllele="refAllele"
                :altAllele="altAllele"
                :mostSevereConsequence="mostSevereConsequence"
                :mostSevereConsequenceImpact="mostSevereConsequenceImpact"
              />
            </v-card>
          </v-col>

          <v-col xs="12" md="12" lg="6">
            <v-card outlined class="d-flex flex-column h-100" style="min-height: 300px;">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>Population Allele Frequencies</v-toolbar-title>
              </v-toolbar>
              <div style="max-height: 350px; overflow-y:auto; padding: 8px;">
                <VariantPopulationFrequencies
                  :frequencies="alleleFrequencies"
                  :variantId="id"
                  :minAF="minAF"
                  :maxAF="maxAF"
                />
              </div>
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
              <VariantClosestGene :symbols="closestGene" :variantId="id" />
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
              />
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
              />
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
              />
            </v-card>
          </v-col>
        </v-row>

        <v-row class="fill-height" justify="space-around" align="stretch" id="coolrow">
          <v-col cols="12">
            <v-card outlined id="phewas">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>PheWAS Results</v-toolbar-title>
              </v-toolbar>
              <PheWas :variantId="id" :traitMetrics="traitMetrics"/>
            </v-card>
          </v-col>
        </v-row>

      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { useRoute } from 'vue-router';
import PheWas from '@/components/variant/PheWAS.vue';
import VariantProfile from "@/components/variant/VariantProfile.vue";
import { API_BASE_URL } from "@/config.js";
import VariantPopulationFrequencies from "@/components/variant/VariantPopulationFrequencies.vue";
import VariantClosestGene from "@/components/variant/VariantClosestGene.vue";
import VariantConsequences from "@/components/variant/VariantConsequences.vue";
import {ref, reactive, onMounted, watch, computed} from 'vue';

import variantIconBlack from "@/assets/figures/node_variant_black.png"
import variantIconWhite from "@/assets/figures/node_variant_white.png"

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

    const pageLoading = ref(false); // overlay controller

    const externalIds = ref("");
    const alleleFrequencies = reactive({});
    const mostSevereConsequence = ref('');
    const mostSevereConsequenceImpact = ref('');
    const refAllele = ref('');
    const altAllele = ref('');
    const location = ref('');
    const availableCards = ref([]);
    const transcriptConsequences = reactive({ headers: [], rows: [] });
    const regulatoryConsequences = reactive({ headers: [], rows: [] });
    const motifConsequences = reactive({ headers: [], rows: [] });
    const closestGene = ref([]);
    const minAF = ref(null);
    const maxAF = ref(null);
    const traitMetrics = reactive({});

    const variantIcon = computed(() =>
      localStorage.getItem('theme') === 'dyHealthNetThemeDark' ? variantIconWhite : variantIconBlack
    );

    const fetchMetricsData = async () => {
      const query = encodeURIComponent(id.value);
      const res = await fetch(`${API_BASE_URL}/variant_get_metrics/?id=${query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      minAF.value = json.min_af
      maxAF.value = json.max_af

      // reset then assign to keep reactivity clean
      Object.keys(traitMetrics).forEach(k => delete traitMetrics[k]);
      Object.assign(traitMetrics, json.metrics || {});
    };

    const fetchAnnotationData = async () => {
      const apply = (data) => {
        externalIds.value = (data.external_ids || []).filter(Boolean).join(", ");
        location.value = data.location || "";
        refAllele.value = data.ref || "";
        altAllele.value = data.alt || "";
        mostSevereConsequence.value = data.msc || "";
        mostSevereConsequenceImpact.value = data.msc_impact || "";

        Object.keys(alleleFrequencies).forEach(k => delete alleleFrequencies[k]);
        Object.assign(alleleFrequencies, data.allele_frequencies || {});

        transcriptConsequences.headers = data.transcript_consequences?.headers || [];
        transcriptConsequences.rows = data.transcript_consequences?.rows || [];

        regulatoryConsequences.headers = data.regulatory_consequences?.headers || [];
        regulatoryConsequences.rows = data.regulatory_consequences?.rows || [];

        motifConsequences.headers = data.motif_consequences?.headers || [];
        motifConsequences.rows = data.motif_consequences?.rows || [];

        closestGene.value = data.closest_gene || [];

        const hasClosest = !(closestGene.value.length === 1 && closestGene.value[0] === "");
        const hasTranscript = transcriptConsequences.rows.length > 0;
        const hasRegulatory = regulatoryConsequences.rows.length > 0;
        const hasMotif = motifConsequences.rows.length > 0;

        availableCards.value = [
          { id: "closest-genes", label: "Closest Genes", short: "CG", enabled: hasClosest },
          { id: "transcript-consequences", label: "Transcript Consequences", short: "TC", enabled: hasTranscript },
          { id: "regulatory-consequences", label: "Regulatory Consequences", short: "RC", enabled: hasRegulatory },
          { id: "motif-consequences", label: "Motif Consequences", short: "MC", enabled: hasMotif },
          { id: "phewas", label: "PheWAS", short: "PW", enabled: true },
        ];
      };

      const query = encodeURIComponent(id.value);
      const res = await fetch(`${API_BASE_URL}/variant_get_annotation/?id=${query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      apply(data);
    };

    const loadVariantData = async () => {
      pageLoading.value = true;

      // clear previous state that depends on variant
      Object.keys(traitMetrics).forEach(k => delete traitMetrics[k]);

      try {
        await Promise.all([fetchAnnotationData(), fetchMetricsData()]);
      } catch (err) {
        console.error("Error loading variant data:", err);
      } finally {
        pageLoading.value = false;
      }
    };

    const scrollTo = (id) => {
      const element = document.getElementById(id);
      if (element) {
        const yOffset = -120;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    };

    const isCardEnabled = (id) => {
      const card = availableCards.value.find(card => card.id === id);
      return card ? card.enabled : true;
    };

    watch(() => route.params.id, (newId, oldId) => {
      if (newId !== oldId) {
        id.value = decodeURIComponent(newId);
        loadVariantData();
      }
    });

    onMounted(() => {
      loadVariantData();
    });

    return {
      id,
      pageLoading,
      externalIds,
      alleleFrequencies,
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
      regulatoryConsequences,
      minAF,
      maxAF,
      traitMetrics,
      variantIcon
    };
  }
};
</script>