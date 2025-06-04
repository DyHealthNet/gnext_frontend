<!--This file defines the Navbar and Footer for all the pages in application-->

<template>
  <v-app>
<!--<component :is="isHomeRoute ? 'Navbar' : 'Navbar_AutoComplete'" />-->
    <Navbar/>
    <v-main>
      <v-container fluid class="page-borders">
        <v-row>
          <router-view />
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import Navbar from "@/components/Navbar.vue";

export default {
  components: {
    Navbar,
    //Navbar_AutoComplete
  },

  computed: {
    isHomeRoute(){
      return this.$route.path === '/';
    }
  }
};
</script>

<style>
</style>