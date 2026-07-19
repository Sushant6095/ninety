// Coverage — "Live across the World Cup 2026": the magicui dotted map (re-skinned, static SVG)
// with the 16 host cities as up-token markers over text-lo/30 world dots. Cities are baked
// constants (they sit still — WC26 two-source rule); nothing here is a runtime dependency.
import { DottedMap } from "../../../components/vendor/magicui/dotted-map";
import { Section } from "./Section";

// The 16 WC26 host cities (lat, lng) — three countries, one slate.
const HOST_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: "Atlanta", lat: 33.755, lng: -84.39 },
  { name: "Boston", lat: 42.36, lng: -71.06 },
  { name: "Dallas", lat: 32.78, lng: -96.8 },
  { name: "Houston", lat: 29.76, lng: -95.36 },
  { name: "Kansas City", lat: 39.1, lng: -94.58 },
  { name: "Los Angeles", lat: 34.05, lng: -118.24 },
  { name: "Miami", lat: 25.76, lng: -80.19 },
  { name: "New York/New Jersey", lat: 40.81, lng: -74.07 },
  { name: "Philadelphia", lat: 39.95, lng: -75.17 },
  { name: "San Francisco Bay Area", lat: 37.4, lng: -121.97 },
  { name: "Seattle", lat: 47.6, lng: -122.33 },
  { name: "Guadalajara", lat: 20.66, lng: -103.35 },
  { name: "Mexico City", lat: 19.43, lng: -99.13 },
  { name: "Monterrey", lat: 25.69, lng: -100.32 },
  { name: "Toronto", lat: 43.65, lng: -79.38 },
  { name: "Vancouver", lat: 49.28, lng: -123.12 },
];

export function Coverage() {
  return (
    <Section eyebrow="Coverage" title="Live across the World Cup 2026." lede="Sixteen host cities, three countries, 104 matches, every one a live market from kickoff to the on-chain whistle.">
      <div className="elev overflow-hidden rounded-card border border-hairline bg-surface p-4 sm:p-6">
        <DottedMap
          aria-label="World map with the sixteen World Cup 2026 host cities marked"
          className="text-lo/30"
          markers={HOST_CITIES.map((c) => ({ lat: c.lat, lng: c.lng, size: 0.5 }))}
          pulse
        />
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Host cities">
          {HOST_CITIES.map((c) => (
            <li key={c.name} className="flex items-center gap-1.5 rounded-chip bg-bg/40 px-2.5 py-1 ring-1 ring-inset ring-hairline">
              <span className="h-1.5 w-1.5 rounded-chip bg-up" aria-hidden />
              <span className="text-label font-medium text-hi/90">{c.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
