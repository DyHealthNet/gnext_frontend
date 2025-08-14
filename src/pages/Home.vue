<template>
  <v-app>
    <v-main class="home-background">
      <v-container width="80%">
        <!-- Part 1: Welcome -->
        <v-row class="mt-12 mb-0">
          <v-col cols="12" class="text-center">
            <h1 class="main-header">
              <span>{{ mainHeaderPrefix }}</span>
              <span class="main-header-study">{{ mainHeaderStudyName }}</span>
              <span>{{ mainHeaderSuffix }}</span>
             </h1>
          </v-col>
          <v-col cols="12" class="text-center">
            <h2 class="main-subheader">{{ mainSubheader }}</h2>
          </v-col>
        </v-row>

      <HomeStatsGrid/>

      <v-row align="center" justify="center" class="mt-6 mb-2" style="gap: 5px; font-size:0.8rem;">
        <v-icon class="mr-1">mdi-arrow-down</v-icon>
        <span>Try searching for a trait or a variant</span>
        <v-icon class="ml-1">mdi-arrow-down</v-icon>
      </v-row>

      <AutoComplete/>


        <v-row align="center" justify="center" class="mt-3" style="gap: 5px; font-size:0.8rem;">
          <v-btn class="example-btn" depressed>
            Example Trait →
          </v-btn>
          <v-btn class="example-btn" depressed>
            Example Variant →
          </v-btn>
        </v-row>
      </v-container>


    </v-main>
  </v-app>

</template>


<script>
import AutoComplete from "@/components/AutoComplete_Home.vue";
import HomeStatsGrid from "@/components/HomeStatsGrid.vue";
import {STUDY_NAME} from '@/config'

export default {
  name: "Home",
  components: {
    AutoComplete,
    HomeStatsGrid
  },
  data() {
    return {
      mainHeaderPrefix: "Welcome to the GWAS Explorer of the ",
      mainHeaderStudyName: STUDY_NAME,
      mainHeaderSuffix: " Study",
      mainSubheader: "Your gateway to explore and analyze GWAS summary statistics",
    }
  },
}
</script>

<style scoped>

.example-btn {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-darken-1));
  font-weight: bold;
  border-radius: 999px;
  padding: 6px 18px;
  transition: all 0.2s ease-in-out;
}


.home-background {
  background: linear-gradient(to bottom right,  rgb(var(--v-theme-primary)),  rgb(var(--v-theme-background)));
  padding: 20px;
  border-radius: 10px;
}


.main-header {
  font-size: 3rem;
  font-weight: bold;
  color: rgb(var(--v-theme-darken-1));
  margin-bottom: 10px;
}

.main-header-study {
  color: rgb(var(--v-theme-primary-darken-1));
  text-decoration: underline;
}

.main-subheader {
  font-size: 2rem;
  font-weight: 400;
  color: rgb(var(--v-theme-primary-darken-1));
}
</style>
