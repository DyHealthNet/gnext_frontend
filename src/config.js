// config.js
export const API_BASE_URL = "/backend";     // NOT /backend/backend
export const GENOME_BUILD = import.meta.env.VITE_GENOME_BUILD ?? "GRCh38";
export const STUDY_NAME   = import.meta.env.VITE_STUDY_NAME   ?? "DefaultStudy";
export const TRAIT_EXAMPLE = import.meta.env.VITE_TRAIT_EXAMPLE
export const VARIANT_EXAMPLE = import.meta.env.VITE_VARIANT_EXAMPLE

export const TYPESENSE_API_KEY = import.meta.env.VITE_TYPESENSE_KEY;
