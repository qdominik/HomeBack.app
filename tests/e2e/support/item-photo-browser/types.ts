export type ActionName = "upload" | "analyze" | "cleanup" | "category" | "save" | "storageUpload" | "preview" | "rollback";
export type Step = { result?: unknown; reject?: boolean; gate?: string };
export type Call = { action: ActionName; input: Record<string, unknown> };
export type PhotoHarness = {
  queue: (action: ActionName, step: Step) => void;
  release: (gate: string) => void;
  calls: Call[];
  invoke: (action: ActionName, input: Record<string, unknown>, fallback: unknown) => Promise<unknown>;
};
declare global { interface Window { photoHarness: PhotoHarness } }
