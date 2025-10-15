<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row class="text-center">
          <v-col cols="12">
            <h1 class="title mt-4">Idea</h1>
          </v-col>
        </v-row>

        <v-row>
          <v-col class="d-flex justify-center">
            <v-divider class="my-2" thickness="2"></v-divider>
          </v-col>
        </v-row>

        <p class="text-body-1 mb-4">

          With this platform, we aim to facilitate the dissemination and exploration of GWAS summary statistics by
          enabling researchers to make their data easily browsable and accessible to the scientific community.
        </p>

        <p class="text-body-1 mb-4">
          The platform currently enables the exploration of GWAS summary statistics through multiple complementary
          functionalities. Association results can be explored from both a variant-centric and
          trait-centric perspective, while functional annotations dervied from the Ensembl Variant Effect Predictor
          (VEP) support the biological interpretation of the findings. For detailed information on the different
          functionlities, please refer to the Documentation page.
        </p>

        <p class="text-body-1 mb-4">
          The platform is actively being developed and continuously enhanced to expand its analytical capabilities and
          improve user experience.

          Upcoming updates will incorporate gene-based association testing methods such as MAGMA, enabling the
          aggregation of SNP-level summary statistics into gene-level results.

          This extension will allow the integration of advanced approaches from network medicine supporting analyses
          such as disease module detection and drug repurposing.
        </p>

        <p class="text-body-1 mb-4">
          If you are interested in deploying this kind of platform for your own study, please contact us at
          lis.arend@tum.de.
        </p>
        <p class="text-body-1 mb-4">
          If you have any suggestions or feedback, please feel free to reach out to us. We would love to hear from you!
        </p>

        <v-row class="my-4">
          <v-col cols="12">
            <v-card outlined>
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title class="d-flex align-center gap-2">
                  Implementational Details
                </v-toolbar-title>
              </v-toolbar>
              <v-card-text>
                <p class="text-body-1 mb-4">
                  We provide an easy-to-use Nextflow pipeline for generating all required input files for this platform.
                  For detailed information on the preprocessing workflow, please refer to the Documentation page.
                  The Nextflow implementation allows seamless and parallel execution of preprocessing steps, enabling
                  users to efficiently handle large-scale GWAS summary statistics and rapidly deploy their own instance
                  of the platform.
                </p>

                <p class="text-body-1 mb-4">
                  The platform itself is then only dependent on the resulting directory coming from the Nextflow
                  pipeline. The platform has an underlying Django frontend, which handles data retrieval and processing.
                  The user interface
                  is implemented using Vue.js and Vuetify, ensuring a responsive and user-friendly interface. For
                  ensuring autocomplete functionality, we utilize Typesense, with a Docker image running in the
                  background.
                </p>

                <p class="text-body-1 mb-4">
                  The platform can be easily deployed using Docker Compose, which orchestrates the different components
                  and ensures smooth operation.
                </p>

              </v-card-text>
            </v-card>
          </v-col>
        </v-row>


        <v-row class="my-4">
          <v-col cols="12">
            <v-card outlined>
              <v-toolbar color="primary-darken-1" density="compact">
                <v-toolbar-title class="d-flex align-center gap-2">
                  Big Picture of DyHealthNet
                </v-toolbar-title>
              </v-toolbar>
              <v-card-text>

                <v-row align="start" justify="space-between" no-gutters>
                  <!-- Text column -->
                  <v-col cols="12" md="6">


                    <p class="text-body-1 mb-4">
                      Population-based epidemiological cohort studies such as the Cooperative Health Research in South
                      Tyrol
                      (CHRIS) study provide a comprehensive overview of the general population’s health state,
                      effectively
                      capturing the standard physiological range and a spectrum of pathological states. Integrating
                      molecular profiling data with clinical and lifestyle metadata presents significant potential for
                      elucidating physiological changes and underlying mechanisms associated with early disease onset.
                      However, even as the number of cohort studies increases and ever more sophisticated data are
                      collected, fruitful exploration and analysis of these datasets across multiple dimensions remains
                      challenging, even for expert data scientists. Network-based approaches are well-suited for this
                      purpose, integrating multi-level biomedical data to build knowledge graphs that capture
                      system-level
                      and functionally relevant interactions.
                    </p>
                    <p class="text-body-1 mb-4">
                      In response to these advancements and challenges, we are developing two platforms for the dynamic
                      exploration of population cohorts through multi-level network medicine approaches.
                    </p>

                    <p class="text-body-1 mb-4">
                      The DyHealthNet Light platform allows the exploration of GWAS summary statistics and offers
                      filtering, annotation, and aggregation of GWAS summary statistics data. Furthermore, with the transformation
                      of variant-level results onto gene-level, the platform enables the application of well-known
                      algorithms and tools from network biology to conduct e.g. disease module discovery or functional enrichment
                      analysis.
                    </p>

                    <p class="text-body-1 mb-4">
                      The second platform, DyHealthNet, integrates heterogeneous molecular and baseline metadata into a
                      unified multi-omics network framework to elucidate complex associations among the different data
                      types. Furthermore, the functionalities of the light version based on GWAS summary statistics will
                      be
                      integrated. Even if certain data layers should not be present in a given dataset, this can be
                      specified in the setup of the platform and all calculations and analyses will then only be applied
                      on
                      the actual present data. There is no need for the user to upload their data to some public server,
                      since each user can set up their own instance of both platforms on their local computing
                      facilities
                      where the data is actually stored. This way, privacy-sensitive data can be kept in a secure and
                      protected environment by “having the platform come to the data”.
                    </p>

                    <p class="text-body-1 mb-4">
                      The DyHealthNet platform supports both global exploratory analyses across the entire cohort data
                      and
                      dynamic computation of associations within user-defined population subsets, enabling the
                      identification of subgroup-specific molecular mechanisms. Such subsets can be defined via logical
                      concatenations of omics variables (especially phenotypes) or the absence / presence of genetic
                      variants. As an example, if a user is interested in the underlying mechanisms of pain sensitivity,
                      they might subset their cohort to e.g. samples over 50 years old with a pressure pain sensitivity
                      above a certain threshold or to samples that possess a certain genetic variant known to be
                      associated
                      with pain sensitivity.
                    </p>

                    <p class="text-body-1 mb-4">
                      The cohort-specific multi-omics association network will be extended by integrating external
                      resources
                      from public databases for the different types of omics layers, in order to “embed” the
                      cohort-specific
                      results into already existing knowledge. Lastly, the platform’s differential context comparison
                      mode
                      will enable differential network analyses between pairwise knowledge graphs of two subgroups.
                      Referring back to our original example research question, this functionality will allow the user
                      to
                      mine for differentially expressed subnetworks between e.g. pairwise knowledge graphs for pain
                      sensitivity of men and women. This way we hope to uncover mechanisms and pathways of variables
                      that,
                      acting together, lead to significant functional differences between e.g. pain sensitivity in men
                      and
                      women.
                    </p>

                    <p class="text-body-1 mb-4">
                      Both platforms are designed to be modular, configurable via cohort-specific configurations, and
                      easily
                      deployable. Thus, DyHealthNet makes disease association mining and explorative analysis of
                      population
                      cohort data more broadly accessible, even to researchers without programming expertise.
                    </p>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-img
                        :src="dyhealthnetvisionimg"
                        alt="DyHealthNet Vision"
                        max-width="100%"
                        class="rounded-lg mb-10"
                        contain
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import dyhealthnetvisionimg from "@/assets/figures/DyHealthNet_Vision.png"

export default {
  name: 'Idea',
  data() {
    return {
      dyhealthnetvisionimg
    };
  },
}
</script>
