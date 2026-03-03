<template>
  <v-container>
    <v-row class="align-center">
      <!-- Left column: QQ plot -->
       <v-col xs="12" sm="12" md="12" lg="4">
        <div id="qq_plot_container" style="width: 400px; height: 750px;"></div>
      </v-col>

      <!-- Right column: text/info -->
       <v-col xs="12" sm="12" md="12" lg="8">
        <p class="gc-control"></p>
        <i>
          (Genomic Control lambda calculated based on the 50th percentile (median),
          10th percentile, 1st percentile, and 1/10th of a percentile)
        </i>
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
import {create_qq_plot} from '../../utils/pheweb_plots.js';
import {API_BASE_URL} from "@/config.js";
import { sortBy, toPairs} from "lodash"
import {downloadPlot} from "@/utils/utils.js";

export default {
  name: "QQPlot",
  props: {
    traitId: {
      type: String,
      required: true,
    }
  },

  data() {
    return {
      textSize: 12,
    }
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
        this.loadQQPlot()
      }
    },
    textSize() {
      this.updateTextSize()
    }
  },

  mounted() {
    this.loadQQPlot();
  },

  methods: {
    async loadQQPlot() {
      try {
        const res = await fetch(`${API_BASE_URL}/trait_get_qq/?id=${this.traitId}`);
        const data = await res.json();

        // clear old plot
        const qqContainer = document.getElementById("qq_plot_container");
        if (qqContainer) {
          qqContainer.innerHTML = "";
        } else {
          console.warn('qq_plot_container not found in DOM');
        }

        // Display GC lambda values
        const container = document.querySelector('.gc-control');
        if (container) {
          container.innerHTML = ''; // clear existing content if any

          sortBy(toPairs(data.overall.gc_lambda), d => -d[0])
              .forEach((d, i) => {
                let text = `GC lambda ${d[0]}: ${d[1].toFixed(3)}`;
                if (i === 0) {
                  text = `<b>${text}</b>`;
                }
                container.innerHTML += `<br>${text}`;
              });
        } else {
          console.warn('gc-control element not found; skipping GC lambda display');
        }

        // Draw QQ plot
        if (data.by_maf) {
          create_qq_plot(data.by_maf, data.ci, this.currentAxesColor);
        } else {
          create_qq_plot(
              [{maf_range: [0, 0.5], qq: data.overall.qq, count: data.overall.count}],
              data.ci,
              this.currentAxesColor
          );
        }
      } catch (error) {
        console.error("Failed to load QQ plot data:", error);
        document.getElementById('qq_plot_container').textContent = 'Could not fetch QQ plot data.';
      }
    },

    handleDownload(format){
      downloadPlot('#qq_plot_container', `qq_gwas_${this.traitId}`, format);
    },

    updateTextSize() {
      const container = document.getElementById('qq_plot_container')
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

#qq_plot_container .axis g.tick line {
  stroke: #666;
  opacity: 0.3;
  fill: none;
}

#qq_plot_container {
  background-color: transparent !important;
}

.x.axis {
      font-size: 12px;
      font-family: sans-serif;
      color: black;
    }
</style>