<template>
  <v-container>
    <span>GWAS summary statistics of {{ variantId }} over all phenotypes.</span>
  </v-container>

  <v-container>
    <div id="phewas_plot" style="width: 100%; height: 600px;"></div>
  </v-container>

  <v-container>
    <DataTable
        :value="rows"
        paginator
        :rows="5"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        tableStyle="min-width: 50rem"
        :customSort="true"
        :sortField="sortField"
        :sortOrder="sortOrder"
        @sort="onSort"
        filterDisplay="menu"
        :filters="filters"
        :globalFilterFields="['id', 'trait_label', 'trait_group']"
        paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink PaginatorEnd"
        currentPageReportTemplate="{first} to {last} of {totalRecords}">
      <template #header>
        <v-row class="align-center mb-1 mt-1">
          <IconField>
            <InputIcon>
              <i class="pi pi-search"/>
            </InputIcon>
            <InputText v-model="filters['global'].value" placeholder="Keyword Search"/>
          </IconField>
        </v-row>
      </template>
      <template #empty> Nothing found.</template>
      <template #loading> Loading data. Please wait.</template>
      <template #paginatorend>
        <div @mouseenter="menuVisible = true" @mouseleave="menuVisible = false" style="position: relative;">
          <Button
              type="button"
              icon="pi pi-download"
              class="p-button-text p-button-secondary"
              @click="onMenuClick"
              aria-haspopup="true"
              aria-controls="download_menu"
          />
          <Menu
              id="download_menu"
              ref="menuRef"
              :model="downloadItems"
              :popup="true"
              :visible="menuVisible"
          />
        </div>
      </template>
      <template v-for="col in columns" :key="col.field">
        <Column
            v-if="col.field !== 'id'"
            :field="col.field"
            :header="col.header"
            sortable
        />
        <Column
            v-else
            :field="col.field"
            :header="col.header"
            sortable
        >
          <template #body="slotProps">
            <a :href="`/trait/${slotProps.data.id}`" class="text-blue-600 hover:underline">
              {{ slotProps.data.id }}
            </a>
          </template>
        </Column>
      </template>
    </DataTable>
  </v-container>
</template>

<script>
import LocusZoom from "locuszoom";
import 'locuszoom/dist/locuszoom.css'
import {API_BASE_URL, GENOME_BUILD} from "@/config.js";
import {InputIcon, IconField, InputText, Column, DataTable, MultiSelect, Menu, Button} from "primevue";
import 'primeicons/primeicons.css'

// Define this at the top
const FilterMatchMode = {
  STARTS_WITH: 'startsWith',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'notContains',
  ENDS_WITH: 'endsWith',
  EQUALS: 'equals',
  NOT_EQUALS: 'notEquals',
  IN: 'in',
  LESS_THAN: 'lt',
  LESS_THAN_OR_EQUAL_TO: 'lte',
  GREATER_THAN: 'gt',
  GREATER_THAN_OR_EQUAL_TO: 'gte'
};

export default {
  name: "PheWas",
  components: {IconField, Button, InputIcon, DataTable, Column, InputText, Menu, MultiSelect},
  props: {
    variantId: {
      type: String,
      required: true,
    },
    traitMetrics: {
      type: Object,
      default: () => ({})
    }
  },

  data: () => ({
    headers: ["id", "trait_label", "trait_group", "log_pvalue", "pvalue", "beta", "stderr_beta", "alt_allele_freq"],
    menuVisible: false,
    sortField: "log_pvalue",
    sortOrder: -1,
    filters: {
      global: {value: null, matchMode: FilterMatchMode.CONTAINS}
    },
    downloadItems: [],
    columns: [], // also add columns here
  }),

  computed: {
    // Convert your dict -> array for the table
    rows() {
      // If traitMetrics is like { key: {...}, ... }
      // turn it into an array of objects
      if (!this.traitMetrics) return [];
      return Object.values(this.traitMetrics);
    }
  },
  methods: {
    onMenuClick(event) {
      this.$refs.menuRef.toggle(event);
    },

    onSort(event) {
      this.sortField = event.sortField;
      this.sortOrder = event.sortOrder;
    },

    async renderPheWasPlot() {
      if (!this.rows || !this.rows.length) return;

      const container = document.getElementById("phewas_plot");
      if (!container) return;
      container.innerHTML = "";

      // var dataSources = new LocusZoom.DataSources();
      //
      // var apiBase = `${API_BASE_URL}/variant_get_metrics/`;
      // dataSources
      //     .add("phewas", ["PheWASLZ", {
      //       url: apiBase,
      //       build: [GENOME_BUILD]
      //     }])

      var dataSources = new LocusZoom.DataSources().add("phewas", ["StaticSource", {data: this.rows}]);

      // Define the layout
      var mods = {
        variant: this.variantId,
      };

      var layout = {
        state: mods,
        dashboard: {
          components: [
            {type: "download", position: "right"},
            {type: "download_png", position: "right"},
          ],
        },
        responsive_resize: true,
        toolbar: LocusZoom.Layouts.get("toolbar", "standard_plot"),
        panels: [
          LocusZoom.Layouts.get("panel", "phewas", {
            height: 600,
            min_height: 400,
            margin: {bottom: 200},
            axes: {
              x: {
                ticks: {
                  transform: "translate(15,0) rotate(50)",
                }
              }
            }
          })
        ]
      }

      LocusZoom.Layouts.mutate_attrs(layout, '$.panels[?(@.tag === "phewas")].margin.top', 32);


      // Modify the tooltips for PheWAS result data layer points to contain more data. The fields in this sample
      //   tooltip are specific to the LZ-Portal API, and are not guaranteed to be in other PheWAS datasources.
      LocusZoom.Layouts.mutate_attrs(layout, '$..data_layers[?(@.tag === "phewas")].tooltip.html', [
        "<strong>Id:</strong> {{phewas:id|htmlescape}}<br>",
        "<strong>Description:</strong> {{phewas:trait_label|htmlescape}}<br>",
        "<strong>Category:</strong> {{phewas:trait_group|htmlescape}}<br>",
        "<strong>P-value:</strong> {{phewas:pvalue|scinotation|htmlescape}}",
        "{{#if phewas:beta|is_numeric}}<br><strong>&beta;:</strong> {{phewas:beta|scinotation|htmlescape}}{{/if}}",
        "{{#if phewas:stderr_beta|is_numeric}}<br><strong>SE (&beta;):</strong> {{phewas:stderr_beta|scinotation|htmlescape}}{{/if}}",
        "{{#if phewas:alt_allele_freq|is_numeric}}<br><strong>AF:</strong> {{phewas:alt_allele_freq|scinotation|htmlescape}}{{/if}}",
      ].join(""));

      // Generate the plot
      LocusZoom.populate("#phewas_plot", dataSources, layout);
    },

    download(format) {
      console.log("Downloading in format: " + format);
      const rows = this.rows;
      const variantId = this.variantId;
      let content = "";
      let mimeType = "text/plain";
      let filename = `variant_${variantId}_PhewasTable.${format}`;

      if (!rows.length) return;

      if (format === 'json') {
        content = JSON.stringify(rows, null, 2);
        mimeType = "application/json";
      } else if (format === 'csv') {
        const headers = Object.keys(rows[0]);
        const csvRows = [
          headers.join(','),
          ...rows.map(row => headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
        ];
        content = csvRows.join('\n');
        mimeType = "text/csv";
      } else if (format === 'txt') {
        const headers = Object.keys(rows[0]);
        const headerLine = headers.join('\t');
        const lines = rows.map(row =>
            headers.map(h => row[h] ?? '').join('\t')
        );
        content = [headerLine, ...lines].join('\n');
      }
      const blob = new Blob([content], {type: mimeType});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  },

  mounted() {
    this.renderPheWasPlot();
  },

  created() {
    this.downloadItems = [
      {
        label: 'Download as CSV',
        icon: 'pi pi-file',
        command: function () {
          this.download('csv')
        }.bind(this)
      },
      {
        label: 'Download as JSON',
        icon: 'pi pi-file',
        command: function () {
          this.download('json')
        }.bind(this)
      },
      {
        label: 'Download as TXT',
        icon: 'pi pi-file',
        command: function () {
          this.download('txt')
        }.bind(this)
      }
    ];
  },

  watch: {
    headers: {
      handler(newVal) {
        this.columns = newVal.map(col => ({
          header: col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          field: col
        }));
      },
      immediate: true
    },
    rows: {
      immediate: true,
      handler(newVal) {
        // render only when there is data
        if (Array.isArray(newVal) && newVal.length) {
          this.$nextTick(() => this.renderPheWasPlot());
        }
      }
    },
    variantId() {
      // variant changed -> clear plot and wait for new rows watcher to fire
      const el = document.getElementById("phewas_plot");
      if (el) el.innerHTML = "";
    }
  },
}


</script>

<style scoped>
.v-data-table .v-data-table-header tr th {
  font-size: 50px !important;
  font-weight: bold !important;
}

a, .green {
  color: rgb(var(--v-theme-primary-darken)) !important;
}

::v-deep(#phewas_plot svg.lz-locuszoom) {
  background-color: transparent !important;
}
</style>


