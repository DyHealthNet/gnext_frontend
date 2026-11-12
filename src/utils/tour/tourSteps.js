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
    {
      id: 'welcome',
      route: null,
      selector: null,
      popover: {
        title: 'Welcome to GNExT! 👋',
          description: '<b>GNExT turns GWAS summary statistics into network-medicine insights.</b><br><br>' +
	      'Using GNExT, you can visualize GWAS results across all traits in a GWAS study, explore the genetic context of ' +
	      'GWAS variants and their aggregated associations in genes, and seamlessly move results of interest into integrated ' +
              'state-of-the-art network-medicine, pathway, and functional enrichment analysis tools.<br><br>' +
	      'GNExT provides a streamlined visualization, analysis, and discovery pipeline leading from GWAS results, to biological networks, and drug-repurposing candidates. <br><br> ' +
              '<i><b>This quick tour</b> follows one real top GWAS hit from the current GNExT deployment all the way through the platform.<br><br>' +
	      'You can skip the tour or replay it anytime from the <b>compass icon</b> in the top bar.</i>',
      },
    },
    {
      id: 'home-search',
      route: '/',
      selector: '[data-tour-id="home-search"]',
      popover: {
        title: 'The Search Bar',
          description: 'From the <b>Main Search Bar</b>, you can start by searching for any <b>trait</b>, any <b>variant</b>, or any <b>gene</b> associated in the GWAS study. <br><br>' +
	      '<b>Type-ahead searching</b> will bring up a clickable list of objects available in the GNExT instance, starting from the initial characters you enter.<br><br> ' +
              '<i>Before you start exploring, <b>follow the tour</b> to see some of what stands out already in this study, starting from the <b>Top Hits Table</b>...</i>',
      },
    },
    hasTrail && {
      id: 'tophits-overview',
      route: '/tophits',
      selector: '[data-tour-id="tophits-table-card"]',
      popover: {
        title: 'Top GWAS Hits across all study traits',
        description: 'The <b>Top Hits Table</b>, linked from the top of the page, lists the <i>strongest, deduplicated GWAS association ' +
              'peaks</i> across <i>every trait</i> in the GNExT instance.<br><br>It\'s the best way to quickly see ' +
              'the <b>strongest association results</b> across all the traits deployed in a GNExT instance. <br><br> ' +
	      '<b>Sort the table</b> by clicking on the arrows next to table header fields.<br><br> ' +
	      '<b>Download</b> the table in multiple formats by clicking the download icon at the bottom of the report. '
      },
    },
    hasTrail && {
      id: 'tophits-top-row',
      route: '/tophits',
      selector: '[data-tour-id="tophits-table-card"] .p-datatable-tbody > tr:first-child',
      popover: {
        title: "Let's follow the top entry",
          description: 'For every peak in the Top Hits table there are links to: <ul><li>the <b>trait report</b></li><li>the peak\'s lead <b>variant report</b></li><li>the <b>gene reports</b> for genes nearby the lead variant</li></ul><br>' +
	      'Use the <b>Keyword Search box</b> to search for specific traits.<br><br>' +
 	      '<i>We\'ll drill down from the top association peak to the <b>Variant Report</b> for the lead variant...</i>'
      },
    },
    hasTrail && {
      id: 'variant-overview',
      route: variantRoute,
      selector: '[data-tour-id="variant-profile-card"]',
      popover: {
        title: 'Variant Report',
          description: 'The <b>Variant Report</b> consists of several sections: <ul><li>The <b>variant profile</b></li><li>Links to <b>nearby genes</b> (if any)</li><li>VEP <b>transcript and regulatory consequence</b> annotations</li><li>An <b>interactive PheWAS plot</b> showing GWAS results for the variant across all study traits</li></ul>'
      },
    },

    hasGene && {
      id: 'variant-closest-gene',
      route: variantRoute,
      selector: '#closest-genes',
      popover: {
        title: 'Variant closest genes',
        description: 'Variants are mapped by location to <b>nearby genes</b> within an up- and down-stream distance window configured when the GNExT instance is built.<br><br>' +
          '<i>We\'ll follow the link to this mapped gene...</i>',
      },
    },
    hasGene && {
      id: 'gene-overview',
      route: geneRoute,
      selector: '[data-tour-id="gene-profile-card"]',
      popover: {
        title: 'Gene-level detail',
          description: 'The <b>Gene Report</b> provides general and study-specific information on each gene:<br> ' +
	      '<ul><li>Gene <b>ID and genomic location</b></li><li>Links to <b>external gene data resources</b></li>' +
              '<li>Tabular <b>MAGMA gene association analysis results</b> for the gene across all study traits (<i>More on this later!</i>)</li>' +
	      '<li>Navigable <b>LocusZoom regional association plots</b> showing the GWAS variants in and around the gene locus for each trait in the MAGMA table</li><ul>'
      },
    },
    hasGene && {
      id: 'gene-top-signals',
      route: geneRoute,
      selector: '[data-tour-id="gene-top-signals-card"]',
      popover: {
        title: 'MAGMA Gene Associations',
          description: 'The <b>MAGMA Table</b> presents aggregate MAGMA association p-values and <b>top variant</b> for the gene ' +
	      'across every trait in the GWAS study.<br><br>' +
	      '<b>MAGMA analysis</b> aggregates GWAS association p-values of variants mapped by location to a gene ' +
	      'into a <b>single association p-value representing the strength of association of the gene with the trait</b>.<br><br>' +
	      'The table is <b>ranked by the MAGMA p-value</b> from the MAGMA analysis for the gene in the trait.<br><br>' +
              'For each gene-trait association, GWAS results are plotted in an interactive, downloadable <b>LocusZoom regional ' +
	      'association plot.</b><br><br>' +
          '<i>We\'ll follow the link to the <b>Trait Report</b> for the most strongly associated trait...</i>',
      },
    },
    hasTrail && {
      id: 'trait-overview',
      route: traitRoute,
      selector: '#manhattan-card',
      popover: {
        title: 'Trait-level GWAS and MAGMA results',
          description: 'The <b>Trait Report</b> provides all GWAS and MAGMA results for each trait in the study:<br><br>' +
	      '<ul><li>Configurable <b>GWAS Manhattan and QQ plots</b></li><li>Configurable <b>MAGMA Manhattan and QQ plots</b></li>' +
	      '<li>Searchable and sortable <b>GWAS Results Table</b>, of all associated variants</li><li>Searchable and sortable <b>MAGMA Results Table</b> of all associated genes</li></ul><br>' +
	      'All plots and tables are <b>downloadable</b> for reproducibility and publication.<br><br>',
      },
    },
    hasTrail && MAGMA_SHOW && {
      id: 'magma-table',
      route: traitRoute,
      selector: '#magma-table-card',
      popover: {
          title: 'MAGMA Results Table',
	  description:'The <b>MAGMA Results Table</b> lists genes significantly associated with the trait.<br><br>' +
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
        title: 'Building a seed gene list',
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
        title: 'Getting started in DrugSt.One',
          description: 'In <b>Drugst.One</b>, start by selecting a saved seed gene list from the <b>Select Seed Gene List</b> menu and then loading it for network analysis using the ' +
	      '<b>Add to Drugst.One</b> button.<br><br>' +
	      'Drugst.One converts each of the seed genes to its encoded <b>protein</b> and constructs an initial network, with <b>proteins as nodes</b> and <b>interactions as edges</b>, using ' +
	      'a large integrated <b>protein-protein interaction</b> data set.<br><br>' +
	      '<b><i>NOTE:</b> If the initial seed gene list contains more than a few dozen genes, it would be sensible to <b>prune large networks</b> before proceeding, either manually using the ' +
	      '<b>Edit Network</b> tool, or by interaction network properties such as subnetwork participation degree (spd), using the <b>Properties-based Pruning</b> tools.</i><br><br>',
      },
    },
    showNetworkMedicineSteps && {
      id: 'nm-graph',
      route: '/networkmedicine',
      selector: '[data-tour-id="nm-drugstone-card"]',
      popover: {
        title: 'Explore the network in Drugst.One',
          description: 'Once the initial network is loaded in Drugst.One, you can:<br><br> ' +
	      '<ul><li><b>Expand network connections</b> via intermediate interacting proteins</li> ' +
	      '<li><b>Prune networks</b> either by manually editing the network or properties based pruning</li> ' +
	      '<li>Apply <b>advanced network medicine algorithms</b> to detect network modules and build <b>ranked lists of drug repurposing candidates</b></li> ' + 
	      '<li>Visualize networks with integrated <b>tissue expression</b>, <b>disease\/disorder</b>, <b>drug</b>, and <b>cellular location</b> datasets</li> ' +
	      '<li>Select and seamlessley export protein sets into external online tools for <b>functional and pathway enrichment analysis</b></li></ul><br>',
      },
    },

    showNetworkMedicineSteps && {
      id: 'nm-graph',
      route: '/networkmedicine',
      selector: '[data-tour-id="nm-drugstone-card"]',
      popover: {
        title: 'Quick drug search',
          description: '<b>All-in-one drug candidate search</b>:<br><br> ' +
	      'The <b>Quick Drug Search</b> utility is a great way to run a complete multi-step analysis using default parameters.<br><br>' +
	      'Running the Quick Drug Search executes multiple steps in order:<br>' +
	      '<ol><li>Starts a <b>Multi-Steiner algorithm</b> on all genes in the network or the selected genes (similar to the <b>Connect Genes</b> function).</li>' +
	      '<li>Executes a <b>Closeness Centrality algorithm</b> on the resulting network, finding drug candidates that are related to the original seed genes.</li>' +
	      '<li><b>Stores</b> the results under the Tasks menu</li><ol><br>' +
	      '<i>Once the Quick drug search has finished, you can access the results in the <b>Tasks</b> menu...</i>',
      },
    },
      
    {
      id: 'wrapup',
      route: null,
      selector: null,
      popover: {
        title: "That's the core workflow!",
          description: '<b>GNExT</b> with its integration with <b>Drugst.One</b> provides a very powerful platform for the visualization and exploration of GWAS results, facilitating seamless analysis from single GWAS hits to network medicine results.<br><br>' +
	      'To take fullest advantage of the platform, we suggest you consult the <b>documentation</b> link at the top of GNExT, and <b>published papers</b> on GNExT and Drugst.One:' +
	      '<ul><li><b>Arend,L. (2026)</b> <b><a href="https://pubmed.ncbi.nlm.nih.gov/42608549/" target="_blank">Bridging the gap between GWAS and network medicine with GNExT</a></b></li>' +
	      '<li><b>Maier,A. (2024)</b> <b><a href="https://pubmed.ncbi.nlm.nih.gov/38783119/" target="_blank">Drugst.One — a plug-and-play solution for online systems medicine and network-based drug repurposing</a></b></li><br>' +
	      'For a step-by-step introduction to the Drugst.One interface, have a look at the <b><a href="https://drugst.one/doc\#drugstone_ui_network" target="_blank">Drugst.One UI documentation</a></b><br><br>' +
	      'Additional detailed documentation for the linked <b>pathway</b> and <b>functional analysis</b> tools are available via their respective interfaces.',
      },
    },
  ]

  return steps.filter(Boolean)
}
