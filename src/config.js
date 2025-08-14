// config.js
// Runtime overrides come from /env-config.js -> window.__ENV__
// Build-time defaults come from import.meta.env
const R = (typeof window !== "undefined" && window.__ENV__) ? window.__ENV__ : {};

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/backend`;
const TYPESENSE_HOST = import.meta.env.VITE_TYPESENSE_HOST;
const TYPESENSE_PORT = Number(import.meta.env.VITE_TYPESENSE_PORT);

// Runtime-first for user-provided vars, fallback to build-time
const GENOME_BUILD = import.meta.env.VITE_GENOME_BUILD;
const STUDY_NAME = import.meta.env.VITE_STUDY_NAME;

console.log("Typesense host:", TYPESENSE_HOST);
console.log("Typesense port (number):", TYPESENSE_PORT);
console.log("Genome build (runtime-first):", GENOME_BUILD);
console.log("Study name (runtime-first):", STUDY_NAME);

export { API_BASE_URL, GENOME_BUILD, TYPESENSE_PORT, TYPESENSE_HOST, STUDY_NAME };
