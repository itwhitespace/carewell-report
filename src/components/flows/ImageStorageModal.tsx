"use client";

import { useState, useEffect } from "react";
import { FileImage, Video, Trash2, X, RefreshCw, Copy, Check, HardDrive, Plus } from "lucide-react";
import { listFlowImagesAction, deleteFlowImageAction } from "@/app/flows/actions";

interface ImageStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia?: (url: string, type: "image" | "video") => void;
  onSelectImage?: (url: string) => void;
}

interface StorageMediaItem {
  name: string;
  size: number;
  createdAt: string | null;
  url: string;
  type: "image" | "video";
}

export function ImageStorageModal({
  isOpen,
  onClose,
  onSelectMedia,
  onSelectImage,
}: ImageStorageModalProps) {
  const [items, setItems] = useState<StorageMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "image" | "video">("all");

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const data = await listFlowImagesAction();
      setItems(data as StorageMediaItem[]);
    } catch (err) {
      console.error("Failed to load storage media:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen]);

  const handleDelete = async (url: string, name: string) => {
    if (!confirm(`คุณต้องการลบไฟล์ "${name}" ออกจาก Supabase Storage ใช่หรือไม่?`)) {
      return;
    }
    try {
      setDeletingName(name);
      const ok = await deleteFlowImageAction(url);
      if (ok) {
        setItems((prev) => prev.filter((item) => item.url !== url));
      } else {
        alert("ไม่สามารถลบไฟล์ได้ กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err) {
      console.error("Error deleting media:", err);
    } finally {
      setDeletingName(null);
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleSelect = (url: string, type: "image" | "video") => {
    if (onSelectMedia) {
      onSelectMedia(url, type);
    } else if (onSelectImage && type === "image") {
      onSelectImage(url);
    }
    onClose();
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === "image") return item.type === "image";
    if (activeTab === "video") return item.type === "video";
    return true;
  });

  const imageCount = items.filter((i) => i.type === "image").length;
  const videoCount = items.filter((i) => i.type === "video").length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>จัดการไฟล์รูปภาพและวีดีโอใน Storage (Supabase Storage)</span>
              </h3>
              <p className="text-xs text-neutral-400">
                รายการไฟล์ทั้งหมดใน Bucket <code className="font-mono text-blue-600 dark:text-blue-400">flow-images</code> ({items.length} ไฟล์)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchItems}
              disabled={isLoading}
              className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="รีเฟรชรายการ"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-3 flex items-center gap-2 border-b border-neutral-100 pb-3 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "all"
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
            }`}
          >
            ทั้งหมด ({items.length})
          </button>
          <button
            onClick={() => setActiveTab("image")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "image"
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
            }`}
          >
            <FileImage className="h-3.5 w-3.5" />
            <span>รูปภาพ ({imageCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "video"
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            <span>วีดีโอ ({videoCount})</span>
          </button>
        </div>

        {/* Modal Content / Media Grid */}
        <div className="flex-1 overflow-y-auto py-4 min-h-[300px]">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              <span>กำลังโหลดรายการไฟล์สื่อจาก Storage...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-400 dark:text-neutral-500">
              {activeTab === "video"
                ? "ยังไม่มีไฟล์วีดีโอใน Storage — เมื่อมีการแทรกวีดีโอในขั้นตอนจะปรากฏที่นี่"
                : activeTab === "image"
                ? "ยังไม่มีไฟล์รูปภาพใน Storage — เมื่อมีการแทรกรูปในขั้นตอนจะปรากฏที่นี่"
                : "ยังไม่มีไฟล์สื่อใน Storage — เมื่อมีการอัปโหลดไฟล์จะปรากฏที่นี่"}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.name}
                  className="group relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 transition-all hover:border-blue-400"
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center">
                    {item.type === "video" ? (
                      <div className="relative h-full w-full flex items-center justify-center bg-neutral-950">
                        <video
                          src={item.url}
                          preload="metadata"
                          className="h-full w-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="flex items-center gap-1 rounded-full bg-blue-600/90 px-2.5 py-1 text-[10px] font-bold text-white shadow">
                            <Video className="h-3 w-3" />
                            <span>VIDEO</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="h-full w-full object-contain bg-white dark:bg-neutral-900"
                      />
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center gap-1">
                      {item.type === "video" ? (
                        <Video className="h-3 w-3 text-purple-500 shrink-0" />
                      ) : (
                        <FileImage className="h-3 w-3 text-blue-500 shrink-0" />
                      )}
                      <p className="truncate text-xs font-semibold text-neutral-800 dark:text-neutral-200" title={item.name}>
                        {item.name}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
                      <span>{(item.size / 1024).toFixed(1)} KB</span>
                      <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString("th-TH") : "-"}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-1 border-t border-neutral-100 pt-2 dark:border-neutral-800">
                    {(onSelectMedia || onSelectImage) && (
                      <button
                        type="button"
                        onClick={() => handleSelect(item.url, item.type)}
                        className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
                        title="แทรกไฟล์นี้ลงในเนื้อหา"
                      >
                        <Plus className="h-3 w-3" />
                        <span>แทรก</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopy(item.url)}
                      className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400"
                      title="คัดลอก URL"
                    >
                      {copiedUrl === item.url ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-500 font-semibold">คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>URL</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.url, item.name)}
                      disabled={deletingName === item.name}
                      className="p-1 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/60 rounded transition-colors disabled:opacity-50"
                      title="ลบไฟล์ออกจาก Storage"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-neutral-200 pt-3 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}

