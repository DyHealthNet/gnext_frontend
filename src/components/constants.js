/**
 * Shared app-wide constants and reactive state.
 *
 * Exposes the resolved backend `BASE_URL` and a global `isLoading` flag (with a
 * setter) that components can import to coordinate a shared loading indicator.
 */
import { ref, reactive } from "vue";

/** Backend origin: the `VITE_BACKEND_URL` env override, else the current host. */
const BASE_URL =
    import.meta.env.VITE_BACKEND_URL ||
    `${window.location.protocol}//${window.location.host}`;

export { BASE_URL };
/** Global reactive loading flag shared across components. */
export const isLoading = ref(false);
/**
 * Sets the global loading flag.
 * @param {boolean} value - New loading state.
 */
export function setIsLoading(value) {
  isLoading.value = value;
}