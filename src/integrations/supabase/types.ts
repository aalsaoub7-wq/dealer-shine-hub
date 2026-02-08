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
      admin_registration_ips: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          background_prompt: string
          background_template_id: string | null
          company_id: string
          created_at: string
          custom_background_seed: string | null
          example_descriptions: string | null
          id: string
          interior_color_history: string[] | null
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
          unlocked_backgrounds: string[] | null
          updated_at: string
          user_id: string
          watermark_opacity: number | null
          watermark_size: number | null
          watermark_x: number | null
          watermark_y: number | null
        }
        Insert: {
          background_prompt?: string
          background_template_id?: string | null
          company_id: string
          created_at?: string
          custom_background_seed?: string | null
          example_descriptions?: string | null
          id?: string
          interior_color_history?: string[] | null
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
          unlocked_backgrounds?: string[] | null
          updated_at?: string
          user_id: string
          watermark_opacity?: number | null
          watermark_size?: number | null
          watermark_x?: number | null
          watermark_y?: number | null
        }
        Update: {
          background_prompt?: string
          background_template_id?: string | null
          company_id?: string
          created_at?: string
          custom_background_seed?: string | null
          example_descriptions?: string | null
          id?: string
          interior_color_history?: string[] | null
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
          unlocked_backgrounds?: string[] | null
          updated_at?: string
          user_id?: string
          watermark_opacity?: number | null
          watermark_size?: number | null
          watermark_x?: number | null
          watermark_y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "public_invite_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      background_templates: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          interior_backgrounds: string[] | null
          is_active: boolean | null
          is_custom: boolean | null
          name: string
          template_id: string
          thumbnail_url: string | null
          unlock_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          interior_backgrounds?: string[] | null
          is_active?: boolean | null
          is_custom?: boolean | null
          name: string
          template_id: string
          thumbnail_url?: string | null
          unlock_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          interior_backgrounds?: string[] | null
          is_active?: boolean | null
          is_custom?: boolean | null
          name?: string
          template_id?: string
          thumbnail_url?: string | null
          unlock_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          car_id: string | null
          company_id: string
          created_at: string
          event_type: string
          id: string
          photo_id: string | null
          stripe_event_id: string | null
          stripe_reported: boolean
          stripe_reported_at: string | null
          user_id: string
        }
        Insert: {
          car_id?: string | null
          company_id: string
          created_at?: string
          event_type?: string
          id?: string
          photo_id?: string | null
          stripe_event_id?: string | null
          stripe_reported?: boolean
          stripe_reported_at?: string | null
          user_id: string
        }
        Update: {
          car_id?: string | null
          company_id?: string
          created_at?: string
          event_type?: string
          id?: string
          photo_id?: string | null
          stripe_event_id?: string | null
          stripe_reported?: boolean
          stripe_reported_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_invite_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "public_photos"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "cars_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_invite_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          employee_invite_code: string | null
          id: string
          name: string
          stripe_customer_id: string | null
          trial_end_date: string | null
          trial_images_remaining: number | null
          trial_images_used: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_invite_code?: string | null
          id?: string
          name: string
          stripe_customer_id?: string | null
          trial_end_date?: string | null
          trial_images_remaining?: number | null
          trial_images_used?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_invite_code?: string | null
          id?: string
          name?: string
          stripe_customer_id?: string | null
          trial_end_date?: string | null
          trial_images_remaining?: number | null
          trial_images_used?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          car_id: string
          created_at: string | null
          display_order: number | null
          edit_type: string | null
          has_free_regeneration: boolean | null
          has_watermark: boolean | null
          id: string
          interior_background_url: string | null
          is_edited: boolean | null
          is_processing: boolean | null
          original_url: string | null
          photo_type: string
          pre_watermark_url: string | null
          transparent_url: string | null
          updated_at: string | null
          url: string
          watermark_opacity: number | null
          watermark_size: number | null
          watermark_x: number | null
          watermark_y: number | null
        }
        Insert: {
          car_id: string
          created_at?: string | null
          display_order?: number | null
          edit_type?: string | null
          has_free_regeneration?: boolean | null
          has_watermark?: boolean | null
          id?: string
          interior_background_url?: string | null
          is_edited?: boolean | null
          is_processing?: boolean | null
          original_url?: string | null
          photo_type: string
          pre_watermark_url?: string | null
          transparent_url?: string | null
          updated_at?: string | null
          url: string
          watermark_opacity?: number | null
          watermark_size?: number | null
          watermark_x?: number | null
          watermark_y?: number | null
        }
        Update: {
          car_id?: string
          created_at?: string | null
          display_order?: number | null
          edit_type?: string | null
          has_free_regeneration?: boolean | null
          has_watermark?: boolean | null
          id?: string
          interior_background_url?: string | null
          is_edited?: boolean | null
          is_processing?: boolean | null
          original_url?: string | null
          photo_type?: string
          pre_watermark_url?: string | null
          transparent_url?: string | null
          updated_at?: string | null
          url?: string
          watermark_opacity?: number | null
          watermark_size?: number | null
          watermark_x?: number | null
          watermark_y?: number | null
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
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_collections: {
        Row: {
          created_at: string
          expires_at: string | null
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
          photo_ids: string[]
          share_token: string
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
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
          photo_ids?: string[]
          share_token: string
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
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
          photo_ids?: string[]
          share_token?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      signup_codes: {
        Row: {
          checkout_url: string | null
          code: string
          company_name: string | null
          created_at: string | null
          id: string
          stripe_customer_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          checkout_url?: string | null
          code: string
          company_name?: string | null
          created_at?: string | null
          id?: string
          stripe_customer_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          checkout_url?: string | null
          code?: string
          company_name?: string | null
          created_at?: string | null
          id?: string
          stripe_customer_id?: string
          used_at?: string | null
          used_by?: string | null
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
          plan: string | null
          scheduled_plan: string | null
          scheduled_plan_date: string | null
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
          plan?: string | null
          scheduled_plan?: string | null
          scheduled_plan_date?: string | null
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
          plan?: string | null
          scheduled_plan?: string | null
          scheduled_plan_date?: string | null
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
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_invite_codes"
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
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_invite_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_invite_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_verifications: {
        Row: {
          created_at: string | null
          email_code_expires_at: string | null
          email_verification_code: string | null
          email_verified: boolean | null
          id: string
          phone_code_expires_at: string | null
          phone_number: string | null
          phone_verification_code: string | null
          phone_verified: boolean | null
          registration_ip: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_code_expires_at?: string | null
          email_verification_code?: string | null
          email_verified?: boolean | null
          id?: string
          phone_code_expires_at?: string | null
          phone_number?: string | null
          phone_verification_code?: string | null
          phone_verified?: boolean | null
          registration_ip?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_code_expires_at?: string | null
          email_verification_code?: string | null
          email_verified?: boolean | null
          id?: string
          phone_code_expires_at?: string | null
          phone_number?: string | null
          phone_verification_code?: string | null
          phone_verified?: boolean | null
          registration_ip?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_invite_codes: {
        Row: {
          employee_invite_code: string | null
          id: string | null
        }
        Insert: {
          employee_invite_code?: string | null
          id?: string | null
        }
        Update: {
          employee_invite_code?: string | null
          id?: string | null
        }
        Relationships: []
      }
      public_photos: {
        Row: {
          id: string | null
          url: string | null
        }
        Insert: {
          id?: string | null
          url?: string | null
        }
        Update: {
          id?: string | null
          url?: string | null
        }
        Relationships: []
      }
      public_shared_collections: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string | null
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
          photo_ids: string[] | null
          share_token: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
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
          photo_ids?: string[] | null
          share_token?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
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
          photo_ids?: string[] | null
          share_token?: string | null
          title?: string | null
        }
        Relationships: []
      }
      public_signup_codes: {
        Row: {
          code: string | null
          company_name: string | null
          id: string | null
          is_used: boolean | null
        }
        Insert: {
          code?: string | null
          company_name?: string | null
          id?: string | null
          is_used?: never
        }
        Update: {
          code?: string | null
          company_name?: string | null
          id?: string | null
          is_used?: never
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_reset_tokens: { Args: never; Returns: undefined }
      generate_reset_token: { Args: never; Returns: string }
      generate_share_token: { Args: never; Returns: string }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      user_belongs_to_company: {
        Args: { company_uuid: string }
        Returns: boolean
      }
      validate_invite_code: { Args: { code: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "employee"
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
    Enums: {
      app_role: ["admin", "employee"],
    },
  },
} as const
