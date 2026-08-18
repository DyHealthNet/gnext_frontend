<template>
  <v-slide-y-reverse-transition>
    <v-card
      v-if="visible"
      class="tour-banner"
      elevation="8"
      rounded="lg"
    >
      <v-card-text class="d-flex align-center flex-wrap ga-3 py-3">
        <v-icon icon="mdi-compass-outline" color="primary" size="28"/>
        <div class="flex-grow-1" style="min-width: 220px;">
          <div class="text-subtitle-1 font-weight-bold">New here?</div>
          <div class="text-body-2 text-medium-emphasis">
            Take a quick guided tour of GNExT — from searching a trait to exploring a gene network.
          </div>
        </div>
        <v-btn color="primary" variant="flat" @click="accept">Start tour</v-btn>
        <v-btn variant="text" @click="dismiss">No thanks</v-btn>
      </v-card-text>
    </v-card>
  </v-slide-y-reverse-transition>
</template>

<script>
/**
 * Opt-in first-visit prompt for the guided tour.
 *
 * Shown once per browser (gated on the same `tourCompleted` localStorage key
 * the tour itself sets on completion) on whatever page the visitor first
 * lands on -- it never forces a redirect on its own. Accepting hands off to
 * `startTour()`, which navigates to Home before driving through the steps;
 * dismissing just records that the offer was seen.
 */
import {TOUR_ENABLED} from '@/config.js'
import {startTour} from '@/utils/tour/tourEngine.js'

const STORAGE_KEY = 'tourCompleted'

export default {
  name: 'TourBanner',
  data() {
    return {
      visible: false,
    }
  },
  /** Shows the banner if the tour feature is enabled and hasn't been offered/completed yet. */
  mounted() {
    if (TOUR_ENABLED && localStorage.getItem(STORAGE_KEY) !== 'true') {
      this.visible = true
    }
  },
  methods: {
    /** Accepts the tour offer: hides the banner, records it, and starts the tour. */
    accept() {
      this.visible = false
      localStorage.setItem(STORAGE_KEY, 'true')
      startTour()
    },
    /** Dismisses the offer without starting the tour. */
    dismiss() {
      this.visible = false
      localStorage.setItem(STORAGE_KEY, 'true')
    },
  },
}
</script>

<style scoped>
.tour-banner {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  max-width: 560px;
  width: calc(100% - 32px);
}
</style>
