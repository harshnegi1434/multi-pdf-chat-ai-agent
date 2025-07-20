/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Add other variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
