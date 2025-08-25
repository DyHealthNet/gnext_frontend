<template>
  <v-container>
    <div id="qq_plot_container" style="width: 400px; height: 710px;"></div>
    <p class="gc-control"></p>
    <i>(Genomic Control lambda calculated based on the 50th percentile (median), 10th percentile, 1st percentile,
            and 1/10th of a percentile)</i>
  </v-container>


</template>

<script>
import Plotly from 'plotly.js-dist-min'
import { API_BASE_URL } from '@/config.js'
import { sortBy, toPairs } from 'lodash'
import {create_qq_plot} from "@/utils/pheweb_plots.js";

export default {
  name: 'QQPlot',
  props: {
    traitId: { type: String, required: true }
  },
  mounted() {
    this.loadQQPlot()
  },
  methods: {

    labelColor(grid = false) {
      // chartjs does not support theme colors so we just directly call the theme color
      let colorName = grid ? "chart-grid" : "chart";
      if (this.$vuetify.theme.global.name === 'dyHealthNetTheme') {
        return this.$vuetify.theme.themes.dyHealthNetTheme.colors[colorName];
      } else {
        return this.$vuetify.theme.themes.dyHealthNetThemeDark.colors[colorName];
      }
    },

    attemptTwoDecimals(x) {
      if (x === 0) return '0'
      if (x >= 0.01) return x.toFixed(2)
      if (x >= 0.001) return x.toFixed(3)
      return Number(x).toExponential(0)
    },

    buildTrumpetTraces(qqCi) {
      const x = qqCi.map(d => d.x)
      const yLower = qqCi.map(d => Math.max(0, d.y_min - 0.05))
      const yUpper = qqCi.map(d => d.y_max + 0.05)

      const lower = {
        type: 'scatter',
        mode: 'lines',
        name: 'Confidence band',
        x,
        y: yLower,
        line: { width: 0 },
        hoverinfo: 'skip',
        showlegend: false
      }
      const upper = {
        type: 'scatter',
        mode: 'lines',
        x,
        y: yUpper,
        fill: 'tonexty',
        fillcolor: 'lightgray',
        line: { width: 0 },
        hoverinfo: 'skip',
        showlegend: false
      }
      return [lower, upper]
    },

    buildMafTraces(mafRanges) {
      const palette = ['#e66101', '#fdb863', '#b2abd2', '#5e3c99']
      return mafRanges.map((m, i) => {
        const bins = m.qq?.bins ?? []
        const x = bins.map(b => b[0])
        const y = bins.map(b => b[1])
        const min = this.attemptTwoDecimals(m.maf_range?.[0] ?? 0)
        const max = this.attemptTwoDecimals(m.maf_range?.[1] ?? 0.5)
        const label = `${min} ≤ MAF < ${max} (${m.count})`
        return {
          type: 'scattergl',
          mode: 'markers',
          name: label,
          x,
          y,
          marker: { size: 3, color: palette[i % palette.length] },
          hovertemplate: 'exp: %{x}<br>obs: %{y}<extra></extra>'
        }
      })
    },

    async drawQQPlot(mafRanges, qqCi) {
      const container = document.getElementById('qq_plot_container')
      if (!container) return

      // Escape hatch like original code
      const hasBins = mafRanges?.[0]?.qq?.bins?.length
      if (!hasBins) {
        container.textContent =
          'No QQ Plot could be generated. It is possible that your data contains only very extreme p-values.'
        return
      }

      const expMax = Math.max(...mafRanges.map(m => m.qq?.max_exp_qval ?? 0), 0)
      let maxObs = 0
      for (const m of mafRanges) {
        for (const b of m.qq?.bins ?? []) {
          if (b[1] > maxObs) maxObs = b[1]
        }
      }
      const obsMax = Math.ceil(Math.max(maxObs, expMax)) + 0.01

      const traces = [
        ...this.buildTrumpetTraces(qqCi),
        ...this.buildMafTraces(mafRanges)
      ]

      const layout = {
        margin: { l: 30, r: 20, t: 35, b: 20 },
        xaxis: {
          title: 'expected -log\u2081\u2080(p)',
          range: [0, expMax],
          dtick: 1,
          ticks: 'outside',
          showgrid: true,
          zeroline: false,
          tickfont: {
            color: this.labelColor()
          },
          gridcolor: this.labelColor(true),
        },
        yaxis: {
          title: 'observed -log\u2081\u2080(p)',
          range: [0, obsMax],
          dtick: 1,
          ticks: 'outside',
          showgrid: true,
          zeroline: false,
          scaleanchor: 'x',
          scaleratio: obsMax / Math.max(expMax, 1e-9),
          tickfont: {
            color: this.labelColor()
          },
          gridcolor: this.labelColor(true),
        },
        paper_bgcolor: 'rgba(0,0,0,0)',  // outer background transparent
        plot_bgcolor: 'rgba(0,0,0,0)',   // plot area background transparent
        legend: {
          orientation: 'v',
          x: 0.1,
          xanchor: "left",
          yanchor: 'top',
          y: -0.05
        }
      }
      const config = {
        displayModeBar: true,
        responsive: true,
        scrollZoom: false
      }

      await Plotly.react(container, traces, layout, config)
    },

    async loadQQPlot() {
      try {
        const res = await fetch(`${API_BASE_URL}/trait_qq/?id=${this.traitId}`)
        const data = await res.json()

        // GC lambda lines
        const container = document.querySelector('.gc-control')
        container.innerHTML = ''
        sortBy(toPairs(data.overall.gc_lambda), d => -d[0]).forEach((d, i) => {
          let text = `GC lambda ${d[0]}: ${Number(d[1]).toFixed(3)}`
          if (i === 0) text = `<b>${text}</b>`
          container.innerHTML += `<br>${text}`
        })

        // Draw Plotly QQ
        if (data.by_maf) {
          await this.drawQQPlot(data.by_maf, data.ci)
        } else {
          await this.drawQQPlot(
            [{ maf_range: [0, 0.5], qq: data.overall.qq, count: data.overall.count }],
            data.ci
          )
        }
      } catch (e) {
        console.error('Failed to load QQ plot data:', e)
        document.getElementById('qq_plot_container').textContent =
          'Could not fetch QQ plot data.'
      }
    }
  }
}
</script>

<style>
/* Optional: axis text styling similar to your D3 styles */
#qq_plot_container .xtick text,
#qq_plot_container .ytick text {
  font-size: 12px;
  font-family: sans-serif;
  fill: black;
}
</style>
