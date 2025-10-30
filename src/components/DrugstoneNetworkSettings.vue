<template>
  <v-expansion-panels class="mt-4">
    <v-expansion-panel>
      <v-expansion-panel-title>
        <v-icon start class="mr-2">mdi-cog-outline</v-icon>
        <p class="text-body-1">Advanced Settings</p>
      </v-expansion-panel-title>

      <v-expansion-panel-text>

        <!-- Protein-Protein Interaction DB -->
        <v-tooltip
            text="Select the dataset of protein-protein information used in functions like 'Find Drug Targets' and 'Run Task X'."
            location="top"
        >
          <template #activator="{ props }">
            <v-select
                v-bind="props"
                class="mt-4"
                label="Protein-Protein Interaction DB"
                :items="dataLists.protProtInterList"
                item-title="label"
                item-value="value"
                v-model="localConfig.interactionProteinProtein"
                density="comfortable"
                variant="outlined"
                persistent-placeholder
            />
          </template>
        </v-tooltip>

        <!-- Drug-Protein Interaction DB -->
        <v-tooltip
            text="Select the dataset of drug-protein information that is later used in functions like 'Find Drug Targets'."
            location="top"
        >
          <template #activator="{ props }">
            <v-select
                v-bind="props"
                label="Drug-Protein Interaction DB"
                :items="dataLists.drugProtInterList"
                item-title="label"
                item-value="value"
                v-model="localConfig.interactionDrugProtein"
                density="comfortable"
                variant="outlined"
                persistent-placeholder
            />
          </template>
        </v-tooltip>

        <!-- Protein-Disease Association DB -->
        <v-tooltip
            text="Select the dataset of protein-disease information that is later used in functions like 'Show disorders adjacent to displayed proteins'."
            location="top"
        >
          <template #activator="{ props }">
            <v-select
                v-bind="props"
                label="Protein-Disease Association DB"
                :items="dataLists.drugDisList"
                item-title="label"
                item-value="value"
                v-model="localConfig.associatedProteinDisorder"
                density="comfortable"
                variant="outlined"
                persistent-placeholder
            />
          </template>
        </v-tooltip>

        <!-- Drug-Disease Indication DB -->
        <v-tooltip
            text="Select the dataset of drug-disease information that is later used in functions like 'Show disorders adjacent to displayed drugs'."
            location="top"
        >
          <template #activator="{ props }">
            <v-select
                v-bind="props"
                label="Drug-Disease Indication DB"
                :items="dataLists.drugDisList"
                item-title="label"
                item-value="value"
                v-model="localConfig.indicationDrugDisorder"
                density="comfortable"
                variant="outlined"
                persistent-placeholder
            />
          </template>
        </v-tooltip>

        <v-row>
          <v-col>
            <!-- Licensed Datasets -->
            <v-tooltip
                text="If enabled, allows the use of licensed datasets. Will trigger an EULA popup in each session."
                location="bottom"
            >
              <template #activator="{ props }">
                <v-switch
                    v-bind="props"
                    v-model="localConfig.licensedDatasets"
                    color="primary"
                    label="Licensed Datasets"
                    inset
                />
              </template>
            </v-tooltip>
          </v-col>
          <v-col>
            <!-- Reviewed proteins -->
            <v-tooltip
                text="If enabled, only reviewed proteins are considered for the analysis."
                location="bottom"
            >
              <template #activator="{ props }">
                <v-switch
                    v-bind="props"
                    v-model="localConfig.reviewed"
                    color="primary"
                    label="Only reviewed proteins"
                    inset
                />
              </template>
            </v-tooltip>

          </v-col>
          <v-col>
            <!-- Approved Drugs -->
            <v-tooltip
                text="If enabled, only approved drugs will be displayed for the adjacent drugs."
                location="bottom"
            >
              <template #activator="{ props }">
                <v-switch
                    v-bind="props"
                    v-model="localConfig.reviewed"
                    color="primary"
                    label="Only approved drugs"
                    inset
                />
              </template>
            </v-tooltip>
          </v-col>
        </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>
export default {
  name: "DrugstoneNetworkSettings",
  props: {
    config: {type: Object, required: true},
  },
  emits: ["update:config"],

  data() {
    return {
      localConfig: {...this.config}, // make local copy for internal use
      dataLists: {
        drugProtInterList: ['NeDRex', 'DrugBank', 'DrugCentral', 'ChEMBL', 'DGIdb'],
        protProtInterList: ['NeDRex', 'BioGRID', 'IID', 'IntAct', 'STRING', 'APID', 'OmniPath'],
        protDisList: ['NeDRex', 'CTD', 'DrugCentral', 'DrugBank'],
        drugDisList: ['NeDRex', 'DisGeNET', 'OMIM']
      }
    }
  },

  watch: {
    localConfig: {
      deep: true,
      handler(newVal) {
        this.$emit("update:config", newVal) // propagate changes upward
      }
    }
  }
}
</script>