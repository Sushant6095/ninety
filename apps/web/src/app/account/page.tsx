import type { Metadata } from "next";
import { AccountPage } from "../../features/account/AccountPage";

// /account — the upgraded portfolio: credits, positions, accuracy, moments, rank, and on-chain proof history.
// Fixture-wired (GET /me/portfolio + /me/positions + /profile/:handle); positions go live off m:{match}:prices.
export const metadata: Metadata = {
  title: "Account — Ninety",
  description: "Your forecasting record — credits, open positions, accuracy, moments, and on-chain proofs.",
};

export default function Page() {
  return <AccountPage />;
}
