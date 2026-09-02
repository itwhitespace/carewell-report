"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Highlighter,
  Palette,
  Upload,
} from "lucide-react";
import { MarkdownViewer } from "./MarkdownViewer";
import type { FlowStep } from "@/lib/flows";

export function FlowEditor({
  step,
  onSaveStep,
}: {
  step: FlowStep;
  onSaveStep: (stepId: string, title: string, content: string) => Promise<void>;
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [title, setTitle] = useState(step.title);
  const [content, setContent] = useState(step.content ?? "");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);

  // Sync state when step prop changes
  useEffect(() => {
    setTitle(step.title);
    setContent(step.content ?? "");
    setSaveStatus("saved");
    isFirstRender.current = true;
  }, [step.id, step.title, step.content]);

  // Save handler
  const performSave = useCallback(
    async (newTitle: string, newContent: string) => {
      try {
        setSaveStatus("saving");
        await onSaveStep(step.id, newTitle, newContent);
        setSaveStatus("saved");
        const now = new Date();
        setLastSavedTime(now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      } catch (err) {
        console.error("Auto-save failed:", err);
        setSaveStatus("error");
      }
    },
    [step.id, onSaveStep]
  );

  // Auto-save debounced effect (1000ms)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus("unsaved");
    const timer = setTimeout(() => {
      performSave(title, content);
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, content, performSave]);

  // Insert snippet helper into textarea
  function insertSnippet(prefix: string, suffix = "") {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || "ข้อความ"}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 6));
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

  // Handle Image File Conversion & Automatic Compression
  async function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    try {
      const dataUrl = await compressImage(file, 1400, 0.82);
      const imageName = file.name ? file.name.replace(/\.[^/.]+$/, "") : "ภาพประกอบ UI/UX";
      const markdownImage = `\n![${imageName}](${dataUrl})\n\n`;
      insertSnippet(markdownImage);
    } catch (err) {
      console.error("Image processing error:", err);
    }
  }

  // Handle Paste Image (Ctrl+V)
  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) handleImageFile(file);
      }
    }
  }

  // Handle Drag & Drop Image
  function handleDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith("image/")) {
          handleImageFile(files[i]);
        }
      }
    }
  }

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

      {/* Header bar: Title, Mode toggle, Auto-save status */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <div className="flex-1">
          {isEditMode ? (
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
          {/* Status Badge */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                กำลังบันทึก...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" />
                บันทึกแล้ว {lastSavedTime ? `(${lastSavedTime})` : ""}
              </span>
            )}
            {saveStatus === "unsaved" && (
              <span className="text-neutral-400 dark:text-neutral-500">มีการเปลี่ยนแปลง...</span>
            )}
            {saveStatus === "error" && (
              <span className="font-medium text-red-600 dark:text-red-400">เกิดข้อผิดพลาดในการบันทึก</span>
            )}
          </div>

          {/* Mode Switcher Buttons */}
          <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-950">
            <button
              onClick={() => setIsEditMode(false)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                !isEditMode
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              อ่านเนื้อหา (Read)
            </button>
            <button
              onClick={() => setIsEditMode(true)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                isEditMode
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              แก้ไข (Edit)
            </button>
          </div>
        </div>
      </div>

      {/* Editor Body */}
      {isEditMode ? (
        <div className="p-6">
          {/* Formatting Toolbar */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 dark:border-neutral-800 dark:bg-neutral-950">
            {/* Headings */}
            <ToolbarButton onClick={() => insertLinePrefix("# ")} title="Header 1 (#)" icon={Heading1} />
            <ToolbarButton onClick={() => insertLinePrefix("## ")} title="Header 2 (##)" icon={Heading2} />
            <ToolbarButton onClick={() => insertLinePrefix("### ")} title="Header 3 (###)" icon={Heading3} />

            <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800 mx-1" />

            {/* Basic Styling */}
            <ToolbarButton onClick={() => insertSnippet("**", "**")} title="Bold (**text**)" icon={Bold} />
            <ToolbarButton onClick={() => insertSnippet("*", "*")} title="Italic (*text*)" icon={Italic} />
            <ToolbarButton onClick={() => insertSnippet("`", "`")} title="Inline Code (`code`)" icon={Code} />

            <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800 mx-1" />

            {/* Color Highlights (ไฮไลต์สี) */}
            <ToolbarButton onClick={() => insertSnippet("==", "==")} title="ไฮไลต์สีเหลือง (==ข้อความ==)" icon={Highlighter} label="เหลือง" />
            <ToolbarButton onClick={() => insertSnippet('<mark class="green">', "</mark>")} title="ไฮไลต์สีเขียว" icon={Highlighter} label="เขียว" />
            <ToolbarButton onClick={() => insertSnippet('<mark class="blue">', "</mark>")} title="ไฮไลต์สีฟ้า" icon={Highlighter} label="ฟ้า" />
            <ToolbarButton onClick={() => insertSnippet('<mark class="rose">', "</mark>")} title="ไฮไลต์สีแดง" icon={Highlighter} label="ชมพู" />

            <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800 mx-1" />

            {/* Text Colors (สีตัวหนังสือ) */}
            <ToolbarButton onClick={() => insertSnippet('<span class="red">', "</span>")} title="ตัวหนังสือสีแดง" icon={Palette} label="ตัวอักษรแดง" />
            <ToolbarButton onClick={() => insertSnippet('<span class="blue">', "</span>")} title="ตัวหนังสือสีฟ้า" icon={Palette} label="ตัวอักษรฟ้า" />

            <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800 mx-1" />

            {/* Image Upload & Insertion */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 transition-colors"
              title="เลือกรูปภาพจากเครื่อง หรือวางรูป (Ctrl+V) ลงในช่องพิมพ์"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>แทรกรูปภาพ</span>
            </button>

            <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800 mx-1" />

            {/* Lists & Extras */}
            <ToolbarButton onClick={() => insertLinePrefix("- ")} title="Bullet List (-)" icon={List} />
            <ToolbarButton onClick={() => insertLinePrefix("1. ")} title="Numbered List (1.)" icon={ListOrdered} />
            <ToolbarButton onClick={() => insertLinePrefix("- [ ] ")} title="Checklist (- [ ])" icon={CheckSquare} />

            <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-800 mx-1" />

            {/* Callouts */}
            <ToolbarButton onClick={() => insertCallout("NOTE")} title="Insert Note Box" icon={Info} label="Note" />
            <ToolbarButton onClick={() => insertCallout("TIP")} title="Insert Tip Box" icon={Lightbulb} label="Tip" />
            <ToolbarButton onClick={() => insertCallout("WARNING")} title="Insert Warning Box" icon={AlertTriangle} label="Warning" />
            <ToolbarButton onClick={insertCodeBlock} title="Insert Code Block" icon={Code} label="Code" />
            <ToolbarButton onClick={() => insertLinePrefix("---\n")} title="Horizontal Divider" icon={Minus} />
          </div>

          {/* Markdown Input Area with Paste & Drag-and-Drop Image handlers */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={handlePaste}
            onDrop={handleDrop}
            placeholder="พิมพ์เนื้อหาขั้นตอน UI/UX Layout ที่นี่... (สามารถกดวางรูปภาพ Ctrl+V หรือลากรูปภาพมาวางได้โดยตรง)"
            rows={18}
            className="w-full rounded-xl border border-neutral-300 bg-white p-4 font-mono text-sm leading-relaxed text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          />
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400 dark:text-neutral-500">
            <span>🖼️ **คำแนะนำ**: กดปุ่ม &quot;แทรกรูปภาพ&quot; หรือกดวางรูปภาพ (**Ctrl + V**) / ลากไฟล์รูปมาวางในช่องพิมพ์ได้ทันที</span>
            <span>💡 **Auto-save**: ระบบบันทึกอัตโนมัติเมื่อหยุดพิมพ์ 1 วินาที</span>
          </div>
        </div>
      ) : (
        <div className="p-6">
          <MarkdownViewer content={content} />
        </div>
      )}
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
