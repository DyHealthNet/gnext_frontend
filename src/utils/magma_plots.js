/**
 * Manhattan and QQ plots (unbinned version)
 * Compatible with unbinned_variants only.
 */

/* global $ */

import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import {memoize, property, range, some, sortBy, template} from 'lodash';
import $ from 'jquery';

function fmt(format, ...args) {
    return format.replace(/{(\d+)}/g, (match, number) =>
        typeof args[number] != 'undefined' ? args[number] : match
    );
}

function create_manhattan_magma_plot(unbinned_variants, {
    tooltip_template = '<b>{d.chrom}:{d.start}:{d.end}</b><br>P = {d.pvalue}',
    color1 = '#e41a1c',
    color2 = '#377eb8',
    axes_color = '#333',
    significance_threshold = 5e-8
} = {}) {

    // Sort from weakest to strongest (so strongest drawn last = on top)
    unbinned_variants = sortBy(unbinned_variants, d => d.neg_log_pvalue);

    const get_chrom_offsets = memoize(() => {
        const chrom_padding = 2e7;
        const chrom_extents = {};

        for (const v of unbinned_variants) {
            if (!(v.chrom in chrom_extents)) {
                chrom_extents[v.chrom] = [v.pos, v.pos];
            } else {
                chrom_extents[v.chrom][0] = Math.min(chrom_extents[v.chrom][0], v.pos);
                chrom_extents[v.chrom][1] = Math.max(chrom_extents[v.chrom][1], v.pos);
            }
        }

        const chroms = sortBy(Object.keys(chrom_extents), c => (isNaN(+c) ? 1000 : +c));
        const chrom_genomic_start_positions = {};
        chrom_genomic_start_positions[chroms[0]] = 0;

        for (let i = 1; i < chroms.length; i++) {
            const prev = chroms[i - 1];
            chrom_genomic_start_positions[chroms[i]] =
                chrom_genomic_start_positions[prev] +
                chrom_extents[prev][1] -
                chrom_extents[prev][0] +
                chrom_padding;
        }

        const chrom_offsets = {};
        chroms.forEach(chrom => {
            chrom_offsets[chrom] = chrom_genomic_start_positions[chrom] - chrom_extents[chrom][0];
        });

        return {chroms, chrom_extents, chrom_genomic_start_positions, chrom_offsets};
    });

    const get_genomic_position = v => get_chrom_offsets().chrom_offsets[v.chrom] + v.pos;

    const get_y_axis_config = (max_qval, plot_height, includes_pval0) => {
        let ticks = [];
        if (max_qval <= 14) ticks = range(0, 15, 2);
        else if (max_qval <= 28) ticks = range(0, 29, 4);
        else if (max_qval <= 40) ticks = range(0, 41, 8);
        else ticks = range(0, 20.1, 4);

        const filtered = ticks.filter(t => t < max_qval);
        if (filtered.length < ticks.length) filtered.push(ticks[filtered.length]);
        let max_plot_qval = filtered[filtered.length - 1];
        if (includes_pval0) max_plot_qval *= 1.1;

        let scale = d3.scaleLinear().clamp(true);
        if (max_plot_qval <= 40)
            scale = scale.domain([max_plot_qval, 0]).range([0, plot_height]);
        else
            scale = scale.domain([max_plot_qval, 20, 0]).range([0, plot_height / 2, plot_height]);

        if (includes_pval0) filtered.push(Infinity);

        return {scale, ticks: filtered, draw_break_at_20: !(max_plot_qval <= 40)};
    };

    $(function () {
        const svg_width = $('#manhattan_magma_plot_container').width();
        const svg_height = 550;
        const margin = {left: 70, right: 30, top: 20, bottom: 50};
        const plot_width = svg_width - margin.left - margin.right;
        const plot_height = svg_height - margin.top - margin.bottom;

        const svg = d3.select('#manhattan_magma_plot_container').append('svg')
            .attr('width', svg_width)
            .attr('height', svg_height)
            .style('display', 'block')
            .style('margin', 'auto');

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const includes_pval0 = some(unbinned_variants, v => v.pvalue === 0);

        const genomic_extent = d3.extent(unbinned_variants, get_genomic_position);
        const x_scale = d3.scaleLinear().domain(genomic_extent).range([0, plot_width]);

        const highest_qval = Math.max(
            -Math.log10(significance_threshold) + 0.5,
            d3.max(unbinned_variants, v => v.neg_log_pvalue || 0)
        );

        const y_config = get_y_axis_config(highest_qval, plot_height, includes_pval0);
        const y_scale = y_config.scale;

        const y_axis = d3.axisLeft(y_scale)
            .tickFormat(d3.format('d'))
            .tickValues(y_config.ticks);

        g.append('g')
            .attr('class', 'y axis')
            .attr('transform', 'translate(-8,0)')
            .call(y_axis)
            .selectAll('text')
            .style('fill', axes_color);

        g.select('.y.axis path').style('stroke', axes_color).style('stroke-width', 1.5);
        g.selectAll('.y.axis line').style('stroke', axes_color).style('stroke-width', 1);

        svg.append('text')
            .style('text-anchor', 'middle')
            .attr('transform', `translate(${margin.left * 0.4},${plot_height / 2 + margin.top})rotate(-90)`)
            .text('-log₁₀(p-value)')
            .style('fill', axes_color);

        const {chroms, chrom_genomic_start_positions, chrom_extents} = get_chrom_offsets();
        const color_by_chrom = d3.scaleOrdinal()
            .domain(chroms)
            .range([color1, color2]);

        // Chromosome labels
        const chrom_labels = chroms.map(chrom => ({
            chrom,
            midpoint: chrom_genomic_start_positions[chrom] +
                (chrom_extents[chrom][1] - chrom_extents[chrom][0]) / 2
        }));

        svg.selectAll('text.chrom_label')
            .data(chrom_labels)
            .enter()
            .append('text')
            .style('text-anchor', 'middle')
            .attr('transform', d => `translate(${margin.left + x_scale(d.midpoint)},${plot_height + margin.top + 20})`)
            .text(d => d.chrom)
            .style('fill', d => color_by_chrom(d.chrom));

        const significance_threshold_tooltip = d3Tip()
            .attr('class', 'd3-tip')
            .html(`Significance Threshold: {0}`.replace('{0}', significance_threshold.toExponential(2)))
            .offset([-8,0]);
        svg.call(significance_threshold_tooltip);

        // Significance line
        g.append('line')
            .attr('x1', 0)
            .attr('x2', plot_width)
            .attr('y1', y_scale(-Math.log10(significance_threshold)))
            .attr('y2', y_scale(-Math.log10(significance_threshold)))
            .attr('stroke-width', 4)
            .attr('stroke', axes_color)
            .attr('stroke-dasharray', '6,6')
            .on('mouseover', significance_threshold_tooltip.show)
            .on('mouseout', significance_threshold_tooltip.hide);

        // Tooltip setup
        const tooltip_fn = template(tooltip_template)

        const point_tooltip = d3Tip()
            .attr('class', 'd3-tip')
            .html(function (d) {
                return tooltip_fn({d: d});
            })
            .offset([-6, 0]);
        svg.call(point_tooltip);

        // Draw variant points
        g.append('g')
            .attr('class', 'variant_points')
            .selectAll('circle')
            .data(unbinned_variants)
            .enter()
            .append('circle')
            .attr('cx', d => x_scale(get_genomic_position(d)))
            .attr('cy', d => y_scale(d.neg_log_pvalue))
            .attr('r', 2.3)
            .style('fill', d => color_by_chrom(d.chrom))
            .on('mouseover', function (event, d) {
                const data = d3.select(this).datum();
                point_tooltip.show(data, this);
            })
            .on('mouseout', function (event, d) {
                point_tooltip.hide(d, this);
            });
    });
}

function create_magma_qq_plot(data, axes_color = "#444") {
  if (!data || data.length === 0) {
    $('#qq_plot_container').text(
      'No QQ Plot could be generated. It is possible that your data has been filtered to only contain very extreme p-values.'
    );
    return;
  }

  // Clean previous plot
  d3.select("#qq_magma_plot_container").selectAll("*").remove();

  // Compute observed -log10(P)
  const obs = data.map(d => -Math.log10(d.P)).sort((a, b) => a - b);
  const n = obs.length;
  const step = (1 - 1 / n) / n;

  // Compute observed vs expected
  const qq_points = obs.map((val, i) => ({
    obs: val,
    exp: -Math.log10(1 - i * step)
  }));

  const exp_max = d3.max(qq_points, d => d.exp);
  const obs_max = Math.ceil(d3.max(qq_points, d => d.obs) + 0.01);
  const maxP = Math.min(exp_max, obs_max);

  // Layout
  const svg_width = $('#qq_magma_plot_container').width() || 400;
  const plot_margin = { left: 70, right: 30, top: 10, bottom: 200 };
  const plot_width = svg_width - plot_margin.left - plot_margin.right;
  const plot_height = 600;
  const svg_height = plot_height + plot_margin.top + plot_margin.bottom;

  // Create SVG
  const qq_svg = d3.select('#qq_magma_plot_container').append('svg')
    .attr('id', 'qq_svg')
    .attr('width', svg_width)
    .attr('height', svg_height)
    .style('display', 'block')
    .style('margin', 'auto')
    .style('background', 'transparent');

  const qq_plot = qq_svg.append('g')
    .attr('id', 'qq_plot')
    .attr('transform', `translate(${plot_margin.left},${plot_margin.top})`);

  // Scales
  const x_scale = d3.scaleLinear()
    .domain([0, exp_max])
    .range([0, plot_width]);
  const y_scale = d3.scaleLinear()
    .domain([0, obs_max])
    .range([plot_height, 0]);

  // Axes with gridlines
  const xAxis = d3.axisBottom(x_scale)
    .tickSizeInner(-plot_height)
    .tickSizeOuter(0)
    .tickPadding(7)
    .tickFormat(d3.format('d'))
    .tickValues(d3.range(0, Math.ceil(exp_max) + 1));

  const yAxis = d3.axisLeft(y_scale)
    .tickSizeInner(-plot_width)
    .tickSizeOuter(0)
    .tickPadding(7)
    .tickFormat(d3.format('d'))
    .tickValues(d3.range(0, Math.ceil(obs_max) + 1));

  qq_plot.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0,${plot_height})`)
    .call(xAxis)
    .selectAll('text')
    .style('fill', axes_color);

  qq_plot.append('g')
    .attr('class', 'y axis')
    .call(yAxis)
    .selectAll('text')
    .style('fill', axes_color);

  qq_plot.selectAll('.x.axis path').style('stroke', axes_color);
  qq_plot.selectAll('.y.axis path').style('stroke', axes_color);
  qq_plot.selectAll('.x.axis line, .y.axis line')
    .style('stroke', '#ccc')
    .style('stroke-width', 0.5);

  // Points
  qq_plot.selectAll('circle.qq_point')
    .data(qq_points)
    .enter()
    .append('circle')
    .attr('class', 'qq_point')
    .attr('cx', d => x_scale(d.exp))
    .attr('cy', d => y_scale(d.obs))
    .attr('r', 1.5)
    .attr('fill', '#5e3c99');

  // Diagonal reference line
  qq_plot.append('line')
    .attr('x1', 0)
    .attr('x2', x_scale(maxP))
    .attr('y1', y_scale(0))
    .attr('y2', y_scale(maxP))
    .style('stroke', 'red')
    .style('stroke-width', 1)
    .style('stroke-dasharray', '3,3');

  // Axis labels
  qq_svg.append('text')
    .style('text-anchor', 'middle')
    .attr('transform', `translate(${plot_margin.left * 0.4},${plot_margin.top + plot_height / 2})rotate(-90)`)
    .text('observed -log₁₀(p-value)')
    .style('fill', axes_color)
    .style('font-family', 'sans-serif');

  qq_svg.append('text')
    .style('text-anchor', 'middle')
    .attr('transform', `translate(${plot_margin.left + plot_width / 2},${plot_margin.top + plot_height + 40})`)
    .text('expected -log₁₀(p-value)')
    .style('fill', axes_color)
    .style('font-family', 'sans-serif');
}

export {create_manhattan_magma_plot, create_magma_qq_plot};