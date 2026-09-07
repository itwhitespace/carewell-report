"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Info,
  Lightbulb,
  AlertTriangle,
  Eye,
  Edit3,
  Check,
  Loader2,
  Minus,
  Image as ImageIcon,
  Video,
  Highlighter,
  Palette,
  Upload,
  Save,
  Columns,
  Trash2,
  HardDrive,
} from "lucide-react";
import { MarkdownViewer } from "./MarkdownViewer";
import { ImageStorageModal } from "./ImageStorageModal";
import type { FlowStep } from "@/lib/flows";
import { uploadFlowImageAction, uploadFlowMediaAction, deleteFlowImageAction } from "@/app/flows/actions";

export function FlowEditor({
  step,
  onSaveStep,
  onDraftChange,
}: {
  step: FlowStep;
  onSaveStep: (stepId: string, title: string, content: string) => Promise<void>;
  onDraftChange?: (isDirty: boolean, title: string, content: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"read" | "edit" | "split">("split");
  const [title, setTitle] = useState(step.title);
  const [content, setContent] = useState(step.content ?? "");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Sync state when step prop changes
  useEffect(() => {
    setTitle(step.title);
    setContent(step.content ?? "");
    setSaveStatus("saved");
  }, [step.id, step.title, step.content]);

  // Calculate dirty state
  const isDirty = title !== step.title || content !== (step.content ?? "");

  // Notify parent of draft changes
  useEffect(() => {
    onDraftChange?.(isDirty, title, content);
  }, [isDirty, title, content, onDraftChange]);

  // Extract inserted markdown images and videos (both direct URLs, HTML video tags, and reference URLs)
  const extractedMedia = useMemo(() => {
    const refMap = new Map<string, string>();
    const rawLines = content.split("\n");
    for (const l of rawLines) {
      const refMatch = l.trim().match(/^\[([a-zA-Z0-9_-]+)\]:\s*(.+)$/);
      if (refMatch) {
        refMap.set(refMatch[1].toLowerCase(), refMatch[2].trim());
      }
    }

    const items: Array<{
      id: string;
      type: "image" | "video";
      alt: string;
      src: string;
      fullMarkup: string;
      refKey?: string | null;
    }> = [];

    // 1. Markdown images or videos ![alt](url) or ![alt][ref]
    const imageMatches = Array.from(content.matchAll(/!\[([^\]]*)\](?:\(([^)]+)\)|\[([^\]]+)\])/g));
    imageMatches.forEach((match, idx) => {
      const alt = match[1] || "สื่อประกอบ";
      let src = match[2] || "";
      const refKey = match[3];
      if (!src && refKey && refMap.has(refKey.toLowerCase())) {
        src = refMap.get(refKey.toLowerCase())!;
      }
      if (src) {
        const ext = src.split(".").pop()?.split("?")[0].toLowerCase() || "";
        const isVideo = ["mp4", "webm", "ogg", "mov", "m4v"].includes(ext) || alt.toLowerCase().includes("video") || alt.includes("วีดีโอ");
        items.push({
          id: `img-${idx}`,
          type: isVideo ? "video" : "image",
          alt,
          src,
          fullMarkup: match[0],
          refKey: refKey || null,
        });
      }
    });

    // 2. HTML <video src="..."> tags
    const videoMatches = Array.from(content.matchAll(/<video\s+[^>]*src=["']([^"']+)["'][^>]*>(?:<\/video>)?/gi));
    videoMatches.forEach((match, idx) => {
      const src = match[1];
      if (src) {
        items.push({
          id: `vid-${idx}`,
          type: "video",
          alt: "วีดีโอประกอบ",
          src,
          fullMarkup: match[0],
          refKey: null,
        });
      }
    });

    return items;
  }, [content]);

  const handleRemoveMedia = (fullMarkup: string, refKey?: string | null, src?: string) => {
    if (src && src.includes("/storage/v1/object/public/flow-images/")) {
      deleteFlowImageAction(src).catch((err) =>
        console.error("Storage deletion warning:", err)
      );
    }
    setContent((prev) => {
      let updated = prev.replace(fullMarkup, "");
      if (refKey) {
        const lines = updated.split("\n").filter((l) => !l.trim().toLowerCase().startsWith(`[${refKey.toLowerCase()}]:`));
        updated = lines.join("\n");
      }
      return updated.trim();
    });
  };

  // Manual save handler
  const handleManualSave = useCallback(async () => {
    try {
      setSaveStatus("saving");
      await onSaveStep(step.id, title, content);
      setSaveStatus("saved");
      const now = new Date();
      setLastSavedTime(
        now.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (err) {
      console.error("Manual save failed:", err);
      setSaveStatus("error");
    }
  }, [step.id, title, content, onSaveStep]);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleManualSave]);

  // Insert snippet helper into textarea
  function insertSnippet(prefix: string, suffix = "") {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || (suffix ? "ข้อความ" : "")}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || (suffix ? 6 : 0)));
    }, 50);
  }

  function insertLinePrefix(prefix: string) {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const newContent = content.substring(0, lineStart) + prefix + content.substring(lineStart);
    setContent(newContent);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 50);
  }

  function insertCallout(type: "NOTE" | "TIP" | "WARNING" | "IMPORTANT") {
    const callout = `> [!${type}]\n> เขียนข้อความแจ้งเตือนรายละเอียดขั้นตอนที่นี่...\n\n`;
    insertSnippet(callout);
  }

  function insertCodeBlock() {
    const code = `\`\`\`javascript\n// เขียนโค้ดหรือสคริปต์ตัวอย่างที่นี่\nconsole.log("Hello CareWell");\n\`\`\`\n\n`;
    insertSnippet(code);
  }

  function insertColumnsBlock() {
    const template = `:::columns\n### รายละเอียดข้อความ (ฝั่งซ้าย)\nเขียนอธิบายขั้นตอนการทำงานหรือรายละเอียดระบบที่นี่...\n\n---\n### รูปภาพหรือวีดีโอประกอบ (ฝั่งขวา)\n![คำอธิบายภาพ|medium](แทรกลิงก์รูปภาพที่นี่)\n:::\n\n`;
    insertSnippet(template);
  }

  // Handle Image Upload
  async function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const imageName = file.name ? file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_") : "ภาพประกอบ_UI";

    try {
      setSaveStatus("saving");
      const formData = new FormData();
      formData.append("file", file);
      const publicUrl = await uploadFlowImageAction(formData);

      const markdownImage = `\n![${imageName}](${publicUrl})\n\n`;
      insertSnippet(markdownImage);
      setSaveStatus("unsaved");
    } catch (err) {
      console.warn("Storage upload notice (falling back to reference style):", err);
      try {
        const dataUrl = await compressImage(file, 1400, 0.82);
        const refId = `img_${Date.now()}`;
        const refTag = `![${imageName}][${refId}]`;
        const refDefinition = `\n\n[${refId}]: ${dataUrl}`;

        insertSnippet(`\n${refTag}\n`);
        setContent((prev) => prev + refDefinition);
        setSaveStatus("unsaved");
      } catch (cErr) {
        console.error("Image processing error:", cErr);
        setSaveStatus("error");
      }
    }
  }

  // Handle Video Upload
  async function handleVideoFile(file: File) {
    if (!file.type.startsWith("video/")) return;
    const videoName = file.name ? file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_") : "วีดีโอประกอบ";

    try {
      setSaveStatus("saving");
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadFlowMediaAction(formData);

      const videoMarkup = `\n<video src="${res.url}" controls class="w-full rounded-xl my-4"></video>\n\n`;
      insertSnippet(videoMarkup);
      setSaveStatus("unsaved");
    } catch (err) {
      console.error("Video upload error:", err);
      alert("เกิดข้อผิดพลาดในการอัปโหลดวีดีโอ กรุณาลองใหม่อีกครั้ง");
      setSaveStatus("error");
    }
  }

  // Handle Paste Image/Video (Ctrl+V)
  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) handleImageFile(file);
      } else if (items[i].type.indexOf("video") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) handleVideoFile(file);
      }
    }
  }

  // Handle Drag & Drop Image/Video
  function handleDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith("image/")) {
          handleImageFile(files[i]);
        } else if (files[i].type.startsWith("video/")) {
          handleVideoFile(files[i]);
        }
      }
    }
  }

  const handleSelectMediaFromStorage = (url: string, type: "image" | "video") => {
    if (type === "video") {
      const snippet = `\n<video src="${url}" controls class="w-full rounded-xl my-4"></video>\n\n`;
      insertSnippet(snippet);
    } else {
      const snippet = `\n![รูปภาพประกอบ](${url})\n\n`;
      insertSnippet(snippet);
    }
  };

  // Render formatting toolbar
  const renderToolbar = () => (
    <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 dark:border-neutral-800 dark:bg-neutral-950">
      <ToolbarButton onClick={() => insertLinePrefix("# ")} title="Header 1 (#)" icon={Heading1} />
      <ToolbarButton onClick={() => insertLinePrefix("## ")} title="Header 2 (##)" icon={Heading2} />
      <ToolbarButton onClick={() => insertLinePrefix("### ")} title="Header 3 (###)" icon={Heading3} />

      <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800 mx-1" />

      <ToolbarButton onClick={() => insertSnippet("**", "**")} title="Bold (**text**)" icon={Bold} />
      <ToolbarButton onClick={() => insertSnippet("*", "*")} title="Italic (*text*)" icon={Italic} />
      <ToolbarButton onClick={() => insertSnippet("`", "`")} title="Inline Code (`code`)" icon={Code} />

      <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800 mx-1" />

      <ToolbarButton onClick={() => insertSnippet("==", "==")} title="ไฮไลต์สีเหลือง (==ข้อความ==)" icon={Highlighter} label="เหลือง" />
      <ToolbarButton onClick={() => insertSnippet('<mark class="green">', "</mark>")} title="ไฮไลต์สีเขียว" icon={Highlighter} label="เขียว" />
      <ToolbarButton onClick={() => insertSnippet('<mark class="blue">', "</mark>")} title="ไฮไลต์สีฟ้า" icon={Highlighter} label="ฟ้า" />
      <ToolbarButton onClick={() => insertSnippet('<mark class="rose">', "</mark>")} title="ไฮไลต์สีแดง" icon={Highlighter} label="ชมพู" />

      <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800 mx-1" />

      <ToolbarButton onClick={() => insertSnippet('<span class="red">', "</span>")} title="ตัวหนังสือสีแดง" icon={Palette} label="ตัวอักษรแดง" />
      <ToolbarButton onClick={() => insertSnippet('<span class="blue">', "</span>")} title="ตัวหนังสือสีฟ้า" icon={Palette} label="ตัวอักษรฟ้า" />

      <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800 mx-1" />

      <button
        type="button"
        onClick={insertColumnsBlock}
        className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
        title="แทรกเลเอาต์ 2 คอลัมน์ (ข้อความอยู่ซ้าย รูปภาพ/วีดีโออยู่ขวา)"
      >
        <Columns className="h-3.5 w-3.5 text-emerald-600" />
        <span>แทรก 2 คอลัมน์</span>
      </button>

      <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800 mx-1" />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 transition-colors"
        title="เลือกรูปภาพจากเครื่อง หรือวางรูป (Ctrl+V) ลงในช่องพิมพ์"
      >
        <ImageIcon className="h-3.5 w-3.5" />
        <span>แทรกรูปภาพ</span>
      </button>

      <button
        type="button"
        onClick={() => videoInputRef.current?.click()}
        className="flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 transition-colors"
        title="เลือกไฟล์วีดีโอจากเครื่อง หรือวางวีดีโอลงในช่องพิมพ์"
      >
        <Video className="h-3.5 w-3.5 text-purple-600" />
        <span>แทรกวีดีโอ</span>
      </button>

      <button
        type="button"
        onClick={() => setIsStorageModalOpen(true)}
        className="flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors"
        title="ดูและลบไฟล์รูปภาพ/วีดีโอทั้งหมดใน Supabase Storage"
      >
        <HardDrive className="h-3.5 w-3.5 text-blue-500" />
        <span>จัดการ Storage</span>
      </button>

      <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800 mx-1" />

      <ToolbarButton onClick={() => insertLinePrefix("- ")} title="Bullet List (-)" icon={List} />
      <ToolbarButton onClick={() => insertLinePrefix("1. ")} title="Numbered List (1.)" icon={ListOrdered} />
      <ToolbarButton onClick={() => insertLinePrefix("- [ ] ")} title="Checklist (- [ ])" icon={CheckSquare} />

      <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800 mx-1" />

      <ToolbarButton onClick={() => insertCallout("NOTE")} title="Insert Note Box" icon={Info} label="Note" />
      <ToolbarButton onClick={() => insertCallout("TIP")} title="Insert Tip Box" icon={Lightbulb} label="Tip" />
      <ToolbarButton onClick={() => insertCallout("WARNING")} title="Insert Warning Box" icon={AlertTriangle} label="Warning" />
      <ToolbarButton onClick={insertCodeBlock} title="Insert Code Block" icon={Code} label="Code" />
      <ToolbarButton onClick={() => insertLinePrefix("---\n")} title="Horizontal Divider" icon={Minus} />
    </div>
  );

  // Render textarea and hints
  const renderTextarea = () => (
    <>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onPaste={handlePaste}
        onDrop={handleDrop}
        placeholder="พิมพ์เนื้อหาขั้นตอน UI/UX Layout ที่นี่... (สามารถกดวางรูปภาพ/วีดีโอ Ctrl+V หรือลากไฟล์มาวางได้โดยตรง)"
        rows={viewMode === "split" ? 14 : 18}
        className="w-full rounded-xl border border-neutral-300 bg-white p-4 font-mono text-sm leading-relaxed text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <span>🎬 **คำแนะนำ**: กดปุ่ม &quot;แทรกรูปภาพ&quot; / &quot;แทรกวีดีโอ&quot; หรือกดวาง (**Ctrl + V**) / ลากไฟล์สื่อมาวางในช่องพิมพ์ได้ทันที</span>
        <div className="flex items-center gap-3">
          <span className="text-neutral-400">💡 กด <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-[10px] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">Ctrl + S</kbd> เพื่อบันทึก</span>
          <button
            type="button"
            onClick={handleManualSave}
            disabled={saveStatus === "saving" || !isDirty}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              isDirty
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 disabled:opacity-50"
            }`}
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isDirty ? "บันทึกข้อมูล" : "บันทึกแล้ว"}</span>
          </button>
        </div>
      </div>
    </>
  );

  // Render Inline Media Gallery (Images & Videos)
  const renderMediaGallery = () => (
    <>
      {extractedMedia.length > 0 && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                🎬 สื่อรูปภาพและวีดีโอประกอบจริงในขั้นตอน ({extractedMedia.length} รายการ)
              </span>
            </div>
            <span className="text-[11px] text-neutral-400">แสดงรูป/วีดีโอจริงให้เห็นทันที ไม่ต้องกดสลับหน้า</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {extractedMedia.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl border border-neutral-200 bg-white p-2 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 flex flex-col justify-between"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-900 flex items-center justify-center border border-neutral-100 dark:border-neutral-800">
                  {item.type === "video" ? (
                    <video
                      src={item.src}
                      controls
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.src}
                      alt={item.alt}
                      className="h-full w-full object-contain bg-neutral-100 dark:bg-neutral-950"
                    />
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="truncate text-[10px] font-medium text-neutral-700 dark:text-neutral-300 max-w-[100px]" title={item.alt}>
                    {item.type === "video" ? "🎥 วีดีโอ" : "📷 รูปภาพ"}: {item.alt}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(item.fullMarkup, item.refKey, item.src)}
                    title="ลบไฟล์นี้ออกจากเนื้อหาและ Storage"
                    className="rounded-md p-1 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {/* Hidden file input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleImageFile(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />

      {/* Hidden file input for Video Upload */}
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleVideoFile(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />

      {/* Header bar: Title, Mode toggle, Manual save button */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <div className="flex-1">
          {viewMode !== "read" ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ตั้งชื่อขั้นตอน UI/UX Layout..."
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-lg font-bold text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            />
          ) : (
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{title}</h2>
          )}
        </div>

        {/* Mode switch & save indicator */}
        <div className="flex items-center gap-3">
          {/* Manual Save Button */}
          <button
            type="button"
            onClick={handleManualSave}
            disabled={saveStatus === "saving" || (!isDirty && saveStatus === "saved")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all ${
              saveStatus === "saving"
                ? "bg-amber-500 text-white cursor-wait opacity-80"
                : isDirty
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95 animate-pulse"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
            }`}
          >
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : isDirty ? (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>บันทึกข้อมูล</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>บันทึกแล้ว {lastSavedTime ? `(${lastSavedTime})` : ""}</span>
              </>
            )}
          </button>

          {/* Mode Switcher Buttons */}
          <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-950">
            <button
              onClick={() => setViewMode("read")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                viewMode === "read"
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>อ่านเนื้อหา (Read)</span>
            </button>
            <button
              onClick={() => setViewMode("edit")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                viewMode === "edit"
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>แก้ไข (Edit)</span>
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                viewMode === "split"
                  ? "bg-blue-600 text-white shadow-sm dark:bg-blue-600"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
              title="ดูหน้าแก้ไขและตัวอย่างรูปภาพ/เอกสารจริงแบบสองช่องคู่ขนาน"
            >
              <Columns className="h-3.5 w-3.5" />
              <span>ตัวอย่างสด (Split)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Body */}
      {viewMode === "read" ? (
        <div className="p-6">
          <MarkdownViewer content={content} />
        </div>
      ) : viewMode === "split" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Left Column: Editor & Media Gallery */}
          <div className="flex flex-col">
            <div className="mb-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
              <span>📝 ช่องแก้ไขเนื้อหา (Markdown, Image & Video Input)</span>
            </div>
            {renderToolbar()}
            {renderTextarea()}
            {renderMediaGallery()}
          </div>

          {/* Right Column: Real-time Live Rendered Preview */}
          <div className="flex flex-col">
            <div className="mb-2 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                <span>Preview</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-normal">แสดงผลรูปภาพ วีดีโอ และการจัดรูปแบบจริงทันที</span>
            </div>
            <div className="flex-1 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-y-auto max-h-[800px] min-h-[500px]">
              <div className="mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{title}</h1>
              </div>
              <MarkdownViewer content={content} />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6">
          {renderToolbar()}
          {renderTextarea()}
          {renderMediaGallery()}
        </div>
      )}

      {/* Image & Video Storage Management Modal */}
      <ImageStorageModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        onSelectMedia={handleSelectMediaFromStorage}
      />
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  title: string;
  icon: React.ElementType;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
    >
      <Icon className="h-3.5 w-3.5" />
      {label && <span>{label}</span>}
    </button>
  );
}

function compressImage(file: File, maxWidth = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

