<template>
  <div>
    <p class="text-body-1 mb-3">
      Compare the Manhattan plots of up to <strong>{{ maxTraits }}</strong> traits, drawn exactly as on the
      individual trait pages. <strong>Overlaid</strong> draws all selected traits in one plot, one color per trait.
      With exactly two traits, <strong>Stacked</strong> is also available: a Miami plot with the second trait
      mirrored below the first. Hover over a point to see the variant.
    </p>

    <div class="d-flex flex-wrap ga-2 mb-3" v-if="selected.length">
      <v-chip
          v-for="id in selected"
          :key="id"
          :color="colorFor(id)"
          variant="flat"
          size="small"
          closable
          @click:close="removeTrait(id)"
      >
        {{ labelFor(id) }}
      </v-chip>
    </div>

    <AutoCompleteTraitSelect
        label="Search for a trait to add"
        :disabled="selected.length >= maxTraits"
        :hint="selected.length >= maxTraits ? `Maximum of ${maxTraits} traits reached. Remove one to add another.` : `${selected.length} of ${maxTraits} traits selected`"
        :excludeIds="selected"
        @select="addTrait"
    />

    <div class="d-flex justify-end align-center mt-3 ga-3">
      <span v-if="!isTwo" class="text-caption text-medium-emphasis">Select exactly two traits to enable the stacked view.</span>
      <v-btn-toggle :model-value="effectiveLayout" @update:model-value="v => v && (layout = v)" mandatory
                    density="compact" color="primary" variant="outlined" divided>
        <v-btn value="overlaid" prepend-icon="mdi-layers-outline">Overlaid</v-btn>
        <v-btn value="stacked" prepend-icon="mdi-view-sequential" :disabled="!isTwo">Stacked</v-btn>
      </v-btn-toggle>
    </div>

    <div ref="wrapper" class="position-relative mt-2" style="min-height: 120px;">
      <v-overlay :model-value="loadingIds.length > 0" contained class="align-center justify-center">
        <v-progress-circular color="primary" indeterminate size="48"/>
      </v-overlay>
      <v-alert v-if="failedIds.length" type="warning" variant="tonal" density="compact" class="mb-2">
        Could not load Manhattan data for: {{ failedIds.join(', ') }}
      </v-alert>
      <v-alert v-if="!selected.length" type="info" variant="tonal" density="compact">
        Select one or more traits to display their Manhattan plots.
      </v-alert>

      <div v-if="effectiveLayout === 'stacked'" ref="miami" class="manhattan-multi"></div>
      <div v-else v-show="loadedIds.length" ref="overlay" class="manhattan-multi"></div>
    </div>

    <!-- Settings, as below the trait page's Manhattan plot -->
    <v-row v-if="loadedIds.length" class="mt-2">
      <v-col cols="12" class="d-flex justify-end align-center flex-wrap">
        <div class="d-flex align-center mr-4" style="min-width: 250px;">
          <v-icon class="mr-2">mdi-format-size</v-icon>
          <v-slider v-model="textSize" :min="8" :max="25" :step="1" thumb-label density="compact" hide-details class="mr-2">
            <template v-slot:append>
              <span class="text-caption" style="min-width: 40px;">{{ textSize }}px</span>
            </template>
          </v-slider>
        </div>

        <!-- Overlaid: one color per trait -->
        <template v-if="effectiveLayout === 'overlaid'">
          <v-menu v-for="id in loadedIds" :key="'color-' + id" :close-on-content-click="false" offset-y>
            <template #activator="{ props }">
              <v-btn v-bind="props" icon size="small" class="mr-2" :title="`Color of ${labelFor(id)}`">
                <v-icon :color="colorFor(id)">mdi-palette</v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-card-text>
                <div class="text-caption mb-2">{{ labelFor(id) }}</div>
                <v-color-picker :model-value="colorFor(id)" @update:model-value="c => setTraitColor(id, c)" mode="hex" hide-inputs></v-color-picker>
              </v-card-text>
            </v-card>
          </v-menu>
          <span class="mr-2"></span>
        </template>
        <!-- Stacked (Miami): the two alternating chromosome colors -->
        <template v-else>
          <v-menu v-for="n in [1, 2]" :key="'chrom-color-' + n" :close-on-content-click="false" offset-y>
            <template #activator="{ props }">
              <v-btn v-bind="props" icon size="small" :class="n === 2 ? 'mr-4' : 'mr-2'" :title="`Chromosome color ${n}`">
                <v-icon :color="chromColor(n)">mdi-palette</v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-card-text>
                <div class="text-caption mb-2">Chromosome Color {{ n }}</div>
                <v-color-picker :model-value="chromColor(n)" @update:model-value="c => setChromColor(n, c)" mode="hex" hide-inputs></v-color-picker>
              </v-card-text>
            </v-card>
          </v-menu>
        </template>

        <v-menu offset-y>
          <template #activator="{ props }">
            <v-btn color="primary" v-bind="props" prepend-icon="mdi-download">Download</v-btn>
          </template>
          <v-list>
            <v-list-item @click="download('png')">PNG</v-list-item>
            <v-list-item @click="download('svg')">SVG</v-list-item>
            <v-list-item @click="download('jpg')">JPG</v-list-item>
          </v-list>
        </v-menu>
      </v-col>
    </v-row>
  </div>
</template>

<script>
/**
 * Multi-trait Manhattan plot (Trait Overview page).
 *
 * Lets the user pick up to `maxTraits` traits (via the Typesense trait search,
 * `AutoComplete_TraitSelect`) and shows their Manhattan plots exactly as the
 * trait page draws them (same data from `trait_get_manhattan`, same D3 drawing
 * via `utils/manhattan_multi.js`, a port of the trait page's renderer), in one
 * of two layouts:
 *  - **overlaid** (default, 1–5 traits): all traits in one plot, one
 *    (editable) color per trait, with a legend above the plot;
 *  - **stacked** (only with exactly two traits): a Miami plot -- the second
 *    trait mirrored below the first -- with the trait page's alternating
 *    chromosome colors. When the selection changes away from two traits, the
 *    view falls back to overlaid.
 * Below the plots, the trait page's settings: text size, colors (two
 * chromosome colors, or one per trait when overlaid) and PNG/SVG/JPG download.
 * Data is held only for the currently selected traits: removing a trait (or
 * leaving the page) discards it, and re-adding it fetches it again -- nothing
 * is kept or stored in the browser.
 */
import {API_BASE_URL} from "@/config.js";
import AutoCompleteTraitSelect from "@/components/autocomplete/AutoComplete_TraitSelect.vue";
import {drawManhattan, drawMiami, computeChromExtents, exportSvg} from "@/utils/manhattan_multi.js";

/** Distinct trait colors for the overlaid layout (Okabe–Ito based, colorblind-friendly). */
const TRAIT_COLORS = ['#0072B2', '#E69F00', '#009E73', '#CC79A7', '#D55E00']

export default {
  name: 'MultiTraitManhattan',
  components: {AutoCompleteTraitSelect},
  props: {
    /** All traits of the study: `[{trait_id, trait_label, ...}]`. */
    traits: {type: Array, required: true},
    /** Whether the dark theme is active. */
    isDark: {type: Boolean, default: false},
    maxTraits: {type: Number, default: 5},
  },
  data() {
    return {
      selected: [],
      layout: 'overlaid',
      textSize: 12,
      chromColors: {1: null, 2: null},  // null = theme default (as on the trait page)
      traitColors: {},                   // trait_id -> user-picked color (overlaid layout)
      cache: {},        // selected trait_id -> {variant_bins, unbinned_variants}; only while selected
      searchLabels: {}, // trait_id -> label from the search hit (fallback if not in `traits`)
      loadingIds: [],
      failedIds: [],
    }
  },
  created() {
    // Non-reactive bookkeeping (live renderers, resize handling).
    this.renderers = []
    this.resizeTimer = null
  },
  computed: {
    /** @returns {Object<string,string>} trait_id → label, from the study's trait list. */
    traitLabels() {
      return Object.fromEntries(this.traits.map(t => [t.trait_id, t.trait_label]))
    },
    /** @returns {string[]} Selected traits whose data has loaded, in selection order. */
    loadedIds() {
      return this.selected.filter(id => this.cache[id])
    },
    /** @returns {boolean} Exactly two traits are shown → the stacked (Miami) view can be chosen. */
    isTwo() {
      return this.loadedIds.length === 2
    },
    /** @returns {'stacked'|'overlaid'} The layout actually drawn (stacked only with exactly two traits). */
    effectiveLayout() {
      return this.isTwo && this.layout === 'stacked' ? 'stacked' : 'overlaid'
    },
  },
  watch: {
    selected(newIds, oldIds) {
      if (newIds.length > this.maxTraits) {
        // Hard cap (e.g. via paste/keyboard): keep the first `maxTraits`.
        this.selected = newIds.slice(0, this.maxTraits)
        return
      }
      if (oldIds) this.failedIds = this.failedIds.filter(id => newIds.includes(id))
      // Drop the data of traits that are no longer selected (no caching).
      const kept = Object.fromEntries(Object.entries(this.cache).filter(([id]) => newIds.includes(id)))
      if (Object.keys(kept).length !== Object.keys(this.cache).length) this.cache = kept
      newIds.filter(id => !this.cache[id]).forEach(id => this.load(id))
      this.scheduleRender()
    },
    layout() { this.scheduleRender() },
    // Leaving the two-trait selection falls back to the default overlaid view.
    isTwo(two) { if (!two) this.layout = 'overlaid' },
    chromColors: {deep: true, handler() { this.scheduleRender() }},
    traitColors: {deep: true, handler() { this.scheduleRender() }},
    // Overlaid: redraw so the legend is re-laid out for the new text size; Miami: just restyle the text.
    textSize() { if (this.effectiveLayout === 'overlaid') this.scheduleRender(); else this.applyTextSize() },
    isDark() { this.scheduleRender() },
    traits: {
      immediate: true,
      handler(ts) {
        // Preselect the first trait so the plot isn't empty on first visit.
        if (!this.selected.length && ts.length) this.selected = [ts[0].trait_id]
      },
    },
  },
  methods: {
    /** Adds a trait picked in the search box (ignored if already selected or at the maximum). */
    addTrait({id, description}) {
      if (!id || this.selected.includes(id) || this.selected.length >= this.maxTraits) return
      if (description) this.searchLabels = {...this.searchLabels, [id]: description}
      this.selected = [...this.selected, id]
    },
    /** Removes a trait from the plot. */
    removeTrait(id) {
      this.selected = this.selected.filter(x => x !== id)
    },
    /** @returns {string} Display label "Label (id)" for a trait. */
    labelFor(id) {
      const label = this.traitLabels[id] || this.searchLabels[id]
      return label && label !== id ? `${label} (${id})` : id
    },
    /** @returns {string} Color of a selected trait: user-picked, else by selection slot. */
    colorFor(id) {
      if (this.traitColors[id]) return this.traitColors[id]
      const i = this.selected.indexOf(id)
      return TRAIT_COLORS[(i < 0 ? 0 : i) % TRAIT_COLORS.length]
    },
    /** Sets a trait's color (overlaid layout). */
    setTraitColor(id, color) {
      this.traitColors = {...this.traitColors, [id]: color}
    },
    /** @returns {string} Alternating chromosome color `n` (1 or 2): user-picked, else the theme's. */
    chromColor(n) {
      const t = this.themeColors()
      return this.chromColors[n] || (n === 1 ? t.color1 : t.color2)
    },
    /** Sets alternating chromosome color `n` (stacked / Miami layout). */
    setChromColor(n, color) {
      this.chromColors = {...this.chromColors, [n]: color}
    },
    /** @returns {HTMLElement[]} The container currently holding the plot. */
    plotContainers() {
      const el = this.effectiveLayout === 'stacked' ? this.$refs.miami : this.$refs.overlay
      return el ? [el] : []
    },
    /** Applies the text-size slider to all text in the plots (as on the trait page). */
    applyTextSize() {
      for (const el of this.plotContainers()) {
        el.querySelectorAll('svg text').forEach(t => { t.style.fontSize = `${this.textSize}px` })
      }
    },
    /** Downloads the shown plot as a PNG/SVG/JPG file. */
    download(format) {
      const svg = this.plotContainers()[0]?.querySelector('svg')
      if (!svg) return
      const name = this.effectiveLayout === 'stacked' ? 'miami' : 'overlaid'
      exportSvg(svg, `manhattan_${name}_${this.loadedIds.join('_')}`.slice(0, 180), format)
    },
    /** Theme colors as used by the trait page's Manhattan plot. */
    themeColors() {
      const themes = this.$vuetify.theme.themes
      const t = this.$vuetify.theme.global.name === 'dyHealthNetTheme' ? themes.dyHealthNetTheme : themes.dyHealthNetThemeDark
      return {color1: t.colors['primary'], color2: t.colors['primary-darken-1'], axesColor: t.colors['darken-1']}
    },
    /** Fetches a trait's Manhattan JSON (the same data the trait page plots). */
    async load(id) {
      this.loadingIds = [...this.loadingIds, id]
      try {
        const res = await fetch(`${API_BASE_URL}/trait_get_manhattan/?id=${encodeURIComponent(id)}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        // Only keep the data if the trait is still selected (it may have been removed while loading).
        if (this.selected.includes(id)) {
          this.cache = {...this.cache, [id]: {variant_bins: json.variant_bins || [], unbinned_variants: json.unbinned_variants || []}}
        }
      } catch (err) {
        console.error(`Manhattan data for ${id} failed:`, err)
        this.failedIds = [...new Set([...this.failedIds, id])]
      } finally {
        this.loadingIds = this.loadingIds.filter(x => x !== id)
        this.scheduleRender()
      }
    },
    /** Redraws after the DOM has updated (and coalesces rapid changes, e.g. resizing). */
    scheduleRender() {
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => this.$nextTick(() => this.render()), 50)
    },
    /** Draws the plots for the current layout. */
    render() {
      this.renderers.forEach(r => r.destroy())
      this.renderers = []
      const ids = this.loadedIds
      if (!ids.length) return
      const {axesColor} = this.themeColors()
      const color1 = this.chromColor(1)
      const color2 = this.chromColor(2)
      const traits = ids.map(id => ({
        id,
        label: this.labelFor(id),
        shortLabel: this.traitLabels[id] || this.searchLabels[id] || id,
        color: this.colorFor(id),
        variant_bins: this.cache[id].variant_bins,
        unbinned_variants: this.cache[id].unbinned_variants,
      }))
      // One shared chromosome layout for all traits.
      const chromExtents = computeChromExtents(traits)
      if (this.effectiveLayout === 'stacked') {
        if (this.$refs.miami) this.renderers.push(drawMiami(this.$refs.miami, traits[0], traits[1], {color1, color2, axesColor, chromExtents}))
      } else if (this.$refs.overlay) {
        this.renderers.push(drawManhattan(this.$refs.overlay, traits, {colorMode: 'trait', axesColor, chromExtents, fontSize: this.textSize}))
      }
      this.applyTextSize()
    },
  },
  /** Redraws when the container width changes (the plots are drawn at a fixed pixel width). */
  mounted() {
    let lastWidth = 0
    this.resizeObserver = new ResizeObserver(entries => {
      const w = Math.round(entries[0].contentRect.width)
      if (w && w !== lastWidth) { lastWidth = w; this.scheduleRender() }
    })
    this.resizeObserver.observe(this.$refs.wrapper)
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect()
    clearTimeout(this.resizeTimer)
    this.renderers.forEach(r => r.destroy())
    this.renderers = []
    this.cache = {}  // release all data when leaving the page
  },
}
</script>

<style scoped>
.manhattan-multi {
  width: 100%;
  min-width: 700px;
}

</style>

<style>
/* Tooltip style, as on the trait page's Manhattan plot. */
.d3-tip {
  line-height: 1.4;
  padding: 12px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  border-radius: 4px;
  pointer-events: none;
  z-index: 2000;
}
</style>
