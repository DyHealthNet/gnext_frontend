<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <h1 class="title mt-4">Drugst.One Page</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col class="d-flex justify-center">
        <v-divider class="my-2" thickness="2"></v-divider>
      </v-col>
    </v-row>

    <v-row class="my-4">
      <v-col cols="12">
        <v-card outlined>
          <v-toolbar color="primary-darken-1" density="compact">
            <v-toolbar-title>Selection of Seed Genes</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-container>
              <p class="text-body-1 mb-4 mt-4">
                Select a seed gene list of the stored seed gene lists
              </p>
            </v-container>

            <v-container>
              <v-row>
                <v-col cols="3">
                  <v-select
                      v-model="selectedList"
                      :items="listNames"
                      label="Select Seed Gene List"
                      density="comfortable"
                      variant="outlined"
                      persistent-placeholder
                      @update:modelValue="loadGenes"
                  >
                  </v-select>
                </v-col>
                <v-col cols="9">
                  <v-text-field
                      v-model="selectedGenes"
                      label="Genes in Selected List"
                      variant="outlined"
                      density="comfortable"
                      readonly
                      persistent-placeholder
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col sm="6" md="6" lg="3">
                  <v-btn color="primary" block height="48px" :disabled="emptyGeneLists"
                         prepend-icon="mdi-send-circle-outline" @click="addNodesToNetwork">
                    Add to Drugst.One Interface
                  </v-btn>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="my-4">
      <v-col cols="12">
        <v-card outlined>
          <v-toolbar color="primary-darken-1" density="compact">
            <v-toolbar-title>Drugst.One</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <div style="max-height: 650px; overflow-y:auto;">
              <drugst-one
                  id='drugstone-component-id'
                  :key="networkKey"
                  groups='{"nodeGroups":{"important":{"type":"gene","color":"#ff881f","font":{"color":"#000000"},"groupName":"Important Gene","shape":"star"},"gene":{"type":"gene","color":"#4da300","font":{"color":"#f0f0f0"},"groupName":"Gene","shape":"circle"},"foundDrug":{"type":"drug","color":"#F12590","font":{"color":"#000000"},"groupName":"Drug","shape":"diamond"}},"edgeGroups":{"default":{"color":"#000000","groupName":"default edge"}}}'
                  :config='JSON.stringify(config)'
                  :style="drugstoneStyle"
                  :network='JSON.stringify(network)'
                  @taskEvent="saveTaskId"
              >
              </drugst-one>
            </div>
            <DrugstoneNetworkSettings v-model:config="config"/>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>

import DrugstoneNetworkSettings from "@/components/DrugstoneNetworkSettings.vue";
import {GENE_ID_SPACE} from "@/config.js";
import {drugstone_themes} from "@/utils/drugstone_themes.js";

export default {
  name: 'Drugstone',
  components: {DrugstoneNetworkSettings},
  data() {
    return {
      selectedList: null,
      selectedGenes: [],
      listNames: [],
      network: {nodes: [], edges: []},
      networkKey: 0,  // Add this to force re-render
      networkName: '',
      config: {
        identifier: GENE_ID_SPACE,
        title: 'Empty Network',
        nodeShadow: true,
        edgeShadow: false,
        autofillEdges: true,
        showEditNetwork: false,
        showLogger: false,
        showNetworkMenuButtonUpload: false,
        interactionProteinProtein: 'NeDRex',
        interactionDrugProtein: 'NeDRex',
        associatedProteinDisorder: 'NeDRex',
        indicationDrugDisorder: 'NeDRex',
        reviewed: false,
        approvedDrugs: false,
        licensedDatasets: false,
        showNetworkMenuButtonLabelIdspace: true,
        showPruning: true,
        calculateProperties: true,
        showViews: false,
        showAdvAnalysisContent: ["pathway-enrichment", "clustering", "enrichment-gprofiler", "enrichment-digest", "search-ndex"]
      },
    }
  },

  mounted() {
    this.loadGeneLists()
    this.loadNetworkFromStorage()

  },

  computed: {
    emptyGeneLists() {
      return this.listNames.length === 0
    },

    drugstoneStyle() {
      const isLight = this.$vuetify.theme.global.name === 'dyHealthNetTheme';
      // load utils/drugstone_themes.js and select based on isLight
      if (isLight) {
        return drugstone_themes['integrated-light']
      } else {
        return drugstone_themes['integrated-dark']
      }
    }
  },

  methods: {
    loadGeneLists() {
      try {
        const geneLists = JSON.parse(localStorage.getItem("geneLists") || "{}")
        this.listNames = Object.keys(geneLists)
        // if more than one, select the first one
        if (this.listNames.length > 0) {
          this.selectedList = this.listNames[0]
          this.loadGenes(this.selectedList)
        }
      } catch (err) {
        console.error("Error loading gene lists:", err)
        this.listNames = []
      }
    },
    loadGenes(listName) {
      const geneLists = JSON.parse(localStorage.getItem("geneLists") || "{}")
      const genes = geneLists[listName] || []
      // join as comma-separated or newline-separated str
      this.selectedGenes = genes.join(", ")
    },

    loadNetworkFromStorage() {
      const storedNetwork = localStorage.getItem('drugstoneNetwork')
      if (storedNetwork) {
        try {
          this.network = JSON.parse(storedNetwork)
          // Add taskIDs that should be shown

        } catch (err) {
          console.error("Error loading network:", err)
          this.network = {nodes: [], edges: []}
        }
      }
      const storedName = localStorage.getItem('drugstoneName')
      if (storedName) {
        this.config['title'] = storedName + " Network"
      }
    },

    addNodesToNetwork() {
      const geneLists = JSON.parse(localStorage.getItem("geneLists") || "{}")
      const genes = geneLists[this.selectedList] || []

      // Update the reactive network object
      this.network = {
        nodes: genes.map(gene => ({id: gene, group: "gene"})),
        edges: []
      }

      this.config['title'] = this.selectedList + " Network"

      const geneTasks = JSON.parse(localStorage.getItem("geneTasks") || "{}")


      // Get old networkname to check if task have been deleted
      const oldNetworkName = localStorage.getItem('drugstoneName')
      if(oldNetworkName){
              const oldTasksDrugstone = JSON.parse(localStorage.getItem("drugstone-tokens-" + window.location.host) || "[]")
              geneTasks[oldNetworkName] = oldTasksDrugstone
              localStorage.setItem("geneTasks", JSON.stringify(geneTasks))
      }

      // Save to localStorage for persistence
      localStorage.setItem('drugstoneNetwork', JSON.stringify(this.network))
      localStorage.setItem('drugstoneName', this.selectedList)

      // Load taskIDs for this gene list
      const taskIDs = geneTasks[this.selectedList] || []
      localStorage.setItem("drugstone-tokens-" + window.location.host, JSON.stringify(taskIDs))

      // Force re-render
      this.networkKey++
    },

    saveTaskId: function (event) {
      console.log("Event received from Drugst.One:", event.detail)
      const geneTasks = JSON.parse(localStorage.getItem("geneTasks") || "{}")
      const storedName = localStorage.getItem('drugstoneName')
      // add taskId to list of taskIds for this gene list
      const currentTasks = Array.isArray(geneTasks[storedName])
          ? geneTasks[storedName]
          : JSON.parse(geneTasks[storedName] || "[]")

      geneTasks[storedName] = currentTasks.concat(event.detail.taskId)
      localStorage.setItem("geneTasks", JSON.stringify(geneTasks))
    }
  }
}

</script>

<style scoped>
:deep(#drugstone-plugin-privacy-banner) {
  width: 100% !important; /* match parent container width */
  left: 0 !important;
  right: 0 !important;
  margin: 0 auto !important;
  box-sizing: border-box;
}


</style>

