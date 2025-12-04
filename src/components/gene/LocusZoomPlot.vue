<template>
  <div ref="locusZoomContainer" id="lz-plot" style="width: 100%; min-height: 500px;"></div>
</template>

<script setup>
import {ref, watch, onMounted, onBeforeUnmount, nextTick} from "vue";
import LocusZoom from "locuszoom";
import "locuszoom/dist/locuszoom.css";
import {API_BASE_URL, GENOME_BUILD} from "@/config.js";

const props = defineProps({
  geneChr: {type: String, required: true},
  geneStart: {type: Number, required: true},
  geneEnd: {type: Number, required: true},
  geneStrand: {type: String, required: true},
  traitId: {type: String, default: null},
  ldRefVariant: {type: String, default: null} // LD reference variant ID (rsID, chr:pos, etc.)
});

const locusZoomContainer = ref(null);
const plot = ref(null);

// window size in kb around gene
const config = ref({window_up: 100, window_down: 100});

/**
 * Register toolbar widget + custom association adapter
 */
const registerLocusZoomComponents = () => {
  // Simple move widget (left/right navigation)
  if (!LocusZoom.Widgets.has("move")) {
    LocusZoom.Widgets.extend("BaseWidget", "move", {
      update() {
        if (this.button) return this;
        this.button = new (LocusZoom.Widgets.get("_Button"))(this)
            .setColor(this.layout.color)
            .setHtml(this.layout.text)
            .setTitle(this.layout.title)
            .setOnclick(() => {
              const start = this.parent_plot.state.start;
              const end = this.parent_plot.state.end;
              const shift = Math.floor(end - start) * this.layout.direction;
              this.parent_plot.applyState({
                chr: this.parent_plot.state.chr,
                start: start + shift,
                end: end + shift
              });
            });
        this.button.show();
        return this.update();
      }
    });
  }

  // Use AssociationLZ as base so the built-in LD wiring works
  const AssociationLZ = LocusZoom.Adapters.get("AssociationLZ");

  class GeneAssociationAdapter extends AssociationLZ {
    constructor(config) {
      super(config);
      this._url = config.url;
      this._trait_id = config.trait_id;
      this._gene_strand = config.gene_strand;
    }

    // Build URL for your backend
    _getURL(request_options) {
      const {chr, start, end} = request_options;

      const params = new URLSearchParams({
        trait_id: this._trait_id,
        chr,
        start,
        end,
        gene_strand: this._gene_strand
      });

      return `${this._url}?${params.toString()}`;
    }

    // Normalize backend response into a flat array of records
    // LocusZoom calls this method
    normalizeResponse(raw) {
      let records;

      if (raw && Array.isArray(raw.data)) {
        records = raw.data;
      } else if (Array.isArray(raw)) {
        records = raw;
      } else {
        records = [];
      }

      // Let our annotation hook fill in canonical fields
      records = this._annotateRecords(records);

      if (records.length) {
        console.log("LZ normalized example:", records.slice(0, 3));
      } else {
        console.log("LZ: no records returned from API");
      }

      return records;
    }

    // Ensure required fields exist: chrom, position, log_pvalue, variant
    // AssociationLZ expects these to be present
    _annotateRecords(records) {
      records.forEach(item => {
        // chrom: map whatever your backend uses to "chrom"
        if (item.chrom == null) {
          item.chrom = item.chr ?? item.chromosome ?? null;
        }
        
        // Ensure position exists
        if (item.position == null && item.pos != null) {
          item.position = item.pos;
        }
        
        // Ensure log_pvalue exists
        if (item.log_pvalue == null && item.pvalue != null) {
          item.log_pvalue = -Math.log10(item.pvalue);
        }
        
        // Ensure variant exists (typically in format chr:pos_ref/alt)
        if (item.variant == null) {
          const chr = item.chrom || item.chr;
          const pos = item.position || item.pos;
          const ref = item.ref || item.reference;
          const alt = item.alt || item.alternate;
          if (chr && pos) {
            item.variant = ref && alt ? `${chr}:${pos}_${ref}/${alt}` : `${chr}:${pos}`;
          }
        }
      });

      return records;
    }
  }

  // Register adapter once
  const existing = LocusZoom.Adapters.list();
  if (!existing.includes("GeneAssociationAdapter")) {
    LocusZoom.Adapters.add("GeneAssociationAdapter", GeneAssociationAdapter);
  }
};

/**
 * Define data sources for association and LD
 */
const createDataSources = () => {
  const remoteBase = "https://portaldev.sph.umich.edu/api/v1/";
  
  return new LocusZoom.DataSources()
      .add("assoc", [
        "GeneAssociationAdapter",
        {
          url: `${API_BASE_URL}/gene_get_locuszoom_data/`,
          trait_id: props.traitId,
          gene_strand: props.geneStrand
        }
      ])
      .add("ld", [
        "LDServer",
        {
          url: "https://services.locuszoom.org/ld/",
          source: "1000G",
          build: GENOME_BUILD,
          population: "ALL"
        }
      ])
      .add("gene", [
        "GeneLZ",
        {
          url: remoteBase + "annotation/genes/",
          params: { build: GENOME_BUILD }
        }
      ])
};

/**
 * Layout using built-in association_pvalues (which wires ld(assoc) internally)
 */
const createLayout = () => {
  let regionStart;
  let regionEnd;

  if (props.geneStrand === "+") {
    regionStart = Math.max(0, props.geneStart - config.value.window_up * 1e3);
    regionEnd   = props.geneEnd + config.value.window_down * 1e3;
  } else {
    regionStart = Math.max(0, props.geneStart - config.value.window_down * 1e3);
    regionEnd   = props.geneEnd + config.value.window_up * 1e3;
  }

  console.log(`LocusZoom region: chr${props.geneChr}:${regionStart}-${regionEnd} (strand: ${props.geneStrand})`);

  const significanceLayer = LocusZoom.Layouts.get("data_layer", "significance", {
    namespace: { assoc: "assoc" }
  });

  const assocLayer = LocusZoom.Layouts.get("data_layer", "association_pvalues", {
    namespace: { assoc: "assoc", ld: "ld" },
    behaviors: {
      onmouseover: [{ action: "set", status: "highlighted" }],
      onmouseout: [{ action: "unset", status: "highlighted" }],
      onclick: [{ action: "toggle", status: "selected", exclusive: true }]
    }
  });

  // Override the tooltip after getting the layout
  assocLayer.tooltip = {
    closable: true,
    show: { or: ["highlighted", "selected"] },
    hide: { and: ["unhighlighted", "unselected"] },
    html: [
      "<strong><a href=\"/variant/{{assoc:id|urlencode}}\">{{assoc:id|htmlescape}}</a></strong><br>",
      "P Value: <strong>{{assoc:log_pvalue|logtoscinotation|htmlescape}}</strong><br>",
      "Log P Value: <strong>{{assoc:log_pvalue|htmlescape}}</strong><br>",
      "Ref. Allele: <strong>{{assoc:ref_allele|htmlescape}}</strong><br>",
      "Alt. Allele: <strong>{{assoc:alt_allele|htmlescape}}</strong><br>",
  
      "{{#if ld:isrefvar}}",
      "<strong>LD Reference Variant</strong><br>",
      "{{#else}}",
      "{{#if ld:state}}",
      "LD (r<sup>2</sup>): <strong>{{ld:state|htmlescape}}</strong><br>",
      "{{/if}}",
      "<a href=\"javascript:void(0);\" onclick=\"var data = this.parentNode.__data__; data.getDataLayer().makeLDReference(data);\">Make LD Reference</a><br>",
      "{{/if}}"
    ].join("")
  };

  // Create genes panel - use basic genes layout without constraints
  const genesPanel = {
    id: "genes",
    height: 225,
    min_height: 112.5,
    margin: { top: 20, right: 50, bottom: 20, left: 50 },
    axes: {
      x: {
        extent: "state",
        render: false
      }
    },
    interaction: {
      drag_background_to_pan: true,
      scroll_to_zoom: true,
      x_linked: true
    },
    data_layers: [
      {
        namespace: { gene: "gene" },
        id: "genes",
        type: "genes",
        fields: [
          "{{namespace[gene]}}all",
          "{{namespace[gene]}}gene_id",
          "{{namespace[gene]}}gene_name"
        ],
        id_field: "gene_id",
        behaviors: {
          onmouseover: [
            { action: "set", status: "highlighted" }
          ],
          onmouseout: [
            { action: "unset", status: "highlighted" }
          ],
          onclick: [
            { action: "toggle", status: "selected", exclusive: true }
          ]
        },
        tooltip: {
          closable: true,
          show: { or: ["highlighted", "selected"] },
          hide: { and: ["unhighlighted", "unselected"] },
          html: (
            "<h4><strong><i>{{gene_name}}</i></strong></h4>" +
            "<div>Gene ID: <strong>{{gene_id}}</strong></div>" +
            "<div>Transcript ID: <strong>{{transcript_id}}</strong></div>" +
            "<div style=\"clear: both;\"></div>" +
            "<table width=\"100%\"><tr><td style=\"text-align: right;\">" +
            "<a href=\"http://gnomad.broadinstitute.org/gene/{{gene_id}}\" target=\"_new\">More data on gnomAD/ExAC</a> " +
            "and <a href=\"http://bravo.sph.umich.edu/freeze5/hg38/gene/{{gene_id}}\" target=\"_new\">Bravo</a>" +
            "</td></tr></table>"
          )
        }
      }
    ]
  };

  return {
    state: {
      chr: props.geneChr,
      start: regionStart,
      end: regionEnd,
      genome_build: GENOME_BUILD
    },
    width: 800,
    responsive_resize: true,
    min_region_scale: 20_000,
    max_region_scale: 500_000,
    toolbar: {
      widgets: [
        { type: "move", text: "<<", title: "Shift 3/4 left", direction: -0.75, group_position: "start" },
        { type: "move", text: "<",  title: "Shift 1/4 left", direction: -0.25, group_position: "middle" },
        { type: "zoom_region", button_html: "z+", title: "Zoom in 2x", step: -0.5, group_position: "middle" },
        { type: "zoom_region", button_html: "z-", title: "Zoom out 2x", step:  1.0, group_position: "middle" },
        { type: "move", text: ">",  title: "Shift 1/4 right", direction:  0.25, group_position: "middle" },
        { type: "move", text: ">>", title: "Shift 3/4 right", direction:  0.75, group_position: "end" },
        { type: "download",     position: "right" },
        { type: "download_png", position: "right" },
        LocusZoom.Layouts.get("toolbar_widgets", "ldlz2_pop_selector")
      ]
    },
    panels: [
      {
        id: "association",
        height: 400,
        margin: { top: 35, right: 50, bottom: 40, left: 50 },
        axes: {
          x: {
            label: `Chromosome ${props.geneChr} (Mb)`,
            label_offset: 32,
            tick_format: "region",
            extent: "state"
          },
          y1: {
            label: "-log10 p-value",
            label_offset: 28
          }
        },
        data_layers: [significanceLayer, assocLayer]
      },
      genesPanel
    ]
  };
};

/**
 * Convert variant ID from table format to LD server format
 * @param {string} variantId - Variant in format like "chr_pos_ref/alt" 
 * @returns {string} - Variant in format like "chr:pos_ref/alt"
 */
const convertToLDServerFormat = (variantId) => {
  if (!variantId) return null;
  
  // If already in LD server format (contains colon), return as-is
  if (variantId.includes(':')) {
    return variantId;
  }
  
  // Convert table format: chr_pos_ref/alt -> chr:pos_ref/alt
  // Example: "1_12345678_A/T" -> "1:12345678_A/T"
  const match = variantId.match(/^(\d+)_(\d+)_(.+)$/);
  if (match) {
    const [, chr, pos, alleles] = match;
    return `${chr}:${pos}_${alleles}`;
  }
  
  // Convert coordinate-only format: chr_pos -> chr:pos
  const coordMatch = variantId.match(/^(\d+)_(\d+)$/);
  if (coordMatch) {
    const [, chr, pos] = coordMatch;
    return `${chr}:${pos}`;
  }
  
  // If no pattern matches, return original
  return variantId;
};

/**
 * Create / recreate plot
 */
const createPlot = async () => {
  // No trait selected or container not mounted yet
  if (!props.traitId || !locusZoomContainer.value) return;

  // Destroy previous plot (when switching trait or gene)
  if (plot.value) {
    plot.value.destroy();
    plot.value = null;
  }

  await nextTick();

  const dataSources = createDataSources();
  const layout = createLayout();

  try {
    plot.value = LocusZoom.populate("#lz-plot", dataSources, layout);
    
    // Convert variant ID to LD server format if needed
    if (props.ldRefVariant) {
      const ldServerVariant = convertToLDServerFormat(props.ldRefVariant);
      plot.value.state.ldrefvar = ldServerVariant;  // LDServer reads this
      console.log('Original variant:', props.ldRefVariant);
      console.log('LD server format:', ldServerVariant);
    }
    
    plot.value.state.genome_build = GENOME_BUILD;
    plot.value.refresh()
  } catch (error) {
    console.error("LocusZoom error", error);
  }
};

onMounted(async () => {
  registerLocusZoomComponents();
  if (props.traitId) {
    await createPlot();
  }
});

onBeforeUnmount(() => {
  if (plot.value) {
    plot.value.destroy();
    plot.value = null;
  }
});

// Rebuild plot when trait changes
watch(
    () => props.traitId,
    async newVal => {
      if (newVal) {
        await createPlot();
      } else if (plot.value) {
        plot.value.destroy();
        plot.value = null;
      }
    }
);

// Rebuild plot when gene region changes
watch(
    () => [props.geneChr, props.geneStart, props.geneEnd, props.geneStrand],
    async () => {
      if (props.traitId) {
        await createPlot();
      }
    }
);

/**
 * Set LD reference variant programmatically
 * @param {string} variantId - Variant identifier (rsID, chr:pos, or variant field value)
 */
const setLDReference = (variantId) => {
  if (!plot.value) {
    console.warn('LocusZoom plot not initialized');
    return;
  }
  
  // Convert to LD server format
  const ldServerVariant = convertToLDServerFormat(variantId);
  console.log('Setting LD reference - Original:', variantId, 'LD Server format:', ldServerVariant);
  
  // Set in plot state for LD server
  plot.value.state.ldrefvar = ldServerVariant;
  plot.value.refresh();
  
  const assocPanel = plot.value.panels.association;
  if (!assocPanel) {
    console.warn('Association panel not found');
    return;
  }
  
  const assocLayer = assocPanel.data_layers.association_pvalues;
  if (!assocLayer) {
    console.warn('Association layer not found');
    return;
  }
  
  // Find variant in the data by different possible identifiers
  const variant = assocLayer.data.find(d => 
    d.variant === variantId || 
    d.id === variantId ||
    d.rsid === variantId ||
    `${d.chrom}:${d.position}` === variantId ||
    `${d.chr}:${d.pos}` === variantId
  );
  
  if (variant) {
    assocLayer.makeLDReference(variant);
    console.log('LD reference set to:', variantId);
  } else {
    console.warn('Variant not found in data:', variantId);
  }
};

// Expose plot handle and methods
defineExpose({plot, refreshPlot: createPlot, setLDReference});
</script>

<style scoped>
#lz-plot :deep(.lz-toolbar) {
  height: 50px !important;
}

#lz-plot :deep(.lz-toolbar-button) {
  height: 40px !important;
  line-height: 40px !important;
  font-size: 14px !important;
}

::v-deep(svg.lz-locuszoom) {
  background-color: transparent !important;
}
</style>