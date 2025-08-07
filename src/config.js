const API_BASE_URL = `${import.meta.env.VITE_API_URL}/backend`;
const GENOME_BUILD = `${import.meta.env.VITE_GENOME_BUILD}`;
const TYPESENSE_HOST =import.meta.env.VITE_TYPESENSE_HOST;
const TYPESENSE_PORT = Number(import.meta.env.VITE_TYPESENSE_PORT);

console.log("Typesense host:", TYPESENSE_HOST);
console.log("Typesense port (number):", TYPESENSE_PORT);

export { API_BASE_URL, GENOME_BUILD, TYPESENSE_PORT, TYPESENSE_HOST}