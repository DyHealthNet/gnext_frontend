<template>
  <v-container>
    <v-row align="center" justify="center" class="ma-0 pa-0" style="gap: 30px;">
      <v-col v-for="item in stats" :key="item.label" cols="auto" class="text-center d-flex flex-column align-center justify-center">
        <v-row>
          <img
              :src="theme.global.name.value === 'dyHealthNetThemeDark' ? item.iconLight : item.iconDark"
              class="stat-icon"
          />
          <div class="d-flex flex-column align-center justify-center" style="min-height: 40px">
            <v-progress-circular
                v-if="statCounts[item.key] === 0"
                indeterminate
                size="24"
                color="primary"
            />
            <div v-else class="stat-number">
              {{ statCounts[item.key].toLocaleString() }}
            </div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import {useTheme} from 'vuetify'
import {onMounted, reactive} from "vue";
import traitHomeDarkIcon from "@/assets/figures/node_phenotype_black.png";
import traitHomeLightIcon from "@/assets/figures/node_phenotype_white.png";
import variantHomeDarkIcon from "@/assets/figures/node_variant_black.png";
import variantHomeLightIcon from "@/assets/figures/node_variant_white.png";
import geneHomeDarkIcon from "@/assets/figures/node_gene_black.png";
import geneHomeLightIcon from "@/assets/figures/node_gene_white.png";
import {API_BASE_URL} from "@/config.js";

const theme = useTheme()

const stats = [
  {
    iconDark: new URL(traitHomeDarkIcon, import.meta.url).href,
    iconLight: new URL(traitHomeLightIcon, import.meta.url).href,
    key: "trait",
    label: "Traits",
  },
  {
    iconDark: new URL(variantHomeDarkIcon, import.meta.url).href,
    iconLight: new URL(variantHomeLightIcon, import.meta.url).href,
    key: "variant",
    label: "Genetic Variants",
  },
  {
    iconDark: new URL(geneHomeDarkIcon, import.meta.url).href,
    iconLight: new URL(geneHomeLightIcon, import.meta.url).href,
    key: "gene",
    label: "Genes",
  }
]

const statCounts = reactive({
  trait: 0,
  variant: 0,
  gene: 0,
})

onMounted(async () => {
  const cached = localStorage.getItem("overview_stats")
  if(cached){
    const json = JSON.parse(cached)
    statCounts.trait = json.trait
    statCounts.variant = json.variant
    statCounts.gene = json.gene
  } else {
    const res = await fetch(`${API_BASE_URL}/get_overview_stats/`);
    const json = await res.json();
    localStorage.setItem("overview_stats", JSON.stringify(json))
    statCounts.trait = json.trait;
    statCounts.variant = json.variant;
    statCounts.gene = json.gene;
  }


})
</script>

<style scoped>
.stat-icon {
  width: 80px;
  height: 80px;
  object-fit: contain;
  display: block;
  margin: 0 auto 0.5rem;
}

.stat-label {
  font-size: 0.8rem;
  text-align: center;
  color: rgb(var(--v-theme-darken-1));
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  color: rgb(var(--v-theme-darken-1));
}
</style>