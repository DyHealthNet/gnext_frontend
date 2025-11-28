<template>
  <v-container>
    <v-row justify="space-around" align="stretch">
      <v-col xs="12" sm="12" md="12" :lg="hasExternalIds ? 8 : 12">
        <h3><strong>Location</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ this.location }}</h3>
        <h3><strong>Reference Allele</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ this.refAllele }}</h3>
        <h3><strong>Alternate Allele</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ this.altAllele }}</h3>
        <h3><strong>Most Severe Consequence</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ this.mostSevereConsequence }}&nbsp;&nbsp;<VariantImpactTag
            :impact="mostSevereConsequenceImpact"/>
        </h3>
        <h3 v-if="hasExternalIds"><strong>External IDs</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ this.externalIds }}</h3>
      </v-col>

      <v-col v-if="hasExternalIds" xs="12" sm="12" md="12" lg="4">
        <h3><strong>External References</strong></h3>
        <v-row dense>
          <v-col
              v-for="(url, label) in links"
              :key="label"
              cols="auto"
              class="mb-2"
          >
            <LinkButton :title="label" :url="url" :disabled="!rsId"/>
          </v-col>
        </v-row>
      </v-col>

    </v-row>
  </v-container>
</template>


<script>
import LinkButton from "@/components/LinkButton.vue";
import VariantImpactTag from "@/components/variant/VariantImpactTag.vue";
import {GENOME_BUILD, HG_BUILD_NUMBER} from "@/config.js";


export default {
  name: "VariantProfile",
  components: {LinkButton, VariantImpactTag},
  props: {
    variantId: {
      type: String,
      required: true,
    },
    externalIds: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    refAllele: {
      type: String,
      required: true,
    },
    altAllele: {
      type: String,
      required: true,
    },
    mostSevereConsequence: {
      type: String,
      required: true,
    },
    mostSevereConsequenceImpact: {
      type: String,
      required: true,
    },
  },

  computed: {
    hasExternalIds() {
      // Check if externalIds is not empty, not [""], and not just whitespace
      if (!this.externalIds) return false;
      const cleaned = this.externalIds.trim();
      return cleaned !== '' && cleaned !== '[""]' && cleaned !== '[]';
    },

    rsId(){
      if (!this.hasExternalIds) return null;
      const match = this.externalIds.match(/rs\d+/);
      return match ? match[0] : null;
    },

    links() {
      // from external IDs extract first rsID -> TODO: check if this is the correct way to do it
      if(!this.rsId) return {};
      const id = this.rsId;
      // retrieve genome build to specify version for gnomAD
      const gnomADVersion = GENOME_BUILD === "GRCh37" ? "gnomad_r2_1" : "gnomad_r4";
      // replace _ and / by - for gnomAD URL
      const gnomADId = this.variantId.replace(/_/g, '-').replace(/\//g, '-');
      const chr = this.location.split(':')[0];
      const pos = this.location.split(':')[1];
      return {
        "GWAS_Catalog": `https://www.ebi.ac.uk/gwas/variants/${id}`,
        "dbSNP": `https://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?searchType=adhoc_search&type=rs&rs=${id}`,
        "Citations": `https://www.ensembl.org/Homo_sapiens/Variation/Citations?v=${id}`,
        "Ensembl": `https://www.ensembl.org/Homo_sapiens/Variation/Explore?v=${id}`,
        "gnomAD": `https://gnomad.broadinstitute.org/variant/${gnomADId}?dataset=${gnomADVersion}`,
        "UCSC": `https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg${HG_BUILD_NUMBER}&highlight=hg${HG_BUILD_NUMBER}.chr${chr}%3A${pos}-${pos}&position=chr${chr}%3A${pos - 200000}-${pos + 200000}`

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