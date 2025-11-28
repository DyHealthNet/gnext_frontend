<template>
  <v-app>
    <v-main class="home-background">
      <v-container width="80%">
        <!-- Part 1: Welcome -->
        <v-row class="mt-12 mb-0">
           <v-col cols="12" class="d-flex align-center justify-center">
            <span class="main-subheader">Welcome to the </span>
            <img :src="logoSrc" alt="GNExT Logo" class="gnext-logo" />
            <span class="main-subheader"> platform of the </span>
          </v-col>
          <v-col cols="12" class="text-center">
            <h1 class="main-header">
              <span class="main-header-study">{{ mainHeaderStudyName }}</span>
             </h1>
          </v-col>
          <v-col cols="12" class="text-center">
            <h2 class="main-subheader">{{ mainSubheader }}</h2>
          </v-col>
        </v-row>

      <HomeStatsGrid/>

      <v-row align="center" justify="center" class="mt-6 mb-2" style="gap: 5px; font-size:0.8rem;">
        <v-icon class="mr-1">mdi-arrow-down</v-icon>
        <span>Try searching for a trait or a variant</span>
        <v-icon class="ml-1">mdi-arrow-down</v-icon>
      </v-row>

      <AutoComplete/>


        <v-row align="center" justify="center" class="mt-3" style="gap: 5px; font-size:0.8rem;">
          <v-btn
              v-if="TRAIT_EXAMPLE !== ''"
              class="example-btn"
              depressed
              @click="onTraitClick"
          >
            Example Trait {{TRAIT_EXAMPLE}} →
          </v-btn>
          <v-btn
              v-if="VARIANT_EXAMPLE !== ''"
              class="example-btn"
              depressed
              @click="onVariantClick"
          >
            Example Variant {{VARIANT_EXAMPLE}} →
          </v-btn>
        </v-row>
      </v-container>

    </v-main>
  </v-app>

</template>


<script setup>
import AutoComplete from "@/components/autocomplete/AutoComplete_Home.vue";
import HomeStatsGrid from "@/components/HomeStatsGrid.vue";
import {STUDY_NAME, VARIANT_EXAMPLE, TRAIT_EXAMPLE, API_BASE_URL} from "@/config";
import { useRouter } from "vue-router";
import { onMounted, computed } from "vue"
import { useTheme } from 'vuetify'
import logoBlack from "@/assets/figures/GNExT_Logo_Black.png";
import logoWhite from "@/assets/figures/GNExT_Logo_White.png";

const theme = useTheme()
const logoSrc = computed(() => {
  return theme.global.current.value.dark ? logoWhite : logoBlack;
})
const mainHeaderStudyName = STUDY_NAME;
const mainSubheader = "Your gateway to explore and analyze GWAS summary statistics";

const router = useRouter();

function onTraitClick() {
  router.push(`/trait/${TRAIT_EXAMPLE}`);
}

function onVariantClick() {
  router.push(`/variant/${encodeURIComponent(VARIANT_EXAMPLE)}`);
}

function loadConfigs() {
  // Try to load from localStorage first
  const cached = localStorage.getItem('configs')
  if (cached) {
    const data = JSON.parse(cached)
    console.log('Loaded configs from localStorage:', data)
    return data
  }

  // Otherwise fetch from API
  fetch(`${API_BASE_URL}/overview_get_config`)
    .then(res => res.json())
    .then(data => {
      localStorage.setItem('configs', JSON.stringify(data))
      console.log('Fetched and stored configs:', data)
      return data
    })
    .catch(err => console.error('Error fetching config:', err))
}

onMounted(() => {
  loadConfigs()
})

</script>

<style scoped>

.example-btn {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-darken-1));
  font-weight: bold;
  border-radius: 999px;
  padding: 6px 18px;
  transition: all 0.2s ease-in-out;
}


.home-background {
  background: linear-gradient(to bottom right,  rgb(var(--v-theme-primary)),  rgb(var(--v-theme-background)));
  padding: 20px;
  border-radius: 10px;
}


.main-header {
  font-size: 2.5rem;
  font-weight: bold;
  color: rgb(var(--v-theme-primary-darken-1));
  margin-bottom: 10px;
}

.main-header-study {
  color: rgb(var(--v-theme-primary-darken));
  text-decoration: underline;
}

.main-subheader {
  font-size: 1.5rem;
  font-weight: 400;
  color: rgb(var(--v-theme-darken-1));
}

.gnext-logo {
  max-width: 110px;
  height: auto;
  margin: 0 10px;
}
</style>
