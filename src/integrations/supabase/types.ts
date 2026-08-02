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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      account_requests: {
        Row: {
          created_at: string
          id: string
          kind: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_cards: {
        Row: {
          action: string
          alerts: Json
          created_at: string
          done: boolean
          done_at: string | null
          for_date: string
          headline: string
          id: string
          module: string | null
          reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          alerts?: Json
          created_at?: string
          done?: boolean
          done_at?: string | null
          for_date?: string
          headline: string
          id?: string
          module?: string | null
          reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          alerts?: Json
          created_at?: string
          done?: boolean
          done_at?: string | null
          for_date?: string
          headline?: string
          id?: string
          module?: string | null
          reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      facts: {
        Row: {
          category: string
          created_at: string
          id: string
          label: string | null
          memory_id: string | null
          name: string
          observed_at: string
          text_value: string | null
          unit: string | null
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          label?: string | null
          memory_id?: string | null
          name: string
          observed_at?: string
          text_value?: string | null
          unit?: string | null
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          label?: string | null
          memory_id?: string | null
          name?: string
          observed_at?: string
          text_value?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "facts_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          ai_tags: string[]
          amount: number | null
          attachment_url: string | null
          content: string | null
          created_at: string
          currency: string | null
          embedded_at: string | null
          embedding: string | null
          id: string
          kind: string
          location: string | null
          metadata: Json
          module: string
          mood: number | null
          occurred_at: string
          related_ids: string[]
          relation_note: string | null
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_tags?: string[]
          amount?: number | null
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          currency?: string | null
          embedded_at?: string | null
          embedding?: string | null
          id?: string
          kind?: string
          location?: string | null
          metadata?: Json
          module?: string
          mood?: number | null
          occurred_at?: string
          related_ids?: string[]
          relation_note?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_tags?: string[]
          amount?: number | null
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          currency?: string | null
          embedded_at?: string | null
          embedding?: string | null
          id?: string
          kind?: string
          location?: string | null
          metadata?: Json
          module?: string
          mood?: number | null
          occurred_at?: string
          related_ids?: string[]
          relation_note?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      money_items: {
        Row: {
          active: boolean
          amount: number
          cadence: string
          category: string | null
          created_at: string
          currency: string
          id: string
          label: string
          memory_id: string | null
          next_due: string | null
          notes: string | null
          source: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          amount?: number
          cadence?: string
          category?: string | null
          created_at?: string
          currency?: string
          id?: string
          label: string
          memory_id?: string | null
          next_due?: string | null
          notes?: string | null
          source?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          amount?: number
          cadence?: string
          category?: string | null
          created_at?: string
          currency?: string
          id?: string
          label?: string
          memory_id?: string | null
          next_due?: string | null
          notes?: string | null
          source?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "money_items_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_eur: number
          created_at: string
          currency: string
          description: string | null
          id: string
          status: string
          user_id: string | null
        }
        Insert: {
          amount_eur?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          amount_eur?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          amount: number | null
          created_at: string
          done: boolean
          due_at: string
          id: string
          module: string | null
          notified_at: string | null
          repeat_rule: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          done?: boolean
          due_at: string
          id?: string
          module?: string | null
          notified_at?: string | null
          repeat_rule?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          done?: boolean
          due_at?: string
          id?: string
          module?: string | null
          notified_at?: string | null
          repeat_rule?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_eur: number
          created_at: string
          current_period_end: string | null
          granted_by: string | null
          id: string
          plan: string
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_eur?: number
          created_at?: string
          current_period_end?: string | null
          granted_by?: string | null
          id?: string
          plan?: string
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_eur?: number
          created_at?: string
          current_period_end?: string | null
          granted_by?: string | null
          id?: string
          plan?: string
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          coach_time: string
          created_at: string
          focus_modules: string[]
          goals: string[]
          id: string
          notify_bills: boolean
          notify_coach: boolean
          notify_events: boolean
          notify_health: boolean
          notify_tasks: boolean
          onboarding_completed: boolean
          quiet_hours_end: string
          quiet_hours_start: string
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coach_time?: string
          created_at?: string
          focus_modules?: string[]
          goals?: string[]
          id?: string
          notify_bills?: boolean
          notify_coach?: boolean
          notify_events?: boolean
          notify_health?: boolean
          notify_tasks?: boolean
          onboarding_completed?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          tone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coach_time?: string
          created_at?: string
          focus_modules?: string[]
          goals?: string[]
          id?: string
          notify_bills?: boolean
          notify_coach?: boolean
          notify_events?: boolean
          notify_health?: boolean
          notify_tasks?: boolean
          onboarding_completed?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          tone?: string
          updated_at?: string
          user_id?: string
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
      is_admin_email: { Args: { _email: string }; Returns: boolean }
      match_memories: {
        Args: {
          match_count?: number
          min_similarity?: number
          query_embedding: string
        }
        Returns: {
          ai_tags: string[]
          amount: number
          content: string
          currency: string
          id: string
          kind: string
          metadata: Json
          module: string
          occurred_at: string
          similarity: number
          summary: string
          title: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
