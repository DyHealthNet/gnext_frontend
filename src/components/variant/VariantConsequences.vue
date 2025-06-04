<template>
  <v-container>
    <div v-if="type === 'transcript'">
      <span>Transcription consequences of {{ variantId }}, as predicted by the Ensembl Variant Effect Predictor.</span>

      <div class="d-flex flex-wrap align-center mt-4 mb-4">
        <span class="me-4">Impact:</span>
        <VariantImpactTag impact="HIGH"/>
        <VariantImpactTag impact="MODERATE"/>
        <VariantImpactTag impact="LOW"/>
        <VariantImpactTag impact="MODIFIER"/>
      </div>
    </div>

    <div v-if="type === 'motif'" class="mb-4">
      <span>Motif feature consequences of {{ variantId }}, as predicted by the Ensembl Variant Effect Predictor.</span>
    </div>

    <div v-if="type === 'regulatory'" class="mb-4">
      <span>Regulatory feature consequences of {{ variantId }}, as predicted by the Ensembl Variant Effect Predictor.</span>
    </div>


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
               :globalFilterFields="['BIOTYPE', 'SYMBOL', 'Consequence']"
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
            v-if="col.field === 'IMPACT'"
            :field="col.field"
            :header="col.header"
            sortable
            :filter="true"
            filterMatchMode="equals"
        >
          <template #body="{ data }">
            <VariantImpactTag :impact="data[col.field]"/>
          </template>
        </Column>

        <Column
            v-else
            :field="col.field"
            :header="col.header"
            sortable
        />
      </template>
    </DataTable>
  </v-container>

</template>

<script>
import VariantImpactTag from "@/components/variant/VariantImpactTag.vue";
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
  name: "VariantConsequences",
  components: {VariantImpactTag, DataTable, Column, IconField, InputText, InputIcon, MultiSelect, Menu, Button},
  props: {
    variantId: {
      type: String,
      required: true,
    },
    headers: {
      type: Array,
      required: true,
    },
    rows: {
      type: Array,
      required: true,
    },
    type: {
      type: String,
      required: true
    }
  },

  data() {
    return {
      columns: [],
      sortField: 'IMPACT',
      sortOrder: 1, // 1 for ascending, -1 for descending
      impactRank: {
        HIGH: 4,
        MODERATE: 3,
        LOW: 2,
        MODIFIER: 1
      },
      menuVisible: false,
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
    }
  },

  methods: {
    onSort(event) {
      this.sortField = event.sortField;
      this.sortOrder = event.sortOrder;

      if (event.sortField === 'IMPACT') {
        this.rows.sort((a, b) => {
          const aRank = this.impactRank[a.IMPACT] || 0;
          const bRank = this.impactRank[b.IMPACT] || 0;
          return this.sortOrder * (aRank - bRank);
        });
      }
    },

    onMenuClick(event) {
      this.$refs.menuRef.toggle(event);

    },

    download(format) {
      console.log("Downloading in format: " + format);
      const rows = this.rows;
      const variantId = this.variantId;
      let content = "";
      let mimeType = "text/plain";
      const type = this.type;
      let filename = `variant_${variantId}_${type}_consequences.${format}`;

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
      handler(newRows){
      },
      immediate: true,
      deep: true
    }
  },
}
</script>

<style>

</style>