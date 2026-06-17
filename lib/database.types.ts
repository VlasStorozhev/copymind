export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      auth_attempts: {
        Row: {
          attempt_type: string
          created_at: string
          expires_at: string
          id: string
          normalized_email: string
          quiz_response_id: string | null
          redirect_path: string
          status: string
          user_id: string | null
          verified_at: string | null
          visit_id: string | null
          visitor_id: string | null
        }
        Insert: {
          attempt_type: string
          created_at?: string
          expires_at: string
          id?: string
          normalized_email: string
          quiz_response_id?: string | null
          redirect_path?: string
          status?: string
          user_id?: string | null
          verified_at?: string | null
          visit_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          attempt_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          normalized_email?: string
          quiz_response_id?: string | null
          redirect_path?: string
          status?: string
          user_id?: string | null
          verified_at?: string | null
          visit_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_attempts_quiz_response_id_fkey"
            columns: ["quiz_response_id"]
            isOneToOne: false
            referencedRelation: "quiz_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auth_attempts_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          step: string | null
          user_id: string | null
          visit_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          step?: string | null
          user_id?: string | null
          visit_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          step?: string | null
          user_id?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_events_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_responses: {
        Row: {
          answers: Json
          completed_at: string | null
          confidence: string | null
          created_at: string
          current_decision: string | null
          decision_context: string | null
          decision_pattern: string | null
          emotional_driver: string | null
          gender: string | null
          id: string
          primary_blocker: string | null
          recommended_starting_point: string | null
          support_preference: string | null
          updated_at: string
          user_id: string | null
          visit_id: string
          visitor_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          confidence?: string | null
          created_at?: string
          current_decision?: string | null
          decision_context?: string | null
          decision_pattern?: string | null
          emotional_driver?: string | null
          gender?: string | null
          id?: string
          primary_blocker?: string | null
          recommended_starting_point?: string | null
          support_preference?: string | null
          updated_at?: string
          user_id?: string | null
          visit_id: string
          visitor_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          confidence?: string | null
          created_at?: string
          current_decision?: string | null
          decision_context?: string | null
          decision_pattern?: string | null
          emotional_driver?: string | null
          gender?: string | null
          id?: string
          primary_blocker?: string | null
          recommended_starting_point?: string | null
          support_preference?: string | null
          updated_at?: string
          user_id?: string | null
          visit_id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string
          email_verified_at: string | null
          first_authenticated_at: string
          first_touch_campaign: string | null
          first_touch_medium: string | null
          first_touch_source: string | null
          id: string
          last_seen_at: string
          last_touch_campaign: string | null
          last_touch_medium: string | null
          last_touch_source: string | null
          product_interest_source: string | null
          product_interested_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          email_verified_at?: string | null
          first_authenticated_at?: string
          first_touch_campaign?: string | null
          first_touch_medium?: string | null
          first_touch_source?: string | null
          id?: string
          last_seen_at?: string
          last_touch_campaign?: string | null
          last_touch_medium?: string | null
          last_touch_source?: string | null
          product_interest_source?: string | null
          product_interested_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          email_verified_at?: string | null
          first_authenticated_at?: string
          first_touch_campaign?: string | null
          first_touch_medium?: string | null
          first_touch_source?: string | null
          id?: string
          last_seen_at?: string
          last_touch_campaign?: string | null
          last_touch_medium?: string | null
          last_touch_source?: string | null
          product_interest_source?: string | null
          product_interested_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          campaign: string | null
          created_at: string
          id: string
          landing_url: string | null
          medium: string | null
          referrer: string | null
          source: string
          updated_at: string
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          campaign?: string | null
          created_at?: string
          id?: string
          landing_url?: string | null
          medium?: string | null
          referrer?: string | null
          source?: string
          updated_at?: string
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          campaign?: string | null
          created_at?: string
          id?: string
          landing_url?: string | null
          medium?: string | null
          referrer?: string | null
          source?: string
          updated_at?: string
          user_id?: string | null
          visitor_id?: string
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
