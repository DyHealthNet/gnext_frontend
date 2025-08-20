<template>
  <div id="manhattan_plot_container" style="width: 100%; height: 500px"></div>
</template>

<script>
import Plotly from 'plotly.js-dist-min'
import {API_BASE_URL} from '@/config.js'


export default {
  name: 'ManhattanPlot',
  props: {
    traitId: {type: String, required: true}
  },
  data() {
    return {
      plotDivId: 'manhattan_plot_container',
      plotHeight: 500,
      cached: null
    }
  },
  mounted() {
    this.loadAndDraw()
  },

  watch: {
    traitId() {
      this.loadAndDraw()
    }
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

    async loadAndDraw() {
      try {
        // Use exactly the same endpoint/data as the SVG version
        const res = await fetch(`${API_BASE_URL}/trait_manhattan/?id=${this.traitId}`)
        const json = await res.json()
        await this.draw(json)
      } catch (error) {
        console.error('Failed to load GWAS plot data:', error)
        const el = document.getElementById(this.plotDivId)
        if (el) el.textContent = 'Could not fetch GWAS plot data.'
      }
    },

    // ---------------- SVG-equivalent helpers ----------------
    computeChromLayout(variantBins, variants) {
      // Same chrom offset math as the SVG code
      const chromPadding = 2e7
      const ext = {}
      const upd = v => {
            if (!v || v.pos == null || v.chrom == null) return
            const c = String(v.chrom)
            if (!ext[c]) ext[c] = [v.pos, v.pos]
            else {
              if (v.pos < ext[c][0]) ext[c][0] = v.pos
              if (v.pos > ext[c][1]) ext[c][1] = v.pos
            }
          }
      ;(variantBins || []).forEach(upd)
      ;(variants || []).forEach(upd)

      const chroms = Object.keys(ext).sort((a, b) => {
        const ai = parseInt(a);
        const bi = parseInt(b)
        if (!Number.isNaN(ai) && !Number.isNaN(bi)) return ai - bi
        if (!Number.isNaN(ai)) return -1
        if (!Number.isNaN(bi)) return 1
        return String(a).localeCompare(String(b))
      })
      if (!chroms.length) return {offsets: {}, midpoints: [], chroms: []}

      const start = {}
      start[chroms[0]] = 0
      for (let i = 1; i < chroms.length; i++) {
        const prev = chroms[i - 1]
        start[chroms[i]] = start[prev] + (ext[prev][1] - ext[prev][0]) + chromPadding
      }

      const offsets = {}
      chroms.forEach(c => {
        offsets[c] = start[c] - ext[c][0]
      })

      const midpoints = chroms.map(c => ({
        chrom: c,
        midpoint: start[c] + (ext[c][1] - ext[c][0]) / 2
      }))

      return {offsets, midpoints, chroms}
    },

    tooltipHTML(d) {
      const ids = Array.isArray(d.rsid) ? d.rsid : (d.rsid ? [d.rsid] : [])
      const idline = ids.length ? `<br>ID: ${ids.join(', ')}` : ''
      const geneList = Array.isArray(d.nearest_genes) ? d.nearest_genes.map(g => g.symbol).join(', ') : ''
      const genes = geneList ? `<br>${geneList}` : ''
      const q = (d.neg_log_pvalue == null) ? '' : (+d.neg_log_pvalue).toFixed(3)
      return `<b>${d.chrom}_${d.pos}_${(d.ref && d.alt) ? (d.ref + '/' + d.alt) : ''}</b><br>-log<sub>10</sub>(p): ${q}${idline}${genes}`
    },

    // ---------------- Exact pp3 translation in Plotly ----------------
    async draw(json) {
      const el = document.getElementById(this.plotDivId)
      if (!el) return

      const variantBins = json.variant_bins || []
      // z-order identical: sort unbinned weak->strong so strong draw last
      const variants = (json.unbinned_variants || []).slice()
          .sort((a, b) => a.neg_log_pvalue - b.neg_log_pvalue)

      // Chrom layout like SVG
      const {offsets, midpoints, chroms} = this.computeChromLayout(variantBins, variants)
      const xCoord = d => (offsets[String(d.chrom)] || 0) + d.pos

      // Colors alternate by chromosome like SVG
      const chromToColor = {}
      chroms.forEach((c, i) => {
        chromToColor[c] = i % 2 === 0 ? this.chromosomeColor1() : this.chromosomeColor2()
      })

      // Robust parsers so we don't drop values that the SVG drew
      const parseQvals = (raw) => {
        if (raw == null) return []
        if (typeof raw === 'string') raw = raw.split(/[,;\s]+/)
        const arr = Array.isArray(raw) ? raw.flat(Infinity) : [raw]
        return arr.map(v => parseFloat(v)).filter(v => !Number.isNaN(v) && Number.isFinite(v))
      }

      const parseExtents = (raw) => {
        const pairs = []
        for (const item of raw) {
          const a = Number(item[0]), b = Number(item[1])
          if (Number.isFinite(a) && Number.isFinite(b)) {
            pairs.push([a, b]);
          }
        }
        return pairs
      }

      // --------- BIN DOTS: exactly like SVG pp3 (one dot per qval at bin x) ---------
      const bx = [], by = [], bc = []
      for (const b of variantBins
          ) {
        const X = xCoord(b)
        const color = chromToColor[String(b.chrom)] || this.chromosomeColor1()
        const list = parseQvals(b.qvals)
        for (const q of list) {
          bx.push(X);
          by.push(q);
          bc.push(color)
        }
      }
      const binPointTraces = []
      const CHUNK = 50000 // keep WebGL smooth if many points
      for (let i = 0; i < bx.length; i += CHUNK) {
        binPointTraces.push({
          type: 'scattergl',
          mode: 'markers',
          x: bx.slice(i, i + CHUNK),
          y: by.slice(i, i + CHUNK),
          // D3 used r=2.3 -> Plotly marker size ~ diameter = 4.6
          marker: {size: 4.6, opacity: 1, color: bc.slice(i, i + CHUNK)},
          hoverinfo: 'skip',
          showlegend: false,
          name: 'Binned points'
        })
      }

      const lineEven = {x: [], y: []}   // gray
      const lineOdd = {x: [], y: []}   // blue
      const capEven = {x: [], y: []}
      const capOdd = {x: [], y: []}
      const LINE_PX = 4.6
      const CAP_SIZE = LINE_PX

      for (const b of variantBins) {
        const X = xCoord(b)
        const pairs = parseExtents(b.qval_extents ?? b.qvals_extent)
        if (!pairs.length) continue

        const even = (chroms.indexOf(String(b.chrom)) % 2 === 0)
        const line = even ? lineEven : lineOdd
        const caps = even ? capEven : capOdd

        for (const [y1, y2] of pairs) {
          if (!Number.isFinite(y1) || !Number.isFinite(y2)) continue
          line.x.push(X, X, null)
          line.y.push(y1, y2, null)
          // emulate SVG round linecaps
          caps.x.push(X, X)
          caps.y.push(y1, y2)
        }
      }

      const binLinesEven = {
        type: 'scattergl', mode: 'lines',
        x: lineEven.x, y: lineEven.y,
        line: {width: LINE_PX, color: this.chromosomeColor1()},
        hoverinfo: 'skip', showlegend: false
      }
      const binLinesOdd = {
        type: 'scattergl', mode: 'lines',
        x: lineOdd.x, y: lineOdd.y,
        line: {width: LINE_PX, color: this.chromosomeColor2()},
        hoverinfo: 'skip', showlegend: false
      }
      const binCapsEven = {
        type: 'scattergl', mode: 'markers',
        x: capEven.x, y: capEven.y,
        marker: {size: CAP_SIZE, color: this.chromosomeColor1()},
        hoverinfo: 'skip', showlegend: false
      }
      const binCapsOdd = {
        type: 'scattergl', mode: 'markers',
        x: capOdd.x, y: capOdd.y,
        marker: {size: CAP_SIZE, color: this.chromosomeColor2()},
        hoverinfo: 'skip', showlegend: false
      }

// --------- UNBINNED POINTS: same visual as SVG (r=2.3 -> size=4.6), on top ---------
      const unbinnedTrace = {
        type: 'scattergl',
        mode: 'markers',
        x: variants.map(v => xCoord(v)),
        y: variants.map(v => (v.neg_log_pvalue === Infinity ? 10.2 : v.neg_log_pvalue)),
        text: variants.map(v => this.tooltipHTML(v)),
        hoverinfo: 'text',
        marker: {size: 4.6, opacity: 1, color: variants.map(v => chromToColor[String(v.chrom)] || '#AFAFAF')},
        name: 'Variants'
      }

// --------- Significance line (5e-8), dashed & thick like SVG ---------
      const signif = 7.30
      const xsAll = [...variantBins.map(xCoord), ...variants.map(xCoord)]
      const xMin = xsAll.length ? Math.min(...xsAll) : 0
      const xMax = xsAll.length ? Math.max(...xsAll) : 1
      const signifLine = {
        type: 'scatter',
        mode: 'lines',
        x: [xMin, xMax],
        y: [signif, signif],
        line: {dash: 'dash', width: 2, color: 'lightgray'},
        hoverinfo: 'skip',
        name: 'Significance'
      }

      // --------- Axes/layout: match SVG (chrom tick labels, y=0..10 default) ---------
      const layout = {
        height: this.plotHeight,
        xaxis: {
          tickvals: midpoints.map(m => m.midpoint),
          ticktext: midpoints.map(m => m.chrom),
          showgrid: false,
          zeroline: false,
          tickfont: {
            color: this.labelColor()
          }
        },
        yaxis: {
          title: '-log\u2081\u2080(p-value)',
          tickfont: {
            color: this.labelColor()
          },
          gridcolor: this.labelColor(true),
        },
        hovermode: 'closest',
        uirevision: 'manhattan',
        responsive: true,
        autosize: true,
        automargin: true,
        showlegend: false,
        paper_bgcolor: 'rgba(0,0,0,0)',  // outer background transparent
        plot_bgcolor: 'rgba(0,0,0,0)',   // plot area background transparent
      }

      // Render order: bin lines, bin dots, unbinned, significance (same z-order feel as SVG)
      const data = [
        ...binPointTraces,        // per-qval bin dots
        binLinesEven, binLinesOdd,
        binCapsEven, binCapsOdd,  // emulate round linecaps
        unbinnedTrace,
        signifLine
      ]
      await Plotly.newPlot(el, data, layout, {
        responsive: true,
        displayModeBar: true})
    }
  }
}
</script>

<style>
#manhattan_plot_container_new {
  min-width: 700px;
}
</style>
