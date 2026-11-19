/**
 * Demo seed gene list for the guided tour's Network Medicine showcase.
 *
 * Builds a small seed gene list on the fly from the real MAGMA gene-based
 * results of whatever trait the tour is currently walking through (resolved
 * by `tourTrail.js` from live Top Hits data -- see that module), using the
 * same `/trait_get_magma_results` endpoint `MAGMATable.vue` uses. This keeps
 * the tour fully generic: it never hardcodes a study-specific trait or gene
 * set. The resulting list is upserted into `localStorage['geneLists']` under
 * a fixed, clearly-namespaced name -- distinct from anything a user would
 * type into MAGMATable's free-text list-name field -- so replaying the tour
 * (even against a different resolved trait) just refreshes/adds that entry
 * instead of accumulating duplicates or hitting the "name already exists"
 * error `addGeneList()` raises for user-created lists.
 */
import {API_BASE_URL} from '@/config.js'

/** Prefix identifying a tour-generated demo seed list. */
export const TOUR_LIST_PREFIX = 'Tour Demo — '

/** Number of top (lowest p-value) genes to include in the demo seed list. */
const TOP_N_GENES = 8

/**
 * Builds the reserved demo seed-list name for a given trait.
 * @param {string} traitId - Trait identifier.
 * @returns {string} The namespaced list name.
 */
export function tourDemoListName(traitId) {
  return `${TOUR_LIST_PREFIX}${traitId}`
}

/**
 * Fetches `traitId`'s MAGMA results, picks the top genes by
 * Bonferroni-corrected (falling back to raw) p-value, and upserts them into
 * `localStorage['geneLists']`. Never throws -- any failure (no trait id, no
 * MAGMA rows, network error) resolves to `null` so callers can gracefully
 * skip the Network Medicine tour steps.
 * @param {string|null|undefined} traitId - The trait to build a demo list for.
 * @returns {Promise<string|null>} The demo list's name, or `null` if unavailable.
 */
export async function ensureDemoSeedList(traitId) {
  if (!traitId) return null

  try {
    const url = `${API_BASE_URL}/trait_get_magma_results/?id=${encodeURIComponent(traitId)}`
    const res = await fetch(url)
    if (!res.ok) return null

    const data = await res.json()
    const rows = (data.rows || []).filter(row => row && row.gene_symbol)
    if (rows.length === 0) return null

    const ranked = [...rows].sort((a, b) => {
      const aVal = a.bonferroni_pvalue ?? a.pvalue ?? 1
      const bVal = b.bonferroni_pvalue ?? b.pvalue ?? 1
      return aVal - bVal
    })
    const genes = [...new Set(ranked.slice(0, TOP_N_GENES).map(row => row.gene_symbol))]
    if (genes.length === 0) return null

    const name = tourDemoListName(traitId)
    const geneLists = JSON.parse(localStorage.getItem('geneLists') || '{}')
    geneLists[name] = {genes, trait_id: traitId}
    localStorage.setItem('geneLists', JSON.stringify(geneLists))

    return name
  } catch (err) {
    console.warn('Tour: could not build the demo seed gene list from MAGMA results:', err)
    return null
  }
}
