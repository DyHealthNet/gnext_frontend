<template>
  <v-container>
    <v-row class="align-center">
      <!-- Left column: QQ plot -->
       <v-col xs="12" sm="12" md="12" lg="4"">
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
import {downloadPlot} from "@/utils/utils.js";

export default {
  name: "QQPlot",
  props: {
    traitId: {
      type: String,
      required: true,
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
        document.getElementById("qq_plot_container").innerHTML = "";

        // Display GC lambda values
        const container = document.querySelector('.gc-control');
        container.innerHTML = ''; // clear existing content if any

        sortBy(toPairs(data.overall.gc_lambda), d => -d[0])
            .forEach((d, i) => {
              let text = `GC lambda ${d[0]}: ${d[1].toFixed(3)}`;
              if (i === 0) {
                text = `<b>${text}</b>`;
              }
              container.innerHTML += `<br>${text}`;
            });

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