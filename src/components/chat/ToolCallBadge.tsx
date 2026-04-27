"use client";

import { Loader2, CheckCircle2, FilePlus, FilePen, FileSearch, Trash2, FileCog } from "lucide-react";

type StrReplaceCommand = "create" | "str_replace" | "insert" | "view" | "undo_edit";
type FileManagerCommand = "rename" | "delete";

interface StrReplaceArgs {
  command: StrReplaceCommand;
  path?: string;
}

interface FileManagerArgs {
  command: FileManagerCommand;
  path?: string;
  new_path?: string;
}

interface ToolCallBadgeProps {
  toolName: string;
  args: StrReplaceArgs | FileManagerArgs | Record<string, unknown>;
  state: string;
  result?: unknown;
}

function getLabel(toolName: string, args: StrReplaceArgs | FileManagerArgs | Record<string, unknown>): { icon: React.ReactNode; text: string } {
  const path = (args as { path?: string }).path ?? "";
  const filename = path.split("/").pop() ?? path;

  if (toolName === "str_replace_editor") {
    const cmd = (args as StrReplaceArgs).command;
    switch (cmd) {
      case "create":
        return { icon: <FilePlus className="w-3 h-3" />, text: `Creating ${filename}` };
      case "str_replace":
      case "insert":
      case "undo_edit":
        return { icon: <FilePen className="w-3 h-3" />, text: `Editing ${filename}` };
      case "view":
        return { icon: <FileSearch className="w-3 h-3" />, text: `Reading ${filename}` };
    }
  }

  if (toolName === "file_manager") {
    const cmd = (args as FileManagerArgs).command;
    const newPath = (args as FileManagerArgs).new_path ?? "";
    const newFilename = newPath.split("/").pop() ?? newPath;
    switch (cmd) {
      case "rename":
        return { icon: <FileCog className="w-3 h-3" />, text: `Renaming ${filename} → ${newFilename}` };
      case "delete":
        return { icon: <Trash2 className="w-3 h-3" />, text: `Deleting ${filename}` };
    }
  }

  return { icon: <FileCog className="w-3 h-3" />, text: toolName };
}

export function ToolCallBadge({ toolName, args, state, result }: ToolCallBadgeProps) {
  const done = state === "result" && result != null;
  const { icon, text } = getLabel(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {done ? (
        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 shrink-0" />
      )}
      <span className="text-neutral-700">{text}</span>
    </div>
  );
}
