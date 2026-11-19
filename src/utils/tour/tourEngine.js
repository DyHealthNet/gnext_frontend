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

/**
 * Class put on <html> while a tour runs. driver.js only locks scrolling on
 * <body>, but Vuetify makes <html> the scroll container, so the page lock has
 * to live there (see `tour.css`). Programmatic scrolling (driver.js's
 * scrollIntoView, router navigation) keeps working under `overflow: hidden`.
 */
const SCROLL_LOCK_CLASS = 'gnext-tour-scroll-lock'

/** Locks/unlocks page scrolling for the duration of the tour. @param {boolean} locked */
function setScrollLock(locked) {
  document.documentElement.classList.toggle(SCROLL_LOCK_CLASS, locked)
}

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

/**
 * Invisible stand-in element used to highlight only the *visible* part of a
 * target that is wider than its scroll container (e.g. a table row inside a
 * horizontally scrolling table: driver.js would otherwise cut the highlight
 * out at the row's full width, past the card's edge).
 */
let clipProxy = null

/** @returns {Element[]} Ancestors of `el` that clip their content (overflow other than visible). */
function clippingAncestors(el) {
  const result = []
  for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node)
    if ([style.overflowX, style.overflowY].some(v => v !== 'visible')) result.push(node)
  }
  return result
}

/**
 * Returns an element covering the visible part of `selector`'s target (its
 * bounding box intersected with every clipping ancestor), or null while the
 * target isn't rendered. Only writes styles when the box changed, because
 * driver.js's waitForElement observes attribute mutations on the document.
 * @param {string} selector - CSS selector of the real target.
 */
function clippedTarget(selector) {
  const target = document.querySelector(selector)
  if (!target) return null

  let {left, top, right, bottom} = target.getBoundingClientRect()
  for (const ancestor of clippingAncestors(target)) {
    const r = ancestor.getBoundingClientRect()
    left = Math.max(left, r.left)
    top = Math.max(top, r.top)
    right = Math.min(right, r.right)
    bottom = Math.min(bottom, r.bottom)
  }
  if (right <= left || bottom <= top) return target

  if (!clipProxy) {
    clipProxy = document.createElement('div')
    clipProxy.setAttribute('aria-hidden', 'true')
    document.body.appendChild(clipProxy)
  }
  const css = `position:absolute;pointer-events:none;visibility:hidden;` +
      `left:${left + window.scrollX}px;top:${top + window.scrollY}px;` +
      `width:${right - left}px;height:${bottom - top}px;`
  if (clipProxy.style.cssText !== css) clipProxy.style.cssText = css
  return clipProxy
}

/** Removes the clip proxy element, if one was created. */
function removeClipProxy() {
  clipProxy?.remove()
  clipProxy = null
}

/**
 * Scrolls the page all the way to the top (page heading visible). Used for
 * targets taller than the viewport, which driver.js would otherwise leave
 * scrolled to somewhere in their middle. driver.js listens for scroll events
 * and re-positions the highlight and popover on its own.
 */
function scrollPageToTop() {
  window.scrollTo({top: 0, behavior: 'auto'})
}

/**
 * Scrolls the page so `el`'s top sits just below the fixed navbar. Used for
 * tall targets in the middle of a page, whose top driver.js would otherwise
 * scroll to y=0 -- underneath the navbar.
 * @param {Element|undefined} el
 */
function scrollTargetBelowNavbar(el) {
  if (!el) return
  const navbar = document.querySelector('.navbar')
  const offset = (navbar ? navbar.getBoundingClientRect().height : 64) + 16
  window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'auto'})
}

/** Watches the highlighted element's size for the current step. */
let resizeObserver = null

/**
 * Re-fits the highlight and popover whenever the highlighted element changes
 * size -- e.g. a table or plot that finishes loading after the step was
 * shown. driver.js only measures the element once (plus on window resize).
 * @param {Element|undefined} el
 */
function followElementSize(el) {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (!el || typeof ResizeObserver === 'undefined') return
  let initial = true // ResizeObserver reports once right after observe()
  resizeObserver = new ResizeObserver(() => {
    if (initial) { initial = false; return }
    driverInstance?.refresh()
  })
  resizeObserver.observe(el)
}

/**
 * Converts one of our step definitions into a driver.js `DriveStep`.
 *
 * Button state is set explicitly from the step's position: with
 * `skipMissingElement`, driver.js treats a neighbouring step whose element
 * lives on another route as "missing", so it would otherwise disable
 * "Previous" and label "Next" as "Done" on every step next to a route change.
 *
 * @param {object} step - Step definition from `tourSteps.js`.
 * @param {number} index - Position of the step in the tour.
 * @param {number} total - Number of steps in the tour.
 */
function toDriveStep(step, index, total) {
  return {
    // `clipToScrollParent` steps highlight only the visible part of the target (see `clippedTarget`).
    element: step.selector
        ? (step.clipToScrollParent ? () => clippedTarget(step.selector) : step.selector)
        : undefined,
    // `scrollToTop`: start at the top of the page instead of the middle of a tall target.
    // `scrollBelowNavbar`: put a tall target's top just below the navbar instead of under it.
    onHighlighted: (el) => {
      if (step.scrollToTop) scrollPageToTop()
      else if (step.scrollBelowNavbar) scrollTargetBelowNavbar(el)
      followElementSize(el)
    },
    popover: {
      title: step.popover.title,
      description: step.popover.description,
      disableButtons: index === 0 ? ['previous'] : [],
      nextBtnText: index === total - 1 ? 'Done' : 'Next',
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

    // Load driver.css before our overrides so tour.css always wins the cascade
    // (with Promise.all the injection order was a race).
    const {driver} = await import('driver.js')
    await import('driver.js/dist/driver.css')
    await import('@/assets/tour.css')

    const trail = await resolveTourTrail()
    const seedListName = (MAGMA_SHOW && trail) ? await ensureDemoSeedList(trail.traitId) : null
    stepList = buildTourSteps({trail, hasSeedList: Boolean(seedListName), seedListName})

    driverInstance = driver({
      showProgress: true,
      allowClose: true,
      allowScroll: false,
      // Highlighted elements are view-only; navigation happens via the popover buttons.
      disableActiveInteraction: true,
      // Clicking the dimmed background does nothing (close via the X button or Esc).
      overlayClickBehavior: () => {},
      overlayOpacity: 0.6,
      stagePadding: 6,
      popoverClass: 'gnext-tour-popover',
      waitForElement: 4000,
      skipMissingElement: true,
      steps: stepList.map((step, i) => toDriveStep(step, i, stepList.length)),
      onDestroyed: () => {
        removeClipProxy()
        followElementSize(null)
        setScrollLock(false)
        localStorage.setItem('tourCompleted', 'true')
        setTourActive(false)
        driverInstance = null
      },
    })

    setScrollLock(true)
    driverInstance.drive(0)
  } catch (err) {
    console.warn('Tour: failed to start', err)
    setScrollLock(false)
    setTourActive(false)
  }
}

/** Stops the active tour, if any. */
export function stopTour() {
  driverInstance?.destroy()
}
