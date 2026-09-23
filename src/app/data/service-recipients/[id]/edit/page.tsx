import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { EditServiceRecipientClient } from "./EditServiceRecipientClient";
import type { ServiceRecipientRow } from "../../ServiceRecipientsClient";

export const dynamic = "force-dynamic";

export default async function EditServiceRecipientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from("service_recipients")
    .select("id, job_code, service_date, care_level, work_format, status, net_total, fee_percent, fee_amount, caregiver_net, cancel_reason")
    .eq("id", id)
    .single();

  if (error || !row) notFound();

  return <EditServiceRecipientClient row={row as unknown as ServiceRecipientRow} />;
}
