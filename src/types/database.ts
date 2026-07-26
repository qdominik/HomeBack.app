export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LocationDependencySummaryDatabaseRow = {
  entity_id: string;
  storage_count: number;
  position_count: number;
  active_direct_items_count: number;
  active_nested_items_count: number;
  active_items_count: number;
  archived_direct_items_count: number;
  archived_nested_items_count: number;
  archived_items_count: number;
  total_distinct_items_count: number;
  primary_location_links_count: number;
  non_primary_location_links_count: number;
  total_location_links_count: number;
  requires_item_resolution: boolean;
  requires_subtree_deletion: boolean;
  can_delete_immediately: boolean;
};

export type LocationDetachDatabaseRow = {
  status: string;
  detached_item_count: number;
  detached_link_count: number;
  active_item_count: number;
  archived_item_count: number;
};

export type LocationMoveDatabaseRow = {
  status: string;
  moved_item_count: number;
  active_item_count: number;
  archived_item_count: number;
  reused_target_link_count: number;
  created_target_link_count: number;
  removed_source_link_count: number;
};

export type LocationDeleteResolutionDatabaseRow = {
  status: string;
  resolution: string;
  deleted_storage_location_l3_id: string;
  affected_item_count: number;
  active_item_count: number;
  archived_item_count: number;
  moved_item_count: number;
  detached_link_count: number;
  reused_target_link_count: number;
  created_target_link_count: number;
};
export type StorageLocationL2DeleteResolutionDatabaseRow = {
  status: string;
  resolution: string;
  deleted_storage_location_l2_id: string;
  deleted_storage_location_l3_count: number;
  affected_item_count: number;
  active_item_count: number;
  archived_item_count: number;
  moved_item_count: number;
  detached_link_count: number;
  reused_target_link_count: number;
  created_target_link_count: number;
  removed_source_link_count: number;
};

export type RoomDeleteResolutionDatabaseRow = {
  status: string;
  resolution: string;
  deleted_room_id: string;
  deleted_storage_location_l2_count: number;
  deleted_storage_location_l3_count: number;
  affected_item_count: number;
  active_item_count: number;
  archived_item_count: number;
  moved_item_count: number;
  detached_link_count: number;
  reused_target_link_count: number;
  created_target_link_count: number;
  removed_source_link_count: number;
};

export type Database = {
  public: {
    Tables: {
      category: {
        Row: {
          id: string;
          household_id: string | null;
          key: string | null;
          nazwa: string;
          ikona: string | null;
          kolor: string | null;
          czy_systemowa: boolean;
          widoczna_dla_dzieci: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id?: string | null;
          key?: string | null;
          nazwa: string;
          ikona?: string | null;
          kolor?: string | null;
          czy_systemowa: boolean;
          widoczna_dla_dzieci: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string | null;
          key?: string | null;
          nazwa?: string;
          ikona?: string | null;
          kolor?: string | null;
          czy_systemowa?: boolean;
          widoczna_dla_dzieci?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      file: {
        Row: {
          id: string;
          item_id: string | null;
          household_id: string | null;
          nazwa: string;
          plik_url: string;
          typ: Database["public"]["Enums"]["file_type"];
          rozmiar_kb: number;
          czy_zaszyfrowany: boolean;
          created_by_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id?: string | null;
          household_id?: string | null;
          nazwa: string;
          plik_url: string;
          typ: Database["public"]["Enums"]["file_type"];
          rozmiar_kb: number;
          czy_zaszyfrowany: boolean;
          created_by_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string | null;
          household_id?: string | null;
          nazwa?: string;
          plik_url?: string;
          typ?: Database["public"]["Enums"]["file_type"];
          rozmiar_kb?: number;
          czy_zaszyfrowany?: boolean;
          created_by_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      household: {
        Row: {
          id: string;
          nazwa: string;
          typ: Database["public"]["Enums"]["household_type"];
          kod_zaproszenia: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nazwa: string;
          typ: Database["public"]["Enums"]["household_type"];
          kod_zaproszenia?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nazwa?: string;
          typ?: Database["public"]["Enums"]["household_type"];
          kod_zaproszenia?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      item: {
        Row: {
          id: string;
          household_id: string;
          category_id: string;
          nazwa: string;
          opis: string | null;
          typ: Database["public"]["Enums"]["item_type"];
          ilosc: number | null;
          jednostka: string | null;
          termin_waznosci: string | null;
          opiekun_id: string | null;
          status: Database["public"]["Enums"]["item_status"];
          archived_at: string | null;
          status_before_archive: Database["public"]["Enums"]["item_status"] | null;
          przechowywany_w_sejfie: boolean;
          miniatura_url: string | null;
          notatki: string | null;
          created_by_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          category_id: string;
          nazwa: string;
          opis?: string | null;
          typ: Database["public"]["Enums"]["item_type"];
          ilosc?: number | null;
          jednostka?: string | null;
          termin_waznosci?: string | null;
          opiekun_id?: string | null;
          status: Database["public"]["Enums"]["item_status"];
          archived_at?: string | null;
          status_before_archive?: Database["public"]["Enums"]["item_status"] | null;
          przechowywany_w_sejfie?: boolean;
          miniatura_url?: string | null;
          notatki?: string | null;
          created_by_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          category_id?: string;
          nazwa?: string;
          opis?: string | null;
          typ?: Database["public"]["Enums"]["item_type"];
          ilosc?: number | null;
          jednostka?: string | null;
          termin_waznosci?: string | null;
          opiekun_id?: string | null;
          status?: Database["public"]["Enums"]["item_status"];
          archived_at?: string | null;
          status_before_archive?: Database["public"]["Enums"]["item_status"] | null;
          przechowywany_w_sejfie?: boolean;
          miniatura_url?: string | null;
          notatki?: string | null;
          created_by_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      item_location: {
        Row: {
          id: string;
          item_id: string;
          storage_location_l3_id: string;
          czy_glowna: boolean;
          notatka: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          storage_location_l3_id: string;
          czy_glowna: boolean;
          notatka?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          storage_location_l3_id?: string;
          czy_glowna?: boolean;
          notatka?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      log: {
        Row: {
          id: string;
          household_id: string;
          profil_id: string;
          akcja: Database["public"]["Enums"]["log_action"];
          typ_obiektu: Database["public"]["Enums"]["log_object_type"];
          obiekt_id: string;
          zmiana_przed: Json | null;
          zmiana_po: Json | null;
          szczegoly: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          profil_id: string;
          akcja: Database["public"]["Enums"]["log_action"];
          typ_obiektu: Database["public"]["Enums"]["log_object_type"];
          obiekt_id: string;
          zmiana_przed?: Json | null;
          zmiana_po?: Json | null;
          szczegoly?: string | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          profil_id?: string;
          akcja?: Database["public"]["Enums"]["log_action"];
          typ_obiektu?: Database["public"]["Enums"]["log_object_type"];
          obiekt_id?: string;
          zmiana_przed?: Json | null;
          zmiana_po?: Json | null;
          szczegoly?: string | null;
          timestamp?: string;
        };
        Relationships: [];
      };
      profile: {
        Row: {
          id: string;
          household_id: string;
          imie: string;
          email: string;
          rola: Database["public"]["Enums"]["profile_role"];
          avatar_url: string | null;
          status: Database["public"]["Enums"]["profile_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          household_id: string;
          imie: string;
          email: string;
          rola: Database["public"]["Enums"]["profile_role"];
          avatar_url?: string | null;
          status: Database["public"]["Enums"]["profile_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          imie?: string;
          email?: string;
          rola?: Database["public"]["Enums"]["profile_role"];
          avatar_url?: string | null;
          status?: Database["public"]["Enums"]["profile_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      room: {
        Row: {
          id: string;
          household_id: string;
          nazwa: string;
          typ: string;
          ikona: string | null;
          opis: string | null;
          kolejność: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          nazwa: string;
          typ: string;
          ikona?: string | null;
          opis?: string | null;
          kolejność: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          nazwa?: string;
          typ?: string;
          ikona?: string | null;
          opis?: string | null;
          kolejność?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      storage_location_l2: {
        Row: {
          id: string;
          room_id: string;
          nazwa: string;
          typ: string;
          opis: string | null;
          kolejność: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          nazwa: string;
          typ: string;
          opis?: string | null;
          kolejność: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          nazwa?: string;
          typ?: string;
          opis?: string | null;
          kolejność?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      storage_location_l3: {
        Row: {
          id: string;
          storage_location_l2_id: string;
          nazwa: string;
          opis: string | null;
          kod_lokalizacji: string;
          identyfikator_qr: string | null;
          identyfikator_nfc: string | null;
          kolejność: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          storage_location_l2_id: string;
          nazwa: string;
          opis?: string | null;
          kod_lokalizacji: string;
          identyfikator_qr?: string | null;
          identyfikator_nfc?: string | null;
          kolejność: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          storage_location_l2_id?: string;
          nazwa?: string;
          opis?: string | null;
          kod_lokalizacji?: string;
          identyfikator_qr?: string | null;
          identyfikator_nfc?: string | null;
          kolejność?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      archive_item: {
        Args: { p_item_id: string };
        Returns: string;
      };
      detach_items_from_room_location: {
        Args: { p_room_id: string };
        Returns: LocationDetachDatabaseRow[];
      };
      detach_items_from_storage_location_l2: {
        Args: { p_storage_location_l2_id: string };
        Returns: LocationDetachDatabaseRow[];
      };
      detach_items_from_storage_location_l3: {
        Args: { p_storage_location_l3_id: string };
        Returns: LocationDetachDatabaseRow[];
      };
      delete_storage_location_l3_with_resolution: {
        Args: {
          p_storage_location_l3_id: string;
          p_resolution: string;
          p_target_storage_location_l3_id: string | null;
          p_expected_distinct_item_count: number;
          p_expected_location_link_count: number;
        };
        Returns: LocationDeleteResolutionDatabaseRow[];
      };
      delete_storage_location_l2_with_resolution: {
        Args: {
          p_storage_location_l2_id: string;
          p_resolution: string;
          p_target_storage_location_l3_id: string | null;
          p_expected_storage_location_l3_count: number;
          p_expected_distinct_item_count: number;
          p_expected_location_link_count: number;
        };
        Returns: StorageLocationL2DeleteResolutionDatabaseRow[];
      };
      delete_room_with_resolution: {
        Args: {
          p_room_id: string;
          p_resolution: string;
          p_target_storage_location_l3_id: string | null;
          p_expected_storage_location_l2_count: number;
          p_expected_storage_location_l3_count: number;
          p_expected_distinct_item_count: number;
          p_expected_location_link_count: number;
        };
        Returns: RoomDeleteResolutionDatabaseRow[];
      };
      move_primary_items_from_location: {
        Args: {
          p_source_type: string;
          p_source_id: string;
          p_target_storage_location_l3_id: string;
        };
        Returns: LocationMoveDatabaseRow[];
      };
      create_household_with_admin: {
        Args: {
          p_imie: string;
          p_nazwa: string;
          p_typ: Database["public"]["Enums"]["household_type"];
        };
        Returns: string;
      };
      current_household_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      current_profile_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["profile_role"] | null;
      };
      delete_item_permanently: {
        Args: { p_item_id: string };
        Returns: string;
      };

      get_room_location_dependency_summary: {
        Args: { p_room_id: string };
        Returns: LocationDependencySummaryDatabaseRow[];
      };
      get_storage_location_l2_dependency_summary: {
        Args: { p_storage_location_l2_id: string };
        Returns: LocationDependencySummaryDatabaseRow[];
      };
      get_storage_location_l3_dependency_summary: {
        Args: { p_storage_location_l3_id: string };
        Returns: LocationDependencySummaryDatabaseRow[];
      };
      generate_test_data: {
        Args: { p_dataset_type: string };
        Returns: Record<string, unknown>;
      };
      is_household_admin: {
        Args: { target_household_id: string };
        Returns: boolean;
      };
      restore_item: {
        Args: {
          p_item_id: string;
          p_legacy_target_status?: Database["public"]["Enums"]["item_status"] | null;
        };
        Returns: string;
      };
      set_item_primary_location: {
        Args: {
          p_item_id: string;
          p_storage_location_l3_id?: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: {
      file_type: "zdjecie" | "skan" | "pdf" | "dokument";
      household_type: "dom" | "mieszkanie" | "garaż";
      item_status: "w domu" | "zużyte" | "pożyczone" | "archiwalne";
      item_type: "unikalny" | "zapas" | "zestaw";
      log_action:
        | "DODANO"
        | "EDYTOWANO"
        | "PRZESUNIĘTO"
        | "USUNIĘTO"
        | "ZMIENIONO_ILOŚĆ";
      log_object_type: "ITEM" | "ROOM" | "CATEGORY" | "PROFILE";
      profile_role: "admin" | "domownik" | "dziecko" | "gość";
      profile_status: "aktywny" | "zaproszony" | "nieaktywny";
    };
    CompositeTypes: Record<never, never>;
  };
};
