<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" class="text-center">
        <!-- Loading spinner -->
        <v-progress-circular
          v-if="isLoading"
          indeterminate
          color="primary"
          size="32"
          class="my-3"
        />
        <div v-else id="qq_magma_plot_container" style="width: 400px; height: 750px;"></div>
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
import {create_magma_qq_plot} from "@/utils/magma_plots.js";
import {downloadPlot} from "@/utils/utils.js";

export default {
  name: "MAGMAQQPlot",
  props: {
    traitId: {
      type: String,
      required: true,
    },
    magmaResults: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      isLoading: true,
      textSize: 12,
    };
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
        this.loadMAGMAQQPlot()
      }
    },
    textSize() {
      this.updateTextSize()
    },

    magmaResults: {
      handler(newVal) {
        if (newVal && newVal.length > 0) {
          this.isLoading = false;
          this.$nextTick(() => {
            this.loadMAGMAQQPlot(newVal);
          });
        } else {
          this.isLoading = true;
        }
      },
      immediate: true
    }
  },

  mounted() {
    this.loadMAGMAQQPlot();
  },

  methods: {
    async loadMAGMAQQPlot() {
      try {
        const pvals = this.magmaResults.map(result => ({P : result.pvalue}));
        create_magma_qq_plot(pvals, this.currentAxesColor);
      } catch (error) {
        console.error("Failed to load MAGMA QQ plot data:", error);
        document.getElementById('qq_magma_plot_container').textContent = 'Could not fetch QQ plot data.';
      }
    },

    handleDownload(format){
      downloadPlot('#qq_magma_plot_container', `qq_magma_${this.traitId}`, format);
    },

    updateTextSize() {
      const container = document.getElementById('qq_magma_plot_container')
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