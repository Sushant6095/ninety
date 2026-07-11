import { PageSkeleton } from "../components/ui/Skeleton";

// Shown during route transitions (App Router). Reserves layout so navigation never flashes an empty screen.
export default function Loading() {
  return <PageSkeleton />;
}
