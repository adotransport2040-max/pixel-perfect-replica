export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          categories: string[]
          payment_types: string[]
          updated_at: string
          user_id: string
          vat_types: string[]
        }
        Insert: {
          categories?: string[]
          payment_types?: string[]
          updated_at?: string
          user_id: string
          vat_types?: string[]
        }
        Update: {
          categories?: string[]
          payment_types?: string[]
          updated_at?: string
          user_id?: string
          vat_types?: string[]
        }
        Relationships: []
      }
      parties: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          credit_days: number | null
          email: string | null
          id: string
          name: string
          notes: string | null
          pan_or_vat: string
          phone: string | null
          type: string
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          credit_days?: number | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          pan_or_vat?: string
          phone?: string | null
          type?: string
          user_id: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          credit_days?: number | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          pan_or_vat?: string
          phone?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_bills: {
        Row: {
          after_vat: number
          before_vat: number
          bills_description: string
          bs_month: number
          bs_year: number
          created_at: string
          date_bs: string
          fiscal_year: string
          id: string
          invoice_no: string
          pan: string
          party_name: string
          sn: number | null
          user_id: string
          vat: number
          vat_no: string
        }
        Insert: {
          after_vat?: number
          before_vat?: number
          bills_description?: string
          bs_month: number
          bs_year: number
          created_at?: string
          date_bs?: string
          fiscal_year?: string
          id: string
          invoice_no?: string
          pan?: string
          party_name?: string
          sn?: number | null
          user_id: string
          vat?: number
          vat_no?: string
        }
        Update: {
          after_vat?: number
          before_vat?: number
          bills_description?: string
          bs_month?: number
          bs_year?: number
          created_at?: string
          date_bs?: string
          fiscal_year?: string
          id?: string
          invoice_no?: string
          pan?: string
          party_name?: string
          sn?: number | null
          user_id?: string
          vat?: number
          vat_no?: string
        }
        Relationships: []
      }
      sales_bills: {
        Row: {
          after_vat: number
          before_vat: number
          bs_month: number
          bs_year: number
          buyer_address: string | null
          buyer_name: string
          category: string
          created_at: string
          date_bs: string
          fiscal_year: string
          id: string
          invoice_no: string
          item_description: string | null
          party_name: string | null
          payment_method: string
          sn: number | null
          user_id: string
          vat: number
          vat_no: string
          vat_type: string
        }
        Insert: {
          after_vat?: number
          before_vat?: number
          bs_month: number
          bs_year: number
          buyer_address?: string | null
          buyer_name?: string
          category?: string
          created_at?: string
          date_bs?: string
          fiscal_year?: string
          id: string
          invoice_no?: string
          item_description?: string | null
          party_name?: string | null
          payment_method?: string
          sn?: number | null
          user_id: string
          vat?: number
          vat_no?: string
          vat_type?: string
        }
        Update: {
          after_vat?: number
          before_vat?: number
          bs_month?: number
          bs_year?: number
          buyer_address?: string | null
          buyer_name?: string
          category?: string
          created_at?: string
          date_bs?: string
          fiscal_year?: string
          id?: string
          invoice_no?: string
          item_description?: string | null
          party_name?: string | null
          payment_method?: string
          sn?: number | null
          user_id?: string
          vat?: number
          vat_no?: string
          vat_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
