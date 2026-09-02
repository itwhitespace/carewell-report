import { notFound } from "next/navigation";
import { getSystemFlowById } from "@/lib/flows";
import { FlowDetailClient } from "./FlowDetailClient";

export const dynamic = "force-dynamic";

export default async function FlowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flow = await getSystemFlowById(id);

  if (!flow) {
    notFound();
  }

  return <FlowDetailClient initialFlow={flow} />;
}
