<template>
  <v-dialog
    :model-value="visible"
    max-width="640"
    @update:model-value="val => { if (!val) dismiss() }"
  >
    <v-card rounded="lg" class="pa-2">
      <v-card-title class="d-flex align-center ga-3 text-h6 font-weight-bold" style="white-space: normal;">
        <span class="wave-hand" role="img" aria-label="Waving hand">👋</span>
        Welcome to GNExT!
      </v-card-title>
      <v-card-text class="text-body-1">
        <p class="mb-3">
          <b>GNExT turns GWAS summary statistics into network-medicine insights.</b>
        </p>
        <p class="mb-3">
          Using GNExT, you can visualize GWAS results across all traits in a GWAS study, explore the genetic context of
          GWAS variants and their aggregated associations in genes, and seamlessly move results of interest into integrated
          state-of-the-art network-medicine, pathway, and functional enrichment analysis tools.
        </p>
        <p class="mb-3">
          GNExT provides a streamlined visualization, analysis, and discovery pipeline leading from GWAS results, to
          biological networks, and drug-repurposing candidates.
        </p>
        <p class="mb-3">
          <i><b>This quick tour</b> follows one real top GWAS hit from the current GNExT deployment all the way through the platform.</i>
        </p>
        <p class="text-body-2 text-medium-emphasis">
          You can skip the tour or replay it anytime from the <b>compass icon</b> in the top bar.
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn variant="text" @click="dismiss">No thanks</v-btn>
        <v-btn color="primary" variant="flat" @click="accept">Start tour</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
/**
 * First-visit dialog asking whether to start the guided tour.
 *
 * Shown once per browser (gated on the same `tourCompleted` localStorage key
 * the tour itself sets on completion) on whatever page the visitor first
 * lands on -- it never forces a redirect on its own. Accepting hands off to
 * `startTour()`, which navigates to Home before driving through the steps;
 * dismissing (button, Esc or clicking outside) just records that the offer
 * was seen.
 */
import {TOUR_ENABLED} from '@/config.js'
import {startTour} from '@/utils/tour/tourEngine.js'

const STORAGE_KEY = 'tourCompleted'

/** localStorage can throw (private mode, blocked storage); treat that as "not seen". */
function readSeen() {
  try { return localStorage.getItem(STORAGE_KEY) === 'true' } catch { return false }
}
function markSeen() {
  try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ignore */ }
}

export default {
  name: 'TourWelcomeDialog',
  data() {
    return {
      visible: false,
    }
  },
  /** Opens the dialog if the tour feature is enabled and hasn't been offered/completed yet. */
  mounted() {
    if (TOUR_ENABLED && !readSeen()) {
      this.visible = true
    }
  },
  methods: {
    /** Accepts the tour offer: closes the dialog, records it, and starts the tour. */
    accept() {
      this.visible = false
      markSeen()
      // Let the dialog's overlay leave the DOM before driver.js lays its own overlay on top.
      this.$nextTick(() => startTour())
    },
    /** Dismisses the offer without starting the tour. */
    dismiss() {
      this.visible = false
      markSeen()
    },
  },
}
</script>

<style scoped>
.wave-hand {
  display: inline-block;
  font-size: 32px;
  line-height: 1;
  transform-origin: 70% 70%;
  animation: wave 1.8s ease-in-out 0.3s 2;
}

@keyframes wave {
  0%, 60%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(14deg); }
  20% { transform: rotate(-8deg); }
  40% { transform: rotate(-4deg); }
  50% { transform: rotate(10deg); }
}

@media (prefers-reduced-motion: reduce) {
  .wave-hand { animation: none; }
}
</style>
