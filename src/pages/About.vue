<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row class="text-center">
          <v-col cols="12">
            <h1 class="title mt-4">About</h1>
          </v-col>
        </v-row>

        <v-row>
          <v-col class="d-flex justify-center">
            <v-divider class="my-2" thickness="2"></v-divider>
          </v-col>
        </v-row>

        <v-row class="text-center my-4">
          <v-col cols="12">
            <v-img
              :src="logo"
              alt="GNext Logo"
              max-width="300"
              class="mx-auto"
              contain
            />
          </v-col>
        </v-row>

        <p class="text-body-1 mb-4">

          With this platform, we aim to facilitate the exploration of GWAS summary statistics by
          enabling researchers to make their data easily browsable and accessible to the scientific community.
        </p>

        <p class="text-body-1 mb-4">
          The platform currently enables the exploration of GWAS summary statistics through multiple complementary
          functionalities. Association results can be explored from both a variant-centric, trait-centric, or gene-centric perspective, while functional annotations dervied from the Ensembl Variant Effect Predictor
          (VEP) support the biological interpretation of the findings. Furthermore, with the integration of MAGMA gene-based association results and the Drugst.One interface, GNExT extends its functionalities beyond a variant-level effect and significance exploration towards a systems and network medicine toolbox. GNExT thus allows its users to study genetic variants on the network level down to the identification of potential drug repurpsoing candidates
          
          For detailed information on the different
          functionlities, please refer to the <router-link to="/docs">Documentation</router-link> page.
        </p>

        <v-row class="my-4">
          <v-col cols="12">
            <v-card outlined>
              <v-toolbar color="primary-darken-1" density="compact" @click="expanded_deploy = !expanded_deploy">
                <v-toolbar-title class="d-flex align-center gap-2">
                  Deploy your Own Instance
                </v-toolbar-title>

                <v-btn
                    size="small"
                    variant="text"
                    icon="mdi-chevron-down"
                    :class="{ 'rotate-180': expanded_deploy }"
                ></v-btn>
              </v-toolbar>

              <v-expand-transition>
                <div v-show="expanded_deploy">
                  <v-divider></v-divider>
                  <v-card-text>
              
                <p class="text-body-1 mb-4">
                  We provide an easy-to-use Nextflow pipeline for generating all required input files for this platform.
                  For detailed information on the preprocessing workflow, please refer to the <router-link to="/docs">Documentation</router-link> page.
                  The Nextflow implementation allows seamless and parallel execution of preprocessing steps, enabling
                  users to efficiently handle large-scale GWAS summary statistics and rapidly deploy their own instance
                  of the platform.
                </p>

                <p class="text-body-1 mb-4">
                  The platform itself is then only dependent on the resulting directory coming from the Nextflow
                  pipeline. The platform has an underlying Django backend, which handles data retrieval and processing.
                  The user interface is implemented using Vue.js and Vuetify, ensuring a responsive and user-friendly interface. For
                  ensuring autocomplete functionality, we utilize a Typesense engine.
                </p>

                <p class="text-body-1 mb-4">
                  To enable seamless deployment, we provide a Docker Compose
                  configuration that sets up all necessary components, including the backend, frontend, and Typesense server.
                </p>

                 <p class="text-body-1 mb-4">
                      If you have issues deploying the platform, please reach out to us and write issues at our GitHub repositories (see Developer Contact).
                 </p>
                </v-card-text>
                </div>
              </v-expand-transition>
            </v-card>
          </v-col>
        </v-row>

         <v-row class="my-4">
          <v-col cols="12">
            <v-card outlined>
              <v-toolbar color="primary-darken-1" density="compact" @click="expanded_github = !expanded_github">
                <v-toolbar-title class="d-flex align-center gap-2">
                  GitHub Repositories
                </v-toolbar-title>

                <v-btn
                    size="small"
                    variant="text"
                    icon="mdi-chevron-down"
                    :class="{ 'rotate-180': expanded_github }"
                ></v-btn>
              </v-toolbar>

              <v-expand-transition>
                <div v-show="expanded_github">
                  <v-divider></v-divider>
                  <v-card-text>
                      <p class="text-body-1 mb-4 mt-4">
                        The source code of this platform and the preprocessing pipeline is openly available at the following repositories:
                      </p>
                       <v-row>
                      <v-col cols="12" md="6" lg="6">
                         <v-card class="h-100" elevation="2">
                          <v-card-title class="d-flex align-center">
                            <v-icon icon="mdi-github" size="large" class="mr-2"></v-icon>
                            <div>GNExT Platform</div>
                          </v-card-title>
                          <v-card-text>
                            <div class="mb-2">
                              <v-icon icon="mdi-code-tags" size="small" class="mr-1"></v-icon>
                              <a href="https://github.com/dyhealthnet/dyhealthnetlight_docker" target="_blank" rel="noopener" class="text-body-2">Source Code</a>
                            </div>
                            <div>
                              <v-icon icon="mdi-message-alert" size="small" class="mr-1"></v-icon>
                              <a href="https://github.com/dyhealthnet/dyhealthnetlight_docker/issues" target="_blank" rel="noopener" class="text-body-2">Issues</a>
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                      <v-col cols="12" md="6" lg="6">
                         <v-card class="h-100" elevation="2">
                          <v-card-title class="d-flex align-center">
                            <v-icon icon="mdi-github" size="large" class="mr-2"></v-icon>
                            <div>GNExT Preprocessing Pipeline</div>
                          </v-card-title>
                          <v-card-text>
                            <div class="mb-2">
                              <v-icon icon="mdi-code-tags" size="small" class="mr-1"></v-icon>
                              <a href="https://github.com/dyhealthnet/gnext_nf_pipeline" target="_blank" rel="noopener" class="text-body-2">Source Code</a>
                            </div>
                            <div>
                              <v-icon icon="mdi-message-alert" size="small" class="mr-1"></v-icon>
                              <a href="https://github.com/dyhealthnet/gnext_nf_pipeline/issues" target="_blank" rel="noopener" class="text-body-2">Issues</a>
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                    <p class="text-body-1 mb-4 mt-4">
                      <v-icon icon="mdi-comment-text" size="small" class="mr-1"></v-icon>
                      If you have any suggestions or feedback, please feel free to reach out to us. We would love to hear from you!
                    </p>

                    <p class="text-body-1 mb-4">
                      <v-icon icon="mdi-email" size="small" class="mr-1"></v-icon>
                      For deployment inquiries or technical support, please contact: <a href="mailto:lis.arend@tum.de">lis.arend@tum.de</a>
                    </p>
                  </v-card-text>
                </div>
              </v-expand-transition>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="my-4">
          <v-col cols="12">
            <v-card outlined>
              <v-toolbar color="primary-darken-1" density="compact" @click="expanded_impressum = !expanded_impressum">
                <v-toolbar-title class="d-flex align-center gap-2">
                  Impressum
                </v-toolbar-title>

                <v-btn
                    size="small"
                    variant="text"
                    icon="mdi-chevron-down"
                    :class="{ 'rotate-180': expanded_impressum }"
                ></v-btn>
              </v-toolbar>

              <v-expand-transition>
                <div v-show="expanded_impressum">
                  <v-divider></v-divider>
                  <v-card-text>                    
                    <div class="mb-4">
                      <h4 class="text-subtitle-1 mb-2">Responsible Research Groups</h4>

                      <v-row>
                        <v-col cols="12" md="6" lg="4">
                          <v-card class="h-100" elevation="2">
                            <v-card-title class="d-flex align-center">
                              <v-icon icon="mdi-account-school" size="large" class="mr-2"></v-icon>
                              <div>Prof. Dr. Markus List</div>
                            </v-card-title>
                            <v-card-text>
                              <div class="mb-2 d-flex align-start">
                                <v-icon icon="mdi-school" size="small" class="mr-1 mt-1"></v-icon>
                                <div class="text-body-2">
                                  Data Science in Systems Biology<br>
                                  Technical University of Munich (TUM), Munich, Germany
                                </div>
                              </div>
                             
                              <div>
                                <v-icon icon="mdi-web" size="small" class="mr-1"></v-icon>
                                <a href="https://www.mls.ls.tum.de/daisybio/startseite/" target="_blank" rel="noopener" class="text-body-2">daisybio.de</a>
                              </div>

                              <div>
                                <v-icon icon="mdi-email" size="small" class="mr-1"></v-icon>
                                <a href="mailto:markus.list@tum.de" class="text-body-2">markus.list@tum.de</a>
                              </div>
                            </v-card-text>
                          </v-card>
                        </v-col>

                        <v-col cols="12" md="6" lg="4">
                          <v-card class="h-100" elevation="2">
                            <v-card-title class="d-flex align-center">
                              <v-icon icon="mdi-account-school" size="large" class="mr-2"></v-icon>
                              <div>Prof. Dr. David B. Blumenthal</div>
                            </v-card-title>
                            <v-card-text>
                              <div class="mb-2 d-flex align-start">
                                <v-icon icon="mdi-school" size="small" class="mr-1 mt-1"></v-icon>
                                <div class="text-body-2">
                                  Biomedical Network Science Lab<br>
                                  Friedrich-Alexander-Universität Erlangen-Nürnberg (FAU), Erlangen, Germany
                                </div>
                              </div>
                              <div>
                                <v-icon icon="mdi-web" size="small" class="mr-1"></v-icon>
                                <a href="https://www.bionets.tf.fau.de/" target="_blank" rel="noopener" class="text-body-2">bionets.tf.fau.de</a>
                              </div>

                              <div>
                                <v-icon icon="mdi-email" size="small" class="mr-1"></v-icon>
                                <a href="mailto:david.b.blumenthal@fau.de" class="text-body-2">david.b.blumenthal@fau.de</a>
                              </div>
                            </v-card-text>
                          </v-card>
                        </v-col>

                        <v-col cols="12" md="6" lg="4">
                          <v-card class="h-100" elevation="2">
                            <v-card-title class="d-flex align-center">
                              <v-icon icon="mdi-account-school" size="large" class="mr-2"></v-icon>
                              <div>Dr. Christian Fuchsberger</div>
                            </v-card-title>
                            <v-card-text>
                              <div class="mb-2 d-flex align-start">
                                <v-icon icon="mdi-school" size="small" class="mr-1 mt-1"></v-icon>
                                <div class="text-body-2">
                                  Institute for Biomedicine<br>
                                  Eurac Research, Bolzano, Italy
                                </div>
                              </div>
                              <div>
                                <v-icon icon="mdi-web" size="small" class="mr-1"></v-icon>
                                <a href="https://www.eurac.edu/en/institutes-centers/institute-for-biomedicine" target="_blank" rel="noopener" class="text-body-2">eurac.edu/en/institutes-centers/institute-for-biomedicine</a>
                              </div>
                              <div>
                                <v-icon icon="mdi-email" size="small" class="mr-1"></v-icon>
                                <a href="mailto:Christian.Fuchsberger@eurac.edu" class="text-body-2">Christian.Fuchsberger@eurac.edu</a>
                              </div>
                            </v-card-text>
                          </v-card>
                        </v-col>
                      </v-row>
                    </div>

                    <div>
                      <h4 class="text-subtitle-1 mb-2">Technical Contact</h4>
                      <div class="mb-2">
                        <v-icon icon="mdi-email" size="small" class="mr-1"></v-icon>
                        <a href="mailto:lis.arend@tum.de" class="text-body-2">lis.arend@tum.de</a>
                      </div>
                    </div>
                  </v-card-text>
                </div>
              </v-expand-transition>
            </v-card>
          </v-col>
        </v-row>

      

      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import logoWhite from "@/assets/figures/GNExT_Logo_White.png"
import logoBlack from "@/assets/figures/GNExT_Logo_Black.png"

export default {
  name: 'Idea',
  data() {
    return {
      expanded_deploy: true,
      expanded_github: true,
      expanded_impressum: true,
    };
  },

  computed: {
    logo() {
      // Dynamically choose logo based on theme (Vuetify 3 API)
      return this.$vuetify.theme.global.current.dark ? logoWhite : logoBlack;
    }
  }
}
</script>

<style>
.rotate-180 {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}
</style>
