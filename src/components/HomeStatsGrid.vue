<template>
  <v-container>
    <v-row align="center" justify="center" class="ma-0 pa-0" style="gap: 30px;">
      <v-col v-for="item in stats" :key="item.label" cols="auto" class="text-center d-flex flex-column align-center justify-center">
        <v-row>
          <img
              :src="theme.global.name.value === 'dyHealthNetThemeDark' ? item.iconLight : item.iconDark"
              class="stat-icon"
          />
          <div class="d-flex flex-column align-center justify-center" style="min-height: 50px">
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
import traitHomeDarkIcon from "@/assets/figures/phenotype_home_dark.png";
import traitHomeLightIcon from "@/assets/figures/phenotype_home_light.png";
import variantHomeDarkIcon from "@/assets/figures/variant_home_dark.png";
import variantHomeLightIcon from "@/assets/figures/variant_home_light.png";
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
]

const statCounts = reactive({
  trait: 0,
  variant: 0,
})

onMounted(async () => {
  const res = await fetch(`${API_BASE_URL}/overview_stats/`);
  const json = await res.json();
  statCounts.trait = json.trait;
  statCounts.variant = json.variant;
  console.log("trait count:", statCounts.trait);
  console.log("Variant count:", statCounts.variant);

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