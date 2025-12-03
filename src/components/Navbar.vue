<template>
    <v-toolbar class="navbar" elevation="4">
      <router-link to="/" class="logo-link">
    <div class="logo-container">
        <img class="forkmeFigure" :src="logoSrc"
             width="auto"
             height="50" alt="DyHealthNet Logo">
    </div>
         </router-link>

    <!-- Correct conditional rendering -->
    <AutoComplete v-if="$route.path !== '/'"/>
    <v-spacer v-else/>

    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn to="/" color="darken-1" cl="mx-1" v-bind="props">
          <template v-slot:prepend>
            <v-icon>mdi-home-outline</v-icon>
          </template>
          Home
        </v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn to="/tophits" color="darken-1" cl="mx-1" v-bind="props">
          <template v-slot:prepend>
            <v-icon>mdi-file-table-outline</v-icon>
          </template>
          Top Hits
        </v-btn>
      </template>
    </v-menu>
    <v-menu v-if="magmaShow" transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn to="/networkmedicine" color="darken-1" cl="mx-1" v-bind="props">
          <template v-slot:prepend>
            <v-icon>mdi-pill-multiple</v-icon>
          </template>
          Network Medicine
        </v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn to="/docs" color="darken-1" class="mx-1" v-bind="props">
          <template v-slot:prepend>
            <v-icon>mdi-help-circle-outline</v-icon>
          </template>
          Documentation
        </v-btn>
      </template>
    </v-menu>
   <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn to="/about" color="darken-1" class="mx-1" v-bind="props">
          <template v-slot:prepend>
            <v-icon>mdi-book-open-outline</v-icon>
          </template>
          About
        </v-btn>
      </template>
    </v-menu>
    <v-menu transition="slide-x-transition">
      <template v-slot:activator="{ props }">
        <v-btn to="/cite" color="darken-1" class="mx-1" v-bind="props">
          <template v-slot:prepend>
            <v-icon>mdi-pencil</v-icon>
          </template>
          Cite
        </v-btn>
      </template>
    </v-menu>
    <v-btn
    icon
    variant="text"
    color="darken-1"
    @click="toggleTheme"
  >
    <v-icon>
      {{ isDark ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}
    </v-icon>
  </v-btn>

  </v-toolbar>
</template>

<script>
import AutoComplete from "@/components/autocomplete/AutoComplete_Navbar.vue";
import {MAGMA_SHOW} from "@/config.js";
import logoBlack from "@/assets/figures/GNExT_Logo_Black.png";
import logoWhite from "@/assets/figures/GNExT_Logo_White.png";

export default {
  components: {AutoComplete},
  data() {
    return {
      isDark: false,
      magmaShow: MAGMA_SHOW,
      logoBlack: logoBlack,
      logoWhite: logoWhite,
    }
  },

  computed: {
    showAutoComplete() {
      return this.$route.path !== '/';
    },
    logoSrc() {
      // Return different logo based on theme
      return this.isDark ? this.logoWhite : this.logoBlack;
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

.navbar {
  background-color: rgb(var(--v-theme-surface));
  position: fixed;
  z-index: 37;
  width: 100%;
  height: 70px
}

.v-application--wrap {
  overflow: visible !important;
}

.v-application--wrap,
.v-main,
.v-container,
.v-card {
  position: static !important;
  z-index: auto !important;
}


</style>