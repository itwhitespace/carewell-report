"use client";

import { useState } from "react";
import { Check, Copy, Info, Lightbulb, AlertTriangle, AlertCircle, Image as ImageIcon } from "lucide-react";

export function MarkdownViewer({ content }: { content: string }) {
  if (!content || !content.trim()) {
    return (
      <div className="py-12 text-center text-sm text-neutral-400 dark:text-neutral-500">
        ยังไม่มีเนื้อหาในขั้นตอนนี้ — กดปุ่ม &quot;แก้ไข (Edit)&quot; เพื่อพิมพ์บันทึกรายละเอียด
      </div>
    );
  }

  // Extract reference link definitions e.g. [img_123]: data:image/jpeg;base64,...
  const refMap = new Map<string, string>();
  const rawLines = content.split("\n");
  const cleanLines: string[] = [];

  for (const l of rawLines) {
    const refMatch = l.trim().match(/^\[([a-zA-Z0-9_-]+)\]:\s*(.+)$/);
    if (refMatch) {
      refMap.set(refMatch[1].toLowerCase(), refMatch[2].trim());
    } else {
      cleanLines.push(l);
    }
  }

  const renderedElements = parseMarkdownToElements(cleanLines.join("\n"), refMap);

  return <div className="prose dark:prose-invert max-w-none">{renderedElements}</div>;
}

function parseMarkdownToElements(content: string, refMap: Map<string, string>): React.ReactNode[] {
  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];
  let currentCodeBlock: { lang: string; lines: string[] } | null = null;
  let currentCalloutBlock: { type: string; lines: string[] } | null = null;
  let currentListBlock: { type: "bullet" | "number" | "check"; items: { text: string; checked?: boolean }[] } | null = null;
  let currentColumnBlock: { lines: string[] } | null = null;

  function flushList() {
    if (!currentListBlock) return;
    const { type, items } = currentListBlock;
    if (type === "bullet") {
      renderedElements.push(
        <ul key={`list-${renderedElements.length}`} className="my-3 list-disc space-y-1.5 pl-6 text-neutral-800 dark:text-neutral-200">
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item.text)}</li>
          ))}
        </ul>
      );
    } else if (type === "number") {
      renderedElements.push(
        <ol key={`list-${renderedElements.length}`} className="my-3 list-decimal space-y-1.5 pl-6 text-neutral-800 dark:text-neutral-200">
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item.text)}</li>
          ))}
        </ol>
      );
    } else if (type === "check") {
      renderedElements.push(
        <div key={`list-${renderedElements.length}`} className="my-3 space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <input
                type="checkbox"
                checked={item.checked}
                readOnly
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-700"
              />
              <span className={`text-sm ${item.checked ? "text-neutral-400 line-through dark:text-neutral-500" : "text-neutral-800 dark:text-neutral-200"}`}>
                {renderInlineMarkdown(item.text)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    currentListBlock = null;
  }

  function flushCallout() {
    if (!currentCalloutBlock) return;
    const { type, lines } = currentCalloutBlock;
    const calloutText = lines.join("\n");

    let bgClass = "bg-blue-50 border-blue-500 text-blue-950 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-200";
    let Icon = Info;
    let title = "NOTE";

    if (type === "TIP") {
      bgClass = "bg-emerald-50 border-emerald-500 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-500 dark:text-emerald-200";
      Icon = Lightbulb;
      title = "TIP";
    } else if (type === "WARNING") {
      bgClass = "bg-amber-50 border-amber-500 text-amber-950 dark:bg-amber-950/40 dark:border-amber-500 dark:text-amber-200";
      Icon = AlertTriangle;
      title = "WARNING";
    } else if (type === "IMPORTANT" || type === "CAUTION") {
      bgClass = "bg-rose-50 border-rose-500 text-rose-950 dark:bg-rose-950/40 dark:border-rose-500 dark:text-rose-200";
      Icon = AlertCircle;
      title = "IMPORTANT";
    }

    renderedElements.push(
      <div
        key={`callout-${renderedElements.length}`}
        className={`my-4 rounded-xl border-l-4 p-4 shadow-sm ${bgClass}`}
      >
        <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider mb-1.5 opacity-90">
          <Icon className="h-4 w-4" />
          <span>{title}</span>
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {renderInlineMarkdown(calloutText)}
        </div>
      </div>
    );
    currentCalloutBlock = null;
  }

  function flushCode() {
    if (!currentCodeBlock) return;
    const { lang, lines } = currentCodeBlock;
    const codeText = lines.join("\n");
    renderedElements.push(
      <CodeBlockViewer key={`code-${renderedElements.length}`} code={codeText} lang={lang} />
    );
    currentCodeBlock = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check :::columns block start / end
    if (line.trim().startsWith(":::columns")) {
      flushList();
      flushCallout();
      flushCode();
      currentColumnBlock = { lines: [] };
      continue;
    }

    if (currentColumnBlock) {
      if (line.trim() === ":::") {
        // Flush 2-column block
        const colContent = currentColumnBlock.lines.join("\n");
        const colParts = colContent.split(/^---$/m);
        const col1Lines = colParts[0] || "";
        const col2Lines = colParts[1] || "";

        renderedElements.push(
          <div key={`col-${i}`} className="my-6 grid grid-cols-1 gap-6 md:grid-cols-2 rounded-2xl border border-neutral-200/80 bg-neutral-50/30 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/30">
            <div className="space-y-3">
              {parseMarkdownToElements(col1Lines, refMap)}
            </div>
            <div className="space-y-3 border-t border-neutral-200/60 pt-4 md:border-t-0 md:border-l md:pl-6 md:pt-0 dark:border-neutral-800/60">
              {parseMarkdownToElements(col2Lines, refMap)}
            </div>
          </div>
        );
        currentColumnBlock = null;
      } else {
        currentColumnBlock.lines.push(line);
      }
      continue;
    }

    // Check Code Block Start / End
    if (line.trim().startsWith("```")) {
      if (currentCodeBlock) {
        flushCode();
      } else {
        flushList();
        flushCallout();
        const lang = line.trim().slice(3).trim();
        currentCodeBlock = { lang, lines: [] };
      }
      continue;
    }

    if (currentCodeBlock) {
      currentCodeBlock.lines.push(line);
      continue;
    }

    // Check Callout Block `> [!NOTE]`
    const calloutMatch = line.match(/^>\s*\[\!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]/i);
    if (calloutMatch) {
      flushList();
      flushCallout();
      currentCalloutBlock = { type: calloutMatch[1].toUpperCase(), lines: [] };
      continue;
    }

    if (currentCalloutBlock) {
      if (line.startsWith(">")) {
        currentCalloutBlock.lines.push(line.replace(/^>\s?/, ""));
        continue;
      } else if (line.trim() === "") {
        flushCallout();
        continue;
      } else {
        flushCallout();
      }
    }

    // Check raw HTML <img src="..." width="..." alt="..." />
    const htmlImgMatch = line.trim().match(/^<img\s+([^>]+)\/?>$/i);
    if (htmlImgMatch) {
      flushList();
      const attrStr = htmlImgMatch[1];
      const srcMatch = attrStr.match(/src=["']([^"']+)["']/i);
      const widthMatch = attrStr.match(/width=["']([^"']+)["']/i);
      const altMatch = attrStr.match(/alt=["']([^"']+)["']/i);
      if (srcMatch) {
        const imageUrl = srcMatch[1];
        const width = widthMatch ? widthMatch[1] : undefined;
        const altText = altMatch ? altMatch[1] : "";
        renderedElements.push(
          <div key={`img-html-${i}`} className="my-6 flex flex-col items-center justify-center rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40 shadow-sm">
            <img
              src={imageUrl}
              alt={altText}
              style={width ? { width: width.endsWith("%") || width.endsWith("px") ? width : `${width}px`, maxWidth: "100%" } : undefined}
              className="max-h-[600px] object-contain rounded-xl shadow-sm"
            />
            {altText && (
              <p className="mt-3 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400">
                🖼️ {altText}
              </p>
            )}
          </div>
        );
        continue;
      }
    }

    // Check Standalone Image Line `![alt](url)` or `![alt|size](url)` or `![alt][ref]`
    const imageMatch = line.trim().match(/^!\[(.*?)\](?:\((.*?)\)|\[(.*?)\])$/);
    if (imageMatch) {
      flushList();
      let rawAlt = imageMatch[1] || "";
      let imageUrl = imageMatch[2] || "";
      const refKey = imageMatch[3];

      if (!imageUrl && refKey && refMap.has(refKey.toLowerCase())) {
        imageUrl = refMap.get(refKey.toLowerCase())!;
      }

      if (imageUrl) {
        let altText = rawAlt;
        let sizeClass = "max-w-full h-auto"; // Natural size by default!
        let customWidth = "";

        if (rawAlt.includes("|")) {
          const parts = rawAlt.split("|");
          altText = parts[0].trim();
          const modifier = parts[1].trim().toLowerCase();

          if (modifier === "small" || modifier === "sm" || modifier === "เล็ก") {
            sizeClass = "max-w-[320px] w-full h-auto";
          } else if (modifier === "medium" || modifier === "md" || modifier === "กลาง") {
            sizeClass = "max-w-[640px] w-full h-auto";
          } else if (modifier === "large" || modifier === "lg" || modifier === "ใหญ่") {
            sizeClass = "max-w-[960px] w-full h-auto";
          } else if (modifier === "full" || modifier === "เต็ม") {
            sizeClass = "w-full h-auto";
          } else if (modifier.endsWith("px") || modifier.endsWith("%")) {
            customWidth = modifier;
          }
        }

        renderedElements.push(
          <div key={`img-${i}`} className="my-6 flex flex-col items-center justify-center rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40 shadow-sm">
            <img
              src={imageUrl}
              alt={altText}
              style={customWidth ? { maxWidth: customWidth, width: "100%" } : undefined}
              className={`max-h-[600px] object-contain rounded-xl shadow-sm transition-all ${sizeClass}`}
            />
            {altText && (
              <p className="mt-3 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400">
                🖼️ {altText}
              </p>
            )}
          </div>
        );
        continue;
      }
    }

    // Check Checkboxes `- [ ]` or `- [x]`
    const checkMatch = line.match(/^[\s]*[-\*]\s+\[([ xX])\]\s+(.*)$/);
    if (checkMatch) {
      if (!currentListBlock || currentListBlock.type !== "check") {
        flushList();
        currentListBlock = { type: "check", items: [] };
      }
      currentListBlock.items.push({
        checked: checkMatch[1].toLowerCase() === "x",
        text: checkMatch[2],
      });
      continue;
    }

    // Check Bullet List `- ` or `* `
    const bulletMatch = line.match(/^[\s]*[-\*]\s+(.*)$/);
    if (bulletMatch) {
      if (!currentListBlock || currentListBlock.type !== "bullet") {
        flushList();
        currentListBlock = { type: "bullet", items: [] };
      }
      currentListBlock.items.push({ text: bulletMatch[1] });
      continue;
    }

    // Check Numbered List `1. `
    const numberMatch = line.match(/^[\s]*\d+\.\s+(.*)$/);
    if (numberMatch) {
      if (!currentListBlock || currentListBlock.type !== "number") {
        flushList();
        currentListBlock = { type: "number", items: [] };
      }
      currentListBlock.items.push({ text: numberMatch[1] });
      continue;
    }

    // Not a list line -> flush any list
    flushList();

    // Check Headings
    if (line.startsWith("# ")) {
      renderedElements.push(
        <h1 key={i} className="mt-8 mb-4 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 pb-2 dark:border-neutral-800">
          {renderInlineMarkdown(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      renderedElements.push(
        <h2 key={i} className="mt-6 mb-3 text-xl font-bold text-neutral-900 dark:text-neutral-100">
          {renderInlineMarkdown(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      renderedElements.push(
        <h3 key={i} className="mt-4 mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {renderInlineMarkdown(line.slice(4))}
        </h3>
      );
    } else if (line.trim() === "---") {
      renderedElements.push(<hr key={i} className="my-6 border-neutral-200 dark:border-neutral-800" />);
    } else if (line.trim() === "") {
      renderedElements.push(<div key={i} className="h-3" />);
    } else {
      renderedElements.push(
        <p key={i} className="my-1.5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {renderInlineMarkdown(line)}
        </p>
      );
    }
  }

  flushList();
  flushCallout();
  flushCode();

  return renderedElements;
}

function CodeBlockViewer({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative my-4 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 shadow-md">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2 text-xs font-mono text-neutral-400">
        <span>{lang || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-1 hover:bg-neutral-800 text-neutral-300 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">คัดลอกแล้ว</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>คัดลอก</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-neutral-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let keyIndex = 0;

  const regex = /(!\[.*?\]\(.*?\)|==.*?==|<mark(?:\s+class=".*?")?>.*?<\/mark>|<span\s+class=".*?">.*?<\/span>|\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const rawParts = text.split(regex);

  rawParts.forEach((part) => {
    if (!part) return;

    // Image
    const imgMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      parts.push(
        <span key={keyIndex++} className="inline-block my-2 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <img src={imgMatch[2]} alt={imgMatch[1] || "รูปประกอบ"} className="max-h-60 rounded-xl object-contain" />
        </span>
      );
      return;
    }

    // Highlight ==text==
    if (part.startsWith("==") && part.endsWith("==")) {
      parts.push(
        <mark
          key={keyIndex++}
          className="rounded bg-amber-200 px-1.5 py-0.5 font-medium text-amber-950 dark:bg-amber-500/35 dark:text-amber-200"
        >
          {part.slice(2, -2)}
        </mark>
      );
      return;
    }

    // <mark class="color">text</mark>
    const markMatch = part.match(/^<mark(?:\s+class="(.*?)")?>(.*?)<\/mark>$/);
    if (markMatch) {
      const color = markMatch[1] || "yellow";
      const innerText = markMatch[2];
      let bgClass = "bg-amber-200 text-amber-950 dark:bg-amber-500/35 dark:text-amber-200";

      if (color === "green") {
        bgClass = "bg-emerald-200 text-emerald-950 dark:bg-emerald-500/35 dark:text-emerald-200";
      } else if (color === "blue") {
        bgClass = "bg-sky-200 text-sky-950 dark:bg-sky-500/35 dark:text-sky-200";
      } else if (color === "rose" || color === "red") {
        bgClass = "bg-rose-200 text-rose-950 dark:bg-rose-500/35 dark:text-rose-200";
      } else if (color === "purple") {
        bgClass = "bg-purple-200 text-purple-950 dark:bg-purple-500/35 dark:text-purple-200";
      }

      parts.push(
        <mark key={keyIndex++} className={`rounded px-1.5 py-0.5 font-medium ${bgClass}`}>
          {innerText}
        </mark>
      );
      return;
    }

    // <span class="color">text</span>
    const spanMatch = part.match(/^<span\s+class="(.*?)">(.*?)<\/span>$/);
    if (spanMatch) {
      const color = spanMatch[1];
      const innerText = spanMatch[2];
      let textClass = "text-neutral-900 dark:text-neutral-100 font-medium";

      if (color === "red") textClass = "text-rose-600 font-semibold dark:text-rose-400";
      else if (color === "blue") textClass = "text-blue-600 font-semibold dark:text-blue-400";
      else if (color === "green") textClass = "text-emerald-600 font-semibold dark:text-emerald-400";
      else if (color === "amber" || color === "orange") textClass = "text-amber-600 font-semibold dark:text-amber-400";
      else if (color === "purple") textClass = "text-purple-600 font-semibold dark:text-purple-400";

      parts.push(
        <span key={keyIndex++} className={textClass}>
          {innerText}
        </span>
      );
      return;
    }

    // Bold
    if (part.startsWith("**") && part.endsWith("**")) {
      parts.push(
        <strong key={keyIndex++} className="font-semibold text-neutral-900 dark:text-neutral-100">
          {part.slice(2, -2)}
        </strong>
      );
      return;
    }

    // Italic
    if (part.startsWith("*") && part.endsWith("*")) {
      parts.push(
        <em key={keyIndex++} className="italic text-neutral-800 dark:text-neutral-200">
          {part.slice(1, -1)}
        </em>
      );
      return;
    }

    // Code
    if (part.startsWith("`") && part.endsWith("`")) {
      parts.push(
        <code
          key={keyIndex++}
          className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
        >
          {part.slice(1, -1)}
        </code>
      );
      return;
    }

    parts.push(part);
  });

  return <>{parts}</>;
}
