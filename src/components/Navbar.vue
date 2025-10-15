<template>
  <v-app-bar class="page-borders-nav" height="80" scroll-behavior="elevate" app>
    <router-link to="/" class="logo-link">
    <div class="logo-container">

        <img class="forkmeFigure" src="@/assets/figures/DyHealthNet_Logo.png"
             width="auto"
             height="100" alt="DyHealthNet Logo">


      <div class="divider"></div>

      <img class="formeFigure" src="@/assets/figures/CHRIS_Interval_Logo.png"
           width="auto"
           height="60">
    </div>
         </router-link>

    <!-- Correct conditional rendering -->
    <AutoComplete v-if="$route.path !== '/'"/>
    <v-spacer v-else/>

    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn to="/" color="primary-darken-1" cl="mx-1" v-bind="props">
          <template v-slot:prepend>
            <v-icon>mdi-home-outline</v-icon>
          </template>
          Home
        </v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn to="/tophits" color="primary-darken-1" cl="mx-1" v-bind="props">
          <template v-slot:prepend>
            <v-icon>mdi-file-table-outline</v-icon>
          </template>
          Top Hits
        </v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn to="/docs" color="primary-darken-1" class="mx-1" v-bind="props">
          <template v-slot:prepend>
            <v-icon>mdi-help-circle-outline</v-icon>
          </template>
          Documentation
        </v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn to="/idea" color="primary-darken-1" class="mx-1" v-bind="props">
          <template v-slot:prepend>
            <v-icon>mdi-book-open-outline</v-icon>
          </template>
          Idea
        </v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn to="/cite" color="primary-darken-1" class="mx-1" v-bind="props">
          <template v-slot:prepend>
            <v-icon>mdi-pencil</v-icon>
          </template>
          Cite
        </v-btn>
      </template>
    </v-menu>
    <v-icon color="primary-darken-1">mdi-white-balance-sunny</v-icon>
    <v-switch
        v-model="isDark"
        hide-details
        inset
        @click="toggleTheme"
        class="mx-2">
    </v-switch>
    <v-icon class="mr-5" color="primary-darken-1">mdi-weather-night</v-icon>

  </v-app-bar>
</template>

<script>
import AutoComplete from "@/components/AutoComplete_Navbar.vue";

export default {
  components: {AutoComplete},
  data() {
    return {
      isDark: false
    }
  },

  computed: {
    showAutoComplete() {
      return this.$route.path !== '/';
    }
  },

  methods: {
    toggleTheme() {
      const currentTheme = this.$vuetify.theme.global.name
      this.$vuetify.theme.global.name = currentTheme === 'dyHealthNetTheme' ? 'dyHealthNetThemeDark' : 'dyHealthNetTheme'
      this.isDark = currentTheme === 'dyHealthNetTheme'
      localStorage.setItem('theme', this.$vuetify.theme.global.name)
      document.documentElement.classList.toggle('my-app-dark', this.isDark)
      this.darkModeText = currentTheme === 'dyHealthNetTheme' ? "Light mode" : "Dark mode";
    },
    defaultTheme() {
      if (localStorage.getItem('theme')) {
        this.$vuetify.theme.global.name = localStorage.getItem('theme')
        this.isDark = localStorage.getItem('theme') === 'dyHealthNetThemeDark'
        return
      }
      const getSystemMode = () => window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      this.$vuetify.theme.global.name = getSystemMode() === "dark" ? "dyHealthNetThemeDark" : "dyHealthNetTheme"
      this.isDark = getSystemMode() === "dark"
      document.documentElement.classList.toggle('my-app-dark', this.isDark)
    },
  },
  created() {
    this.defaultTheme()
    this.darkModeText = this.$vuetify.theme.global.name === 'dyHealthNetTheme' ? "Light mode" : "Dark mode";
  },
}
</script>

<style>
.page-borders-nav {
}

.logo-link:hover {
  background-color: transparent !important;
  box-shadow: none !important;
}

.divider {
  width: 1px;
  height: 60px;
  background-color: rgb(var(--v-theme-primary));
}

.logo-container {
  display: flex;
  align-items: center;
}

.v-application,
.v-app-bar,
body {
  overflow: visible;
}
</style>