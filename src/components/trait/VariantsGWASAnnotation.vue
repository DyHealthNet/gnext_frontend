<template>
  <v-container>

      <div class="table-wrapper" style="overflow-x: auto;">
      <DataTable
               class="no-wrap-headers"
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
               :globalFilterFields="globalFilterFields"
               paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink PaginatorEnd"
               currentPageReportTemplate="{first} to {last} of {totalRecords}"
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
            v-if="col.field !== 'variant_id'"
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
            <a :href="`/variant/${encodeURIComponent(slotProps.data.variant_id)}`" class="text-blue-600 hover:underline no-wrap">
              {{ slotProps.data.variant_id }}
            </a>
          </template>
        </Column>
      </template>
    </DataTable>
        </div>

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
  name: "VariantsGWASAnnotation2",
  components: {IconField, Button, InputIcon, DataTable, Column, InputText, Menu, MultiSelect},
  props: {
    headers: {
      type: Array,
      required: false,
      default: () => ["variant_id","rsid", "chrom","pos","ref","alt","neg_log_pvalue","pvalue","beta","stderr_beta",
		          "alt_allele_freq"]

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
    }
  },
    data: () => ({
    menuVisible: false,
    sortField: "log_pvalue",
    sortOrder: -1,
    filters: {
      global: {value: null, matchMode: FilterMatchMode.CONTAINS}
    },
  }),
  computed: {
    downloadItems() {
      return [
        { label: 'Download as CSV', icon: 'pi pi-file', command: () => this.download('csv') },
        { label: 'Download as JSON', icon: 'pi pi-file', command: () => this.download('json') },
        { label: 'Download as TXT', icon: 'pi pi-file', command: () => this.download('txt') }
      ];
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
    download(format) {
      console.log("Downloading in format: " + format);
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
  watch: {
    headers: {
      handler(newVal) {
        this.columns = newVal.map(col => ({
          field: col, // must match row keys
          header: col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) // nicely formatted
        }));
        console.log("this.columns:", this.columns);
      },
      immediate: true
    }
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
</style>

