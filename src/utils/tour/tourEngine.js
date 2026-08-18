/**
 * driver.js wrapper powering the guided first-visit tour.
 *
 * Owns the single active driver.js instance, translates our declarative step
 * data (`tourSteps.js`) into driver.js's `DriveStep` shape, and handles
 * cross-route steps: each popover's Next/Previous button navigates to the
 * upcoming step's route (if different from the current one) before advancing.
 * driver.js's own `waitForElement`/`skipMissingElement` config then waits for
 * the newly-routed page to render the target element (via its internal
 * MutationObserver) and silently skips a step whose element never appears --
 * so a slow render, a missing card, or an unexpected app state degrades to
 * "skip this step" rather than a broken tour.
 */
import router from '@/router.js'
import {MAGMA_SHOW} from '@/config.js'
import {buildTourSteps} from './tourSteps.js'
import {resolveTourTrail} from './tourTrail.js'
import {ensureDemoSeedList} from './tourSeedList.js'
import {setTourActive, isTourActive} from '@/components/tour/tourState.js'

/** The active driver.js instance, if a tour is running. */
let driverInstance = null
/** The step definitions the active tour was built from (for route lookups in the click handlers). */
let stepList = []

/**
 * Navigates to a step's route (if it differs from the current one) and, for
 * steps that preset a Network Medicine seed list, signals it via localStorage
 * for `NetworkMedicine.vue` to pick up on mount.
 * @param {object|undefined} step - The step being entered.
 */
async function goToStepRoute(step) {
  if (!step) return
  if (step.presetListName) {
    localStorage.setItem('tourAutoLoadList', step.presetListName)
  }
  if (step.route && step.route !== router.currentRoute.value.path) {
    try {
      await router.push(step.route)
    } catch (err) {
      // Ignore redundant/duplicate navigation errors from vue-router.
    }
  }
}

/** Popover "Next" handler shared by every step: navigate to the next step's route, then advance. */
async function handleNext(el, step, opts) {
  await goToStepRoute(stepList[(opts.index ?? 0) + 1])
  opts.driver.moveNext()
}

/** Popover "Previous" handler shared by every step: navigate to the previous step's route, then go back. */
async function handlePrev(el, step, opts) {
  await goToStepRoute(stepList[(opts.index ?? 0) - 1])
  opts.driver.movePrevious()
}

/** Converts one of our step definitions into a driver.js `DriveStep`. @param {object} step */
function toDriveStep(step) {
  return {
    element: step.selector || undefined,
    popover: {
      title: step.popover.title,
      description: step.popover.description,
      onNextClick: handleNext,
      onPrevClick: handlePrev,
    },
  }
}

/**
 * Starts (or restarts) the guided tour: resolves to the Home page, follows a
 * real top hit from this deployment's own data (top hit → variant → gene →
 * trait, see `tourTrail.js`), builds the demo Network Medicine seed list from
 * that trait's live MAGMA results if possible, and drives through the
 * resulting step list. Safe to call repeatedly -- a no-op while a tour is
 * already active.
 */
export async function startTour() {
  if (isTourActive.value) return
  setTourActive(true)

  try {
    if (router.currentRoute.value.path !== '/') {
      await router.push('/').catch(() => {})
    }

    const [{driver}] = await Promise.all([
      import('driver.js'),
      import('driver.js/dist/driver.css'),
      import('@/assets/tour.css'),
    ])

    const trail = await resolveTourTrail()
    const seedListName = (MAGMA_SHOW && trail) ? await ensureDemoSeedList(trail.traitId) : null
    stepList = buildTourSteps({trail, hasSeedList: Boolean(seedListName), seedListName})

    driverInstance = driver({
      showProgress: true,
      allowClose: true,
      overlayOpacity: 0.6,
      stagePadding: 6,
      popoverClass: 'gnext-tour-popover',
      waitForElement: 4000,
      skipMissingElement: true,
      steps: stepList.map(toDriveStep),
      onDestroyed: () => {
        localStorage.setItem('tourCompleted', 'true')
        setTourActive(false)
        driverInstance = null
      },
    })

    driverInstance.drive(0)
  } catch (err) {
    console.warn('Tour: failed to start', err)
    setTourActive(false)
  }
}

/** Stops the active tour, if any. */
export function stopTour() {
  driverInstance?.destroy()
}
