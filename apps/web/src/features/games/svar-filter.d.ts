// Type shim for @svar-ui/filter-store · the published @svar-ui/react-filter@2.6.0 points its
// "types" at dist/types/index.d.ts while the real file ships at dist/types/src/index.d.ts, so
// TS cannot resolve the store's exports (`createArrayFilter`, field/set shapes) even though the
// runtime bundles them. This declares just the surface the games filter uses, mirroring
// dist/types/src/{helpers,types}.d.ts. Delete when upstream fixes the types path.
declare module "@svar-ui/filter-store" {
  export type TGlue = "and" | "or";

  export interface IFilter {
    field: string | "*";
    type?: string;
    predicate?: string;
    filter?: string;
    includes?: unknown[];
    value?: unknown;
  }

  export interface IFilterSet {
    rules?: (IFilter | IFilterSet)[];
    glue?: TGlue;
  }

  export interface IFilterBarField {
    type: string;
    id: string;
    filter?: string;
    options?: { id: string | number; label: string }[];
    value?: unknown;
    label?: string;
    placeholder?: string;
  }

  export type ArrayFilterFunction = <T>(value: T[]) => T[];

  export function createArrayFilter(cfg: IFilterSet): ArrayFilterFunction;
}
