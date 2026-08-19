export type NoteStatus = "ประเด็นใหม่" | "ดำเนินการแล้ว";

export type NoteItem = {
  id: string;
  topic: string;
  detail: string | null;
  status: NoteStatus;
  rawDetail: string | null;
  sort_order?: number | null;
  created_at?: string | null;
};

export function parseNoteDetail(rawDetail: string | null): { status: NoteStatus; detail: string | null } {
  if (!rawDetail) return { status: "ประเด็นใหม่", detail: null };

  const str = rawDetail.trim();
  if (str.startsWith("[STATUS:ดำเนินการแล้ว]")) {
    const clean = str.replace("[STATUS:ดำเนินการแล้ว]", "").trim();
    return { status: "ดำเนินการแล้ว", detail: clean === "" ? null : clean };
  }

  if (str.startsWith("[STATUS:ประเด็นใหม่]")) {
    const clean = str.replace("[STATUS:ประเด็นใหม่]", "").trim();
    return { status: "ประเด็นใหม่", detail: clean === "" ? null : clean };
  }

  if (str.includes("ดำเนินการแล้ว") || str.includes("ดำเนินการเพิ่มเติมเรียบร้อยแล้ว")) {
    return { status: "ดำเนินการแล้ว", detail: str };
  }

  return { status: "ประเด็นใหม่", detail: str };
}

export function formatNoteDetail(status: NoteStatus, detailText: string | null): string | null {
  const clean = (detailText ?? "").trim();
  return `[STATUS:${status}] ${clean}`.trim();
}
