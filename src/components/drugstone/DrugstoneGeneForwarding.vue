<template>
  <v-expansion-panels class="mt-4" v-model="panel">
    <v-expansion-panel value="geneForwarding">
      <v-expansion-panel-title>
        <v-icon start class="mr-2">mdi-open-in-new</v-icon>
        <p class="text-body-1">Redirect to Genes from {{ trait }}</p>
      </v-expansion-panel-title>

      <v-expansion-panel-text>
        <v-container fluid class="pa-0">
          <v-row align="center" no-gutters>
            <v-col cols="auto" class="pr-4">
              <img
                :src="phenotypeIcon"
                style="width: 40px; height: 40px;"
                alt="Phenotype Icon"
              >
            </v-col>
            <v-col>
              <h3><strong>Gene Seed List</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{name}}</h3>
              <h3><strong>Trait ID</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{trait}}</h3>
            </v-col>
            <v-col lg="10">
              <AutoCompleteDrugstone :trait="trait" />
            </v-col>
          </v-row>
        </v-container>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useTheme } from 'vuetify'
import AutoCompleteDrugstone from "@/components/autocomplete/AutoComplete_Drugstone.vue";
import phenotypeIconWhite from "@/assets/figures/node_phenotype_white.png";
import phenotypeIconBlack from "@/assets/figures/node_phenotype_black.png";

// Define props
const props = defineProps({
  trait: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: false,
    default: null,
  }
});

// Get Vuetify theme
const theme = useTheme()

// Theme-aware phenotype icon - reactively updates when theme changes
const phenotypeIcon = computed(() => 
  theme.global.name.value === 'dyHealthNetThemeDark' ? phenotypeIconWhite : phenotypeIconBlack
);

// Panel expansion state - open when trait is loaded, closed when empty
const panel = ref(null)

// Watch for trait changes to control panel expansion
watch(
  () => props.trait,
  (newTrait) => {
    if (newTrait && newTrait.trim() !== '') {
      // Network/trait is loaded - open the panel
      panel.value = ['geneForwarding']
    } else {
      // No network/trait loaded - close the panel
      panel.value = []
    }
  },
  { immediate: true }
)
</script>

<style scoped>
</style>
