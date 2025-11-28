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
    <div id="manhattan_magma_plot_container" style="width: 100%; height: 600px; background-color: transparent"></div>
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
import {create_manhattan_magma_plot} from '../../utils/magma_plots.js';
import {downloadPlot} from "@/utils/utils.js";


export default {
  name: 'MAGMAManhattan',
  props: {
    traitId: {type: String, required: true},
    magmaResults: {type: Array, required: true},
    totalGenes: {type: Number},
  },
  data() {
    return {
      isLoading: true,
    }
  },

  computed: {
    currentAxesColor() {
      return this.$vuetify.theme.global.name === 'dyHealthNetTheme'
          ? this.$vuetify.theme.themes.dyHealthNetTheme.colors["darken-1"]
          : this.$vuetify.theme.themes.dyHealthNetThemeDark.colors["darken-1"]
    }
  },

  async mounted() {
    this.loadManhattanMAGMAPlot();
  },

  watch: {
    currentAxesColor(newColor, oldColor) {
      if (newColor !== oldColor) {
        this.loadManhattanMAGMAPlot()
      }
    },

    magmaResults: {
      immediate: true,
      deep: true,
      handler() {
        this.loadManhattanMAGMAPlot();
      }
    }
  },

  methods: {
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

    async loadManhattanMAGMAPlot() {
      this.isLoading = true;
      try {
        // clear old plot
        const container = document.getElementById("manhattan_magma_plot_container");
        if (container) container.innerHTML = "";

        // iterate over this.magmaResults and create json with chrom, pos, start, stop, neg_log_pvalue, pvalue
        if (!this.magmaResults || this.magmaResults.length === 0) {
          console.warn("No data available for Manhattan MAGMA plot.");
          return;
        }
        const manhattan_json = this.magmaResults.map(row => ({
          chrom: row['Chrom'],
          pos: (row['Start'] + row['End']) / 2,
          start: row['Start'],
          end: row['End'],
          neg_log_pvalue: row['-Log10(Pvalue)'],
          pvalue: row['Pvalue'],
          gene: row['Gene'],
          symbol: row['Symbol'],
        }));
        const tooltip_template = `
  <b>Gene: <%- d.gene || "N/A" %> (<%- d.symbol || "N/A" %>)</b><br>
   Chr <%- d.chrom %>: <%- d.start %>-<%- d.end %></b><br>
  -log<sub>10</sub>(p): <%- d.neg_log_pvalue ? (+d.neg_log_pvalue).toFixed(3) : "N/A" %>
`;
        create_manhattan_magma_plot(manhattan_json, {
          tooltip_template,
          color1: this.chromosomeColor1(),
          color2: this.chromosomeColor2(),
          axes_color: this.currentAxesColor,
          significance_threshold: 0.05 / this.totalGenes
        });
        this.isLoading = false;
      } catch (error) {
        console.error("Failed to load Manhattan MAGMA plot data:", error);
        document.getElementById('manhattan_magma_plot_container').textContent = 'Could not fetch GWAS plot data.';
      }
    },

    handleDownload(format){
      downloadPlot('#manhattan_magma_plot_container', `manhattan_magma_${this.traitId}`, format);
    }
  },

}
</script>

<style scoped>
table {
  border-collapse: collapse;
  width: 100%;
}

th, td {
  border: 1px solid #ddd;
  padding: 6px;
}

th {
  background-color: #f2f2f2;
  font-weight: bold;
}
</style>