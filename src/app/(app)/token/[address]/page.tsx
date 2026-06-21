import { getTokenDetail } from "@/lib/birdeye";
import { TokenView } from "@/components/trade/TokenView";

/** Token detail route — server-fetches the token and renders the full view. */
export default async function TokenPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const token = await getTokenDetail(address);
  return <TokenView token={token} />;
}
