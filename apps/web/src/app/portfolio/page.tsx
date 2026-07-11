import { PortfolioPage } from "../../features/portfolio/PortfolioPage";

// Portfolio — balance, open positions, live unrealized. Fixture-wired (GET /me/portfolio + /me/positions),
// swaps 1:1 when the API boots; positions go live off m:{match}:prices per SCREEN-DATA-MAP.
export default function Page() {
  return <PortfolioPage />;
}
