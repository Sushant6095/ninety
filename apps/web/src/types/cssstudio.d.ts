// cssstudio ships no type declarations; this shim satisfies strict type-checking for the
// dev-only dynamic import in components/dev/CssStudio.tsx. Dev tooling only.
declare module "cssstudio" {
  export function startStudio(): void;
}
