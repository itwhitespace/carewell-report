import Link from "next/link";
import { getSystemFlows } from "@/lib/flows";
import { createFlowAction } from "./actions";
import { DeleteFlowButton } from "./DeleteFlowButton";
import { Plus, Search, Layers, GitMerge, FileText, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FlowsPage() {
  const hasEnvVars = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const flows = await getSystemFlows();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {!hasEnvVars && (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          <h3 className="font-bold text-base flex items-center gap-2">
            ⚠️ ยังไม่ได้ตั้งค่าคีย์เชื่อมต่อ Supabase ในเครื่อง Local (.env.local)
          </h3>
          <p className="mt-1 text-xs sm:text-sm">
            กรุณาสร้างไฟล์ชื่อ <code className="font-mono bg-amber-200/60 px-1.5 py-0.5 rounded text-amber-950 dark:bg-amber-900/60 dark:text-amber-100">.env.local</code> ในโฟลเดอร์โปรเจกต์ของคุณ แล้วระบุค่าดังนี้:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-amber-950 p-3 font-mono text-xs text-amber-100">
{`NEXT_PUBLIC_SUPABASE_URL=https://kdbeyokcdnsdenzickkw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=คีย์_service_role_จาก_supabase_dashboard`}
          </pre>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
            <GitMerge className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            ขั้นตอนการทำงานของระบบ (System Flows)
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            คู่มือและบันทึกขั้นตอนการทำงานของระบบทีละขั้นตอน รองรับ Note Notion-like Editor และ Markdown
          </p>
        </div>

        {/* Quick create flow form */}
        <CreateFlowModal />
      </div>

      {/* Grid of Flows */}
      <div className="mt-8">
        {flows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-800">
            <Layers className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-4 text-base font-semibold text-neutral-900 dark:text-neutral-100">
              ยังไม่มี Flow ขั้นตอนในระบบ
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              เริ่มบันทึกขั้นตอนการทำงานแรกของระบบด้วยปุ่มด้านล่าง
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {flows.map((flow) => (
              <div
                key={flow.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-blue-500"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      {flow.category ?? "General"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-neutral-400">
                      <FileText className="h-3.5 w-3.5" />
                      {flow.step_count ?? 0} ขั้นตอน
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-neutral-900 group-hover:text-blue-600 dark:text-neutral-100 dark:group-hover:text-blue-400 transition-colors">
                    {flow.title}
                  </h3>

                  {flow.description && (
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                      {flow.description}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
                  <span className="text-xs text-neutral-400">
                    อัปเดต: {new Date(flow.updated_at).toLocaleDateString("th-TH")}
                  </span>

                  <div className="flex items-center gap-3">
                    <DeleteFlowButton flowId={flow.id} title={flow.title} />

                    <Link
                      href={`/flows/${flow.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-colors"
                    >
                      <span>ดูรายละเอียด Flow</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function CreateFlowModal() {
  return (
    <form action={createFlowAction} className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        name="title"
        required
        placeholder="ชื่อ Flow (เช่น UI/UX Layout หน้าสมาชิก)..."
        className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 min-w-[280px]"
      />
      <select
        name="category"
        defaultValue="UI/UX Layout"
        className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 font-medium text-blue-600 dark:text-blue-400"
      >
        <option value="UI/UX Layout">UI/UX Layout</option>
        <option value="System Flow">System Flow</option>
        <option value="Database">Database Schema</option>
        <option value="API">API/Backend</option>
      </select>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span>สร้าง Flow</span>
      </button>
    </form>
  );
}
