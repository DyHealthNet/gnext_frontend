<template>
  <v-container>
    <div id="qq_plot_container" style="width: 400px; height: 710px; background-color: white"></div>
    <p class="gc-control"></p>
    <i>(Genomic Control lambda calculated based on the 50th percentile (median), 10th percentile, 1st percentile,
            and 1/10th of a percentile)</i>
  </v-container>
</template>


<script>
import {create_qq_plot} from '../../utils/pheweb_plots.js';
import {API_BASE_URL} from "@/config.js";
import { sortBy, toPairs} from "lodash"

export default {
  name: "QQPlot",
  props: {
    traitId: {
      type: String,
      required: true,
    }
  },

  mounted() {
    this.loadQQPlot();
  },

  methods: {
    async loadQQPlot() {
      try {
        console.log("trait ID:", this.traitId);
        const res = await fetch(`${API_BASE_URL}/trait_get_qq/?id=${this.traitId}`);
        const data = await res.json();

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
          create_qq_plot(data.by_maf, data.ci);
        } else {
          create_qq_plot(
              [{maf_range: [0, 0.5], qq: data.overall.qq, count: data.overall.count}],
              data.ci
          );
        }
      } catch (error) {
        console.error("Failed to load QQ plot data:", error);
        document.getElementById('qq_plot_container').textContent = 'Could not fetch QQ plot data.';
      }


    }
  }


}
</script>

<style>
#qq_plot_container .axis path.domain {
  stroke: black;
  fill: none;
}

#qq_plot_container .axis g.tick line {
  stroke: #666;
  opacity: 0.3;
}

.x.axis {
      font-size: 12px;
      font-family: sans-serif;
      color: black;
    }
</style>