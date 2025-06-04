<template>
  <v-app>
      <v-main>
      <v-container>
        <v-row  class="text-center">
          <v-col cols="12">
            <h1 class="title mt-4">Overview of Variants and Traits</h1>
          </v-col>
        </v-row>

        <v-row>
          <v-col class="d-flex justify-center">
            <v-divider class="my-2" thickness="2"></v-divider>
          </v-col>
        </v-row>

      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import QQPlot from "@/components/trait/QQ.vue";
import ManhattanPlot from "@/components/trait/Manhattan.vue";

export default {
  name: 'Overview',
  components: {ManhattanPlot, QQPlot},
}
</script>
