import {createApp} from 'vue'
import router from './router'

import "./assets/main.css"

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import {createVuetify} from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// PrimeVue
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura';
import {definePreset} from '@primeuix/themes';


// Components
import App from './App.vue'

import InstantSearch from 'vue-instantsearch/vue3/es'
import {COLOR_PRIMARY, COLOR_PRIMARY_DARK} from "@/config.js"; // ← this is critical for Vue 3

const dyHealthNetTheme = {
    dark: false,
    colors: {
        "background": "#F5F5F5",
        "surface": "#FAFAFA",
        "surface-bright": "#FFFFFF",
        "surface-light": "#F5F5F5",
        "surface-variant": "#E0E0E0",
        "on-surface-variant": "#4D4D4D",
        "darken-1": "#333333",
        "white-surface": "#FAFAFA",

        "primary": COLOR_PRIMARY,
        "primary-darken-1": COLOR_PRIMARY_DARK,

        "error": "#E57373",
        "info": "#3398DB",
        "success": "#81C784",
        "warning": "#FFB74D",

        "orcid_button": "#A6CE39",
        "github_button": "#121212",

        "chart": '#707070',
        "chart-grid": '#E0E0E0',

        "node-logo-background": "#CDDDE8",

        "text": "#000000",
    },
}

const dyHealthNetThemeDark = {
    dark: true,
    colors: {
        "background": "#1E1E1E",
        "surface": "#2A2A2A",
        "surface-bright": "#3C3C3C",
        "surface-light": "#474747",
        "surface-variant": "#555555",
        "on-surface-variant": "#D1D1D1",
        "darken-1": "#FFFFFF",
        "white-surface": "#FAFAFA",

        "primary": COLOR_PRIMARY_DARK,
        "primary-darken-1": COLOR_PRIMARY,

        "error": "#E57373",
        "info": "#3398DB",
        "success": "#81C784",
        "warning": "#FFB74D",

        "chart": '#B0B0B0',
        "chart-grid": '#555555',

        "text": "#FFFFFF",
    },
}

const vuetify = createVuetify({
    theme: {
        defaultTheme: 'dyHealthNetTheme',
        themes: {
            dyHealthNetTheme,
            dyHealthNetThemeDark
        }
    },
    options: {
        customProperties: true,
    },
    components,
    directives,
})

const MyPreset = definePreset(Aura, {
    components: {
        inputtext: {
            colorScheme: {
                light: {
                    root: {
                        background: 'transparent'
                    }
                },
                dark: {
                    root: {
                        background: 'transparent'
                    }
                }
            }
        },
        select: {
            colorScheme: {
                light: {
                    root: {
                        background: 'transparent'
                    }
                },
                dark: {
                    root: {
                        background: 'transparent'
                    }
                }
            }
        },
        paginator: {
            colorScheme: {
                light: {
                    root: {
                        background: 'transparent'
                    }
                },
                dark: {
                    root: {
                        background: 'transparent'
                    }
                }
            }
        },
        datatable: {
            colorScheme: {
                light: {
                    root: {
                        root: {background: 'transparent'},
                        header: {
                            background: 'transparent',
                            cell: {background: 'transparent'}
                        },
                        body: {background: 'transparent'},
                        footer: {
                            background: 'transparent',
                            border: {color: dyHealthNetTheme.surface},
                            cell: {background: 'transparent'}
                        },
                        row: {background: 'transparent'},
                    }
                },
                dark: {
                    root: {
                        root: {background: 'transparent'},
                        header: {
                            background: 'transparent',
                            cell: {background: 'transparent'}
                        },
                        body: {background: 'transparent'},
                        footer: {
                            background: 'transparent',
                            border: {color: dyHealthNetTheme.surface},
                            cell: {background: 'transparent'}
                        },
                        row: {background: 'transparent'},
                    }
                }
            }
        }
    }
})

createApp(App).use(vuetify).use(router).use(InstantSearch).use(PrimeVue, {
    theme: {
        preset: MyPreset, options: {
            prefix: 'p',
            darkModeSelector: 'html.my-app-dark',
            cssLayer: false
        }
    }
}).mount('#app')