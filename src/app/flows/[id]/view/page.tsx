import { notFound } from "next/navigation";
import { getSystemFlowById } from "@/lib/flows";
import { FlowViewClient } from "./FlowViewClient";

export const dynamic = "force-dynamic";

export default async function FlowViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string; stepId?: string }>;
}) {
  const { id } = await params;
  const { step, stepId } = await searchParams;
  const flow = await getSystemFlowById(id);

  if (!flow) {
    notFound();
  }

  const initialStepNumber = step ? parseInt(step, 10) : undefined;

  return (
    <FlowViewClient
      initialFlow={flow}
      initialStepNumber={isNaN(initialStepNumber as number) ? undefined : initialStepNumber}
      initialStepId={stepId}
    />
  );
}
