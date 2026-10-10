import type { Page, TestInfo } from "@playwright/test";

// Only synthetic filter UUIDs and flags are collected. Never copy headers,
// DOM, cookie values, React props, query text or arbitrary console messages.
export function filterNavigationDiagnostics(page: Page, testInfo: TestInfo) {
  const events: unknown[] = [];
  const uuid = (value: string | null) => value && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
  const requestListener = (request: import("@playwright/test").Request) => {
    const url = new URL(request.url());
    if (url.pathname !== "/items") return;
    const headers = request.headers();
    events.push({ phase: "request", time: Date.now(), category: uuid(url.searchParams.get("category")), room: uuid(url.searchParams.get("room")),
      rsc: headers.rsc === "1", prefetch: ["1", "2", "3"].includes(headers["next-router-prefetch"]) ? headers["next-router-prefetch"] : null,
      segment: Boolean(headers["next-router-segment-prefetch"]), navigation: request.isNavigationRequest() });
  };
  page.on("request", requestListener);
  return {
    async selection(phase: "before-first" | "before-second", firstField: string, firstLabel: string) {
      const state = await page.evaluate(({ firstField, firstLabel }) => {
        type Hook = { memoizedState: unknown; baseState?: unknown; next: Hook | null };
        type Fiber = { type?: { name?: string }; return: Fiber | null; child: Fiber | null; sibling: Fiber | null; memoizedState: Hook | null; stateNode?: { current?: Fiber } };
        const category = document.querySelector<HTMLSelectElement>('select[name="category"]');
        const room = document.querySelector<HTMLSelectElement>('select[name="room"]');
        const uuid = (value: string | null) => value && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
        const filters = (value: string) => { const params = new URLSearchParams(value); return { category: uuid(params.get("category")), room: uuid(params.get("room")) }; };
        const property = category && Object.getOwnPropertyNames(category).find((key) => key.startsWith("__reactFiber$"));
        let fiber = property ? (category as unknown as Record<string, Fiber>)[property] : null;
        while (fiber?.return) fiber = fiber.return;
        const current = fiber?.stateNode?.current;
        const find = (node: Fiber | null | undefined): Fiber | null => !node ? null : node.type?.name === "ItemFilters" ? node : find(node.child) ?? find(node.sibling);
        // Host nodes can retain the alternate fiber after a commit. Always
        // read the root's current tree rather than its stale hook values.
        fiber = find(current);
        // Private hooks are observational diagnostics only. A framework rename
        // yields mounted=false; it cannot gate or change the tested actions.
        let intended = null;
        let optimistic = null;
        let base = null;
        let pending = null;
        for (let hook = fiber?.memoizedState; hook; hook = hook.next) {
          const value = hook.memoizedState;
          if (typeof value === "string") { optimistic = filters(value); base = typeof hook.baseState === "string" ? filters(hook.baseState) : null; }
          else if (typeof value === "boolean") pending = value;
          else if (value && typeof value === "object" && "current" in value && typeof value.current === "string") intended = filters(value.current);
        }
        return { category: uuid(category?.value ?? null), room: uuid(room?.value ?? null), mounted: Boolean(fiber), intended, optimistic, base, pending,
          firstChip: Boolean(document.querySelector('[aria-label="Aktywne filtry"]')?.textContent?.includes(firstLabel)),
          firstValue: firstField === "category" ? category?.value : room?.value };
      }, { firstField, firstLabel });
      const { firstValue, ...diagnostic } = state;
      events.push({ phase, time: Date.now(), ...diagnostic });
      return firstValue;
    },
    async publish() {
      page.off("request", requestListener);
      await testInfo.attach("filter-navigation", { body: Buffer.from(JSON.stringify(events)), contentType: "application/json" });
    },
  };
}
