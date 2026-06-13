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
      bosses: {
        Row: {
          created_at: string
          created_by: string | null
          description_de: string | null
          description_en: string | null
          difficulty: string
          drops: Json
          id: string
          image_url: string | null
          name_de: string
          name_en: string | null
          slug: string
          spawn_item_id: string | null
          strategy_de: string | null
          strategy_en: string | null
          tags: string[]
          updated_at: string
          world_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description_de?: string | null
          description_en?: string | null
          difficulty?: string
          drops?: Json
          id?: string
          image_url?: string | null
          name_de: string
          name_en?: string | null
          slug: string
          spawn_item_id?: string | null
          strategy_de?: string | null
          strategy_en?: string | null
          tags?: string[]
          updated_at?: string
          world_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description_de?: string | null
          description_en?: string | null
          difficulty?: string
          drops?: Json
          id?: string
          image_url?: string | null
          name_de?: string
          name_en?: string | null
          slug?: string
          spawn_item_id?: string | null
          strategy_de?: string | null
          strategy_en?: string | null
          tags?: string[]
          updated_at?: string
          world_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bosses_spawn_item_id_fkey"
            columns: ["spawn_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bosses_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      commands: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description_de: string | null
          description_en: string | null
          examples: string | null
          id: string
          name_de: string
          name_en: string | null
          permission: string | null
          slug: string
          syntax: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description_de?: string | null
          description_en?: string | null
          examples?: string | null
          id?: string
          name_de: string
          name_en?: string | null
          permission?: string | null
          slug: string
          syntax: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description_de?: string | null
          description_en?: string | null
          examples?: string | null
          id?: string
          name_de?: string
          name_en?: string | null
          permission?: string | null
          slug?: string
          syntax?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description_de: string | null
          description_en: string | null
          enchanted: boolean
          id: string
          image_url: string | null
          name_de: string
          name_en: string | null
          oraxen_id: string | null
          rarity: string
          slug: string
          source_de: string | null
          source_en: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description_de?: string | null
          description_en?: string | null
          enchanted?: boolean
          id?: string
          image_url?: string | null
          name_de: string
          name_en?: string | null
          oraxen_id?: string | null
          rarity?: string
          slug: string
          source_de?: string | null
          source_en?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description_de?: string | null
          description_en?: string | null
          enchanted?: boolean
          id?: string
          image_url?: string | null
          name_de?: string
          name_en?: string | null
          oraxen_id?: string | null
          rarity?: string
          slug?: string
          source_de?: string | null
          source_en?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          acquire_de: string | null
          acquire_en: string | null
          created_at: string
          created_by: string | null
          description_de: string | null
          description_en: string | null
          id: string
          image_url: string | null
          kind: string
          name_de: string
          name_en: string | null
          skills_de: string | null
          skills_en: string | null
          slug: string
          source: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          acquire_de?: string | null
          acquire_en?: string | null
          created_at?: string
          created_by?: string | null
          description_de?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          name_de: string
          name_en?: string | null
          skills_de?: string | null
          skills_en?: string | null
          slug: string
          source?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          acquire_de?: string | null
          acquire_en?: string | null
          created_at?: string
          created_by?: string | null
          description_de?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          name_de?: string
          name_en?: string | null
          skills_de?: string | null
          skills_en?: string | null
          slug?: string
          source?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          created_at: string
          created_by: string | null
          description_de: string | null
          description_en: string | null
          grid: Json
          id: string
          name_de: string
          name_en: string | null
          result_count: number
          result_item_id: string | null
          shaped: boolean
          slug: string
          station: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description_de?: string | null
          description_en?: string | null
          grid?: Json
          id?: string
          name_de: string
          name_en?: string | null
          result_count?: number
          result_item_id?: string | null
          shaped?: boolean
          slug: string
          station?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description_de?: string | null
          description_en?: string | null
          grid?: Json
          id?: string
          name_de?: string
          name_en?: string | null
          result_count?: number
          result_item_id?: string | null
          shaped?: boolean
          slug?: string
          station?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_result_item_id_fkey"
            columns: ["result_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_offers: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          currency: string
          description_de: string | null
          description_en: string | null
          id: string
          image_url: string | null
          item_id: string | null
          item_name_override: string | null
          name_de: string
          name_en: string | null
          price: number
          slug: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description_de?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          item_id?: string | null
          item_name_override?: string | null
          name_de: string
          name_en?: string | null
          price: number
          slug: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description_de?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          item_id?: string | null
          item_name_override?: string | null
          name_de?: string
          name_en?: string | null
          price?: number
          slug?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_offers_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description_de: string | null
          description_en: string | null
          frequency: string
          id: string
          name_de: string
          name_en: string | null
          reward_amount: number | null
          reward_currency: string
          reward_extra_de: string | null
          reward_extra_en: string | null
          slug: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description_de?: string | null
          description_en?: string | null
          frequency?: string
          id?: string
          name_de: string
          name_en?: string | null
          reward_amount?: number | null
          reward_currency?: string
          reward_extra_de?: string | null
          reward_extra_en?: string | null
          slug: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description_de?: string | null
          description_en?: string | null
          frequency?: string
          id?: string
          name_de?: string
          name_en?: string | null
          reward_amount?: number | null
          reward_currency?: string
          reward_extra_de?: string | null
          reward_extra_en?: string | null
          slug?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wiki_pages: {
        Row: {
          body_de: string | null
          body_en: string | null
          category: string
          created_at: string
          created_by: string | null
          id: string
          slug: string
          tags: string[]
          title_de: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          body_de?: string | null
          body_en?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          slug: string
          tags?: string[]
          title_de: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          body_de?: string | null
          body_en?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          slug?: string
          tags?: string[]
          title_de?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      worlds: {
        Row: {
          access_info_de: string | null
          access_info_en: string | null
          created_at: string
          created_by: string | null
          description_de: string | null
          description_en: string | null
          id: string
          image_url: string | null
          name_de: string
          name_en: string | null
          rules_de: string | null
          rules_en: string | null
          slug: string
          tags: string[]
          updated_at: string
          world_type: string
        }
        Insert: {
          access_info_de?: string | null
          access_info_en?: string | null
          created_at?: string
          created_by?: string | null
          description_de?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          name_de: string
          name_en?: string | null
          rules_de?: string | null
          rules_en?: string | null
          slug: string
          tags?: string[]
          updated_at?: string
          world_type?: string
        }
        Update: {
          access_info_de?: string | null
          access_info_en?: string | null
          created_at?: string
          created_by?: string | null
          description_de?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          name_de?: string
          name_en?: string | null
          rules_de?: string | null
          rules_en?: string | null
          slug?: string
          tags?: string[]
          updated_at?: string
          world_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_editor: { Args: { _user_id: string }; Returns: boolean }
      wiki_search: {
        Args: { q: string }
        Returns: {
          image_url: string
          kind: string
          slug: string
          snippet: string
          title: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "editor"
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
      app_role: ["admin", "editor"],
    },
  },
} as const
