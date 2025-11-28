<template>
  <v-container>

    <div class="table-wrapper" style="overflow-x: auto;">
      <DataTable
          class="no-wrap-headers"
          :value="rows"
          paginator
          :rows="defaultTableRows"
          :rowsPerPageOptions="[5, 10, 20, 50, 100]"
          tableStyle="min-width: 50rem"
          :customSort="true"
          :sortField="sortField"
          :sortOrder="sortOrder"
          @sort="onSort"
          filterDisplay="menu"
          :filters="filters"
          :globalFilterFields="globalFilterFields"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink PaginatorEnd"
          currentPageReportTemplate="{first} to {last} of {totalRecords}"
          :selectionMode="selection ? 'single' : null"
          v-model:selection="selectedRow"
          @row-select="onRowSelect"
          @row-unselect="onRowUnselect"
          :scrollable="true">
        <template #header>
          <v-row class="align-center mb-1">
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
          <!-- Download Button outside scrollable table -->
          <div style="margin-left: auto; display: flex; align-items: center;">
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
              v-if="col.field !== 'variant_id' && col.field !== 'trait_id' && col.field !== 'top_variant' && col.field !== 'location' && col.field !== 'distance' && col.field !== 'nearest_genes'"
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
            <template #body="{ data, field }">
              <!-- Variant link -->
              <template v-if="field === 'variant_id'">
                <a :href="`/variant/${encodeURIComponent(data.variant_id)}`"
                   class="table-link hover:underline no-wrap">
                  {{ data.variant_id }}
                </a>
              </template>

              <template v-else-if="field === 'top_variant'">
                <a :href="`/variant/${encodeURIComponent(data.top_variant.split(' ')[0])}`"
                   class="table-link hover:underline no-wrap">
                  {{ data.top_variant }}
                </a>
              </template>

              <!-- Phenotype link -->
              <template v-else-if="field === 'trait_id'">
                <a :href="`/trait/${encodeURIComponent(data.trait_id)}`"
                   class="table-link hover:underline no-wrap">
                  {{ data.trait_id }} <!-- show description as text -->
                </a>
              </template>

              <!-- Location of Gene -->
              <template v-else-if="field === 'location'">
                <GeneLocationTag :location="data.location"/>
              </template>

              <template v-else-if="field === 'distance'">
                {{ data.distance }}
              </template>

              <!-- Nearest Genes -->
              <template v-else-if="field === 'nearest_genes'">
                <template v-if="data.nearest_genes && Object.keys(data.nearest_genes).length > 0">
                  <span v-for="(symbol, ensg_id, index) in data.nearest_genes" :key="ensg_id">
                    <a :href="`/gene/${encodeURIComponent(ensg_id)}?trait=${data.trait_id || selectedTrait}`" class="table-link hover:underline">
                      {{ symbol }}
                    </a>
                    <span v-if="index < Object.keys(data.nearest_genes).length - 1">, </span>
                  </span>
                </template>
                <span v-else>-</span>
              </template>

              <!-- Default rendering -->
              <template v-else>
                {{ data[field] }}
              </template>
            </template>
          </Column>
        </template>
      </DataTable>
    </div>

  </v-container>
</template>

<script>
import 'locuszoom/dist/locuszoom.css'
import {InputIcon, IconField, InputText, Column, DataTable, MultiSelect, Menu, Button, ProgressBar} from "primevue";
import 'primeicons/primeicons.css'
import GeneLocationTag from './gene/GeneLocationTag.vue';

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
  name: "TableSkeleton",
  components: {IconField, Button, InputIcon, DataTable, Column, InputText, Menu, MultiSelect, GeneLocationTag, ProgressBar},
  emits: ['row-selected', 'row-unselected'],
  props: {
    headers: {
      type: Array,
      required: false,
      default: () => ["variant_id", "chrom", "pos", "ref", "alt", "beta", "stderr_beta",
        "alt_allele_freq", "pvalue", "neg_log_pvalue", "location"]
    },
    rows: {
      type: Array,
      required: false,
      default: () => []   // ensure table has an array
    },
    globalFilterFields: {
      type: Array,
      default: () => ['rsid', 'chrom', 'pos']   // sensible defaults
    },
    downloadName: {
      type: String,
      required: false,
      default: "",
    },
    priorityOrder: {
      type: Array,
      required: false,  // sensible defaults
      default: () => []
    },
    defaultTableRows: {
      type: Number,
      required: false,  // sensible defaults
      default: 5
    },
    selection: {
      type: Boolean,
      required: false,
      default: false,
    },
    selectedTrait: {
      type: String,
      required: false,
      default: null,
    }
  },
  data: () => ({
    menuVisible: false,
    sortField: "Pvalue",
    sortOrder: 1,
    filters: {
      global: {value: null, matchMode: FilterMatchMode.CONTAINS}
    },
    selectedRow: null,
    
  }),
  computed: {

    downloadItems() {
      return [
        {label: 'Download as CSV', icon: 'pi pi-file', command: () => this.download('csv')},
        {label: 'Download as JSON', icon: 'pi pi-file', command: () => this.download('json')},
        {label: 'Download as TXT', icon: 'pi pi-file', command: () => this.download('txt')}
      ];
    },
    columns() {
      const sorted = [
        ...this.priorityOrder.filter(c => this.headers.includes(c)),
        ...this.headers.filter(c => !this.priorityOrder.includes(c))
      ];

      const sorted_renamed = sorted.map(col => ({
        field: col,
        header:
            col === 'neg_log_pvalue' ? '-Log10(Pvalue)' : col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }));
      return sorted_renamed;
    }
  },
  watch: {
    // Watch for changes in rows and selection prop
    rows: {
      handler(newRows) {
        if (this.selection && newRows.length > 0 && !this.selectedRow) {
          // Select first row if selection is enabled and no row is selected
          this.selectedRow = newRows[0];
          this.$emit('row-selected', newRows[0]);
        }
      },
      immediate: true
    },
    selection: {
      handler(newValue) {
        if (newValue && this.rows.length > 0 && !this.selectedRow) {
          // Select first row when selection is enabled
          this.selectedRow = this.rows[0];
          this.$emit('row-selected', this.rows[0]);
        }
      },
      immediate: true
    }
  },
  methods: {
    onRowSelect(event) {
      console.log('Selected row:', event.data);
      this.$emit('row-selected', event.data);
    },
    onRowUnselect(event) {
      console.log('Attempted to unselect row:', event.data);
      // Prevent unselection by immediately reselecting
      this.$nextTick(() => {
        if (!this.selectedRow) {
          this.selectedRow = event.data;
        }
      });
      // Don't emit row-unselected to enforce always-selected behavior
    },
    onMenuClick(event) {
      this.$refs.menuRef.toggle(event);
    },
    onSort(event) {
      this.sortField = event.sortField;
      this.sortOrder = event.sortOrder;
    },
    download(format) {
      const rows = this.rows;
      let content = "";
      let mimeType = "text/plain";
      let filename = `trait_${this.downloadName}_variants.${format}`;

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
    },
  },
}

</script>

<style>

.no-wrap {
  white-space: nowrap;
}

.no-wrap-headers .p-datatable-thead > tr > th {
  white-space: nowrap;
}

.table-link {
  color: rgb(var(--v-theme-primary-darken-1));
}

.table-link:hover {
  background-color: rgb(var(--v-theme-primary))
}

</style>