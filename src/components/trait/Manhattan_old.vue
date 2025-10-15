<template>
  <v-container>
    <div id="manhattan_plot_container" style="width: 100%; height: 600px; background-color: transparent"></div>
  </v-container>
</template>


<script>
import {create_gwas_plot} from '../../utils/pheweb_plots.js';
import {API_BASE_URL} from "@/config.js";

export default {
  name: "ManhattanPlot",
  props: {
    traitId: {
      type: String,
      required: true,
    }
  },

  mounted() {
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
        this.loadManhattanPlot()
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

    async loadManhattanPlot() {
      try {
        console.log("trait ID:", this.traitId);
        const res = await fetch(`${API_BASE_URL}/trait_get_manhattan/?id=${this.traitId}`)
        const json = await res.json();
        // clear old plot
        document.getElementById("manhattan_plot_container").innerHTML = "";

        create_gwas_plot(json.variant_bins, json.unbinned_variants, {
          url_prefix: `${API_BASE_URL}/region_view`,
          tooltip_template: '<b><%- d.chrom %>_<%- d.pos %>_<%- (d.ref && d.alt) ? (d.ref + "/" + d.alt) : "" %></b><br>-log<sub>10</sub>(p): <%- d.neg_log_pvalue && (+d.neg_log_pvalue).toFixed(3) %><% var ids = Array.isArray(d.rsid) ? d.rsid : (d.rsid ? [d.rsid] : []); if (ids.length) { %>'
  + '<br>ID: <%- ids.join(", ") %>'
  + '<% } %>',
          color1: this.chromosomeColor1(),
          color2: this.chromosomeColor2(),
          axes_color: this.currentAxesColor,
        })
      } catch (error) {
        console.error("Failed to load GWAS plot data:", error);
        document.getElementById('gwas_plot_container').textContent = 'Could not fetch GWAS plot data.';
      }
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