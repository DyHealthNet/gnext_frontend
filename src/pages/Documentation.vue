<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row class="text-center">
          <v-col cols="12">
            <h1 class="title mt-4">Documentation</h1>
          </v-col>
        </v-row>

        <v-row>
          <v-col class="d-flex justify-center">
            <v-divider class="my-2" thickness="2"></v-divider>
          </v-col>
        </v-row>

        <p class="text-body-1 mb-4">
          This page provides an overview of the main components and features of the application. Each section includes a
          concise explanation of its purpose, accompanied by visual snapshots and examples to help you understand how
          the different parts fit together. The goal of this tutorial is to guide you step by step through the system’s
          structure and functionality, enabling you to quickly become familiar with its core concepts and practical use.
        </p>

        <p class="text-body-1 mb-4">
          Details on the data preprocessing procedures applied for this website are provided at the bottom of the page.
        </p>

        <p class="text-body-1 mb-4">
          An important note on genomic coordinates: All genomic positions in this application are based on the <b>{{GENOME_BUILD}} human genome assembly</b>.
          When searching for variants or traits, please ensure that you are using coordinates corresponding to this assembly.
        </p>

        <v-row class="my-4">
          <v-col cols="12">
            <v-card outlined>
              <v-toolbar color="primary-darken-1" density="compact" @click="expanded_home = !expanded_home">
                <v-toolbar-title class="d-flex align-center gap-2">
                  <v-icon icon="mdi-numeric-1-circle"/>
                  Home Page
                </v-toolbar-title>

                <v-btn
                    size="small"
                    variant="text"
                    icon="mdi-chevron-down"
                    :class="{ 'rotate-180': expanded_home }"
                ></v-btn>
              </v-toolbar>

              <v-expand-transition>
                <div v-show="expanded_home">
                  <v-divider></v-divider>
                  <v-card-text>
                    <div class="d-flex align-start flex-nowrap" style="gap: 24px;">
                      <!-- Text -->
                      <div style="flex: 1;">
                        <p class="text-body-1 mb-4">
                          The <b>Home page</b> serves as the central hub for users to initiate their exploration of the
                          platform.
                          It displays the number of traits and variants currently available in the database, providing
                          users
                          with a quick overview of the data scope.
                        </p>
                        <p class="text-body-1 mb-4">
                          One of the key features of the platform is the <b>autocomplete search bar</b>, positioned
                          centrally on the Home page and accessible from all other pages. Once you start typing, it will
                          suggest relevant traits and variants based on your input, making it easier to find specific
                          items.
                        </p>
                        <p class="text-body-1 mb-4">
                          You can search for two main entities and by clicking you will be redirected to their
                          respective
                          pages:
                        </p>
                        <ul class="text-body-1 mb-4 pl-6">
                          <li><b>traits</b> by trait ID, description, trait group, or external ID.</li>
                          <li><b>variants</b> by variant ID (<code>chr_pos_ref/alt</code>) or rsID (from VEP).
                          </li>
                        </ul>
                        <p class="text-body-1 mb-4">
                          When navigating away from the Home page, the <b>search bar dynamically relocates</b> to the
                          navigation bar, ensuring continuous
                          accessibility across the interface.
                        </p>
                      </div>

                      <!-- Image -->
                      <v-img
                          :src="homepageimg"
                          alt="Home Page Tutorial"
                          width="1%"
                          class="rounded-lg flex-shrink-0"
                          contain
                      />
                    </div>
                  </v-card-text>
                </div>
              </v-expand-transition>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="my-4">
          <v-col cols="12">
            <v-card outlined>
              <v-toolbar color="primary-darken-1" density="compact" @click="expanded_tophits = !expanded_tophits">
                <v-toolbar-title class="d-flex align-center gap-2">
                  <v-icon icon="mdi-numeric-2-circle"/>
                  Top Hits Page
                </v-toolbar-title>

                <v-btn
                    size="small"
                    variant="text"
                    icon="mdi-chevron-down"
                    :class="{ 'rotate-180': expanded_tophits }"
                ></v-btn>
              </v-toolbar>

              <v-expand-transition>
                <div v-show="expanded_tophits">
                  <v-divider></v-divider>
                  <v-card-text>
                    <p class="text-body-1 mb-4">
                      If you are unsure what to search for, you can explore the <b>Top Hits page</b>, which highlights
                      the
                      most
                      significant traits and variants identified in this study. Just navigate through the Top Hits table
                      via
                      the navigation bar.
                      You can use the trait ID or top variant column to navigate to the respective trait or variant page
                      of
                      interest.
                    </p>

                    <p class="text-body-1 mb-4">
                      This table shows only the peaks with a p-value < 10⁻⁶.
                      Variants are excluded if another variant within 500kb of the same trait has a smaller p-value.
                      For each phenotype, only the top 500 variants are retained, and the table is limited to the top
                      10,000
                      hits overall.
                      Entries with a reported p-value of 0 but a valid −log₁₀(p-value)
                      represent values smaller than approximately 5×10⁻³²⁴, which fall below the representable range of
                      double-precision
                      floating-point numbers and consequently underflow to zero.
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
              <v-toolbar color="primary-darken-1" density="compact" @click="expanded_variant = !expanded_variant">
                <v-toolbar-title class="d-flex align-center">
                  <v-icon icon="mdi-numeric-3-circle"/>
                  Variant Page
                </v-toolbar-title>

                <v-btn
                    size="small"
                    variant="text"
                    icon="mdi-chevron-down"
                    :class="{ 'rotate-180': expanded_variant }"
                ></v-btn>
              </v-toolbar>

              <v-expand-transition>
                <div v-show="expanded_variant">
                  <v-divider></v-divider>

                  <v-card-text>
                    <v-row align="start" justify="space-between" no-gutters>
                      <!-- Text column -->
                      <v-col cols="12" md="6">
                        <p class="text-body-1 mb-4">
                          The <b>Variant page</b> provides a comprehensive overview of a specific genetic variant,
                          including its
                          <b>functional annotations</b> derived from the Ensembl Variant Effect Predictor (VEP) and <b>association
                          results</b> across all analyzed traits.
                        </p>

                        <p class="text-body-1 mb-4">
                          The <b>Variant Profile</b> card summarizes fundamental information about the variant, such as
                          its
                          genomic position, alleles, and external identifiers (e.g., rsID from dbSNP).
                          It also provides external reference links to databases including the GWAS Catalog, gnomAD,
                          ClinVar, and dbSNP for extended exploration.
                        </p>

                        <p class="text-body-1 mb-4">
                          On the right-hand side of the Variant Profile card, the <b>Population Allele Frequencies</b>
                          section displays study-specific allele frequency ranges alongside allele frequencies from
                          reference populations (as annotated by VEP).
                        </p>

                        <p class="text-body-1 mb-4">
                          A navigation bar is provided to facilitate direct access to the major sections of the page:
                        </p>

                        <ul class="text-body-1 mb-4 pl-6">
                          <li>
                            <b>Predicted Genes</b>: Lists the genes predicted to be affected by the variant based on VEP
                            annotations.
                            Genes are ordered by predicted impact (high, moderate, low, modifier), followed by
                            consequence
                            type and genomic distance from the variant.
                          </li>

                          <li>
                            <b>Predicted Transcript Consequences</b>: Summarizes transcript-level annotations from VEP
                            for
                            all transcripts impacted by the variant.
                            Information includes transcript ID, biotype, gene symbol, predicted impact, consequence
                            type,
                            and additional functional attributes.
                            The table is both searchable and sortable to support efficient data exploration. For more
                            information on the impact and consequence, please refer
                            to the official Ensembl <a
                              href="https://www.ensembl.org/info/genome/variation/prediction/predicted_data.html"
                              target="_blank" rel="noopener">page</a>.
                          </li>

                          <li>
                            <b>Predicted Regulatory Consequences</b>: Provides VEP-derived annotations for regulatory
                            regions potentially affected by the variant, including element type and predicted impact.
                          </li>

                          <li>
                            <b>Predicted Motif Consequences</b>: Summarizes the predicted effects of the variant on
                            transcription factor binding motifs, as annotated by VEP.
                          </li>
                        </ul>

                        <p class="text-body-1 mb-4">
                          Buttons that appear grayed out indicate the absence of predicted consequences of the
                          corresponding
                          type for the selected variant.
                        </p>

                        <p class="text-body-1 mb-4">
                          The <b>PheWAS</b> Results panel provides an overview of the variant-specific association
                          statistics across all available traits.
                          For a given variant, the panel displays the corresponding p-values on a −log₁₀ scale, allowing
                          users to assess the breadth
                          and strength of associations across diverse phenotypes. The visualization is powered by
                          LocusZoom,
                          which enables intuitive
                          exploration of the results. Users can refine the displayed associations using the built-in
                          filters
                          — either by p-value
                          threshold or by trait category — to focus on relevant subsets of traits. This interactive
                          filtering facilitates the
                          identification of trait groups or individual phenotypes that show the most significant
                          associations for the selected
                          variant. Filtering can be easily being reverted to the default view by clicking the "Reset"
                          button.
                        </p>

                        <p class="text-body-1 mb-4">
                          The PheWAS plot is complemented by a <b>detailed table</b> summarizing all or a subset of
                          association results for the selected variant across traits,
                          allowing direct navigation to the corresponding trait-specific pages.
                        </p>
                      </v-col>

                      <!-- Image column -->
                      <v-col cols="12" md="6">
                        <v-img
                            :src="variantpageimg1"
                            alt="Variant Page Tutorial"
                            max-width="100%"
                            class="rounded-lg mb-10"
                            contain
                        />

                        <v-img
                            :src="variantpageimg2"
                            alt="Variant Page Tutorial 2"
                            max-width="100%"
                            class="rounded-lg"
                            contain
                        />
                      </v-col>
                    </v-row>
                  </v-card-text>
                </div>
              </v-expand-transition>

            </v-card>
          </v-col>
        </v-row>

        <v-row class="my-4">
          <v-col cols="12">
            <v-card outlined>
              <v-toolbar color="primary-darken-1" density="compact" @click="expanded_trait = !expanded_trait">
                <v-toolbar-title class="d-flex align-center gap-2">
                  <v-icon icon="mdi-numeric-4-circle"/>
                  Trait Page
                </v-toolbar-title>

                <v-btn
                    size="small"
                    variant="text"
                    icon="mdi-chevron-down"
                    :class="{ 'rotate-180': expanded_trait }"
                ></v-btn>
              </v-toolbar>

              <v-expand-transition>
                <div v-show="expanded_trait">
                  <v-divider></v-divider>
                  <v-card-text>
                    <div class="d-flex align-start flex-nowrap" style="gap: 24px;">
                      <!-- Text -->
                      <div style="flex: 1;">
                        <p class="text-body-1 mb-4">
                          The <b>Trait page</b> provides detailed GWAS results for a specific phenotype.
                          At the top, similar to the Variant page, the Trait Profile card summarizes essential
                          information about the trait, and directly below, users can navigate to different analytical
                          sections of the page for in-depth exploration of the association data:
                        </p>

                        <ul class="text-body-1 mb-4 pl-6">
                          <li>
                            <b>Manhattan plot</b>: Displays the −log₁₀(p-value) results across all chromosomes,
                            highlighting genomic regions with significant signals. This plot is generated using code
                            from LocusZoom and PheWeb.
                          </li>
                          <li>
                            <b>GWAS results table</b>: Provides multiple filtering and exploration options to examine
                            the GWAS results for the selected trait in greater detail. Further information on these
                            features is provided below.
                          </li>
                          <li>
                            <b>QQ plot</b>: The QQ plot compares the distribution of observed p-values to the expected
                            distribution under the null hypothesis. It's used to check the overall quality of the GWAS
                            results and to identify potential inflation of test statistics. This has also been created
                            using code from PheWeb and LocusZoom.
                          </li>
                        </ul>

                        <p class="text-body-1 mb-4">
                          Multiple filtering options are available to refine the GWAS results displayed in the table:
                        </p>

                        <ul class="text-body-1 mb-4 pl-6">
                          <li>
                            <b>All Top Loci</b>: This default view displays all top loci identified for the trait. For the definition of top loci, please refer to the documentation of the Top Hits table.
                          </li>

                          <li>
                            <b>By P-Value</b>: Allows users to filter results based on a specified p-value threshold, enabling focus on the most statistically significant associations. A maximum of 10,000 results can be displayed at once.
                          </li>

                          <li>
                            <b>By SNP ID</b>: Enables searching for specific variants using their SNP ID (rsID) to quickly locate their association results within the table. In addition, a neighboring region around the specified SNP can be specified to explore nearby associations, and a p-value threshold can be specified.
                          </li>

                          <li>
                            <b>By Chromosome Range</b>: Allows users to filter results within a specific chromosomal range by specifying the chromosome number and start/end positions. A p-value threshold can also be specified.
                          </li>
                        </ul>

                        <p class="text-body-1 mb-4">
                          The current filter mode is always indicated above the table to ensure clarity on the displayed
                          results.
                        </p>

                      </div>

                      <!-- Image -->
                      <v-img
                          :src="traitpageimg"
                          alt="Trait Page Tutorial"
                          width="1%"
                          class="rounded-lg flex-shrink-0"
                          contain
                      />
                    </div>
                  </v-card-text>
                </div>
              </v-expand-transition>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col class="d-flex justify-center">
            <v-divider class="my-2" thickness="2"></v-divider>
          </v-col>
        </v-row>

        <v-row class="my-4">
          <v-col cols="12">
            <v-card outlined>
              <v-toolbar color="primary-darken-1" density="compact" @click="expanded_preprocessing = !expanded_preprocessing">
                <v-toolbar-title class="d-flex align-center gap-2">
                  <v-icon icon="mdi-laptop"/>
                  Preprocessing Workflow
                </v-toolbar-title>

                <v-btn
                    size="small"
                    variant="text"
                    icon="mdi-chevron-down"
                    :class="{ 'rotate-180': expanded_preprocessing }"
                ></v-btn>
              </v-toolbar>

              <v-expand-transition>
                <div v-show="expanded_preprocessing ">
                  <v-divider></v-divider>
                  <v-card-text>
                    <div class="d-flex align-start flex-nowrap" style="gap: 24px;">
                      <!-- Text -->
                      <!-- Text -->
<div style="flex: 1;">
  <p class="text-body-1 mb-4">
    The <b>data preprocessing workflow</b>, implemented in <b>Nextflow</b>, defines the sequence of steps required to prepare the raw GWAS summary statistics for integration into this web application.
    Importantly, this workflow focuses solely on reformatting and indexing the data for efficient querying and visualization—while the original association results (e.g., p-values, effect sizes, and standard errors) remain unaltered.
  </p>

  <p class="text-body-1 mb-4">
    The preprocessing comprises the following main stages:
  </p>

  <ul class="text-body-1 mb-4 pl-6">
    <li>
      <b>Harmonization</b>: Because GWAS summary statistics are produced by various tools using different formats, the first step involves harmonizing the data into a unified structure.
      This includes standardizing column names and data types, verifying field completeness, and ensuring compatibility for downstream analyses.
    </li>

    <li>
      <b>Variant Reference File</b>: A comprehensive VCF file is created that contains all unique variants across traits.
      This design ensures that variant annotation must be performed only once, rather than for each individual GWAS file.
    </li>

    <li>
      <b>VEP Annotation</b>: The variant reference file is annotated using the Ensembl Variant Effect Predictor (VEP),
      resulting in an annotated VCF that stores all relevant variant-level functional information.
    </li>

    <li>
      <b>Variant-ID LMDB</b>: To avoid repeatedly inserting rsIDs into each GWAS file, an LMDB database is built that maps variant identifiers (chr_pos_ref/alt) to rsIDs.
      This enables rapid lookup of rsIDs during downstream analyses without altering the harmonized data.
    </li>

    <li>
      <b>PheWAS Preparation</b>: The harmonized GWAS files are transformed into a <i>variant-centric</i> structure to support efficient PheWAS queries.
      Instead of storing data per trait, each variant-centric file aggregates all trait-specific association results for that variant,
      allowing fast retrieval of PheWAS data for any given locus.
    </li>

    <li>
      <b>Manhattan & QQ Data</b>: For each trait, precomputed data for Manhattan and QQ plots is generated to enable fast rendering and interactive visualization on the Trait page.
    </li>

    <li>
      <b>Top Hits Extraction</b>: Once the Manhattan JSON files are produced, top variants are extracted according to predefined criteria (as detailed in the Top Hits section)
      to populate the Top Hits table used throughout the web interface.
    </li>
  </ul>
</div><!---->

                      <!-- Image -->
                      <v-img
                          :src="preprocessingimag"
                          alt="Preprocessing Tutorial"
                          width="1%"
                          class="rounded-lg flex-shrink-0"
                          contain
                      />
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
import homepageimg from "@/assets/figures/Home_Page_Tutorial.png"
import variantpageimg1 from "@/assets/figures/Variant_Page_Tutorial_1.png"
import variantpageimg2 from "@/assets/figures/Variant_Page_Tutorial_2.png"
import traitpageimg from "@/assets/figures/Trait_Page_Tutorial.png"
import preprocessingimag from "@/assets/figures/DyHealthNetLight_Preprocessing.png"
import {GENOME_BUILD} from "@/config.js"

export default {
  name: 'Documentation',
  components: {},
  data() {
    return {
      homepageimg,
      variantpageimg1,
      variantpageimg2,
      traitpageimg,
      preprocessingimag,
      GENOME_BUILD: GENOME_BUILD,
      expanded_variant: false,
      expanded_home: true,
      expanded_tophits: false,
      expanded_trait: false,
      expanded_preprocessing: false,
    };
  },
}
</script>


<style>
.rotate-180 {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}
</style>