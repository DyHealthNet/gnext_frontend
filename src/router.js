import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import Documentation from './pages/Documentation.vue'
import Variant from "./pages/Variant.vue";
import Trait from "./pages/Trait.vue";
import TopHits from "./pages/TopHits.vue";
import Citation from "./pages/Citation.vue";
import Idea from "./pages/Idea.vue";

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
    path: '/idea',
    name: 'Idea',
    component: Idea
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router