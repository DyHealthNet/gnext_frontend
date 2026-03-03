<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <div id="manhattan_plot_container" style="width: 100%; height: 600px; background-color: transparent"></div>
      </v-col>
    </v-row>
    
    <v-row class="mt-4">
      <v-col cols="12" class="d-flex justify-end align-center">
        <div class="d-flex align-center mr-4" style="min-width: 250px;">
          <v-icon class="mr-2">mdi-format-size</v-icon>
          <v-slider
            v-model="textSize"
            :min="8"
            :max="25"
            :step="1"
            thumb-label
            density="compact"
            hide-details
            class="mr-2"
          >
            <template v-slot:append>
              <span class="text-caption" style="min-width: 40px;">{{ textSize }}px</span>
            </template>
          </v-slider>
        </div>
        
        <v-menu :close-on-content-click="false" offset-y>
          <template #activator="{ props }">
            <v-btn v-bind="props" icon size="small" class="mr-2">
              <v-icon :color="chromColor1">mdi-palette</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-text>
              <div class="text-caption mb-2">Chromosome Color 1</div>
              <v-color-picker v-model="chromColor1" mode="hex" hide-inputs></v-color-picker>
            </v-card-text>
          </v-card>
        </v-menu>
        
        <v-menu :close-on-content-click="false" offset-y>
          <template #activator="{ props }">
            <v-btn v-bind="props" icon size="small" class="mr-4">
              <v-icon :color="chromColor2">mdi-palette</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-text>
              <div class="text-caption mb-2">Chromosome Color 2</div>
              <v-color-picker v-model="chromColor2" mode="hex" hide-inputs></v-color-picker>
            </v-card-text>
          </v-card>
        </v-menu>
        
        <v-menu offset-y>
          <template #activator="{ props }">
            <v-btn color="primary" v-bind="props" prepend-icon="mdi-download">
              Download
            </v-btn>
          </template>

          <v-list>
            <v-list-item @click="handleDownload('png')">PNG</v-list-item>
            <v-list-item @click="handleDownload('svg')">SVG</v-list-item>
            <v-list-item @click="handleDownload('jpg')">JPG</v-list-item>
          </v-list>
        </v-menu>
      </v-col>
    </v-row>
  </v-container>
</template>


<script>
import {create_gwas_plot} from '../../utils/pheweb_plots.js';
import {API_BASE_URL} from "@/config.js";
import {downloadPlot} from "@/utils/utils.js";

export default {
  name: "ManhattanPlot",
  props: {
    traitId: {
      type: String,
      required: true,
    }
  },

  data() {
    return {
      textSize: 12,
      chromColor1: null,
      chromColor2: null,
      isLoadingPlot: false,
      plotLoadTimeout: null,
    }
  },

  mounted() {
    this.chromColor1 = this.chromosomeColor1();
    this.chromColor2 = this.chromosomeColor2();
    this.loadManhattanPlot();
  },

  computed: {
    currentAxesColor() {
      return this.$vuetify.theme.global.name === 'dyHealthNetTheme'
        ? this.$vuetify.theme.themes.dyHealthNetTheme.colors["darken-1"]
        : this.$vuetify.theme.themes.dyHealthNetThemeDark.colors["darken-1"]
    }
  },

  watch: {
    currentAxesColor(newColor, oldColor) {
      if (newColor !== oldColor) {
        this.debouncedLoadPlot()
      }
    },
    textSize() {
      this.updateTextSize()
    },
    chromColor1() {
      this.debouncedLoadPlot()
    },
    chromColor2() {
      this.debouncedLoadPlot()
    }
  },


  methods: {

    debouncedLoadPlot() {
      // Clear any pending plot load
      if (this.plotLoadTimeout) {
        clearTimeout(this.plotLoadTimeout)
      }
      // Debounce to avoid multiple simultaneous calls
      this.plotLoadTimeout = setTimeout(() => {
        this.loadManhattanPlot()
      }, 150)
    },

    chromosomeColor1() {
      let color = "white"
      if (this.$vuetify.theme.global.name === 'dyHealthNetTheme') {
        color = this.$vuetify.theme.themes.dyHealthNetTheme.colors["primary"]
      } else {
        color = this.$vuetify.theme.themes.dyHealthNetThemeDark.colors["primary"]
      }
      return color
    },

    chromosomeColor2() {
      let color = "white"
      if (this.$vuetify.theme.global.name === 'dyHealthNetTheme') {
        color = this.$vuetify.theme.themes.dyHealthNetTheme.colors["primary-darken-1"]
      } else {
        color = this.$vuetify.theme.themes.dyHealthNetThemeDark.colors["primary-darken-1"]
      }
      return color
    },

    async loadManhattanPlot() {
      // Prevent multiple simultaneous loads
      if (this.isLoadingPlot) return
      
      this.isLoadingPlot = true
      try {
        const res = await fetch(`${API_BASE_URL}/trait_get_manhattan/?id=${this.traitId}`)
        const json = await res.json();
        
        // clear old plot
        const container = document.getElementById("manhattan_plot_container")
        if (container) {
          container.innerHTML = ""
        }

        create_gwas_plot(json.variant_bins, json.unbinned_variants, {
          url_prefix: `${API_BASE_URL}/region_view`,
          tooltip_template: '<b><%- d.chrom %>_<%- d.pos %>_<%- (d.ref && d.alt) ? (d.ref + "/" + d.alt) : "" %></b><br>-log<sub>10</sub>(p): <%- d.neg_log_pvalue && (+d.neg_log_pvalue).toFixed(3) %><% var ids = Array.isArray(d.rsid) ? d.rsid : (d.rsid ? [d.rsid] : []); if (ids.length) { %>'
  + '<br>ID: <%- ids.join(", ") %>'
  + '<% } %>',
          color1: this.chromColor1,
          color2: this.chromColor2,
          axes_color: this.currentAxesColor,
        })
      } catch (error) {
        console.error("Failed to load GWAS plot data:", error);
        const container = document.getElementById('manhattan_plot_container')
        if (container) {
          container.textContent = 'Could not fetch GWAS plot data.'
        }
      } finally {
        this.isLoadingPlot = false
      }
    },

    handleDownload(format){
      downloadPlot('#manhattan_plot_container', `manhattan_gwas_${this.traitId}`, format);
    },

    updateTextSize() {
      const container = document.getElementById('manhattan_plot_container')
      if (!container) return

      // Update all text elements in the plot
      container.querySelectorAll('text').forEach(text => {
        text.style.fontSize = `${this.textSize}px`
      })
    }
  }
}
</script>

<style>
/* Creates a small triangle extender for the tooltip */
    .d3-tip {
      line-height: 1.4;
      padding: 12px;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      border-radius: 4px;
      pointer-events: none;
    }

    /* Creates a small triangle extender for the tooltip */
    .d3-tip:after {
      display: inline;
      font-size: 10px;
      width: 100%;
      line-height: 1;
      color: rgba(0, 0, 0, 0.8);
      position: absolute;
      pointer-events: none;
    }

    /* Northward tooltips */
    .d3-tip.n:after {
      content: "\25BC";
      margin: -3px 0 0 0;
      top: 100%;
      left: 0;
      text-align: center;
    }

    .y.axis {
      font-size: 12px;
      font-family: sans-serif;
      color: black;
    }

    #manhattan_plot_container {
      min-width: 700px;
    }

    #manhattan_plot_container .axis > path.domain {
      stroke-width: 2px;
      stroke: #666;
      fill: none;
    }

    #manhattan_plot_container .axis g.tick line {
      stroke: #666;
    }
</style>