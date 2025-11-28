// config.js
export const API_BASE_URL = "/backend";     // NOT /backend/backend
export const GENOME_BUILD = import.meta.env.VITE_GENOME_BUILD ?? "GRCh38";
export const HG_BUILD_NUMBER = import.meta.env.VITE_HG_BUILD_NUMBER

export const STUDY_NAME   = import.meta.env.VITE_STUDY_NAME   ?? "DefaultStudy";
export const TRAIT_EXAMPLE = import.meta.env.VITE_TRAIT_EXAMPLE ?? "";
export const VARIANT_EXAMPLE = import.meta.env.VITE_VARIANT_EXAMPLE ?? "";

export const TRAIT_EXTERNAL_REF_URL = import.meta.env.VITE_TRAIT_EXTERNAL_REF_URL ?? ""

export const STUDY_PLAIN_CITATION = import.meta.env.VITE_STUDY_PLAIN_CITATION
export const STUDY_BIBTEX_CITATION = import.meta.env.VITE_STUDY_BIBTEX_CITATION
export const STUDY_DOI_LINK = import.meta.env.VITE_STUDY_CITATION_DOI_LINK

export const TYPESENSE_API_KEY = import.meta.env.VITE_TYPESENSE_KEY;

export const COLOR_PRIMARY = import.meta.env.VITE_COLOR_PRIMARY ?? "#A5BFDC"
export const COLOR_PRIMARY_DARK = import.meta.env.VITE_COLOR_PRIMARY_DARK ?? "#516F84"

export const MAGMA_SHOW = import.meta.env.VITE_MAGMA_SHOW === 'true' ?? false;

export const GENE_ID_SPACE = import.meta.env.VITE_GENE_ID_SPACE ?? "ensembl";