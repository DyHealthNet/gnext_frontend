/**
 * Shared reactive state for the guided tour.
 *
 * Mirrors the tiny-shared-state pattern used by `src/components/constants.js`
 * (a plain ref + setter) rather than introducing a store library, since this is
 * the only piece of tour state that needs to be observed outside the tour
 * engine itself (e.g. to disable the Navbar's "replay tour" button while a tour
 * is already running).
 */
import {ref} from 'vue'

/** Whether a guided tour is currently running. */
export const isTourActive = ref(false)

/**
 * Sets the tour-active flag.
 * @param {boolean} value - New active state.
 */
export function setTourActive(value) {
  isTourActive.value = value
}
