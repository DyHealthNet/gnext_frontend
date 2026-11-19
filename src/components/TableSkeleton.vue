<template>
  <v-container>

    <div class="table-wrapper" style="overflow-x: auto;">
      <DataTable
          class="no-wrap-headers"
          :value="sortedRows"
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
              v-if="col.field !== 'variant_id' && col.field !== 'trait_id' && col.field !== 'top_variant' && col.field !== 'location' && col.field !== 'distance' && col.field !== 'nearest_genes' && col.field !== 'gene_id' && col.field !== 'gene_symbol' "
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

              <!-- Gene ID -->
              <template v-else-if="field === 'gene_id'">
                <a :href="`/gene/${encodeURIComponent(data.gene_id)}?trait=${data.trait_id || selectedTrait}`" class="table-link hover:underline">
                      {{ data.gene_id }}
                    </a>
            </template>


              <!-- Gene Symbol -->
              <template v-else-if="field === 'gene_symbol'">
                <a :href="`/gene/${encodeURIComponent(data.gene_id)}?trait=${data.trait_id || selectedTrait}`" class="table-link hover:underline">
                      {{ data.gene_symbol }}
                    </a>
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
/**
 * Reusable PrimeVue DataTable wrapper used across the app's result tables.
 *
 * Accepts column `headers`, `rows` and display options as props and renders a
 * paginated, globally-filterable, custom-sorted table. It knows how to turn
 * certain known fields (variant_id, trait_id, gene_id, nearest_genes, location,
 * ...) into entity links/tags, supports single-row selection (always keeping a
 * row selected), and offers CSV/JSON/TXT export of all rows or, while a keyword
 * search is active, of only the matching rows.
 * Emits `row-selected` / `row-unselected`.
 */
import 'locuszoom/dist/locuszoom.css'
import {InputIcon, IconField, InputText, Column, DataTable, MultiSelect, Menu, Button, ProgressBar} from "primevue";
import {FilterService} from '@primevue/core/api'
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

/**
 * Global-search match mode: case-insensitive "contains" that, unlike PrimeVue's
 * built-in CONTAINS, also looks inside object/array cells (e.g. `nearest_genes`,
 * a `{ensembl_id: symbol}` map), which would otherwise stringify to
 * "[object Object]" and be unsearchable.
 */
const DEEP_CONTAINS = 'deepContains'
const cellToSearchText = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    return Object.entries(value).map(([k, v]) => `${k} ${cellToSearchText(v)}`).join(' ')
  }
  return String(value)
}
FilterService.register(DEEP_CONTAINS, (value, filter) => {
  if (filter === undefined || filter === null || String(filter).trim() === '') return true
  return cellToSearchText(value).toLocaleLowerCase().includes(String(filter).trim().toLocaleLowerCase())
})

/**
 * Flattens a cell value for CSV/TXT export. Arrays are joined with "; " and
 * plain objects -- e.g. `nearest_genes` (`{ensembl_id: symbol}`) -- become
 * "key:value; key:value", instead of the default "[object Object]".
 */
const cellToExportText = (value) => {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map(cellToExportText).join('; ')
  if (typeof value === 'object') {
    return Object.entries(value).map(([k, v]) => `${k}:${cellToExportText(v)}`).join('; ')
  }
  return String(value)
}

/**
 * Comparable value for sorting a cell. Object cells -- e.g. `nearest_genes`
 * (`{ensembl_id: symbol}`, ordered by distance) -- sort by their displayed
 * values ("SYMBOL1, SYMBOL2, ..."), arrays by their joined items; empty
 * objects/arrays/strings count as missing so they sort last.
 */
const toSortValue = (value) => {
  if (value === null || value === undefined) return null
  if (Array.isArray(value)) return value.length ? value.join(', ') : null
  if (typeof value === 'object') {
    const values = Object.values(value)
    return values.length ? values.join(', ') : null
  }
  if (typeof value === 'string' && value.trim() === '') return null
  return value
}

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
    /**
     * Downloads contain only the displayed columns (in display order) by
     * default; set to false to export every field of the row objects instead.
     */
    exportVisibleColumnsOnly: {
      type: Boolean,
      required: false,
      default: true,
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
    },
    defaultSortField: {
      type: String,
      required: false,
      default: null,
    },
    defaultSortOrder: {
      type: Number,
      required: false,
      default: 1, // 1 = ascending, -1 = descending
    }
  },
  data() {
    return {
      menuVisible: false,
      sortField: this.defaultSortField,
      sortOrder: this.defaultSortOrder,
      filters: {
        global: {value: null, matchMode: DEEP_CONTAINS}
      },
      selectedRow: null,
    }
  },
  computed: {

    /** @returns {Array<object>} PrimeVue Menu items for the CSV/JSON/TXT download options. */
    downloadItems() {
      const items = [
        {label: 'Download all as CSV', icon: 'pi pi-file', command: () => this.download('csv')},
        {label: 'Download all as JSON', icon: 'pi pi-file', command: () => this.download('json')},
        {label: 'Download all as TXT', icon: 'pi pi-file', command: () => this.download('txt')}
      ];
      if (this.isFiltered) {
        const n = this.filteredRows.length;
        items.push(
          {separator: true},
          {label: `Download ${n} filtered rows as CSV`, icon: 'pi pi-filter', disabled: !n, command: () => this.download('csv', true)},
          {label: `Download ${n} filtered rows as JSON`, icon: 'pi pi-filter', disabled: !n, command: () => this.download('json', true)},
          {label: `Download ${n} filtered rows as TXT`, icon: 'pi pi-filter', disabled: !n, command: () => this.download('txt', true)}
        );
      }
      return items;
    },
    /** @returns {boolean} Whether a keyword search is currently active. */
    isFiltered() {
      const v = this.filters.global.value;
      return v !== null && v !== undefined && String(v).trim() !== '';
    },
    /**
     * @returns {Array<object>} The rows currently matched by the keyword search
     *   (same match logic as the table's global filter), in the current sort order.
     */
    filteredRows() {
      if (!this.isFiltered) return this.sortedRows;
      const term = this.filters.global.value;
      const match = FilterService.filters[DEEP_CONTAINS];
      return this.sortedRows.filter(row =>
        this.globalFilterFields.some(f => match(row[f], term))
      );
    },
    /**
     * @returns {Array<{field:string, header:string}>} Column descriptors with
     *   `priorityOrder` fields first and human-readable headers (snake_case
     *   converted to Title Case, with a special label for `neg_log_pvalue`).
     */
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
    },
    /**
     * @returns {Array<object>} `rows` sorted by the active sort field/order,
     *   using numeric comparison when possible and a string fallback otherwise;
     *   null/undefined values are pushed to the end.
     */
    sortedRows() {
      if (!this.sortField) return this.rows;
      
      const sorted = [...this.rows].sort((a, b) => {
        const aVal = toSortValue(a[this.sortField]);
        const bVal = toSortValue(b[this.sortField]);

        // Handle null/undefined/empty -- always pushed to the end
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        // Try numeric comparison first
        const aNum = Number(aVal);
        const bNum = Number(bVal);

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return (aNum - bNum) * this.sortOrder;
        }

        // Alphabetical fallback (case-insensitive, numbers inside strings compared naturally)
        return String(aVal).localeCompare(String(bVal), undefined, {sensitivity: 'base', numeric: true}) * this.sortOrder;
      });
      
      return sorted;
    }
  },
  watch: {
    // When rows arrive (or selection is toggled on) and nothing is selected yet,
    // auto-select the first row and notify the parent.
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
    /** Emits `row-selected` when the user picks a row. @param {object} event - PrimeVue row-select event. */
    onRowSelect(event) {
      console.log('Selected row:', event.data);
      this.$emit('row-selected', event.data);
    },
    /**
     * Enforces always-selected behavior: re-selects the row instead of allowing
     * an empty selection. @param {object} event - PrimeVue row-unselect event.
     */
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
    /** Toggles the download options popup menu. @param {Event} event - Click event. */
    onMenuClick(event) {
      this.$refs.menuRef.toggle(event);
    },
    /** Updates the active sort field/order from a sort event. @param {object} event - PrimeVue sort event. */
    onSort(event) {
      this.sortField = event.sortField;
      this.sortOrder = event.sortOrder;
    },
    /**
     * Serializes the current rows and triggers a client-side file download.
     * @param {'csv'|'json'|'txt'} format - Desired export format.
     * @param {boolean} [filteredOnly=false] - Export only the rows matching the
     *   current keyword search (in the current sort order) instead of all rows.
     */
    download(format, filteredOnly = false) {
      const rows = filteredOnly ? this.filteredRows : this.rows;
      let content = "";
      let mimeType = "text/plain";
      let filename = `trait_${this.downloadName}_variants${filteredOnly ? '_filtered' : ''}.${format}`;

      if (!rows.length) return;

      const headers = this.exportVisibleColumnsOnly
          ? this.columns.map(c => c.field)
          : Object.keys(rows[0]);

      if (format === 'json') {
        const exportRows = this.exportVisibleColumnsOnly
            ? rows.map(row => Object.fromEntries(headers.map(h => [h, row[h] ?? null])))
            : rows;
        content = JSON.stringify(exportRows, null, 2);
        mimeType = "application/json";
      } else if (format === 'csv') {
        const csvRows = [
          headers.join(','),
          ...rows.map(row => headers.map(h => `"${cellToExportText(row[h]).replace(/"/g, '""')}"`).join(','))
        ];
        content = csvRows.join('\n');
        mimeType = "text/csv";
      } else if (format === 'txt') {
        const headerLine = headers.join('\t');
        const lines = rows.map(row =>
            headers.map(h => cellToExportText(row[h]).replace(/[\t\r\n]+/g, ' ')).join('\t')
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

.p-datatable-header-cell {
  border-color: rgb(var(--v-theme-data-table-line)) !important;
}

.p-datatable-tbody > tr > td {
  border-color: rgb(var(--v-theme-data-table-line)) !important;
}

</style>