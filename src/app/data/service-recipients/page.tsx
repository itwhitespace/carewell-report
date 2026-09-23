import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ServiceRecipientsClient, type ServiceRecipientRow } from "./ServiceRecipientsClient";

export const dynamic = "force-dynamic";

async function getRows(): Promise<ServiceRecipientRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("service_recipients")
    .select("id, job_code, service_date, care_level, work_format, status, net_total, fee_percent, fee_amount, caregiver_net")
    .order("service_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching service_recipients:", error);
    return [];
  }

  return (data ?? []) as ServiceRecipientRow[];
}

export default async function ServiceRecipientsPage() {
  const rows = await getRows();
  return <ServiceRecipientsClient initialRows={rows} />;
}
