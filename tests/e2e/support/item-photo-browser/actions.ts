import type { ActionName, Step } from "./types";
import { buildItemPhotoDraftPath, validateItemPhotoFile } from "@/lib/items/item-photo-storage";
import { uploadItemPhotoWithPreview } from "@/lib/items/item-photo/upload-with-preview";

const queues = new Map<ActionName, Step[]>();
const gates = new Map<string, () => void>();
window.photoHarness = {
  calls: [],
  queue(action, step) { queues.set(action, [...(queues.get(action) ?? []), step]); },
  release(gate) {
    const release = gates.get(gate);
    if (!release) throw new Error(`Gate ${gate} is not pending`);
    gates.delete(gate); release();
  },
  async invoke(action, input, fallback) {
    this.calls.push({ action, input });
    const step = queues.get(action)?.shift();
    if (step?.gate) await new Promise<void>((resolve) => gates.set(step.gate!, resolve));
    if (step?.reject) throw new Error("private-token signed-url private-provider-body");
    return step && "result" in step ? step.result : fallback;
  },
};

export async function uploadItemPhotoDraft(data: FormData) {
  const checked = validateItemPhotoFile(data.get("photo"));
  if (!checked.ok) return checked;
  const { file, mimeType, sizeBytes } = checked;
  const { draftId, path } = buildItemPhotoDraftPath({ householdId: "25000000-0000-4000-8000-000000000001", filename: file.name });
  const bitmap = await createImageBitmap(file);
  const input = { filename: file.name, mimeType, sizeBytes, storagePath: path, width: bitmap.width, height: bitmap.height };
  bitmap.close();
  const selected = await window.photoHarness.invoke("upload", input, {
    ok: true, draftId, storagePath: path,
    file: { mimeType, sizeBytes },
    previewUrl: URL.createObjectURL(file),
  }) as { ok: boolean; previewUrl: string };
  if (!selected.ok) return selected;
  const result = await uploadItemPhotoWithPreview({
    upload: async () => await window.photoHarness.invoke("storageUpload", { storagePath: path }, { error: null }) as { error: unknown },
    preview: async () => await window.photoHarness.invoke("preview", { storagePath: path }, { data: { signedUrl: selected.previewUrl }, error: null }) as { data: { signedUrl: string } | null; error: unknown },
    removeUploaded: () => window.photoHarness.invoke("rollback", { storagePath: path }, { error: null }),
  });
  return result.ok ? selected : result;
}
export async function cleanupItemPhotoDraft(input: { storagePath: string }) {
  return window.photoHarness.invoke("cleanup", input, { ok: true });
}
export async function analyzeItemPhotoDraft(input: Record<string, unknown>) {
  return window.photoHarness.invoke("analyze", input, { ok: true, suggestion: {
    nazwa: "Wiertarka", opis: "Opis z AI", categoryId: "tools", categoryConfidence: "high",
    typ: "unikalny", ilosc: null, jednostka: null, userMessage: null,
  } });
}
export async function createQuickCustomCategory(name: string) {
  return window.photoHarness.invoke("category", { name }, {
    status: "created", category: { id: "custom-tools", label: name, isSystem: false },
  });
}
