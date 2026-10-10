import { readFileSync, existsSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, posix, resolve } from "node:path";
import ts from "typescript";

const installedRequire = createRequire(resolve("package.json"));
export const lifecycleIds = {
  category: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  kitchen: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  salon: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
};

// Bundle Next's browser React runtime and the real filter component/parsers.
// Only navigation transport, Link and decorative icons are substituted. The
// unresolved router promise models a navigation whose response is withheld.
export function itemFilterLifecycleBundle({ strictEffects = false, firstFilter = "category" }: {
  strictEffects?: boolean;
  firstFilter?: "category" | "room";
} = {}) {
  const modules = new Map<string, string>();
  for (const [name, packageName, filename] of [
    ["react", "react", "react.development.js"],
    ["react-dom", "react-dom", "react-dom.development.js"],
    ["react-dom/client", "react-dom", "react-dom-client.development.js"],
    ["react/jsx-runtime", "react", "react-jsx-runtime.development.js"],
    ["scheduler", "scheduler", "scheduler.development.js"],
  ]) {
    const directory = dirname(installedRequire.resolve(`next/dist/compiled/${packageName}/package.json`));
    modules.set(name, readFileSync(resolve(directory, "cjs", filename), "utf8")
      .replaceAll("next/dist/compiled/", ""));
  }
  function projectModule(id: string): string {
    if (modules.has(id)) return id;
    const path = [id, `${id}.ts`, `${id}.tsx`, `${id}/index.ts`]
      .find((candidate) => existsSync(resolve(candidate)) && statSync(resolve(candidate)).isFile());
    if (!path) throw new Error(`Cannot bundle project module ${id}`);
    modules.set(id, "");
    const compiled = ts.transpileModule(readFileSync(resolve(path), "utf8"), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
      fileName: path,
    }).outputText.replace(/require\("([^\"]+)"\)/g, (match, dependency: string) => {
      const imported = dependency.startsWith("@/") ? `src/${dependency.slice(2)}`
        : dependency.startsWith(".") ? posix.normalize(posix.join(posix.dirname(path), dependency)) : null;
      return imported ? `require(${JSON.stringify(projectModule(imported))})` : match;
    });
    modules.set(id, compiled);
    return id;
  }
  projectModule("src/components/items/item-filters");
  const factories = [...modules].map(([name, source]) => `${JSON.stringify(name)}:function(module,exports,require){${source}\n}`).join(",");
  return `(() => {
    const process = { env: { NODE_ENV: "development" } };
    const factories = {${factories}};
    const cache = {};
    const substitutes = {};
    function require(name) {
      if (substitutes[name]) return substitutes[name];
      if (name.startsWith("@phosphor-icons/")) return new Proxy({}, { get: () => () => null });
      if (cache[name]) return cache[name].exports;
      if (!factories[name]) throw new Error("Unexpected lifecycle dependency " + name);
      const module = { exports: {} }; cache[name] = module;
      factories[name](module, module.exports, require); return module.exports;
    }
    const React = require("react");
    const ReactDOM = require("react-dom");
    const ReactDOMClient = require("react-dom/client");
    const Context = React.createContext(null);
    const layoutStates = [];
    let mountReconciliation = null;
    const useLayoutEffect = React.useLayoutEffect;
    // Observe the component's real committed callback, forwarding to React's
    // actual hook. Explicit replay tests an old closure after a newer commit.
    React.useLayoutEffect = (create, dependencies) => {
      if (!create.toString().includes("intendedSearch.current")) return useLayoutEffect(create, dependencies);
      return useLayoutEffect(() => {
        mountReconciliation ??= create;
        layoutStates.push({ search: dependencies[0], pending: dependencies[1] });
        return create();
      }, dependencies);
    };
    const requests = [];
    const responses = [];
    const ids = ${JSON.stringify(lifecycleIds)};
    const strictEffects = ${JSON.stringify(strictEffects)};
    const firstFilter = ${JSON.stringify(firstFilter)};
    const { parseItemSearchParams } = require("src/lib/items/item-search-params");
    const { parseItemView } = require("src/lib/items/item-view-filter");
    const { routes } = require("src/lib/routes");
    substitutes["next/link"] = { default: ({ onNavigate, ...props }) => React.createElement("a", {
      ...props, onClick: (event) => onNavigate?.({ preventDefault: () => event.preventDefault() }),
    }) };
    substitutes["next/navigation"] = {
      useRouter: () => React.useContext(Context).router,
      useSearchParams: () => {
        const state = React.useContext(Context).search;
        return new URLSearchParams(typeof state === "string" ? state : React.use(state));
      },
    };
    const { ItemFilters } = require("src/components/items/item-filters");
    function choose(name, value) {
      const select = document.querySelector('select[name="' + name + '"]');
      select.value = value; select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    function App() {
      const [search, setSearch] = React.useState("");
      const router = React.useMemo(() => {
        function navigate(href) {
          requests.push(href);
          const promise = new Promise((resolve) => responses.push(() => resolve(new URL(href, location.href).search.slice(1))));
          setSearch(promise);
        }
        return { replace: navigate, push: navigate };
      }, []);
      // A real change event during the commit deliberately precedes mount's
      // passive effect. No DOM-only select or artificial hook implementation.
      const didChoose = React.useRef(false);
      React.useLayoutEffect(() => {
        if (!didChoose.current) {
          didChoose.current = true;
          choose(firstFilter, firstFilter === "category" ? ids.category : ids.kitchen);
        }
      }, []);
      window.filterLifecycle = {
        requests,
        layoutStates,
        replayMountReconciliation() { mountReconciliation(); },
        release(index) { responses[index](); },
        external(search, history = false) {
          window.history.replaceState(null, "", search ? routes.items + "?" + search : routes.items);
          React.startTransition(() => setSearch(search));
          if (history) window.dispatchEvent(new PopStateEvent("popstate"));
        },
      };
      return React.createElement(Context.Provider, { value: { search, router } },
        React.createElement(React.Suspense, { fallback: React.createElement("p", null, "Loading") },
          React.createElement(ResolvedFilters, { search })));
    }
    function ResolvedFilters({ search }) {
      const committed = typeof search === "string" ? search : React.use(search);
      const params = Object.fromEntries(new URLSearchParams(committed));
      return React.createElement(ItemFilters, {
        categories: [{ id: ids.category, label: "Elektronika" }],
        rooms: [{ id: ids.kitchen, label: "Kuchnia" }, { id: ids.salon, label: "Salon" }],
        positions: [], storageLocations: [], filters: parseItemSearchParams(params), view: parseItemView(params),
      });
    }
    ReactDOM.flushSync(() => ReactDOMClient.createRoot(document.getElementById("root")).render(
      strictEffects ? React.createElement(React.StrictMode, null, React.createElement(App)) : React.createElement(App)
    ));
  })();`;
}
