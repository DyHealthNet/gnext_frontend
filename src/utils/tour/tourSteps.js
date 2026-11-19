/**
 * Declarative step definitions for the guided first-visit tour.
 *
 * Each step is plain data: which route it needs (`null` = stay on the current
 * route), which element to spotlight (a CSS selector, or `null` for a
 * centered, non-targeted popover), and the popover copy. Steps are filtered
 * here based on the resolved `trail` (see `tourTrail.js` -- a real top hit's
 * variant/gene/trait, followed live from this deployment's own data) and
 * whether a demo seed list could be built for it, so the tour shortens itself
 * gracefully instead of pointing at routes/elements that don't exist.
 */
import {MAGMA_SHOW} from '@/config.js'
import variantIconBlack from '@/assets/figures/node_variant_black.png'
import variantIconWhite from '@/assets/figures/node_variant_white.png'
import geneIconBlack from '@/assets/figures/node_gene_black.png'
import geneIconWhite from '@/assets/figures/node_gene_white.png'
import traitIconBlack from '@/assets/figures/node_phenotype_black.png'
import traitIconWhite from '@/assets/figures/node_phenotype_white.png'

/**
 * Prefixes a step title with an emoji, sized/spaced like the 👋 in the
 * welcome dialog (see `.gnext-tour-title-icon` in tour.css).
 * @param {string} emoji
 * @param {string} label - Accessible name of the emoji.
 * @param {string} title
 */
const withIcon = (emoji, label, title) =>
  `<span class="gnext-tour-title-icon" role="img" aria-label="${label}">${emoji}</span>${title}`

/**
 * Prefixes a step title with a Material Design icon (the same icon font the
 * navbar uses), sized/spaced like the emoji icons.
 * @param {string} mdiName - e.g. 'mdi-pill-multiple'.
 * @param {string} title
 */
const withMdiIcon = (mdiName, title) =>
  `<i class="mdi ${mdiName} gnext-tour-title-icon" aria-hidden="true"></i>${title}`

/**
 * Prefixes a step title with an image icon that has light/dark variants; CSS
 * in tour.css shows the one matching the current theme (`html.my-app-dark`).
 * @param {string} lightSrc - Icon for the light theme.
 * @param {string} darkSrc - Icon for the dark theme.
 * @param {string} label - Accessible name of the icon.
 * @param {string} title
 */
const withImageIcon = (lightSrc, darkSrc, label, title) =>
  `<img class="gnext-tour-title-icon gnext-tour-icon-light" src="${lightSrc}" alt="${label}">` +
  `<img class="gnext-tour-title-icon gnext-tour-icon-dark" src="${darkSrc}" alt="${label}">${title}`

/**
 * Builds the ordered, config-filtered list of tour steps.
 * @param {object} opts
 * @param {{variantId: string, traitId: string, geneId: string|null, geneSymbol: string|null}|null} opts.trail
 *   The resolved top-hit trail, or `null` if none could be resolved.
 * @param {boolean} opts.hasSeedList - Whether a demo seed list was successfully built.
 * @param {string|null} opts.seedListName - The demo seed list's name, if built.
 * @returns {Array<object>} Ordered step definitions.
 */
export function buildTourSteps({trail, hasSeedList, seedListName}) {
  const hasTrail = Boolean(trail && trail.variantId && trail.traitId)
  const hasGene = hasTrail && Boolean(trail.geneId)

  const variantRoute = hasTrail ? `/variant/${encodeURIComponent(trail.variantId)}` : null
  const geneRoute = hasGene
      ? `/gene/${encodeURIComponent(trail.geneId)}?trait=${encodeURIComponent(trail.traitId)}`
      : null
  const traitRoute = hasTrail ? `/trait/${encodeURIComponent(trail.traitId)}` : null
  const showNetworkMedicineSteps = hasTrail && MAGMA_SHOW && hasSeedList

  const steps = [
    // The welcome/intro text lives in the first-visit dialog (TourWelcomeDialog.vue).
    {
      id: 'home-search',
      route: '/',
      selector: '[data-tour-id="home-search"]',
      popover: {
        title: withIcon('🔍', 'Magnifying glass', 'The Search Bar'),
          description: 'From the <b>Main Search Bar</b>, you can start by searching for any <b>trait</b>, any <b>variant</b>, or any <b>gene</b> associated in the GWAS study. <br><br>' +
	      '<b>Type-ahead searching</b> will bring up a clickable list of objects available in the GNExT instance, starting from the initial characters you enter.<br><br> ' +
              '<i>Before you start exploring, <b>follow the tour</b> to see some of what stands out already in this study, starting from the <b>Trait Overview</b> table...</i>',
      },
    },
    {
      id: 'trait-overview-table',
      route: '/traits',
      selector: '[data-tour-id="trait-overview-table-card"]',
      // Start at the very top of the page (the table card is tall).
      scrollToTop: true,
      popover: {
        title: withMdiIcon('mdi-chart-pie', 'Trait Overview'),
        description: 'The <b>Trait Overview</b>, linked from the top of the page, gives you an <b>overview of all traits incorporated in this study</b>, ' +
          'with their labels, trait groups and numbers of samples.<br><br>' +
          'Click a group in the <b>Traits per Group</b> chart below the table to filter the table to that group. ' +
          '<b>Sort</b> the table using the arrows next to the header fields, <b>search</b> it with the <b>Keyword Search</b> box, ' +
          'and <b>download</b> it at the bottom.<br><br>' +
          '<i>Further down this page, you can compare traits directly...</i>',
      },
    },
    {
      id: 'multi-trait-manhattan',
      route: '/traits',
      selector: '[data-tour-id="multi-trait-manhattan-card"]',
      // Keep the card's header visible below the navbar.
      scrollBelowNavbar: true,
      popover: {
        title: withMdiIcon('mdi-chart-scatter-plot', 'Multi-Trait Manhattan Plot'),
        description: 'The <b>Multi-Trait Manhattan Plot</b> lets you compare the GWAS results of up to <b>five traits</b> side by side. ' +
          'Search for a trait to add it to the plot.' +
          '<ul><li><b>Overlaid</b> draws all selected traits in one plot, one color per trait</li>' +
          '<li>With exactly two traits, <b>Stacked</b> shows a Miami plot with the second trait mirrored below the first</li></ul>' +
          'Text size and colors are configurable, and the plot can be downloaded as PNG, SVG or JPG.' +
          (hasTrail ? '<br><br><i>Now let\'s look at the strongest associations across all traits in the <b>Top Hits Table</b>...</i>' : ''),
      },
    },
    hasTrail && {
      id: 'tophits-overview',
      route: '/tophits',
      selector: '[data-tour-id="tophits-table-card"]',
      popover: {
        title: withMdiIcon('mdi-file-table-outline', 'Top GWAS Hits across all study traits'),
        description: 'The <b>Top Hits Table</b>, linked from the top of the page, lists the strongest, deduplicated GWAS association ' +
              'peaks across every trait in the GNExT instance.<br><br>It\'s the best way to quickly see ' +
              'the <b>strongest association results</b> across all the traits deployed in a GNExT instance.<br><br>' +
	      '<b>Sort the table</b> by clicking on the arrows next to the table header fields, and <b>search the table</b> using the <b>Keyword Search</b> box.<br><br>' +
	      '<b>Download</b> the table in multiple formats by clicking the download icon at the bottom of the report.'
      },
    },
    hasTrail && {
      id: 'tophits-top-row',
      route: '/tophits',
      selector: '[data-tour-id="tophits-table-card"] .p-datatable-tbody > tr:first-child',
      // The row is wider than the (horizontally scrolling) table when zoomed in.
      clipToScrollParent: true,
      popover: {
        title: withIcon('🎯', 'Target', "Let's follow the top entry"),
          description: 'For every peak in the Top Hits table there are links to: <ul><li>the <b>trait report</b></li><li>the peak\'s lead <b>variant report</b></li><li>the <b>gene reports</b> for genes nearby the lead variant</li></ul><br>' +
	      'Use the <b>Keyword Search box</b> to search for specific traits, variants, or genes. ' +
	      'You can <b>download</b> the complete table or only your currently filtered rows at the bottom.<br><br>' +
 	      '<i>We\'ll drill down from the top association peak to the <b>Variant Report</b> for the lead variant...</i>'
      },
    },
    hasTrail && {
      id: 'variant-overview',
      route: variantRoute,
      selector: '[data-tour-id="variant-overview"]',
      popover: {
        title: withImageIcon(variantIconBlack, variantIconWhite, 'Variant', 'Variant Report'),
          description: 'The <b>Variant Report</b> consists of several sections: <ul><li>The <b>variant profile</b></li><li><b>Population allele frequencies</b> from VEP</li><li>Links to <b>nearby genes</b> (if any)</li><li>VEP <b>transcript and regulatory consequence</b> annotations</li><li>An <b>interactive PheWAS plot</b> showing GWAS results for the variant across all study traits</li></ul>'
      },
    },

    hasGene && {
      id: 'variant-closest-gene',
      route: variantRoute,
      selector: '#closest-genes',
      popover: {
        title: withIcon('📍', 'Pin', 'Variant closest genes'),
        description: 'Variants are mapped by location to <b>nearby genes</b> within an up- and down-stream distance window configured when the GNExT instance is built.',
      },
    },
    hasTrail && {
      id: 'variant-phewas',
      route: variantRoute,
      selector: '#phewas_plot',
      popover: {
        title: withIcon('🌐', 'Globe', 'PheWAS plot'),
        description: 'The <b>PheWAS plot</b> shows the GWAS association of this variant across <b>all traits</b> in the study, ' +
          'grouped and colored by <b>trait category</b>.<br><br>' +
          'Use the filters above the plot to restrict it to a <b>p-value cutoff</b> or to selected <b>trait categories</b>. ' +
          'The <b>PheWAS table</b> below the plot lists the same results and is searchable, sortable and downloadable.<br><br>' +
          (hasGene
            ? '<i>Let\'s jump back up to the <b>closest genes</b> of this variant...</i>'
            : '<i>No gene is mapped near this variant, so we\'ll continue to the <b>Trait Report</b>...</i>'),
      },
    },
    hasGene && {
      id: 'variant-gene-link',
      route: variantRoute,
      // The mapped gene's button in the Closest Genes card (see VariantClosestGene.vue).
      selector: `#closest-genes [data-tour-gene="${CSS.escape(String(trail.geneId))}"]`,
      popover: {
        title: withIcon('🔗', 'Link', `Mapped gene: ${trail?.geneSymbol || trail?.geneId}`),
        description: 'Each gene mapped to this variant links to its own <b>Gene Report</b>.<br><br>' +
          `<i>Let's follow the link to the mapped gene <b>${trail?.geneSymbol || trail?.geneId}</b>...</i>`,
      },
    },
    hasGene && {
      id: 'gene-overview',
      route: geneRoute,
      selector: '[data-tour-id="gene-overview"]',
      // Taller than the viewport: start at the very top of the gene page.
      scrollToTop: true,
      popover: {
        title: withImageIcon(geneIconBlack, geneIconWhite, 'Gene', 'Gene Report'),
          description: 'The <b>Gene Report</b> provides general and study-specific information on each gene:' +
	      '<ul><li>Gene <b>ID and genomic location</b></li><li>Links to <b>external gene data resources</b></li>' +
              '<li>The <b>Top Signals in Gene</b> table: the most significant variant in and around the gene for each study trait</li>' +
	      '<li>A navigable <b>LocusZoom regional association plot</b> of the GWAS variants in and around the gene for the trait selected in the table</li></ul>' +
          '<i>Let\'s have a deeper look at the first trait in the table...</i>'
      },
    },
    hasGene && {
      id: 'gene-top-trait',
      route: geneRoute,
      selector: '[data-tour-id="gene-top-signals-card"] .p-datatable-tbody > tr:first-child',
      // The row is wider than the (horizontally scrolling) table when zoomed in.
      clipToScrollParent: true,
      popover: {
        title: withIcon('🥇', 'First place medal', 'The strongest signal in this gene'),
        description: 'The table is sorted by <b>−log₁₀(p-value)</b>, so the first row is the trait with the ' +
          '<b>strongest association</b> to a variant in or around this gene.<br><br>' +
          'The selected row determines the trait shown in the <b>LocusZoom plot</b> below the table; click any other row to switch traits.<br><br>' +
          '<i>We\'ll follow the link to the <b>Trait Report</b> for this trait...</i>',
      },
    },
    hasTrail && {
      id: 'trait-overview',
      route: traitRoute,
      selector: '[data-tour-id="trait-overview"]',
      // Start at the very top of the trait page, like the Variant and Gene Reports.
      scrollToTop: true,
      popover: {
        title: withImageIcon(traitIconBlack, traitIconWhite, 'Trait', 'Trait Report'),
        description: 'The <b>Trait Report</b> provides all GWAS' + (MAGMA_SHOW ? ' and MAGMA' : '') + ' results for each trait in the study:' +
          '<ul><li>The <b>trait profile</b>: ID, label, trait group and number of samples' +
          (MAGMA_SHOW ? ', plus the <b>MAGMA settings</b> used for the gene analysis' : '') + '</li>' +
          '<li>Configurable <b>GWAS Manhattan and QQ plots</b></li>' +
          (MAGMA_SHOW ? '<li>Configurable <b>MAGMA Manhattan and QQ plots</b></li>' : '') +
          '<li>Searchable and sortable <b>GWAS Results Table</b> of all associated variants</li>' +
          (MAGMA_SHOW ? '<li>Searchable and sortable <b>MAGMA Results Table</b> of all associated genes</li>' : '') +
          '</ul>' +
          'Use the <b>buttons</b> below the profile to jump directly to each section. ' +
          'All plots and tables are <b>downloadable</b> for reproducibility and publication.' +
          (MAGMA_SHOW ? '<br><br><i>Let\'s have a look at the <b>MAGMA Results Table</b>...</i>' : ''),
      },
    },
    hasTrail && MAGMA_SHOW && {
      id: 'magma-table',
      route: traitRoute,
      selector: '#magma-table-card',
      // Taller than the viewport: keep the card's header visible below the navbar.
      scrollBelowNavbar: true,
      popover: {
          title: withIcon('📋', 'Clipboard', 'MAGMA Results Table'),
	  description:'The <b>MAGMA Results Table</b> lists genes significantly associated with the trait.<br><br>' +
	      '<b>MAGMA analysis</b> aggregates the GWAS association p-values of the variants mapped by location to a gene ' +
	      'into a <b>single p-value representing the strength of association of the gene with the trait</b>.<br><br>' +
	      'This table is the <b>gateway to network medicine analysis.</b><br><br>' +
	      'For <b>each gene</b>, genomic location information and details of the MAGMA association are presented, as well as links back to the GNExT Gene Report for the gene.<br><br>' +
	      'The <b>set of genes</b> in the table can be <b>filtered</b> by p-value and chromosome, and sorted on any of the table columns.<br><br>' +
	      'The <b>filtered set of genes</b> constitutes the <b>seeds</b> for integrated downstream network medicine analysis using Drugst.One tools.<br><br>' + 
	      '<i>We\'ll look at how <b>seed lists</b> are saved...</i>',
      },
    },
    showNetworkMedicineSteps && {
      id: 'seed-list',
      route: traitRoute,
      selector: '[data-tour-id="magma-seedlist-row"]',
      popover: {
        title: withIcon('🌱', 'Seedling', 'Building a seed gene list'),
          description: 'The first step is to give the filtered gene set a name and click the <b>+ Seed Lists</b> button to save it for Drugst.One.<br><br>' +
	      'For this virtual tour, we\'ve created a demo list (named like \t"Tour Demo\") from a few of the top trait\'s top MAGMA hits.<br><br>' +
	      '<i>Once the seed list is saved, click the <b>Network Medicine button</b> to move to Drugst.One...</i>',
      },
    },
    showNetworkMedicineSteps && {
      id: 'nm-select',
      route: '/networkmedicine',
      selector: '[data-tour-id="nm-select"]',
      presetListName: seedListName,
      popover: {
        title: withMdiIcon('mdi-pill-multiple', 'Getting started in Drugst.One'),
          description: 'In <b>Drugst.One</b>, start by selecting a saved seed gene list from the <b>Select Seed Gene List</b> menu and then loading it for network analysis using the ' +
	      '<b>Add to Drugst.One</b> button.<br><br>' +
	      'Drugst.One converts each of the seed genes to its encoded <b>protein</b> and constructs an initial network, with <b>proteins as nodes</b> and <b>interactions as edges</b>, using ' +
	      'a large integrated <b>protein-protein interaction</b> data set.<br><br>' +
	      '<b><i>NOTE:</b> If the initial seed gene list contains more than a hundred genes, it would be sensible to <b>prune large networks</b> before proceeding, either manually using the ' +
	      '<b>Edit Network</b> tool, or by interaction network properties such as subnetwork participation degree (spd), using the <b>Properties-based Pruning</b> tools.</i><br><br>',
      },
    },
    showNetworkMedicineSteps && {
      id: 'nm-graph',
      route: '/networkmedicine',
      selector: '[data-tour-id="nm-drugstone-card"]',
      // Taller than the viewport: keep the card's header visible below the navbar.
      scrollBelowNavbar: true,
      popover: {
        title: withMdiIcon('mdi-pill-multiple', 'Explore the network and find drug repurposing candidates'),
        description: 'Once the initial network is loaded in Drugst.One, you can:' +
          '<ul><li><b>Connect genes</b> and find a <b>disease module</b> by incorporating connector genes</li>' +
          '<li>Select and seamlessly <b>export protein sets</b> into external online tools for <b>functional and pathway enrichment analysis</b></li>' +
          '<li><b>Prune networks</b> either by manually editing the network or by properties-based pruning</li>' +
          '<li>Visualize networks with integrated <b>tissue expression</b>, <b>disease/disorder</b>, <b>drug</b>, and <b>cellular location</b> datasets on the right-hand side</li>' +
          '<li><b>Prioritize drug repurposing candidates</b> by running network medicine algorithms (e.g. closeness centrality) on the network, ' +
          'or all in one go with the <b>Quick Drug Search</b>; results are stored in the <b>Tasks</b> menu</li>' +
          '<li>Change the underlying <b>interaction networks</b> (protein-protein and drug-protein interaction databases) ' +
          'in the <b>Advanced Settings</b> at the bottom of the page</li></ul>' +
          'A more detailed description of the Drugst.One components is provided ' +
          '<b><a href="https://drugst.one/doc" target="_blank" rel="noopener">here</a></b>.',
      },
    },

    {
      id: 'wrapup',
      route: null,
      selector: null,
      popover: {
        title: withIcon('🎉', 'Party popper', "That's the core workflow!"),
          description: '<b>GNExT</b> with its integration with <b>Drugst.One</b> provides a platform for the visualization and exploration of GWAS results, facilitating seamless analysis from single GWAS hits to network medicine hypotheses.<br><br>' +
	      'To take fullest advantage of the platform, we suggest you consult the <b>documentation</b> link at the top of GNExT, and <b>published papers</b> on GNExT and Drugst.One:' +
	      '<ul><li><b>Arend,L. (2026)</b> <b><a href="https://pubmed.ncbi.nlm.nih.gov/42608549/" target="_blank">Bridging the gap between GWAS and network medicine with GNExT</a></b></li>' +
	      '<li><b>Maier,A. (2024)</b> <b><a href="https://pubmed.ncbi.nlm.nih.gov/38783119/" target="_blank">Drugst.One — a plug-and-play solution for online systems medicine and network-based drug repurposing</a></b></li></ul>',
      },
    },
  ]

  return steps.filter(Boolean)
}
