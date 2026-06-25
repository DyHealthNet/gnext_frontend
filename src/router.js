/**
 * Vue Router configuration for the GNExT SPA.
 *
 * Declares the static routes (home, docs, about, top hits, citation) and the
 * dynamic entity routes (`/variant/:id`, `/trait/:id`, `/gene/:id`) that pass
 * their `:id` param through as a prop. The Network Medicine route is only
 * registered when MAGMA results are enabled via the `MAGMA_SHOW` config flag.
 */
import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import Documentation from './pages/Documentation.vue'
import Variant from "./pages/Variant.vue";
import Trait from "./pages/Trait.vue";
import TopHits from "./pages/TopHits.vue";
import Citation from "./pages/Citation.vue";
import About from "./pages/About.vue";
import NetworkMedicine from "@/pages/NetworkMedicine.vue";
import {MAGMA_SHOW} from "@/config.js";
import Gene from "./pages/Gene.vue";

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/docs',
    name: 'Documentation',
    component: Documentation
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/tophits',
    name: 'Top Hits',
    component: TopHits
  },
  {
    path: '/cite',
    name: 'Citation',
    component: Citation
  },
  {
    path: '/variant/:id',
    name: 'Variant',
    component: Variant,
    props: true
  },
  {
    path: '/trait/:id',
    name: 'Trait',
    component: Trait,
    props: true
  },
  {
    path: '/gene/:id',
    name: 'Gene',
    component: Gene,
    props: true
  }
]

if(MAGMA_SHOW === true){
  routes.push({
    path: '/networkmedicine',
    name: 'NetworkMedicine',
    component: NetworkMedicine,
  })
}


const router = createRouter({
  history: createWebHistory(),
  routes,
  /**
   * Controls scroll position on navigation: restores the saved position on
   * back/forward navigation, otherwise jumps to the top of the page.
   * @param {import('vue-router').RouteLocationNormalized} to - Target route.
   * @param {import('vue-router').RouteLocationNormalized} from - Previous route.
   * @param {{left:number, top:number}|null} savedPosition - Position saved by the browser, if any.
   * @returns {object} The scroll target for the new route.
   */
  scrollBehavior(to, from, savedPosition) {
    // If the user navigated using browser back/forward, restore saved position
    if (savedPosition) {
      return savedPosition
    }
    // Otherwise, scroll to top instantly (no smooth animation)
    return { top: 0 }
  }
})

export default router