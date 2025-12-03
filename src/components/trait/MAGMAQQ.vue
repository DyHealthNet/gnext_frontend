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

         <div class="d-flex justify-end mt-4">

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
    </div>
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
      isLoading: true
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