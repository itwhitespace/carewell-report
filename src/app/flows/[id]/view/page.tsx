import { notFound } from "next/navigation";
import { getSystemFlowById } from "@/lib/flows";
import { FlowViewClient } from "./FlowViewClient";

export const dynamic = "force-dynamic";

export default async function FlowViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flow = await getSystemFlowById(id);

  if (!flow) {
    notFound();
  }

  return <FlowViewClient initialFlow={flow} />;
}
