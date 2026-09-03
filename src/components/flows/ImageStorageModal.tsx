"use client";

import { useState, useEffect } from "react";
import { FileImage, Trash2, X, RefreshCw, Copy, Check, HardDrive, ExternalLink } from "lucide-react";
import { listFlowImagesAction, deleteFlowImageAction } from "@/app/flows/actions";

interface ImageStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (url: string) => void;
}

interface StorageImageItem {
  name: string;
  size: number;
  createdAt: string | null;
  url: string;
}

export function ImageStorageModal({ isOpen, onClose, onSelectImage }: ImageStorageModalProps) {
  const [images, setImages] = useState<StorageImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fetchImages = async () => {
    try {
      setIsLoading(true);
      const data = await listFlowImagesAction();
      setImages(data);
    } catch (err) {
      console.error("Failed to load storage images:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchImages();
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
        setImages((prev) => prev.filter((img) => img.url !== url));
      } else {
        alert("ไม่สามารถลบไฟล์ได้ กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err) {
      console.error("Error deleting image:", err);
    } finally {
      setDeletingName(null);
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>จัดการไฟล์รูปภาพใน Storage (Supabase Storage)</span>
              </h3>
              <p className="text-xs text-neutral-400">
                รายการรูปภาพทั้งหมดใน Bucket <code className="font-mono text-blue-600 dark:text-blue-400">flow-images</code> ({images.length} ไฟล์)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchImages}
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

        {/* Modal Content / Images Grid */}
        <div className="flex-1 overflow-y-auto py-4 min-h-[300px]">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              <span>กำลังโหลดรายการรูปภาพจาก Storage...</span>
            </div>
          ) : images.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-400 dark:text-neutral-500">
              ยังไม่มีไฟล์รูปภาพใน Storage — เมื่อมีการแทรกรูปในขั้นตอนจะปรากฏที่นี่
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img) => (
                <div
                  key={img.name}
                  className="group relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 transition-all hover:border-blue-400"
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="mt-3">
                    <p className="truncate text-xs font-semibold text-neutral-800 dark:text-neutral-200" title={img.name}>
                      {img.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
                      <span>{(img.size / 1024).toFixed(1)} KB</span>
                      <span>{img.createdAt ? new Date(img.createdAt).toLocaleDateString("th-TH") : "-"}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => handleCopy(img.url)}
                      className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400"
                      title="คัดลอก URL"
                    >
                      {copiedUrl === img.url ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-500 font-semibold">คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>คัดลอก URL</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(img.url, img.name)}
                      disabled={deletingName === img.name}
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
