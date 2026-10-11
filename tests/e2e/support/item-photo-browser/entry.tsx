import { createRoot } from "react-dom/client";
import { ItemForm } from "@/components/items/item-form";
import "./actions";
import type { Database } from "@/types/database";

const edit = new URLSearchParams(location.search).has("edit");
const photo = edit ? {
  filename: "existing.webp", mimeType: "image/webp", sizeBytes: 200,
  storagePath: "households/25000000-0000-4000-8000-000000000001/items/35000000-0000-4000-8000-000000000001/photo.webp",
  previewUrl: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="green"/></svg>'),
} : null;
const item: Database["public"]["Tables"]["item"]["Row"] | undefined = edit ? {
  id: "35000000-0000-4000-8000-000000000001", household_id: "25000000-0000-4000-8000-000000000001",
  nazwa: "Istniejąca rzecz", typ: "unikalny", category_id: "tools", ilosc: 1, opis: "Istniejący opis", jednostka: "szt.",
  termin_waznosci: null, opiekun_id: null, status: "w domu", archived_at: null, status_before_archive: null,
  przechowywany_w_sejfie: false, miniatura_url: photo?.storagePath ?? null, notatki: null,
  created_by_id: "45000000-0000-4000-8000-000000000001", created_at: "2026-10-10T00:00:00Z", updated_at: "2026-10-10T00:00:00Z",
} : undefined;
createRoot(document.getElementById("root")!).render(<ItemForm
  action={async (data) => { await window.photoHarness.invoke("save", Object.fromEntries(data), null); document.getElementById("saved")!.textContent = "Zapisano fixture"; }}
  categories={[{ id: "tools", label: "Narzędzia", isSystem: true }]}
  defaultCategoryId="tools"
  item={item}
  photo={photo}
  layout="compact"
  locationOptions={{ rooms: [], storageLocations: [], positions: [] }}
  submitLabel="Zapisz fixture"
/>);
