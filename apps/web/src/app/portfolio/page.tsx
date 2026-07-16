import { redirect } from "next/navigation";
import { routes } from "../../lib/routes";

// /portfolio → /account. The account page absorbed the portfolio (equity, positions, unrealized) and adds
// accuracy, moments, rank, and proof history. The route survives for bookmarks and old links only.
export default function Page() {
  redirect(routes.account);
}
