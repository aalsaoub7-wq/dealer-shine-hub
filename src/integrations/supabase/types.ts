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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_settings: {
        Row: {
          background_prompt: string
          created_at: string
          example_descriptions: string | null
          id: string
          landing_page_accent_color: string | null
          landing_page_background_color: string | null
          landing_page_description: string | null
          landing_page_footer_text: string | null
          landing_page_header_fit: string | null
          landing_page_header_height: string | null
          landing_page_header_image_url: string | null
          landing_page_layout: string | null
          landing_page_logo_position: string | null
          landing_page_logo_size: string | null
          landing_page_logo_url: string | null
          landing_page_text_color: string | null
          landing_page_title: string | null
          logo_url: string | null
          updated_at: string
          user_id: string
          watermark_opacity: number | null
          watermark_size: number | null
          watermark_x: number | null
          watermark_y: number | null
        }
        Insert: {
          background_prompt?: string
          created_at?: string
          example_descriptions?: string | null
          id?: string
          landing_page_accent_color?: string | null
          landing_page_background_color?: string | null
          landing_page_description?: string | null
          landing_page_footer_text?: string | null
          landing_page_header_fit?: string | null
          landing_page_header_height?: string | null
          landing_page_header_image_url?: string | null
          landing_page_layout?: string | null
          landing_page_logo_position?: string | null
          landing_page_logo_size?: string | null
          landing_page_logo_url?: string | null
          landing_page_text_color?: string | null
          landing_page_title?: string | null
          logo_url?: string | null
          updated_at?: string
          user_id: string
          watermark_opacity?: number | null
          watermark_size?: number | null
          watermark_x?: number | null
          watermark_y?: number | null
        }
        Update: {
          background_prompt?: string
          created_at?: string
          example_descriptions?: string | null
          id?: string
          landing_page_accent_color?: string | null
          landing_page_background_color?: string | null
          landing_page_description?: string | null
          landing_page_footer_text?: string | null
          landing_page_header_fit?: string | null
          landing_page_header_height?: string | null
          landing_page_header_image_url?: string | null
          landing_page_layout?: string | null
          landing_page_logo_position?: string | null
          landing_page_logo_size?: string | null
          landing_page_logo_url?: string | null
          landing_page_text_color?: string | null
          landing_page_title?: string | null
          logo_url?: string | null
          updated_at?: string
          user_id?: string
          watermark_opacity?: number | null
          watermark_size?: number | null
          watermark_x?: number | null
          watermark_y?: number | null
        }
        Relationships: []
      }
      blocket_ad_sync: {
        Row: {
          blocket_ad_id: string | null
          blocket_store_id: string | null
          car_id: string
          created_at: string | null
          last_action: string | null
          last_action_state: string | null
          last_error: string | null
          last_synced_at: string | null
          source_id: string
          state: string
          updated_at: string | null
        }
        Insert: {
          blocket_ad_id?: string | null
          blocket_store_id?: string | null
          car_id: string
          created_at?: string | null
          last_action?: string | null
          last_action_state?: string | null
          last_error?: string | null
          last_synced_at?: string | null
          source_id: string
          state?: string
          updated_at?: string | null
        }
        Update: {
          blocket_ad_id?: string | null
          blocket_store_id?: string | null
          car_id?: string
          created_at?: string | null
          last_action?: string | null
          last_action_state?: string | null
          last_error?: string | null
          last_synced_at?: string | null
          source_id?: string
          state?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocket_ad_sync_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: true
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          color: string | null
          company_id: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          fuel: string | null
          gearbox: string | null
          id: string
          image_urls: string[] | null
          make: string
          mileage: number | null
          model: string
          notes: string | null
          price: number | null
          publish_on_blocket: boolean | null
          registration_number: string | null
          updated_at: string | null
          user_id: string
          vin: string | null
          year: number
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          fuel?: string | null
          gearbox?: string | null
          id?: string
          image_urls?: string[] | null
          make: string
          mileage?: number | null
          model: string
          notes?: string | null
          price?: number | null
          publish_on_blocket?: boolean | null
          registration_number?: string | null
          updated_at?: string | null
          user_id?: string
          vin?: string | null
          year: number
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          fuel?: string | null
          gearbox?: string | null
          id?: string
          image_urls?: string[] | null
          make?: string
          mileage?: number | null
          model?: string
          notes?: string | null
          price?: number | null
          publish_on_blocket?: boolean | null
          registration_number?: string | null
          updated_at?: string | null
          user_id?: string
          vin?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "cars_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          id: string
          name: string
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      photos: {
        Row: {
          car_id: string
          created_at: string | null
          display_order: number | null
          id: string
          is_edited: boolean | null
          is_processing: boolean | null
          original_url: string | null
          photo_type: string
          updated_at: string | null
          url: string
        }
        Insert: {
          car_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_edited?: boolean | null
          is_processing?: boolean | null
          original_url?: string | null
          photo_type: string
          updated_at?: string | null
          url: string
        }
        Update: {
          car_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_edited?: boolean | null
          is_processing?: boolean | null
          original_url?: string | null
          photo_type?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_collections: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          photo_ids: string[]
          share_token: string
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          photo_ids?: string[]
          share_token: string
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          photo_ids?: string[]
          share_token?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          company_id: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_stats: {
        Row: {
          created_at: string
          edited_images_cost: number
          edited_images_count: number
          id: string
          month: string
          stripe_invoice_id: string | null
          total_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          edited_images_cost?: number
          edited_images_count?: number
          id?: string
          month: string
          stripe_invoice_id?: string | null
          total_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          edited_images_cost?: number
          edited_images_count?: number
          id?: string
          month?: string
          stripe_invoice_id?: string | null
          total_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_companies: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_share_token: { Args: never; Returns: string }
      user_belongs_to_company: {
        Args: { company_uuid: string }
        Returns: boolean
      }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
