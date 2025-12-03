# GNExT Platform - Frontend

<div align="center">
  <img src="src/assets/figures/GNExT_Logo_Black.png" alt="GNExT Logo" width="400"/>
  <p><em>GWAS Network Exploration Tool</em></p>
</div>

## Overview

The frontend of the GNExT platform is a Vue.js application providing interactive visualizations and search capabilities for GWAS (Genome-Wide Association Studies) data. 

For detailed overview of the platform, please refer to the **[GNExT platform repository](https://github.com/DyHealthNet/gnext_platform)**  which describes the platform in more detail and showcases how to set up a GNExT platform for your study data. The repository provides information on the configuration parameters and the deployment strategy.

### 🔗 Repository Links

- **📦 [GNExT Platform](https://github.com/DyHealthNet/gnext_platform)** - Complete platform with frontend, backend, and deployment
- **🔧 [GNExT Backend](https://github.com/DyHealthNet/gnext_backend)** - Django REST API and data processing
- **🎨 [GNExT Frontend](https://github.com/DyHealthNet/gnext_frontend)** - Vue.js web interface (this repository)
- **⚙️ [GNExT Nextflow Pipeline](https://github.com/DyHealthNet/gnext_nf_pipeline)** - Data processing pipeline for GWAS analysis

### Features

- 🔍 **Interactive Search**: Fast phenotype, variant, and gene lookup powered by Typesense
- 📊 **Data Visualizations**: Manhattan plots, QQ plots, LocusZoom integration
- 🧬 **Gene Analysis**: MAGMA gene-based association results with interactive tables
- 🌐 **Network Medicine**: Integration with Drugst.One for drug discovery insights


## Development Setup

In development mode, ensure that the [GNExT Platform](https://github.com/DyHealthNet/gnext_platform)** repository is cloned with all submodules. After completing the .env configuration, proceed to the frontend directory to initialize and configure the development environment according to the steps outlined below. 

### Quick Start

**Option 1: Create new conda environment**
```bash
# Create and activate conda environment with Node.js
conda create -n gnext_frontend nodejs
conda activate gnext_frontend

# Install npm dependencies
npm install

# Start development server
npm run dev
```

**Option 2: Use existing conda environment**
```bash
# Activate your existing conda environment (with Node.js v24.4.1)
conda activate gnext_frontend

# Install npm dependencies
npm install

# Start development server
npm run dev
```

**Note**: The `requirements.txt` file contains system-level Python packages that are typically not needed for frontend development. Only install Python dependencies if you encounter specific build issues.

The frontend will be available at `http://localhost:5173` (or the port specified in `VITE_FRONTEND_PORT`)

## Deployment Setup

Please have a look at the [GNExT Platform](https://github.com/DyHealthNet/gnext_platform)** repository.


## Citation
TBA