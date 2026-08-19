"use client";

import { useState } from "react";
import { createNote, updateNote, deleteNote } from "./actions";
import type { NoteItem, NoteStatus } from "@/lib/notes";

export function NotesTable({ notes }: { notes: NoteItem[] }) {
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  return (
    <div className="mt-8 flex flex-col gap-8">
      {/* Create Form Card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          ➕ เพิ่มประเด็นใหม่
        </h2>
        <form action={createNote} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">หัวข้อ</span>
              <input
                type="text"
                name="topic"
                required
                placeholder="ระบุหัวข้อประเด็นเพิ่มเติม..."
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">สถานะ</span>
              <select
                name="status"
                defaultValue="ประเด็นใหม่"
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              >
                <option value="ประเด็นใหม่">🔵 ประเด็นใหม่</option>
                <option value="ดำเนินการแล้ว">🟢 ดำเนินการแล้ว</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">รายละเอียด (ถ้ามี)</span>
            <textarea
              name="detail"
              rows={2}
              placeholder="ระบุรายละเอียดเพิ่มเติม..."
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            />
          </label>
          <button
            type="submit"
            className="self-start rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white shadow hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            บันทึกประเด็น
          </button>
        </form>
      </div>

      {/* Notes History Table Card */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            📋 ตารางประวัติประเด็นเพิ่มเติม
          </h2>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            ทั้งหมด {notes.length} รายการ
          </span>
        </div>

        {notes.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-400">
            ยังไม่มีบันทึกประเด็นเพิ่มเติมในระบบ
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/50 dark:text-neutral-400">
                  <th className="px-6 py-3.5">วันที่บันทึก</th>
                  <th className="px-6 py-3.5">หัวข้อ</th>
                  <th className="px-6 py-3.5">รายละเอียด</th>
                  <th className="px-6 py-3.5">สถานะ</th>
                  <th className="px-6 py-3.5 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {notes.map((note) => {
                  const isDone = note.status === "ดำเนินการแล้ว";
                  return (
                    <tr
                      key={note.id}
                      className="hover:bg-neutral-50/50 dark:hover:bg-neutral-950/50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-neutral-500 dark:text-neutral-400">
                        {formatDate(note.created_at)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-neutral-100">
                        {note.topic}
                      </td>
                      <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                        {note.detail ? (
                          <p className="whitespace-pre-wrap">{note.detail}</p>
                        ) : (
                          <span className="text-neutral-400 dark:text-neutral-600">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isDone
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isDone ? "bg-emerald-500" : "bg-blue-500"
                            }`}
                          />
                          {note.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setEditingNote(note)}
                            className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                          >
                            แก้ไข
                          </button>
                          <form
                            action={deleteNote.bind(null, note.id)}
                            onSubmit={(e) => {
                              if (!confirm(`ยืนยันการลบหัวข้อ "${note.topic}" ?`)) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <button
                              type="submit"
                              className="text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
                            >
                              ลบ
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-800">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                ✏️ แก้ไขประเด็นเพิ่มเติม
              </h3>
              <button
                onClick={() => setEditingNote(null)}
                className="text-sm font-semibold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await updateNote(formData);
                setEditingNote(null);
              }}
              className="mt-4 flex flex-col gap-4"
            >
              <input type="hidden" name="id" value={editingNote.id} />

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">หัวข้อ</span>
                <input
                  type="text"
                  name="topic"
                  required
                  defaultValue={editingNote.topic}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">สถานะ</span>
                <select
                  name="status"
                  defaultValue={editingNote.status}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                >
                  <option value="ประเด็นใหม่">🔵 ประเด็นใหม่</option>
                  <option value="ดำเนินการแล้ว">🟢 ดำเนินการแล้ว</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">รายละเอียด (ถ้ามี)</span>
                <textarea
                  name="detail"
                  rows={3}
                  defaultValue={editingNote.detail ?? ""}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
              </label>

              <div className="mt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
