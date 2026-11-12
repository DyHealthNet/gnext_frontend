<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row class="text-center">
          <v-col cols="12">
            <h1 class="title mt-4">How to Cite</h1>
          </v-col>
        </v-row>

        <v-row>
          <v-col class="d-flex justify-center">
            <v-divider class="my-2" thickness="2"></v-divider>
          </v-col>
        </v-row>

        <!-- Study Citations -->
        <v-card outlined class="mb-6">
          <v-toolbar color="primary-darken-1" density="compact">
            <v-toolbar-title class="d-flex align-center">
              If you use the study data in your work, please cite as follows:
            </v-toolbar-title>
          </v-toolbar>
          <v-divider></v-divider>

          <v-card-text>
            <div class="d-flex align-center mb-5">
              <h3 class="mr-3">Plain</h3>
              <v-btn size="small" icon="mdi-content-copy" @click="copyStudyPlainToClipboard"></v-btn>
            </div>
            <textarea readonly class="citation-box">{{ studyPlainEntry }}</textarea>

            <div class="d-flex align-center mb-5 mt-6">
              <h3 class="mr-3">BibTeX</h3>
              <v-btn size="small" icon="mdi-content-copy" @click="copyStudyBibtexToClipboard"></v-btn>
            </div>
            <textarea readonly class="citation-box">{{ studyBibtexEntry }}</textarea>

            <h3 class="mt-6">
              DOI URL:
              <a :href="studyDoiLink" target="_blank" class="doi-link">
                {{ studyDoiLink }}
              </a>
            </h3>
          </v-card-text>
        </v-card>


        <!-- Software Citations -->

        <v-card outlined class="mb-6">
          <v-toolbar color="primary-darken-1" density="compact">
            <v-toolbar-title class="d-flex align-center">
              Additionally, cite the GNExT paper as follows:
            </v-toolbar-title>
          </v-toolbar>
          <v-divider></v-divider>

          <v-card-text>
             <div class="d-flex align-center mb-5">
          <h3 class="mr-3">Plain</h3>
          <v-btn size="small" icon="mdi-content-copy" @click="copySoftwarePlainToClipboard"></v-btn>
        </div>
        <textarea readonly class="citation-box">{{softwarePlainEntry}}</textarea>

        <div class="d-flex align-center mb-5">
          <h3 class="mr-3">BibTeX</h3>
          <v-btn size="small" icon="mdi-content-copy" @click="copySoftwareBibtexToClipboard"></v-btn>
        </div>
        <textarea readonly class="citation-box">{{softwareBibtexEntry}}</textarea>

        <h3 class="mb-5">
          DOI URL:
          <a :href="softwareDoiLink" target="_blank" class="doi-link">
            {{ softwareDoiLink }}
          </a>
        </h3>
          </v-card-text>
        </v-card>

      </v-container>
    </v-main>
  </v-app>
</template>

<script>
/**
 * Citation page.
 *
 * Displays how to cite both the study dataset (plain + BibTeX + DOI, sourced
 * from config) and the GNExT software paper (hard-coded reference), each with a
 * copy-to-clipboard button.
 */
import {STUDY_BIBTEX_CITATION, STUDY_NAME, STUDY_PLAIN_CITATION, STUDY_DOI_LINK} from "@/config.js";


export default {
  name: 'Citation',
  data() {
    return {
      mainHeaderStudyName: STUDY_NAME,
      studyDoiLink: STUDY_DOI_LINK,
      studyBibtexEntry: STUDY_BIBTEX_CITATION,
      studyPlainEntry: STUDY_PLAIN_CITATION,
      softwareDoiLink: "https://doi.org/10.64898/2026.01.30.702559",
      softwareBibtexEntry: `@ARTICLE{Arend2026-wi,
              title        = {Bridging the gap between {GWAS} and network medicine with
                              {GNExT}},
              author       = {Arend, Lis and Woller, Fabian and Rehor, Bastienne and Emmert,
                              David and Frasnelli, Johannes and Fuchsberger, Christian and
                              Blumenthal, David B and List, Markus},
              journaltitle = {Nat. Genet.},
              pages        = {1--3},
              date         = {2026-08-17},
              doi          = {10.1038/s41588-026-02708-6},
              urldate      = {2026-08-21},
              language     = {en}
            }
      `,
      softwarePlainEntry: `Arend, L., Woller, F., Rehor, B., Emmert, D., Frasnelli, J., Fuchsberger, C., Blumenthal, D. B., & List, M. (2026). Bridging the gap between GWAS and network medicine with GNExT. Nature Genetics, 1–3. https://doi.org/10.1038/s41588-026-02708-6`
    }
  },

  methods: {
    /** Copies the plain-text GNExT software citation to the clipboard. */
    copySoftwarePlainToClipboard() {
      navigator.clipboard.writeText(this.softwarePlainEntry)
    },
    /** Copies the BibTeX GNExT software citation to the clipboard. */
    copySoftwareBibtexToClipboard() {
      navigator.clipboard.writeText(this.softwareBibtexEntry)
    },
    /** Copies the plain-text study citation to the clipboard. */
    copyStudyPlainToClipboard() {
      navigator.clipboard.writeText(this.studyPlainEntry)
    },
    /** Copies the BibTeX study citation to the clipboard. */
    copyStudyBibtexToClipboard() {
      navigator.clipboard.writeText(this.softwareBibtexEntry)
    },
  }
}
</script>

<style>
.main-subheader {
  font-size: 1.5rem;
  font-weight: 400;
  color: rgb(var(--v-theme-primary-darken-1));
}

.doi-link {
  font-weight: inherit;
  font-size: inherit;
  color: rgb(var(--v-theme-primary-darken-1)); /* or pick a theme color */
  text-decoration: underline; /* optional */
}

.citation-box {
  width: 100%;
  min-height: 200px; /* default size */
  resize: vertical; /* user can drag to increase height */
  overflow: auto; /* scroll if content too long */
  font-family: monospace;
  font-size: 0.9rem;
  background: rgb(var(--v-theme-surface));
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 4px;
  white-space: pre; /* keep formatting */
}

</style>
