export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
      is_household_admin: {
        Args: { target_household_id: string };
        Returns: boolean;
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
