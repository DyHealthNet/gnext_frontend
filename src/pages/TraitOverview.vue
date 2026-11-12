<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row class="text-center">
          <v-col cols="12">
            <h1 class="title mt-4">Trait Overview</h1>
          </v-col>
        </v-row>

        <v-row>
          <v-col class="d-flex justify-center">
            <v-divider class="my-2" thickness="2"></v-divider>
          </v-col>
        </v-row>

        <v-row v-if="error">
          <v-col cols="12">
            <v-alert type="error" variant="tonal">{{ error }}</v-alert>
          </v-col>
        </v-row>

        <v-row class="my-2">
          <v-col cols="12">
            <v-card outlined class="position-relative">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>All Traits</v-toolbar-title>
              </v-toolbar>
              <v-overlay :model-value="loading" contained class="align-center justify-center">
                <v-progress-circular color="primary" indeterminate size="64"/>
              </v-overlay>
              <v-card-text>
                <p class="text-body-1 mb-2">
                  This study contains <strong>{{ traits.length }}</strong> traits in
                  <strong>{{ groups.length }}</strong> group{{ groups.length === 1 ? '' : 's' }}.
                  Click a group in the chart below to filter the table.
                </p>
                <v-chip
                    v-if="selectedGroup"
                    class="mb-2"
                    closable
                    :color="groupColors[selectedGroup]"
                    variant="flat"
                    @click:close="selectedGroup = null"
                >
                  Group: {{ selectedGroup }}
                </v-chip>
                <TableSkeleton
                    :headers="tableHeaders"
                    :rows="filteredTraits"
                    :priorityOrder="tableHeaders"
                    :globalFilterFields="tableHeaders"
                    :defaultTableRows="20"
                    downloadName="overview"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="my-2" align="stretch">
          <v-col cols="12">
            <v-card outlined class="h-100 position-relative">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>Traits per Group</v-toolbar-title>
              </v-toolbar>
              <v-overlay :model-value="loading" contained class="align-center justify-center">
                <v-progress-circular color="primary" indeterminate size="48"/>
              </v-overlay>
              <div ref="pie" class="plot"></div>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="my-2">
          <v-col cols="12">
            <v-card outlined class="position-relative">
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title>Multi-Trait Manhattan Plot</v-toolbar-title>
              </v-toolbar>
              <v-card-text>
                <MultiTraitManhattan :traits="traits" :isDark="isDark"/>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
/**
 * Trait Overview page.
 *
 * Lists every trait in the study (from `overview_get_traits`) in a table and
 * summarizes them with a Plotly pie chart of traits per group. Clicking a
 * slice filters the table to that group. Below, a multi-trait Manhattan plot
 * (`MultiTraitManhattan`) shows the trait-page Manhattan plots of up to five
 * selected traits, stacked or overlaid. Plotly is loaded lazily so it only
 * ships with this page.
 */
import {markRaw} from "vue";
import {API_BASE_URL} from "@/config.js";
import TableSkeleton from "@/components/TableSkeleton.vue";
import MultiTraitManhattan from "@/components/trait/MultiTraitManhattan.vue";

/** Qualitative palette (Plotly/D3 "category10" + extension); cycled if there are more groups. */
const PALETTE = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2',
  '#7f7f7f', '#bcbd22', '#17becf', '#393b79', '#ad494a', '#637939', '#7b4173',
  '#3182bd', '#e6550d', '#31a354', '#756bb1', '#636363', '#843c39',
]

export default {
  name: 'TraitOverview',
  components: {TableSkeleton, MultiTraitManhattan},
  data() {
    return {
      traits: [],
      loading: false,
      error: null,
      selectedGroup: null,
      tableHeaders: ['trait_id', 'trait_label', 'trait_group', 'nr_samples'],
      plotly: null,
    }
  },
  computed: {
    /** @returns {string[]} Distinct trait groups, sorted alphabetically. */
    groups() {
      return [...new Set(this.traits.map(t => t.trait_group))].sort((a, b) => a.localeCompare(b))
    },
    /** @returns {Object<string,string>} Stable group → color mapping shared by the pie chart and the filter chip. */
    groupColors() {
      return Object.fromEntries(this.groups.map((g, i) => [g, PALETTE[i % PALETTE.length]]))
    },
    /** @returns {Object<string,number>} Number of traits per group. */
    groupCounts() {
      const counts = {}
      for (const t of this.traits) counts[t.trait_group] = (counts[t.trait_group] || 0) + 1
      return counts
    },
    /** @returns {Array<object>} Table rows, restricted to the selected group if one is set. */
    filteredTraits() {
      return this.selectedGroup ? this.traits.filter(t => t.trait_group === this.selectedGroup) : this.traits
    },
    /** @returns {boolean} Whether the dark theme is active (re-renders the chart with matching colors). */
    isDark() {
      return this.$vuetify.theme.global.current.dark
    },
  },
  watch: {
    isDark() { this.renderPlots() },
    selectedGroup() { this.renderPlots() },
  },
  methods: {
    /** Fetches the trait list from the backend and renders the chart. */
    async loadTraits() {
      this.loading = true
      this.error = null
      try {
        const [res, plotlyModule] = await Promise.all([
          fetch(`${API_BASE_URL}/overview_get_traits/`),
          import('plotly.js-dist-min'),
        ])
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        this.traits = await res.json()
        // markRaw: Plotly must not be wrapped in a Vue reactive proxy (also passed down as a prop).
        this.plotly = markRaw(plotlyModule.default || plotlyModule)
      } catch (err) {
        console.error('Error fetching traits:', err)
        this.error = 'The trait list could not be loaded.'
      }
      this.loading = false
      await this.$nextTick()
      this.renderPlots()
    },
    /** Shared Plotly layout settings matching the current light/dark theme. */
    baseLayout() {
      const fontColor = this.isDark ? '#e0e0e0' : '#333333'
      return {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {color: fontColor},
        margin: {t: 20, r: 20, b: 40, l: 60},
        legend: {orientation: 'h', y: -0.15},
        height: 380,
      }
    },
    /** Draws (or redraws) the pie chart and wires its click → group filter. */
    renderPlots() {
      const Plotly = this.plotly
      const el = this.$refs.pie
      if (!Plotly || !el || !this.traits.length) return

      Plotly.react(el, [{
        type: 'pie',
        labels: this.groups,
        values: this.groups.map(g => this.groupCounts[g]),
        marker: {colors: this.groups.map(g => this.groupColors[g])},
        pull: this.groups.map(g => (g === this.selectedGroup ? 0.08 : 0)),
        sort: false,
        textinfo: this.groups.length > 12 ? 'none' : 'value',
        hovertemplate: '%{label}<br>%{value:,} traits (%{percent})<extra></extra>',
      }], {
        ...this.baseLayout(),
        margin: {t: 20, r: 20, b: 20, l: 20},
        legend: {orientation: 'v', x: 1.02, y: 0.5, yanchor: 'middle'},
      }, {responsive: true, displaylogo: false})

      // Clicking a slice toggles the group filter. Re-bind each render.
      el.removeAllListeners?.('plotly_click')
      el.on('plotly_click', ev => {
        const g = ev.points[0].label
        this.selectedGroup = this.selectedGroup === g ? null : g
      })
    },
  },
  /** Loads the trait list and chart when the page mounts. */
  mounted() {
    this.loadTraits()
  },
  /** Releases Plotly's resources for the chart. */
  beforeUnmount() {
    if (this.plotly && this.$refs.pie) this.plotly.purge(this.$refs.pie)
  },
}
</script>

<style scoped>
.plot {
  width: 100%;
  min-height: 380px;
}
</style>
