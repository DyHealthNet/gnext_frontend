/**
 * Multi-trait Manhattan plot renderer (Trait Overview page).
 *
 * A port of `create_gwas_plot` from `pheweb_plots.js` (the trait page's
 * Manhattan plot) that draws the same thing -- binned variants as small
 * points + vertical lines, unbinned variants as hoverable points, same y-axis
 * scale/ticks, chromosome spacing, significance line and tooltip -- but:
 *  - renders into a given element (not the fixed `#manhattan_plot_container`),
 *    so several plots can live on one page;
 *  - `drawManhattan` accepts several traits, drawn on top of each other, either
 *    with the trait page's alternating chromosome colors (`colorMode:
 *    'chromosome'`) or one color per trait (`colorMode: 'trait'`);
 *  - `drawMiami` draws two traits as a Miami plot: the first pointing up, the
 *    second mirrored below, chromosome labels in between, one shared y-scale;
 *  - plots can share one chromosome layout (`chromExtents`) so they line up;
 *  - each call returns `{destroy}` to remove its tooltips again.
 * `exportSvg` downloads a plot as PNG/JPG/SVG. The trait page keeps using
 * `pheweb_plots.js`.
 */
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import {range, sortBy, template} from 'lodash';

const SIGNIFICANCE_THRESHOLD = 5e-8;
const SIG_Q = -Math.log10(SIGNIFICANCE_THRESHOLD);
const CHROM_PADDING = 2e7;
const DEFAULT_TOOLTIP =
    '<b><%- d.chrom %>_<%- d.pos %>_<%- (d.ref && d.alt) ? (d.ref + "/" + d.alt) : "" %></b>'
    + '<br>-log<sub>10</sub>(p): <%- d.neg_log_pvalue && (+d.neg_log_pvalue).toFixed(3) %>'
    + '<% var ids = Array.isArray(d.rsid) ? d.rsid : (d.rsid ? [d.rsid] : []); if (ids.length) { %>'
    + '<br>ID: <%- ids.join(", ") %>'
    + '<% } %>';

/**
 * Per-chromosome [min, max] positions over the bins and unbinned variants of
 * all given traits (same rule as the trait page, unioned across traits).
 * @param {Array<{variant_bins: Array, unbinned_variants: Array}>} traits
 * @returns {Object<string, [number, number]>}
 */
export function computeChromExtents(traits) {
    const ext = {};
    const update = (v) => {
        const e = ext[v.chrom];
        if (!e) ext[v.chrom] = [v.pos, v.pos];
        else if (v.pos > e[1]) e[1] = v.pos;
        else if (v.pos < e[0]) e[0] = v.pos;
    };
    for (const t of traits) {
        (t.variant_bins || []).forEach(update);
        (t.unbinned_variants || []).forEach(update);
    }
    return ext;
}

/** Concatenated chromosome layout (CHROM_PADDING apart), as on the trait page. */
function chromLayout(ext) {
    const chroms = sortBy(Object.keys(ext), parseInt);
    const startPos = {};
    chroms.forEach((c, i) => {
        startPos[c] = i === 0 ? 0 : startPos[chroms[i - 1]] + ext[chroms[i - 1]][1] - ext[chroms[i - 1]][0] + CHROM_PADDING;
    });
    const last = chroms[chroms.length - 1];
    const offset = Object.fromEntries(chroms.map(c => [c, startPos[c] - ext[c][0]]));
    return {
        chroms,
        midpoint: c => startPos[c] + (ext[c][1] - ext[c][0]) / 2,
        gpos: v => offset[v.chrom] + v.pos,
        has: c => offset[c] !== undefined,
        total: startPos[last] + ext[last][1] - ext[last][0],
    };
}

/** Weakest variants first so the strongest are drawn on top (as on the trait page). */
function prepare(traits) {
    return traits.map(t => ({
        ...t,
        variant_bins: t.variant_bins || [],
        unbinned_variants: sortBy(t.unbinned_variants || [], d => d.neg_log_pvalue),
    }));
}

/** Largest −log10 p to scale for (same rule as the trait page) and whether p = 0 occurs. */
function qvalRange(traits) {
    const unbinned = traits.flatMap(t => t.unbinned_variants);
    const includesPval0 = unbinned.some(v => v.pvalue === 0);
    const best = unbinned.length
        ? -Math.log10(d3.min(unbinned, d => (d.pvalue === 0 ? 1 : d.pvalue)))
        : d3.max(traits.flatMap(t => t.variant_bins.flatMap(b => b.qvals || [])));
    return {max: Math.max(SIG_Q + 0.5, Number.isFinite(best) ? best : 0), includesPval0};
}

/**
 * Same ticks/scale rules as `get_y_axis_config` in pheweb_plots.js. With
 * `flipped`, 0 is at the top and values grow downwards (Miami lower panel).
 */
function getYAxisConfig(maxDataQval, plotHeight, includesPval0, flipped = false) {
    let possible;
    if (maxDataQval <= 14) possible = range(0, 14.1, 2);
    else if (maxDataQval <= 28) possible = range(0, 28.1, 4);
    else if (maxDataQval <= 40) possible = range(0, 40.1, 8);
    else {
        possible = range(0, 20.1, 4);
        if (maxDataQval <= 70) possible = possible.concat([30, 40, 50, 60, 70]);
        else if (maxDataQval <= 120) possible = possible.concat([40, 60, 80, 100, 120]);
        else if (maxDataQval <= 220) possible = possible.concat([60, 100, 140, 180, 220]);
        else {
            const p10 = Math.pow(10, Math.floor(Math.log10(maxDataQval)));
            const first = maxDataQval / p10;
            const mult = first <= 2 ? [0.5, 1, 1.5, 2] : first <= 4 ? [1, 2, 3, 4] : [2, 4, 6, 8, 10];
            possible = possible.concat(mult.map(m => m * p10));
        }
    }
    const ticks = possible.filter(q => q < maxDataQval);
    if (ticks.length < possible.length) ticks.push(possible[ticks.length]);
    let maxPlotQval = ticks[ticks.length - 1];
    if (includesPval0) maxPlotQval *= 1.1;
    const split = maxPlotQval > 40;
    const domain = split ? [maxPlotQval, 20, 0] : [maxPlotQval, 0];
    let rng = split ? [0, plotHeight / 2, plotHeight] : [0, plotHeight];
    if (flipped) rng = rng.map(v => plotHeight - v);
    const scale = d3.scaleLinear().clamp(true).domain(domain).range(rng);
    if (includesPval0) ticks.push(Infinity);
    return {scale, drawBreakAt20: split, ticks};
}

/** Draws a y-axis (ticks, break marks) into `g` for scale `y`. */
function drawYAxis(g, y, cfg, includesPval0, axesColor) {
    const axis = d3.axisLeft(y).tickFormat(d3.format('d')).tickValues(cfg.ticks);
    g.append('g').attr('class', 'y axis').attr('transform', 'translate(-8,0)').call(axis)
        .selectAll('text').style('fill', axesColor);
    g.selectAll('.y.axis path').style('stroke', axesColor).style('stroke-width', 1.5);
    g.selectAll('.y.axis line').style('stroke', axesColor).style('stroke-width', 1);
    const brk = (yy) => g.append('line').attr('x1', -15).attr('x2', -1).attr('y1', yy + 6).attr('y2', yy - 6)
        .attr('stroke-width', '3px').style('stroke', axesColor);
    if (includesPval0) brk(y(Infinity) + (y(0) - y(Infinity)) * 0.03);
    if (cfg.drawBreakAt20) brk(y(20));
}

/** Dashed genome-wide significance line with hover tooltip. */
function drawSignificanceLine(g, y, width, axesColor, tip) {
    g.append('line')
        .attr('x1', 0).attr('x2', width)
        .attr('y1', y(SIG_Q)).attr('y2', y(SIG_Q))
        .attr('stroke-width', 4)
        .attr('stroke', axesColor)
        .attr('stroke-dasharray', '6,6')
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);
}

/** Gene symbols of a variant's nearest genes (array of {symbol} or {ensg: symbol} map). */
function geneSymbols(v) {
    const g = v.nearest_genes;
    if (!g) return [];
    if (Array.isArray(g)) return g.map(x => (typeof x === 'string' ? x : x.symbol)).filter(Boolean);
    return Object.values(g).filter(Boolean);
}

/**
 * Draws the bins and unbinned points of `traits` into `g` (bins of all traits
 * first, then points), plus gene labels for the 7 strongest significant peaks
 * when gene annotations are present (as on the trait page). `labelBelow`
 * places labels under the points (Miami lower panel).
 */
function drawTraits(g, svg, traits, {x, y, gpos, has, colorFor, tips, opacity, labelBelow = false, showTraitInTooltip = false}) {
    for (const t of [...traits].reverse()) {
        const bins = g.append('g').attr('class', 'bins').style('opacity', opacity);
        for (const bin of t.variant_bins) {
            if (!has(bin.chrom)) continue;
            const bx = x(gpos(bin));
            const col = colorFor(t, bin.chrom);
            for (const q of bin.qvals || []) {
                bins.append('circle').attr('cx', bx).attr('cy', y(q)).attr('r', 2.3).style('fill', col);
            }
            for (const [lo, hi] of bin.qval_extents || []) {
                bins.append('line').attr('x1', bx).attr('x2', bx).attr('y1', y(lo)).attr('y2', y(hi))
                    .style('stroke', col).style('stroke-width', 4.6).style('stroke-linecap', 'round');
            }
        }
    }
    for (const t of [...traits].reverse()) {
        const tpl = template((showTraitInTooltip ? `<b>${escapeHtml(t.label)}</b><br>` : '') + DEFAULT_TOOLTIP);
        const tip = d3Tip().attr('class', 'd3-tip').html(d => tpl({d})).offset([-6, 0]);
        svg.call(tip);
        tips.push(tip);
        const pts = t.unbinned_variants.filter(v => has(v.chrom));
        g.append('g').attr('class', 'variant_points').style('opacity', opacity)
            .selectAll('circle')
            .data(pts)
            .enter()
            .append('circle')
            .attr('cx', d => x(gpos(d)))
            .attr('cy', d => y(d.neg_log_pvalue))
            .attr('r', 2.3)
            .style('fill', d => colorFor(t, d.chrom))
            .on('mouseover', function (d) { tip.show(d, this); })
            .on('mouseout', tip.hide);

        const labelled = pts.filter(v => !!v.peak && v.neg_log_pvalue > 7.301 && geneSymbols(v).length)
            .sort((a, b) => b.neg_log_pvalue - a.neg_log_pvalue)
            .slice(0, 7);
        g.append('g').attr('class', 'genenames')
            .selectAll('text')
            .data(labelled)
            .enter()
            .append('text')
            .style('font-style', 'italic')
            .attr('text-anchor', 'middle')
            .attr('transform', d => `translate(${x(gpos(d))},${y(d.neg_log_pvalue) + (labelBelow ? 14 : -5)})`)
            .text(d => {
                const genes = geneSymbols(d);
                return genes.length <= 2 ? genes.join(',') : genes.slice(0, 2).join(',') + ',...';
            });
    }
}

/**
 * Draws a horizontal legend (colored dot + trait label per trait) into `svg`,
 * wrapping onto further rows when it doesn't fit into `width`.
 * @returns {number} The height the legend occupies (incl. spacing below it).
 */
function drawLegend(svg, traits, {left, top, width, fontSize, textColor}) {
    const rowHeight = Math.round(fontSize * 1.6);
    const gap = 24;
    const r = 5;
    const g = svg.append('g').attr('class', 'legend');
    let xPos = 0;
    let row = 0;
    for (const t of traits) {
        const item = g.append('g');
        item.append('circle').attr('cx', r).attr('cy', 0).attr('r', r).style('fill', t.color);
        const text = item.append('text')
            .attr('x', 2 * r + 6).attr('y', 0)
            .attr('dominant-baseline', 'central')
            .style('font-size', `${fontSize}px`)
            .style('fill', textColor)
            .text(t.label);
        const w = 2 * r + 6 + text.node().getComputedTextLength();
        if (xPos > 0 && xPos + w > width) { xPos = 0; row += 1; }
        item.attr('transform', `translate(${left + xPos},${top + row * rowHeight + rowHeight / 2})`);
        xPos += w + gap;
    }
    return (row + 1) * rowHeight + 8;
}

/**
 * Draws a Manhattan plot for one or more traits into `container`.
 * @param {HTMLElement} container - Element to draw into (cleared first).
 * @param {Array<{label: string, color: string, variant_bins: Array, unbinned_variants: Array}>} traits
 * @param {object} [options]
 * @param {'chromosome'|'trait'} [options.colorMode] - Alternate colors per chromosome (trait page style) or one color per trait.
 * @param {string} [options.color1] - First alternating chromosome color ('chromosome' mode).
 * @param {string} [options.color2] - Second alternating chromosome color ('chromosome' mode).
 * @param {string} [options.axesColor] - Axis/label color.
 * @param {Object<string,[number,number]>} [options.chromExtents] - Shared chromosome layout (default: from `traits`).
 * @param {number} [options.height] - SVG height in px (trait page: 550), without the legend.
 * @param {number} [options.fontSize] - Legend text size in px ('trait' mode draws a legend above the plot).
 * @returns {{destroy: Function}}
 */
export function drawManhattan(container, traits, {
    colorMode = 'chromosome',
    color1 = 'red',
    color2 = 'blue',
    axesColor = 'green',
    chromExtents = null,
    height = 550,
    fontSize = 12,
} = {}) {
    container.innerHTML = '';
    const tips = [];
    const destroy = () => { tips.forEach(t => t.destroy()); container.innerHTML = ''; };
    if (!traits.length) return {destroy};
    traits = prepare(traits);

    const L = chromLayout(chromExtents || computeChromExtents(traits));
    const svgWidth = container.clientWidth || 900;
    const margin = {left: 70, right: 30, top: 20, bottom: 50};
    const plotWidth = svgWidth - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container).append('svg')
        .attr('width', svgWidth).attr('height', height)
        .style('display', 'block').style('margin', 'auto');
    if (colorMode === 'trait') {
        // Legend (one entry per trait) above the plot area; part of the SVG so it is included in downloads.
        const legendHeight = drawLegend(svg, traits, {left: margin.left, top: 8, width: plotWidth, fontSize, textColor: axesColor});
        margin.top += legendHeight;
        svg.attr('height', height + legendHeight);
    }
    const plot = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const sigTip = d3Tip().attr('class', 'd3-tip').html('Significance Threshold: 5E-8').offset([-8, 0]);
    svg.call(sigTip);
    tips.push(sigTip);

    const x = d3.scaleLinear().domain([0, L.total]).range([0, plotWidth]);
    const {max, includesPval0} = qvalRange(traits);
    const cfg = getYAxisConfig(max, plotHeight, includesPval0);
    const y = cfg.scale;
    drawYAxis(plot, y, cfg, includesPval0, axesColor);
    svg.append('text')
        .style('text-anchor', 'middle')
        .attr('transform', `translate(${margin.left * 0.4},${plotHeight / 2 + margin.top})rotate(-90)`)
        .text('-log₁₀(p-value)')
        .style('fill', axesColor);

    const colorByChrom = d3.scaleOrdinal().domain(L.chroms).range([color1, color2]);
    const colorFor = (t, chrom) => (colorMode === 'trait' ? t.color : colorByChrom(chrom));
    svg.selectAll('text.chrom_label')
        .data(L.chroms).enter().append('text')
        .style('text-anchor', 'middle')
        .attr('transform', c => `translate(${margin.left + x(L.midpoint(c))},${plotHeight + margin.top + 20})`)
        .text(c => c)
        .style('fill', c => (colorMode === 'trait' ? axesColor : colorByChrom(c)));

    drawSignificanceLine(plot, y, plotWidth, axesColor, sigTip);
    drawTraits(plot, svg, traits, {
        x, y, gpos: L.gpos, has: L.has, colorFor, tips,
        opacity: colorMode === 'trait' && traits.length > 1 ? 0.75 : 1,
        showTraitInTooltip: traits.length > 1,
    });
    return {destroy};
}

/**
 * Draws a Miami plot: `top` as a normal Manhattan plot, `bottom` mirrored
 * below it, chromosome labels in between, both on one shared y-scale (so the
 * two traits are directly comparable) and with the trait page's alternating
 * chromosome colors.
 * @param {HTMLElement} container
 * @param {{label: string, variant_bins: Array, unbinned_variants: Array}} top
 * @param {{label: string, variant_bins: Array, unbinned_variants: Array}} bottom
 * @param {object} [options] - `color1`, `color2`, `axesColor`, `chromExtents`, `panelHeight` (px per half).
 * @returns {{destroy: Function}}
 */
export function drawMiami(container, top, bottom, {
    color1 = 'red',
    color2 = 'blue',
    axesColor = 'green',
    chromExtents = null,
    panelHeight = 300,
} = {}) {
    container.innerHTML = '';
    const tips = [];
    const destroy = () => { tips.forEach(t => t.destroy()); container.innerHTML = ''; };
    const [T, B] = prepare([top, bottom]);

    const L = chromLayout(chromExtents || computeChromExtents([T, B]));
    const svgWidth = container.clientWidth || 900;
    const band = 30;  // space for the chromosome labels between the panels
    const margin = {left: 90, right: 30, top: 25, bottom: 25};
    const plotWidth = svgWidth - margin.left - margin.right;
    const height = margin.top + panelHeight + band + panelHeight + margin.bottom;

    const svg = d3.select(container).append('svg')
        .attr('width', svgWidth).attr('height', height)
        .style('display', 'block').style('margin', 'auto');
    const sigTip = d3Tip().attr('class', 'd3-tip').html('Significance Threshold: 5E-8').offset([-8, 0]);
    svg.call(sigTip);
    tips.push(sigTip);

    const x = d3.scaleLinear().domain([0, L.total]).range([0, plotWidth]);
    const {max, includesPval0} = qvalRange([T, B]);
    const cfgTop = getYAxisConfig(max, panelHeight, includesPval0, false);
    const cfgBottom = getYAxisConfig(max, panelHeight, includesPval0, true);
    const colorByChrom = d3.scaleOrdinal().domain(L.chroms).range([color1, color2]);
    const colorFor = (t, chrom) => colorByChrom(chrom);

    const gTop = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const gBottom = svg.append('g').attr('transform', `translate(${margin.left},${margin.top + panelHeight + band})`);
    for (const [g, cfg, t, below] of [[gTop, cfgTop, T, false], [gBottom, cfgBottom, B, true]]) {
        drawYAxis(g, cfg.scale, cfg, includesPval0, axesColor);
        drawSignificanceLine(g, cfg.scale, plotWidth, axesColor, sigTip);
        drawTraits(g, svg, [t], {x, y: cfg.scale, gpos: L.gpos, has: L.has, colorFor, tips, opacity: 1, labelBelow: below});
    }

    // Chromosome labels in the band between the panels.
    svg.selectAll('text.chrom_label')
        .data(L.chroms).enter().append('text')
        .style('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('transform', c => `translate(${margin.left + x(L.midpoint(c))},${margin.top + panelHeight + band / 2})`)
        .text(c => c)
        .style('fill', c => colorByChrom(c));

    // Axis titles: shared "-log10(p-value)" in the middle, trait name per panel.
    svg.append('text')
        .style('text-anchor', 'middle')
        .attr('transform', `translate(${margin.left * 0.42},${margin.top + panelHeight + band / 2})rotate(-90)`)
        .text('-log₁₀(p-value)')
        .style('fill', axesColor);
    const short = s => (s.length > 32 ? s.slice(0, 31) + '…' : s);
    svg.append('text')
        .style('text-anchor', 'middle')
        .attr('transform', `translate(${margin.left * 0.18},${margin.top + panelHeight / 2})rotate(-90)`)
        .text(short(T.shortLabel || T.label))
        .style('fill', axesColor);
    svg.append('text')
        .style('text-anchor', 'middle')
        .attr('transform', `translate(${margin.left * 0.18},${margin.top + panelHeight + band + panelHeight / 2})rotate(-90)`)
        .text(short(B.shortLabel || B.label))
        .style('fill', axesColor);
    return {destroy};
}

/**
 * Downloads an SVG element as SVG, PNG or JPG (white background, 3× scale for
 * raster formats), like the trait page's download button.
 * @param {SVGSVGElement} svg
 * @param {string} fileBase - File name without extension.
 * @param {'png'|'svg'|'jpg'} format
 * @param {number} [scale]
 */
export function exportSvg(svg, fileBase, format = 'png', scale = 3) {
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    if (format === 'svg') {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileBase}.svg`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
    }
    const width = +svg.getAttribute('width');
    const height = +svg.getAttribute('height');
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.drawImage(img, 0, 0, width, height);
        const a = document.createElement('a');
        a.download = `${fileBase}.${format}`;
        a.href = canvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png', 1.0);
        a.click();
        URL.revokeObjectURL(url);
    };
    img.src = url;
}

/** Escapes text for safe use inside the tooltip HTML. */
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
}
