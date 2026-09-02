"use client";

import { Trash2 } from "lucide-react";
import { deleteFlowAction } from "./actions";

export function DeleteFlowButton({ flowId, title }: { flowId: string; title: string }) {
  return (
    <form action={deleteFlowAction.bind(null, flowId)}>
      <button
        type="submit"
        title="ลบ Flow"
        onClick={(e) => {
          if (!confirm(`ต้องการลบ Flow "${title}" หรือไม่?`)) {
            e.preventDefault();
          }
        }}
        className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
