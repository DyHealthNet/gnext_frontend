<template>
  <v-container class="position-relative">
    <!-- No Gene Lists Overlay -->
    <v-overlay
      :model-value="emptyGeneLists && showNoGeneListsOverlay"
      contained
      class="align-center justify-center"
    >
      <div class="text-center pa-8">
        <v-card max-width="500" class="mx-auto position-relative" elevation="8">
          <!-- Close Button -->
          <v-btn
            icon="mdi-close"
            size="small"
            variant="tonal"
            color="surface"
            class="position-absolute pa-2"
            style="top: 8px; right: 8px; z-index: 1;"
            @click="closeOverlay"
          ></v-btn>
          
          <v-card-text class="pa-8">
            <div class="mb-4">
              <v-icon 
                icon="mdi-alert-circle-outline" 
                size="64" 
                color="warning"
              ></v-icon>
            </div>
            
            <h2 class="text-h5 mb-4">No Gene Lists Available Yet</h2>
            
            <p class="text-body-1 mb-4">
              To use the Network Medicine functionality, you first need to create gene lists from your analysis results.
            </p>
            
            <p class="text-body-2 mb-6 text-medium-emphasis">
              Browse through the traits and visit a trait-specific page to explore the gene-based test results and create gene lists for network analysis.
            </p>
          </v-card-text>
        </v-card>
      </div>
    </v-overlay>

    <v-row class="text-center">
      <v-col cols="12">
        <h1 class="title mt-4">Network Medicine</h1>
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
                         prepend-icon="mdi-send-circle-outline" @click="addNodesToNetwork" style="color: #ffffff !important;">
                    Add to Drugst.One
                  </v-btn>
                </v-col>
                <v-col sm="6" md="6" lg="3" class="ml-auto">
                  <v-btn color="error" block height="48px" :disabled="emptyGeneLists"
                         prepend-icon="mdi-close-circle-outline" @click="clearGeneLists">
                    Clear All Seed Gene Lists
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
            <div style="max-height: 1000px; overflow-y:auto;">
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
            <DrugstoneGeneForwarding v-if="loadedName != null" :name="loadedName" :trait="loadedTrait"/>
            <DrugstoneNetworkSettings v-model:config="config"/>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="showConfirmDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">
          Confirm Action
        </v-card-title>
        <v-card-text>
          Are you sure you want to clear all seed gene lists? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="showConfirmDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="red"
            variant="text"
            @click="confirmClearGeneLists"
          >
            Clear All
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>

import DrugstoneNetworkSettings from "@/components/drugstone/DrugstoneNetworkSettings.vue";
import DrugstoneGeneForwarding from "@/components/drugstone/DrugstoneGeneForwarding.vue";
import {GENE_ID_SPACE} from "@/config.js";
import {drugstone_themes} from "@/utils/drugstone_themes.js";

export default {
  name: 'NetworkMedicine',
  components: {DrugstoneNetworkSettings, DrugstoneGeneForwarding},
  data() {
    return {
      loadedTrait: null,
      loadedName: null,
      selectedList: null,
      selectedGenes: [],
      listNames: [],
      network: {nodes: [], edges: []},
      networkKey: 0,  // Add this to force re-render
      networkName: '',
      showConfirmDialog: false,
      showNoGeneListsOverlay: true,
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
      const genes = geneLists[listName]["genes"] || []
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
        this.loadedName = storedName
        this.loadedTrait = JSON.parse(localStorage.getItem("geneLists"))[storedName]["trait_id"] || null
      }
    },

    addNodesToNetwork() {
      const geneLists = JSON.parse(localStorage.getItem("geneLists") || "{}")
      const genes = geneLists[this.selectedList]["genes"] || []

      // Update the reactive network object
      this.network = {
        nodes: genes.map(gene => ({id: gene, group: "gene"})),
        edges: []
      }

      this.config['title'] = this.selectedList + " Network"
      this.loadedName = this.selectedList
      this.loadedTrait = geneLists[this.selectedList]["trait_id"] || null

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
    },

    clearGeneLists(){
      // Show confirmation dialog
      this.showConfirmDialog = true
    },

    confirmClearGeneLists(){
      // Clear all gene lists from localStorage
      localStorage.removeItem("geneLists")
      localStorage.removeItem("geneTasks")
      localStorage.removeItem('drugstoneNetwork')
      localStorage.removeItem('drugstoneName')
      localStorage.removeItem("drugstone-tokens-" + window.location.host)
      
      // Reset component state
      this.listNames = []
      this.selectedList = null
      this.selectedGenes = []
      this.loadedTrait = null
      this.loadedName = null
      this.network = {nodes: [], edges: []}
      this.config.title = 'Empty Network'
      
      // Close dialog
      this.showConfirmDialog = false
      
      // Force network re-render
      this.networkKey++
      
      console.log("All seed gene lists cleared")
    },

    closeOverlay() {
      this.showNoGeneListsOverlay = false
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

