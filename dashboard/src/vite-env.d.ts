/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for dbt docs (default /dbt-docs/) */
  readonly VITE_DBT_DOCS_BASE_URL?: string;
  /** dbdiagram.io (or other) embed URL for raw-layer ERD */
  readonly VITE_MORTGAGE_RAW_ERD_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
