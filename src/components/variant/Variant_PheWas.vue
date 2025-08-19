<template>
  <v-container>
    <span>GWAS summary statistics of {{ variantId }} over all phenotypes.</span>
  </v-container>

  <v-container>
    <div id="phewas_plot" style="width: 100%; height: 500px;"></div>
  </v-container>

  <v-container>
    <DataTable :value="rows"
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
            v-if="col.field !== 'trait_label'"
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
            <a :href="`/trait/${slotProps.data.trait_label}`" class="text-blue-600 hover:underline">
              {{ slotProps.data.trait_label }}
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
import {API_BASE_URL} from "@/config.js";
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
    }
  },

  data: () => ({
    headers: ["id", "trait_label", "trait_group", "log_pvalue", "se", "beta"],
    rows: [],
    menuVisible: false,
    sortField: "log_pvalue",
    sortOrder: -1,
    filters: {
      global: {value: null, matchMode: FilterMatchMode.CONTAINS}
    },
    downloadItems: [
      {
        label: 'Download as CSV',
        icon: 'pi pi-file',
        command: () => this.download('csv')
      },
      {
        label: 'Download as JSON',
        icon: 'pi pi-file',
        command: () => this.download('json')
      },
      {
        label: 'Download as TXT',
        icon: 'pi pi-file',
        command: () => this.download('txt')
      }
    ]
  }),

  methods: {
    onMenuClick(event) {
      this.$refs.menuRef.toggle(event);

    },

    onSort(event) {
      this.sortField = event.sortField;
      this.sortOrder = event.sortOrder;
    },

    async renderPheWasPlot() {
      try {
        const container = document.getElementById("phewas_plot");
        if (!container) {
          return;
        }

        // Clear previous plot (important on route change)
        container.innerHTML = "";

        var dataSources = new LocusZoom.DataSources();

        var apiBase = `${API_BASE_URL}/variant_phewas/`;
        dataSources
            .add("phewas", ["PheWASLZ", {
              url: apiBase,
              build: ["GRCh37"]
            }])

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
              margin: {bottom: 200},
              axes: {
                x: {
                  ticks: {
                    transform: ""
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
          "<strong>trait:</strong> {{phewas:trait_label|htmlescape}}<br>",
          "<strong>trait Category:</strong> {{phewas:trait_group|htmlescape}}<br>",
          "<strong>P-value:</strong> {{phewas:log_pvalue|logtoscinotation|htmlescape}}",
          "{{#if phewas:beta|is_numeric}}<br><strong>&beta;:</strong> {{phewas:beta|scinotation|htmlescape}}{{/if}}",
          "{{#if phewas:se|is_numeric}}<br><strong>SE (&beta;):</strong> {{phewas:se|scinotation|htmlescape}}{{/if}}",
          "{{#if phewas:study}}",
          "<br><br></b><strong>Study:</strong> {{phewas:study|htmlescape}}",
          "{{/if}}",
          "{{#if phewas:pmid}} {{#if phewas:description}}",
          '<br><strong>Description:</strong> <a target=_blank href="https://www.ncbi.nlm.nih.gov/pubmed/?term={{phewas:pmid|htmlescape}}">{{phewas:description|htmlescape}}</a>',
          "{{/if}} {{/if}}"
        ].join(""));

        // Generate the plot
        LocusZoom.populate("#phewas_plot", dataSources, layout);

      } catch (err) {
        console.error("Failed to render plot: " + err);
      }
    },

    async renderPheWasTable() {
      const query = encodeURIComponent(`variant eq '${this.variantId}'`);
      const res = await fetch(`${API_BASE_URL}/variant_phewas/?filter=${query}`);
      const json = await res.json();
      this.rows = json.data;
    }
  },

  mounted() {
    this.renderPheWasPlot();
    this.renderPheWasTable();
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

    variantId: {
      handler() {
        this.renderPheWasPlot();
        this.renderPheWasTable();
      },
      immediate: true
    }
  },
}


</script>

<style>
.v-data-table .v-data-table-header tr th {
  font-size: 50px !important;
  font-weight: bold !important;
}
a, .green {
  color: rgb(var(--v-theme-primary)) !important;
}
</style>


