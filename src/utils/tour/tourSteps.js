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
        title: 'Welcome to GNExT 👋',
        description: 'GNExT turns GWAS summary statistics into network-medicine ' +
          'insights — from significant variants and genes down to drug-repurposing ' +
          'candidates. This quick tour follows one real top hit from this ' +
          'deployment all the way through the platform. You can skip it, or ' +
          'replay it anytime from the compass icon in the top bar.',
      },
    },
    {
      id: 'home-search',
      route: '/',
      selector: '[data-tour-id="home-search"]',
      popover: {
        title: 'Search anything',
        description: 'Start by searching for a trait, a variant, or a gene here. ' +
          'Typeahead search covers the full dataset for this deployment. But ' +
          'let\'s first see what stands out already — over to Top Hits.',
      },
    },
    hasTrail && {
      id: 'tophits-overview',
      route: '/tophits',
      selector: '[data-tour-id="tophits-table-card"]',
      popover: {
        title: 'Top hits across the whole study',
        description: 'This table lists the strongest, deduplicated association ' +
          'peaks across every trait in this deployment — one row per independent ' +
          'signal, together with its nearest gene(s). It\'s the fastest way to see ' +
          'what stands out right now.',
      },
    },
    hasTrail && {
      id: 'tophits-top-row',
      route: '/tophits',
      selector: '[data-tour-id="tophits-table-card"] .p-datatable-tbody > tr:first-child',
      popover: {
        title: "Let's follow the top entry",
        description: 'Every row links to its variant and gene(s). We\'ll open ' +
          'this one and drill all the way down to its trait page.',
      },
    },
    hasTrail && {
      id: 'variant-overview',
      route: variantRoute,
      selector: '[data-tour-id="variant-profile-card"]',
      popover: {
        title: 'Variant-level detail',
        description: 'Every variant gets its own page: population allele ' +
          'frequencies, predicted functional consequences, and — right below — ' +
          'the gene(s) mapped nearest to it.',
      },
    },
    hasGene && {
      id: 'variant-closest-gene',
      route: variantRoute,
      selector: '#closest-genes',
      popover: {
        title: 'Its closest gene',
        description: 'Variants are mapped to nearby genes using a configurable ' +
          'up-/downstream window. Let\'s open this gene\'s own page next.',
      },
    },
    hasGene && {
      id: 'gene-overview',
      route: geneRoute,
      selector: '[data-tour-id="gene-profile-card"]',
      popover: {
        title: 'Gene-level detail',
        description: 'The Gene page shows its genomic location plus quick links ' +
          'out to external gene databases (Ensembl, NCBI, Open Targets, ' +
          'GeneCards, and more).',
      },
    },
    hasGene && {
      id: 'gene-top-signals',
      route: geneRoute,
      selector: '[data-tour-id="gene-top-signals-card"]',
      popover: {
        title: 'Which traits is this gene tied to?',
        description: 'This table ranks every trait by how strongly it\'s ' +
          'associated with this gene, and auto-selects the strongest one — ' +
          'plotted below via LocusZoom. Let\'s follow that trait to its own page.',
      },
    },
    hasTrail && {
      id: 'trait-overview',
      route: traitRoute,
      selector: '#manhattan-card',
      popover: {
        title: 'Trait-level GWAS results',
        description: 'We followed the top hit all the way to its trait page: an ' +
          'interactive Manhattan plot, a full variant results table, and a QQ ' +
          'plot summarizing every tested variant for this phenotype.',
      },
    },
    hasTrail && MAGMA_SHOW && {
      id: 'magma-table',
      route: traitRoute,
      selector: '#magma-table-card',
      popover: {
        title: 'Gene-based association results',
        description: 'MAGMA aggregates variant-level signal into gene-based ' +
          'p-values. Filter this table by significance and chromosome — the genes ' +
          'you keep can be turned into a "seed list" for network analysis.',
      },
    },
    showNetworkMedicineSteps && {
      id: 'seed-list',
      route: traitRoute,
      selector: '[data-tour-id="magma-seedlist-row"]',
      popover: {
        title: 'Build a seed gene list',
        description: 'Name a filtered gene set and click "Seed Lists" to save ' +
          'it. We\'ve already created a demo list from this trait\'s top MAGMA ' +
          'hits for you — the same button is what you\'d use with your own gene sets.',
      },
    },
    showNetworkMedicineSteps && {
      id: 'nm-select',
      route: '/networkmedicine',
      selector: '[data-tour-id="nm-select"]',
      presetListName: seedListName,
      popover: {
        title: 'Pick a seed list',
        description: 'Any saved seed list can be loaded here. We\'ve preselected ' +
          'the demo list we just built so you can see it in action right away.',
      },
    },
    showNetworkMedicineSteps && {
      id: 'nm-graph',
      route: '/networkmedicine',
      selector: '[data-tour-id="nm-drugstone-card"]',
      popover: {
        title: 'Explore the network',
        description: 'Your seed genes are now a live, interactive network powered ' +
          'by Drugst.One — expand it, run module detection, or search for ' +
          'drug-repurposing candidates targeting these genes.',
      },
    },
    {
      id: 'wrapup',
      route: null,
      selector: null,
      popover: {
        title: "That's the core workflow!",
        description: 'From a single top hit to its variant, gene, trait, and a ' +
          'druggable network — in a few clicks. Explore more from Top Hits, or ' +
          'visit Documentation for the full picture. Replay this tour anytime via ' +
          'the compass icon in the navigation bar.',
      },
    },
  ]

  return steps.filter(Boolean)
}
