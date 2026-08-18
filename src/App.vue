<!--This file defines the Navbar and Footer for all the pages in application-->

<template>
  <v-app>
<!--<component :is="isHomeRoute ? 'Navbar' : 'Navbar_AutoComplete'" />-->
    <Navbar/>
    <v-main style="padding-top: 60px;">
      <v-container fluid class="page-borders">
        <v-row>
          <router-view />
        </v-row>
      </v-container>
    </v-main>
    <TourBanner/>
  </v-app>
</template>

<script>
/**
 * Root application shell.
 *
 * Renders the persistent Navbar and the routed page content (`<router-view>`)
 * inside the Vuetify app frame. Every page in the SPA is mounted within this
 * layout. Also mounts the opt-in `TourBanner` here (rather than per-page) so
 * the guided-tour offer follows the visitor regardless of which page they
 * land on first.
 */
import Navbar from "@/components/Navbar.vue";
import TourBanner from "@/components/tour/TourBanner.vue";

export default {
  components: {
    Navbar,
    TourBanner,
    //Navbar_AutoComplete
  },

  computed: {
    /** @returns {boolean} True when the current route is the home page ("/"). */
    isHomeRoute(){
      return this.$route.path === '/';
    }
  }
};
</script>

<style>
</style>