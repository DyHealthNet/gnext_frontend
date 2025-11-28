<template>
  <v-container>
    <v-row>
      <v-col xs="12" sm="12" md="12" lg="4">
        <h3><strong>Gene ID</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{geneId}}</h3>
        <h3><strong>Symbol</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{geneSymbol}}</h3>
        <h3><strong>Position</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Chr {{geneChr}}: {{geneStart}} - {{geneEnd}} (Strand {{geneStrand}})</h3>
      </v-col>

      <v-col xs="12" sm="12" md="12" lg="8">
        <h3><strong>External References</strong></h3>
        <v-row dense>
          <v-col
              v-for="(url, label) in links"
              :key="label"
              cols="auto"
              class="mb-2"
          >
            <LinkButton :title="label" :url="url" :disabled="!geneSymbol"/>
          </v-col>
        </v-row>
      </v-col>

    </v-row>
  </v-container>
</template>


<script>

import LinkButton from "@/components/LinkButton.vue";
import {GENOME_BUILD, HG_BUILD_NUMBER} from "@/config.js";


export default {
  name: "TraitProfile",
  components: {LinkButton},
  props: {
    geneId: {
      type: String,
      required: true,
    },
    geneSymbol: {
      type: String,
      required: true,
    },
    geneChr: {
      type: String,
      required: true,
    },
    geneStart: {
      type: Number,
      required: true,
    },
    geneEnd: {
      type: Number,
      required: false
    },
    geneStrand: {
      type: String,
      required: false
    }
  },

  computed: {
    links() {
      if(!this.geneSymbol) return {};
      const ncbiGeneUrl = `https://www.ncbi.nlm.nih.gov/gene/?term=${this.geneSymbol}`
      const ensemblGeneUrl = `https://www.ensembl.org/Homo_sapiens/Gene/Summary?g=${this.geneSymbol}`
      const opentargetGeneUrl = `https://platform.opentargets.org/search?q=${this.geneSymbol}&page=1`
      const geneCardsUrl = `https://www.genecards.org/cgi-bin/carddisp.pl?gene=${this.geneSymbol}`
      const gwasCatalogUrl = `https://www.ebi.ac.uk/gwas/genes/${this.geneSymbol}`
      const gnomadUrl = `https://gnomad.broadinstitute.org/gene/${this.geneSymbol}?dataset=gnomad_r4`
      const gtExUrl = `https://www.gtexportal.org/home/gene/${this.geneSymbol}`
      return {
        "NCBI": ncbiGeneUrl,
        "Ensembl": ensemblGeneUrl,
        "OpenTargets": opentargetGeneUrl,
        "Gene Cards": geneCardsUrl,
        "GWAS Catalog": gwasCatalogUrl,
        "gnomAD v4": gnomadUrl,
        "GTEx": gtExUrl
      }
    }
  }

}
</script>

<style scoped>
.grid-three {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
</style>