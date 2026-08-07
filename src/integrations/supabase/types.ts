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
      ai_conversations: {
        Row: {
          id: string
          last_message_at: string
          messages: number
          plan: string | null
          started_at: string
          topic: string | null
          user_id: string
        }
        Insert: {
          id?: string
          last_message_at?: string
          messages?: number
          plan?: string | null
          started_at?: string
          topic?: string | null
          user_id: string
        }
        Update: {
          id?: string
          last_message_at?: string
          messages?: number
          plan?: string | null
          started_at?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assistant_profiles: {
        Row: {
          confidence: string
          created_at: string
          data_points: number
          habits: Json
          id: string
          open_questions: Json
          patterns: Json
          people: Json
          portrait: string | null
          preferences: Json
          routines: Json
          trained_at: string | null
          updated_at: string
          user_id: string
          version: number
          watchlist: Json
        }
        Insert: {
          confidence?: string
          created_at?: string
          data_points?: number
          habits?: Json
          id?: string
          open_questions?: Json
          patterns?: Json
          people?: Json
          portrait?: string | null
          preferences?: Json
          routines?: Json
          trained_at?: string | null
          updated_at?: string
          user_id: string
          version?: number
          watchlist?: Json
        }
        Update: {
          confidence?: string
          created_at?: string
          data_points?: number
          habits?: Json
          id?: string
          open_questions?: Json
          patterns?: Json
          people?: Json
          portrait?: string | null
          preferences?: Json
          routines?: Json
          trained_at?: string | null
          updated_at?: string
          user_id?: string
          version?: number
          watchlist?: Json
        }
        Relationships: []
      }
      classification_corrections: {
        Row: {
          ai_tags: string[]
          created_at: string
          from_module: string
          id: string
          kind: string | null
          memory_id: string | null
          note: string | null
          summary: string | null
          title: string | null
          to_module: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_tags?: string[]
          created_at?: string
          from_module: string
          id?: string
          kind?: string | null
          memory_id?: string | null
          note?: string | null
          summary?: string | null
          title?: string | null
          to_module: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_tags?: string[]
          created_at?: string
          from_module?: string
          id?: string
          kind?: string | null
          memory_id?: string | null
          note?: string | null
          summary?: string | null
          title?: string | null
          to_module?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classification_corrections_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
        ]
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
          completed_at: string | null
          content: string | null
          created_at: string
          currency: string | null
          deleted_at: string | null
          due_at: string | null
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
          status: string
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_tags?: string[]
          amount?: number | null
          attachment_url?: string | null
          completed_at?: string | null
          content?: string | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          due_at?: string | null
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
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_tags?: string[]
          amount?: number | null
          attachment_url?: string | null
          completed_at?: string | null
          content?: string | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          due_at?: string | null
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
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          action_label: string | null
          action_url: string | null
          archived_at: string | null
          body: string | null
          created_at: string
          dedupe_key: string | null
          id: string
          kind: string
          level: string
          metadata: Json
          module: string | null
          read_at: string | null
          related_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          archived_at?: string | null
          body?: string | null
          created_at?: string
          dedupe_key?: string | null
          id?: string
          kind?: string
          level?: string
          metadata?: Json
          module?: string | null
          read_at?: string | null
          related_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          archived_at?: string | null
          body?: string | null
          created_at?: string
          dedupe_key?: string | null
          id?: string
          kind?: string
          level?: string
          metadata?: Json
          module?: string | null
          read_at?: string | null
          related_at?: string | null
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
          environment: string
          id: string
          provider: string
          reference: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          amount_eur?: number
          created_at?: string
          currency?: string
          description?: string | null
          environment?: string
          id?: string
          provider?: string
          reference?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          amount_eur?: number
          created_at?: string
          currency?: string
          description?: string | null
          environment?: string
          id?: string
          provider?: string
          reference?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pricing_config: {
        Row: {
          config: Json
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      proactive_alerts: {
        Row: {
          created_at: string
          dedupe_key: string
          detail: string | null
          dismissed: boolean
          due_at: string | null
          id: string
          kind: string
          notified_at: string | null
          seen: boolean
          severity: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dedupe_key: string
          detail?: string | null
          dismissed?: boolean
          due_at?: string | null
          id?: string
          kind?: string
          notified_at?: string | null
          seen?: boolean
          severity?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dedupe_key?: string
          detail?: string | null
          dismissed?: boolean
          due_at?: string | null
          id?: string
          kind?: string
          notified_at?: string | null
          seen?: boolean
          severity?: string
          title?: string
          updated_at?: string
          user_id?: string
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
          attachment_name: string | null
          attachment_url: string | null
          completed_at: string | null
          created_at: string
          done: boolean
          due_at: string
          id: string
          module: string | null
          notes: string | null
          notified_at: string | null
          repeat_rule: string | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          attachment_name?: string | null
          attachment_url?: string | null
          completed_at?: string | null
          created_at?: string
          done?: boolean
          due_at: string
          id?: string
          module?: string | null
          notes?: string | null
          notified_at?: string | null
          repeat_rule?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          attachment_name?: string | null
          attachment_url?: string | null
          completed_at?: string | null
          created_at?: string
          done?: boolean
          due_at?: string
          id?: string
          module?: string | null
          notes?: string | null
          notified_at?: string | null
          repeat_rule?: string | null
          status?: string
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
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          granted_by: string | null
          id: string
          plan: string
          plan_key: string | null
          price_id: string | null
          source: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_eur?: number
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          granted_by?: string | null
          id?: string
          plan?: string
          plan_key?: string | null
          price_id?: string | null
          source?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_eur?: number
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          granted_by?: string | null
          id?: string
          plan?: string
          plan_key?: string | null
          price_id?: string | null
          source?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_replies: {
        Row: {
          author: string
          body: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          author: string
          body: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          author?: string
          body?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_reply: string | null
          attachment_name: string | null
          attachment_url: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          replied_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_reply?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          replied_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_reply?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          replied_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          coach_time: string
          created_at: string
          custom_categories: Json
          focus_modules: string[]
          goals: string[]
          id: string
          notify_bills: boolean
          notify_coach: boolean
          notify_daily_tip: boolean
          notify_events: boolean
          notify_health: boolean
          notify_tasks: boolean
          onboarding_completed: boolean
          quiet_hours_end: string
          quiet_hours_start: string
          timezone: string
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coach_time?: string
          created_at?: string
          custom_categories?: Json
          focus_modules?: string[]
          goals?: string[]
          id?: string
          notify_bills?: boolean
          notify_coach?: boolean
          notify_daily_tip?: boolean
          notify_events?: boolean
          notify_health?: boolean
          notify_tasks?: boolean
          onboarding_completed?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          timezone?: string
          tone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coach_time?: string
          created_at?: string
          custom_categories?: Json
          focus_modules?: string[]
          goals?: string[]
          id?: string
          notify_bills?: boolean
          notify_coach?: boolean
          notify_daily_tip?: boolean
          notify_events?: boolean
          notify_health?: boolean
          notify_tasks?: boolean
          onboarding_completed?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          timezone?: string
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
      admin_delete_cron_job: { Args: { _jobid: number }; Returns: undefined }
      admin_list_cron_jobs: { Args: never; Returns: Json }
      admin_run_cron_job: { Args: { _jobid: number }; Returns: undefined }
      admin_save_cron_job: {
        Args: {
          _active?: boolean
          _command: string
          _jobname: string
          _schedule: string
        }
        Returns: Json
      }
      admin_set_cron_active: {
        Args: { _active: boolean; _jobid: number }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
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
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      purge_expired_trash: { Args: never; Returns: number }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
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
