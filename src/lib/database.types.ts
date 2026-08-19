// Minimal hand-written types matching supabase/schema.sql — keep in sync
// with that file if columns change.

export type Database = {
  public: {
    Tables: {
      line_oa_daily_stats: {
        Row: {
          id: string;
          account: "carewellteam" | "carewell";
          stat_date: string;
          contacts: number | null;
          target_reaches: number | null;
          blocks: number | null;
          imported_at: string;
        };
        Insert: {
          id?: string;
          account: "carewellteam" | "carewell";
          stat_date: string;
          contacts?: number | null;
          target_reaches?: number | null;
          blocks?: number | null;
          imported_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["line_oa_daily_stats"]["Insert"]>;
        Relationships: [];
      };
      caregivers: {
        Row: {
          id: string;
          caregiver_code: string;
          prefix: string | null;
          full_name: string | null;
          phone: string | null;
          gender: string | null;
          status: string | null;
          registered_date: string | null;
          approved_date: string | null;
          bank_name: string | null;
          bank_account_no: string | null;
          position: string | null;
          job_type: string | null;
          province: string | null;
          special_skill: string | null;
          lifestyle: string | null;
          badge: string | null;
          updated_date: string | null;
          imported_at: string;
        };
        Insert: {
          id?: string;
          caregiver_code: string;
          prefix?: string | null;
          full_name?: string | null;
          phone?: string | null;
          gender?: string | null;
          status?: string | null;
          registered_date?: string | null;
          approved_date?: string | null;
          bank_name?: string | null;
          bank_account_no?: string | null;
          position?: string | null;
          job_type?: string | null;
          province?: string | null;
          special_skill?: string | null;
          lifestyle?: string | null;
          badge?: string | null;
          updated_date?: string | null;
          imported_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["caregivers"]["Insert"]>;
        Relationships: [];
      };
      service_recipients: {
        Row: {
          id: string;
          job_code: string | null;
          service_date: string | null;
          care_level: string | null;
          work_format: string | null;
          status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_code?: string | null;
          service_date?: string | null;
          care_level?: string | null;
          work_format?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_recipients"]["Insert"]>;
        Relationships: [];
      };
      report_notes: {
        Row: {
          id: string;
          topic: string;
          detail: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          topic: string;
          detail?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["report_notes"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
