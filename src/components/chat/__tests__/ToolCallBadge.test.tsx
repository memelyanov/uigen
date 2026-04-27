import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

test("shows 'Creating' for str_replace_editor create command", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "src/App.tsx" }} state="call" />);
  expect(screen.getByText("Creating App.tsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor str_replace command", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "str_replace", path: "src/Card.tsx" }} state="call" />);
  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor insert command", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "insert", path: "src/index.ts" }} state="call" />);
  expect(screen.getByText("Editing index.ts")).toBeDefined();
});

test("shows 'Reading' for str_replace_editor view command", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "view", path: "src/utils.ts" }} state="call" />);
  expect(screen.getByText("Reading utils.ts")).toBeDefined();
});

test("shows rename label for file_manager rename command", () => {
  render(<ToolCallBadge toolName="file_manager" args={{ command: "rename", path: "src/Old.tsx", new_path: "src/New.tsx" }} state="call" />);
  expect(screen.getByText("Renaming Old.tsx → New.tsx")).toBeDefined();
});

test("shows delete label for file_manager delete command", () => {
  render(<ToolCallBadge toolName="file_manager" args={{ command: "delete", path: "src/Unused.tsx" }} state="call" />);
  expect(screen.getByText("Deleting Unused.tsx")).toBeDefined();
});

test("falls back to toolName for unknown tools", () => {
  render(<ToolCallBadge toolName="unknown_tool" args={{}} state="call" />);
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("shows spinner when not done", () => {
  const { container } = render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "App.tsx" }} state="call" />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("shows checkmark when done", () => {
  const { container } = render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "App.tsx" }} state="result" result={{ success: true }} />);
  expect(container.querySelector(".animate-spin")).toBeNull();
  expect(container.querySelector(".text-emerald-500")).toBeDefined();
});
