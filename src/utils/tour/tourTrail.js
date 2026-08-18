/**
 * Resolves a concrete "top hit → variant → gene → trait" trail for the
 * guided tour's opening walkthrough, by following the exact same backend
 * endpoints the TopHits/Variant/Gene pages themselves call. This keeps the
 * tour anchored to real, currently-significant results for this deployment's
 * own data instead of any fixed/hardcoded example.
 *
 * The trail is resolved once, up front, so the tour engine knows every
 * target route before it starts driving through steps:
 *  1. The first row of `/overview_get_top_hits/` gives a variant id and its
 *     source trait id directly (`top_variant`, `trait_id`).
 *  2. That variant's own `/variant_get_annotation/` call gives its closest
 *     gene (`closest_gene`) -- the same lookup `Variant.vue`'s "Closest
 *     Genes" card performs, so the tour highlights the exact gene the page
 *     itself shows. Falls back to the top-hit row's own `nearest_genes` if
 *     that lookup comes back empty.
 *  3. That gene's own `/gene_get_top_signals/` call gives the trait it's
 *     most strongly associated with (`neg_log_pvalue` descending) -- the
 *     same row `Gene.vue` auto-selects, so the tour's next stop mirrors what
 *     the Gene page would already have on screen. Falls back to the
 *     original top-hit's trait id if the gene lookup didn't resolve.
 */
import {API_BASE_URL} from '@/config.js'

/**
 * @returns {Promise<{variantId: string, traitId: string, geneId: string|null, geneSymbol: string|null}|null>}
 *   The resolved trail, or `null` if not even a variant/trait could be found.
 */
export async function resolveTourTrail() {
  try {
    const topHitsRes = await fetch(`${API_BASE_URL}/overview_get_top_hits/`)
    if (!topHitsRes.ok) return null
    const topHits = await topHitsRes.json()
    if (!Array.isArray(topHits) || topHits.length === 0) return null

    const topHit = topHits[0]
    const variantId = (topHit.top_variant || '').split(' ')[0].trim()
    const sourceTraitId = topHit.trait_id
    if (!variantId || !sourceTraitId) return null

    let geneId = null
    let geneSymbol = null

    try {
      const variantRes = await fetch(`${API_BASE_URL}/variant_get_annotation/?id=${encodeURIComponent(variantId)}`)
      if (variantRes.ok) {
        const variantData = await variantRes.json()
        const closestGene = variantData.closest_gene
        if (closestGene && typeof closestGene === 'object' && !Array.isArray(closestGene)) {
          const entries = Object.entries(closestGene)
          if (entries.length > 0) {
            [geneId, geneSymbol] = entries[0]
          }
        }
      }
    } catch (err) {
      console.warn("Tour: could not resolve the variant's closest gene:", err)
    }

    // Fall back to the top-hit row's own nearest-gene mapping if the variant's
    // own closest-gene lookup came back empty.
    if (!geneId && topHit.nearest_genes && typeof topHit.nearest_genes === 'object') {
      const entries = Object.entries(topHit.nearest_genes)
      if (entries.length > 0) {
        [geneId, geneSymbol] = entries[0]
      }
    }

    let traitId = sourceTraitId
    if (geneId) {
      try {
        const geneRes = await fetch(`${API_BASE_URL}/gene_get_top_signals/?id=${encodeURIComponent(geneId)}`)
        if (geneRes.ok) {
          const geneData = await geneRes.json()
          const rows = geneData.rows || []
          if (rows.length > 0) {
            const topSignal = [...rows].sort(
                (a, b) => (b.neg_log_pvalue ?? -Infinity) - (a.neg_log_pvalue ?? -Infinity)
            )[0]
            if (topSignal && topSignal.trait_id) traitId = topSignal.trait_id
          }
        }
      } catch (err) {
        console.warn("Tour: could not resolve the gene's top trait signal:", err)
      }
    }

    return {variantId, traitId, geneId, geneSymbol}
  } catch (err) {
    console.warn('Tour: could not resolve a top-hit trail:', err)
    return null
  }
}
