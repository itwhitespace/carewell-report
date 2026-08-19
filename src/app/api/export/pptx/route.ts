import { NextResponse } from "next/server";
import { loadSlideData } from "@/lib/slide-data";
import { buildPptx } from "@/lib/build-pptx";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await loadSlideData();
  const buffer = await buildPptx(data);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="carewell-report-${new Date().toISOString().slice(0, 10)}.pptx"`,
    },
  });
}
