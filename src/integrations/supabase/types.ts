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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academy_certificates: {
        Row: {
          certificate_url: string | null
          id: string
          issued_at: string
          module_id: string
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          id?: string
          issued_at?: string
          module_id: string
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          id?: string
          issued_at?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_certificates_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_lessons: {
        Row: {
          content: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          module_id: string
          organization_id: string
          sort_order: number | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          module_id: string
          organization_id: string
          sort_order?: number | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          module_id?: string
          organization_id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_lessons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_modules: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          difficulty: string | null
          id: string
          is_published: boolean | null
          organization_id: string
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          is_published?: boolean | null
          organization_id: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          is_published?: boolean | null
          organization_id?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_modules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          progress_percent: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          progress_percent?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          progress_percent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_quiz_attempts: {
        Row: {
          answers: Json | null
          created_at: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          id?: string
          passed?: boolean
          quiz_id: string
          score?: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          created_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "academy_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_quiz_questions: {
        Row: {
          correct_answer: number
          id: string
          options: Json
          question: string
          quiz_id: string
          sort_order: number | null
        }
        Insert: {
          correct_answer?: number
          id?: string
          options?: Json
          question: string
          quiz_id: string
          sort_order?: number | null
        }
        Update: {
          correct_answer?: number
          id?: string
          options?: Json
          question?: string
          quiz_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "academy_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_quizzes: {
        Row: {
          created_at: string
          id: string
          module_id: string
          organization_id: string
          passing_score: number | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          organization_id: string
          passing_score?: number | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          organization_id?: string
          passing_score?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_quizzes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversation_logs: {
        Row: {
          agent_id: string
          contact_id: string
          created_at: string
          id: string
          input_message: string | null
          model: string | null
          organization_id: string
          output_message: string | null
          tokens_used: number | null
        }
        Insert: {
          agent_id: string
          contact_id: string
          created_at?: string
          id?: string
          input_message?: string | null
          model?: string | null
          organization_id: string
          output_message?: string | null
          tokens_used?: number | null
        }
        Update: {
          agent_id?: string
          contact_id?: string
          created_at?: string
          id?: string
          input_message?: string | null
          model?: string | null
          organization_id?: string
          output_message?: string | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "client_ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversation_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_views: {
        Row: {
          announcement_id: string
          confirmed_at: string | null
          id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          announcement_id: string
          confirmed_at?: string | null
          id?: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          announcement_id?: string
          confirmed_at?: string | null
          id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_views_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          attachment_url: string | null
          content: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          organization_id: string
          priority: string
          published_at: string | null
          require_confirmation: boolean
          show_dashboard: boolean
          show_popup: boolean
          status: string
          target_roles: string[] | null
          target_unit_ids: string[] | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          organization_id: string
          priority?: string
          published_at?: string | null
          require_confirmation?: boolean
          show_dashboard?: boolean
          show_popup?: boolean
          status?: string
          target_roles?: string[] | null
          target_unit_ids?: string[] | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          organization_id?: string
          priority?: string
          published_at?: string | null
          require_confirmation?: boolean
          show_dashboard?: boolean
          show_popup?: boolean
          status?: string
          target_roles?: string[] | null
          target_unit_ids?: string[] | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_invites: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_invites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          calendar_id: string | null
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string
          google_event_id: string | null
          id: string
          location: string | null
          organization_id: string
          readonly: boolean | null
          recurrence: string | null
          start_at: string
          title: string
          unit_id: string | null
          updated_at: string
          visibility: string | null
        }
        Insert: {
          all_day?: boolean | null
          calendar_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          organization_id: string
          readonly?: boolean | null
          recurrence?: string | null
          start_at: string
          title: string
          unit_id?: string | null
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          all_day?: boolean | null
          calendar_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string
          google_event_id?: string | null
          id?: string
          location?: string | null
          organization_id?: string
          readonly?: boolean | null
          recurrence?: string | null
          start_at?: string
          title?: string
          unit_id?: string | null
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      calendars: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          organization_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          organization_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendars_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          category: string | null
          conditions: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          title: string
        }
        Insert: {
          category?: string | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          title: string
        }
        Update: {
          category?: string | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_ai_agents: {
        Row: {
          avatar_url: string | null
          channel: string
          created_at: string
          created_by: string | null
          crm_actions: Json
          description: string | null
          gender: string | null
          id: string
          knowledge_base: Json
          name: string
          objectives: Json
          organization_id: string
          persona: Json
          prompt_config: Json
          role: string
          status: string
          tags: string[]
          updated_at: string
          whatsapp_instance_ids: Json
        }
        Insert: {
          avatar_url?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          crm_actions?: Json
          description?: string | null
          gender?: string | null
          id?: string
          knowledge_base?: Json
          name: string
          objectives?: Json
          organization_id: string
          persona?: Json
          prompt_config?: Json
          role?: string
          status?: string
          tags?: string[]
          updated_at?: string
          whatsapp_instance_ids?: Json
        }
        Update: {
          avatar_url?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          crm_actions?: Json
          description?: string | null
          gender?: string | null
          id?: string
          knowledge_base?: Json
          name?: string
          objectives?: Json
          organization_id?: string
          persona?: Json
          prompt_config?: Json
          role?: string
          status?: string
          tags?: string[]
          updated_at?: string
          whatsapp_instance_ids?: Json
        }
        Relationships: [
          {
            foreignKeyName: "client_ai_agents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_campaigns: {
        Row: {
          budget: number | null
          content: Json | null
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          name: string
          organization_id: string
          start_date: string | null
          status: string
          type: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          content?: Json | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          name: string
          organization_id: string
          start_date?: string | null
          status?: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          content?: Json | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          name?: string
          organization_id?: string
          start_date?: string | null
          status?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_checklist_items: {
        Row: {
          category: string | null
          created_at: string
          date: string
          id: string
          is_completed: boolean | null
          organization_id: string
          source: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          date?: string
          id?: string
          is_completed?: boolean | null
          organization_id: string
          source?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          date?: string
          id?: string
          is_completed?: boolean | null
          organization_id?: string
          source?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_checklist_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_content: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          cta: string | null
          format: string | null
          id: string
          main_message: string | null
          media_urls: string[] | null
          objective: string | null
          organization_id: string
          platform: string | null
          published_at: string | null
          result: Json | null
          scheduled_at: string | null
          status: string
          strategy_id: string | null
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          cta?: string | null
          format?: string | null
          id?: string
          main_message?: string | null
          media_urls?: string[] | null
          objective?: string | null
          organization_id: string
          platform?: string | null
          published_at?: string | null
          result?: Json | null
          scheduled_at?: string | null
          status?: string
          strategy_id?: string | null
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          cta?: string | null
          format?: string | null
          id?: string
          main_message?: string | null
          media_urls?: string[] | null
          objective?: string | null
          organization_id?: string
          platform?: string | null
          published_at?: string | null
          result?: Json | null
          scheduled_at?: string | null
          status?: string
          strategy_id?: string | null
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_content_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_diagnostics: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          lead_id: string | null
          notes: string | null
          organization_id: string
          scores: Json
          total_score: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id: string
          scores?: Json
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id?: string
          scores?: Json
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_diagnostics_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_diagnostics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_dispatches: {
        Row: {
          channel: string
          created_at: string
          created_by: string | null
          delay_seconds: number
          id: string
          image_url: string | null
          max_per_day: number
          message: string | null
          organization_id: string
          recipients: Json | null
          scheduled_at: string | null
          sent_at: string | null
          source_type: string
          stats: Json | null
          status: string
          title: string
        }
        Insert: {
          channel?: string
          created_at?: string
          created_by?: string | null
          delay_seconds?: number
          id?: string
          image_url?: string | null
          max_per_day?: number
          message?: string | null
          organization_id: string
          recipients?: Json | null
          scheduled_at?: string | null
          sent_at?: string | null
          source_type?: string
          stats?: Json | null
          status?: string
          title: string
        }
        Update: {
          channel?: string
          created_at?: string
          created_by?: string | null
          delay_seconds?: number
          id?: string
          image_url?: string | null
          max_per_day?: number
          message?: string | null
          organization_id?: string
          recipients?: Json | null
          scheduled_at?: string | null
          sent_at?: string | null
          source_type?: string
          stats?: Json | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_dispatches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_gamification: {
        Row: {
          badges: Json | null
          created_at: string
          id: string
          last_activity_at: string | null
          level: number | null
          organization_id: string
          points: number | null
          streak_days: number | null
          title: string | null
          updated_at: string
          user_id: string
          xp: number | null
        }
        Insert: {
          badges?: Json | null
          created_at?: string
          id?: string
          last_activity_at?: string | null
          level?: number | null
          organization_id: string
          points?: number | null
          streak_days?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
          xp?: number | null
        }
        Update: {
          badges?: Json | null
          created_at?: string
          id?: string
          last_activity_at?: string | null
          level?: number | null
          organization_id?: string
          points?: number | null
          streak_days?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_gamification_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string | null
          organization_id: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          organization_id: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          organization_id?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_nps_responses: {
        Row: {
          agent_id: string | null
          comment: string | null
          contact_id: string
          created_at: string
          id: string
          organization_id: string
          score: number
        }
        Insert: {
          agent_id?: string | null
          comment?: string | null
          contact_id: string
          created_at?: string
          id?: string
          organization_id: string
          score: number
        }
        Update: {
          agent_id?: string | null
          comment?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_nps_responses_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "client_ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_nps_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_payments: {
        Row: {
          amount: number
          asaas_customer_id: string | null
          asaas_payment_id: string | null
          billing_type: string
          contract_id: string
          created_at: string
          franchisee_share: number
          franqueadora_share: number | null
          id: string
          invoice_url: string | null
          month: string
          organization_id: string
          paid_at: string | null
          status: string
          surplus_amount: number | null
          updated_at: string
        }
        Insert: {
          amount?: number
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          billing_type?: string
          contract_id: string
          created_at?: string
          franchisee_share?: number
          franqueadora_share?: number | null
          id?: string
          invoice_url?: string | null
          month: string
          organization_id: string
          paid_at?: string | null
          status?: string
          surplus_amount?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          billing_type?: string
          contract_id?: string
          created_at?: string
          franchisee_share?: number
          franqueadora_share?: number | null
          id?: string
          invoice_url?: string | null
          month?: string
          organization_id?: string
          paid_at?: string | null
          status?: string
          surplus_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_posts: {
        Row: {
          content_id: string | null
          created_at: string | null
          created_by: string | null
          duration: string | null
          format: string | null
          id: string
          input_text: string | null
          organization_id: string
          reference_image_urls: string[] | null
          result_data: Json | null
          result_url: string | null
          status: string | null
          style: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          content_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration?: string | null
          format?: string | null
          id?: string
          input_text?: string | null
          organization_id: string
          reference_image_urls?: string[] | null
          result_data?: Json | null
          result_url?: string | null
          status?: string | null
          style?: string | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          content_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration?: string | null
          format?: string | null
          id?: string
          input_text?: string | null
          organization_id?: string
          reference_image_urls?: string[] | null
          result_data?: Json | null
          result_url?: string | null
          status?: string | null
          style?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_posts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "client_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_scripts: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_scripts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_sites: {
        Row: {
          content: Json | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          organization_id: string
          published_at: string | null
          status: string
          strategy_id: string | null
          type: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          organization_id: string
          published_at?: string | null
          status?: string
          strategy_id?: string | null
          type?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          organization_id?: string
          published_at?: string | null
          status?: string
          strategy_id?: string | null
          type?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_sites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_sites_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "marketing_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tasks: {
        Row: {
          assigned_team: string | null
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          organization_id: string
          priority: string
          source: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_team?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id: string
          priority?: string
          source?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_team?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string
          priority?: string
          source?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          template_type: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          template_type?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          template_type?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_address: string | null
          client_document: string | null
          client_phone: string | null
          content: string | null
          contract_type: string | null
          created_at: string
          created_by: string | null
          duration_months: number | null
          end_date: string | null
          id: string
          lead_id: string | null
          monthly_value: number | null
          organization_id: string
          owner_type: string | null
          payment_day: number | null
          service_description: string | null
          signed_at: string | null
          signer_email: string | null
          signer_name: string | null
          start_date: string | null
          status: string
          surplus_issuer: string | null
          surplus_value: number | null
          template_id: string | null
          title: string
          total_value: number | null
          unit_org_id: string | null
          updated_at: string
        }
        Insert: {
          client_address?: string | null
          client_document?: string | null
          client_phone?: string | null
          content?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          duration_months?: number | null
          end_date?: string | null
          id?: string
          lead_id?: string | null
          monthly_value?: number | null
          organization_id: string
          owner_type?: string | null
          payment_day?: number | null
          service_description?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string | null
          start_date?: string | null
          status?: string
          surplus_issuer?: string | null
          surplus_value?: number | null
          template_id?: string | null
          title: string
          total_value?: number | null
          unit_org_id?: string | null
          updated_at?: string
        }
        Update: {
          client_address?: string | null
          client_document?: string | null
          client_phone?: string | null
          content?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          duration_months?: number | null
          end_date?: string | null
          id?: string
          lead_id?: string | null
          monthly_value?: number | null
          organization_id?: string
          owner_type?: string | null
          payment_day?: number | null
          service_description?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string | null
          start_date?: string | null
          status?: string
          surplus_issuer?: string | null
          surplus_value?: number | null
          template_id?: string | null
          title?: string
          total_value?: number | null
          unit_org_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_unit_org_id_fkey"
            columns: ["unit_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          organization_id: string
          type: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          type?: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_wallets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lead_id: string
          organization_id: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lead_id: string
          organization_id: string
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string
          organization_id?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_automation_queue: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          organization_id: string
          processed: boolean | null
          trigger_data: Json | null
          trigger_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          organization_id: string
          processed?: boolean | null
          trigger_data?: Json | null
          trigger_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          organization_id?: string
          processed?: boolean | null
          trigger_data?: Json | null
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_automation_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_automations: {
        Row: {
          action_config: Json
          action_type: string
          agent_id: string | null
          assigned_user_ids: Json
          created_at: string
          description: string | null
          execution_count: number | null
          funnel_ids: Json
          id: string
          is_active: boolean
          last_executed_at: string | null
          name: string
          organization_id: string
          priority: number
          team_ids: Json
          trigger_config: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_type?: string
          agent_id?: string | null
          assigned_user_ids?: Json
          created_at?: string
          description?: string | null
          execution_count?: number | null
          funnel_ids?: Json
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          name: string
          organization_id: string
          priority?: number
          team_ids?: Json
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          agent_id?: string | null
          assigned_user_ids?: Json
          created_at?: string
          description?: string | null
          execution_count?: number | null
          funnel_ids?: Json
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          name?: string
          organization_id?: string
          priority?: number
          team_ids?: Json
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_automations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "client_ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_automations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          address: string | null
          birth_date: string | null
          company: string | null
          created_at: string
          custom_fields: Json | null
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          position: string | null
          source: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          position?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          position?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_files: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          mime_type: string | null
          name: string
          organization_id: string
          size_bytes: number | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          mime_type?: string | null
          name: string
          organization_id: string
          size_bytes?: number | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          mime_type?: string | null
          name?: string
          organization_id?: string
          size_bytes?: number | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_files_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_funnels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          organization_id: string
          stages: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          stages?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          stages?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_funnels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string
          organization_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id: string
          organization_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          organization_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          contact_id: string | null
          created_at: string
          custom_fields: Json | null
          email: string | null
          funnel_id: string | null
          id: string
          lost_at: string | null
          lost_reason: string | null
          name: string
          organization_id: string
          phone: string | null
          source: string | null
          stage: string
          tags: string[] | null
          temperature: string | null
          updated_at: string
          value: number | null
          whatsapp_contact_id: string | null
          won_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          contact_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          funnel_id?: string | null
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          name: string
          organization_id: string
          phone?: string | null
          source?: string | null
          stage?: string
          tags?: string[] | null
          temperature?: string | null
          updated_at?: string
          value?: number | null
          whatsapp_contact_id?: string | null
          won_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          contact_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          funnel_id?: string | null
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          name?: string
          organization_id?: string
          phone?: string | null
          source?: string | null
          stage?: string
          tags?: string[] | null
          temperature?: string | null
          updated_at?: string
          value?: number | null
          whatsapp_contact_id?: string | null
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "crm_funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_partner_companies: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          document: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          document?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          document?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_partner_companies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          price: number
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          price?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          price?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_proposals: {
        Row: {
          accepted_at: string | null
          content: Json | null
          created_at: string
          created_by: string | null
          discount_total: number
          id: string
          items: Json
          lead_id: string | null
          notes: string | null
          organization_id: string
          partner_company_id: string | null
          payment_terms: string | null
          rejected_at: string | null
          sent_at: string | null
          status: string
          title: string
          updated_at: string
          valid_until: string | null
          value: number | null
        }
        Insert: {
          accepted_at?: string | null
          content?: Json | null
          created_at?: string
          created_by?: string | null
          discount_total?: number
          id?: string
          items?: Json
          lead_id?: string | null
          notes?: string | null
          organization_id: string
          partner_company_id?: string | null
          payment_terms?: string | null
          rejected_at?: string | null
          sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
          valid_until?: string | null
          value?: number | null
        }
        Update: {
          accepted_at?: string | null
          content?: Json | null
          created_at?: string
          created_by?: string | null
          discount_total?: number
          id?: string
          items?: Json
          lead_id?: string | null
          notes?: string | null
          organization_id?: string
          partner_company_id?: string | null
          payment_terms?: string | null
          rejected_at?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          valid_until?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_proposals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_proposals_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "crm_partner_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_settings: {
        Row: {
          alerts_enabled: boolean
          auto_tasks_on_stage_move: boolean
          created_at: string
          id: string
          lead_roulette_enabled: boolean
          organization_id: string
          outbound_webhooks: Json
          roulette_last_index: number | null
          roulette_members: Json
          sla_first_contact_hours: number
          sla_first_contact_minutes: number
          sla_no_response_minutes: number
          sla_stage_stuck_days: number
          sla_task_open_days: number
          updated_at: string
        }
        Insert: {
          alerts_enabled?: boolean
          auto_tasks_on_stage_move?: boolean
          created_at?: string
          id?: string
          lead_roulette_enabled?: boolean
          organization_id: string
          outbound_webhooks?: Json
          roulette_last_index?: number | null
          roulette_members?: Json
          sla_first_contact_hours?: number
          sla_first_contact_minutes?: number
          sla_no_response_minutes?: number
          sla_stage_stuck_days?: number
          sla_task_open_days?: number
          updated_at?: string
        }
        Update: {
          alerts_enabled?: boolean
          auto_tasks_on_stage_move?: boolean
          created_at?: string
          id?: string
          lead_roulette_enabled?: boolean
          organization_id?: string
          outbound_webhooks?: Json
          roulette_last_index?: number | null
          roulette_members?: Json
          sla_first_contact_hours?: number
          sla_first_contact_minutes?: number
          sla_no_response_minutes?: number
          sla_stage_stuck_days?: number
          sla_task_open_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          organization_id: string
          priority: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          organization_id: string
          priority?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          organization_id?: string
          priority?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_teams: {
        Row: {
          created_at: string
          description: string | null
          funnel_ids: Json | null
          id: string
          members: Json | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          funnel_ids?: Json | null
          id?: string
          members?: Json | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          funnel_ids?: Json | null
          id?: string
          members?: Json | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_messages: {
        Row: {
          author: string | null
          created_at: string
          date: string
          id: string
          message: string
          organization_id: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          date?: string
          id?: string
          message: string
          organization_id: string
        }
        Update: {
          author?: string | null
          created_at?: string
          date?: string
          id?: string
          message?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_clients: {
        Row: {
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_closings: {
        Row: {
          created_at: string
          created_by: string | null
          file_url: string | null
          id: string
          month: number
          notes: string | null
          organization_id: string
          status: string
          title: string
          unit_id: string | null
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          month: number
          notes?: string | null
          organization_id: string
          status?: string
          title: string
          unit_id?: string | null
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          month?: number
          notes?: string | null
          organization_id?: string
          status?: string
          title?: string
          unit_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "finance_closings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_closings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_employees: {
        Row: {
          created_at: string
          hire_date: string | null
          id: string
          name: string
          organization_id: string
          role: string | null
          salary: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hire_date?: string | null
          id?: string
          name: string
          organization_id: string
          role?: string | null
          salary?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hire_date?: string | null
          id?: string
          name?: string
          organization_id?: string
          role?: string | null
          salary?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          date: string
          description: string
          finance_month_id: string | null
          id: string
          is_recurring: boolean | null
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          description: string
          finance_month_id?: string | null
          id?: string
          is_recurring?: boolean | null
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          description?: string
          finance_month_id?: string | null
          id?: string
          is_recurring?: boolean | null
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_expenses_finance_month_id_fkey"
            columns: ["finance_month_id"]
            isOneToOne: false
            referencedRelation: "finance_months"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_franchisees: {
        Row: {
          created_at: string
          franchisee_org_id: string | null
          id: string
          marketing_fee: number | null
          name: string
          organization_id: string
          royalty_percentage: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          franchisee_org_id?: string | null
          id?: string
          marketing_fee?: number | null
          name: string
          organization_id: string
          royalty_percentage?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          franchisee_org_id?: string | null
          id?: string
          marketing_fee?: number | null
          name?: string
          organization_id?: string
          royalty_percentage?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_franchisees_franchisee_org_id_fkey"
            columns: ["franchisee_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_franchisees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_installments: {
        Row: {
          created_at: string
          description: string
          id: string
          installment_amount: number
          organization_id: string
          paid_installments: number
          start_date: string | null
          status: string
          total_amount: number
          total_installments: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          installment_amount?: number
          organization_id: string
          paid_installments?: number
          start_date?: string | null
          status?: string
          total_amount?: number
          total_installments?: number
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          installment_amount?: number
          organization_id?: string
          paid_installments?: number
          start_date?: string | null
          status?: string
          total_amount?: number
          total_installments?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_installments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_months: {
        Row: {
          closed_at: string | null
          created_at: string
          id: string
          month: number
          organization_id: string
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          id?: string
          month: number
          organization_id: string
          status?: string
          updated_at?: string
          year: number
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          id?: string
          month?: number
          organization_id?: string
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "finance_months_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_revenues: {
        Row: {
          amount: number
          category: string | null
          client_id: string | null
          created_at: string
          date: string
          description: string
          finance_month_id: string | null
          id: string
          organization_id: string
          payment_method: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string | null
          client_id?: string | null
          created_at?: string
          date?: string
          description: string
          finance_month_id?: string | null
          id?: string
          organization_id: string
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          client_id?: string | null
          created_at?: string
          date?: string
          description?: string
          finance_month_id?: string | null
          id?: string
          organization_id?: string
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_revenues_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "finance_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_revenues_finance_month_id_fkey"
            columns: ["finance_month_id"]
            isOneToOne: false
            referencedRelation: "finance_months"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_revenues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      franchisee_charges: {
        Row: {
          asaas_payment_id: string | null
          created_at: string
          franchisee_org_id: string
          id: string
          month: string
          organization_id: string
          paid_at: string | null
          royalty_amount: number
          status: string
          system_fee: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          asaas_payment_id?: string | null
          created_at?: string
          franchisee_org_id: string
          id?: string
          month: string
          organization_id: string
          paid_at?: string | null
          royalty_amount?: number
          status?: string
          system_fee?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          asaas_payment_id?: string | null
          created_at?: string
          franchisee_org_id?: string
          id?: string
          month?: string
          organization_id?: string
          paid_at?: string | null
          royalty_amount?: number
          status?: string
          system_fee?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchisee_charges_franchisee_org_id_fkey"
            columns: ["franchisee_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchisee_charges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      franchisee_system_payments: {
        Row: {
          amount: number
          asaas_payment_id: string | null
          billing_type: string
          created_at: string
          id: string
          invoice_url: string | null
          month: string
          organization_id: string
          paid_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          asaas_payment_id?: string | null
          billing_type?: string
          created_at?: string
          id?: string
          invoice_url?: string | null
          month: string
          organization_id: string
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          asaas_payment_id?: string | null
          billing_type?: string
          created_at?: string
          id?: string
          invoice_url?: string | null
          month?: string
          organization_id?: string
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchisee_system_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      franqueado_prospections: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inputs: Json
          lead_id: string | null
          organization_id: string
          result: Json | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inputs?: Json
          lead_id?: string | null
          organization_id: string
          result?: Json | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inputs?: Json
          lead_id?: string | null
          organization_id?: string
          result?: Json | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franqueado_prospections_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      franqueado_strategies: {
        Row: {
          created_at: string
          created_by: string | null
          diagnostic_answers: Json
          id: string
          lead_id: string | null
          organization_id: string
          result: Json | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          diagnostic_answers?: Json
          id?: string
          lead_id?: string | null
          organization_id: string
          result?: Json | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          diagnostic_answers?: Json
          id?: string
          lead_id?: string | null
          organization_id?: string
          result?: Json | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franqueado_strategies_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_claims: {
        Row: {
          claimed_at: string | null
          id: string
          organization_id: string
          reward_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          id?: string
          organization_id: string
          reward_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          id?: string
          organization_id?: string
          reward_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_claims_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_rewards: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          required_badges: string[] | null
          required_level: number | null
          title: string
          type: string
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          required_badges?: string[] | null
          required_level?: number | null
          title: string
          type?: string
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          required_badges?: string[] | null
          required_level?: number | null
          title?: string
          type?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "gamification_rewards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          assigned_to: string | null
          created_at: string
          current_value: number | null
          id: string
          metric: string
          organization_id: string
          period_end: string | null
          period_start: string | null
          priority: string
          scope: string
          status: string
          target_unit_ids: string[] | null
          target_value: number
          team_id: string | null
          title: string
          type: string
          unit_org_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          current_value?: number | null
          id?: string
          metric?: string
          organization_id: string
          period_end?: string | null
          period_start?: string | null
          priority?: string
          scope?: string
          status?: string
          target_unit_ids?: string[] | null
          target_value?: number
          team_id?: string | null
          title: string
          type?: string
          unit_org_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          current_value?: number | null
          id?: string
          metric?: string
          organization_id?: string
          period_end?: string | null
          period_start?: string | null
          priority?: string
          scope?: string
          status?: string
          target_unit_ids?: string[] | null
          target_value?: number
          team_id?: string | null
          title?: string
          type?: string
          unit_org_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_unit_org_id_fkey"
            columns: ["unit_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          client_id: string | null
          client_secret: string | null
          created_at: string
          expires_at: string
          google_calendar_id: string | null
          id: string
          organization_id: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          expires_at: string
          google_calendar_id?: string | null
          id?: string
          organization_id: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          expires_at?: string
          google_calendar_id?: string | null
          id?: string
          organization_id?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_assets: {
        Row: {
          created_at: string
          created_by: string | null
          folder_id: string | null
          id: string
          name: string
          organization_id: string
          size_bytes: number | null
          tags: string[] | null
          thumbnail_url: string | null
          type: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          folder_id?: string | null
          id?: string
          name: string
          organization_id: string
          size_bytes?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          type?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          folder_id?: string | null
          id?: string
          name?: string
          organization_id?: string
          size_bytes?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_assets_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "marketing_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_folders: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          parent_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          parent_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "marketing_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_strategies: {
        Row: {
          answers: Json
          created_at: string
          id: string
          is_active: boolean
          nivel: string
          organization_id: string
          score_percentage: number
          status: string | null
          strategy_result: Json | null
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          nivel?: string
          organization_id: string
          score_percentage?: number
          status?: string | null
          strategy_result?: Json | null
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          nivel?: string
          organization_id?: string
          score_percentage?: number
          status?: string | null
          strategy_result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_strategies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_visual_identities: {
        Row: {
          created_at: string | null
          fonts: Json | null
          id: string
          image_bank_urls: Json | null
          logo_url: string | null
          organization_id: string
          palette: Json | null
          reference_links: Json | null
          style: string | null
          tone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fonts?: Json | null
          id?: string
          image_bank_urls?: Json | null
          logo_url?: string | null
          organization_id: string
          palette?: Json | null
          reference_links?: Json | null
          style?: string | null
          tone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fonts?: Json | null
          id?: string
          image_bank_urls?: Json | null
          logo_url?: string | null
          organization_id?: string
          palette?: Json | null
          reference_links?: Json | null
          style?: string | null
          tone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_visual_identities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      module_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          id: string
          module: string
          profile_id: string
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          id?: string
          module: string
          profile_id: string
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          id?: string
          module?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_permissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "permission_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      noe_service_catalog: {
        Row: {
          base_price: number
          created_at: string
          id: string
          is_active: boolean
          module: string
          name: string
          organization_id: string
          sort_order: number
          type: string
          unit: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          id?: string
          is_active?: boolean
          module: string
          name: string
          organization_id: string
          sort_order?: number
          type?: string
          unit?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          id?: string
          is_active?: boolean
          module?: string
          name?: string
          organization_id?: string
          sort_order?: number
          type?: string
          unit?: string
        }
        Relationships: []
      }
      onboarding_checklist: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          is_completed: boolean | null
          onboarding_unit_id: string
          organization_id: string
          sort_order: number | null
          title: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          onboarding_unit_id: string
          organization_id: string
          sort_order?: number | null
          title: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          onboarding_unit_id?: string
          organization_id?: string
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checklist_onboarding_unit_id_fkey"
            columns: ["onboarding_unit_id"]
            isOneToOne: false
            referencedRelation: "onboarding_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklist_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_indicators: {
        Row: {
          created_at: string
          current_value: number | null
          id: string
          name: string
          onboarding_unit_id: string
          organization_id: string
          target_value: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          id?: string
          name: string
          onboarding_unit_id: string
          organization_id: string
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          id?: string
          name?: string
          onboarding_unit_id?: string
          organization_id?: string
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_indicators_onboarding_unit_id_fkey"
            columns: ["onboarding_unit_id"]
            isOneToOne: false
            referencedRelation: "onboarding_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_indicators_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_meetings: {
        Row: {
          created_at: string
          date: string | null
          id: string
          notes: string | null
          onboarding_unit_id: string
          organization_id: string
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          id?: string
          notes?: string | null
          onboarding_unit_id: string
          organization_id: string
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string
          date?: string | null
          id?: string
          notes?: string | null
          onboarding_unit_id?: string
          organization_id?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_meetings_onboarding_unit_id_fkey"
            columns: ["onboarding_unit_id"]
            isOneToOne: false
            referencedRelation: "onboarding_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_meetings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          is_completed: boolean | null
          onboarding_unit_id: string
          organization_id: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          onboarding_unit_id: string
          organization_id: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          onboarding_unit_id?: string
          organization_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tasks_onboarding_unit_id_fkey"
            columns: ["onboarding_unit_id"]
            isOneToOne: false
            referencedRelation: "onboarding_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_units: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          responsible: string | null
          start_date: string | null
          status: string
          target_date: string | null
          unit_org_id: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          responsible?: string | null
          start_date?: string | null
          status?: string
          target_date?: string | null
          unit_org_id?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          responsible?: string | null
          start_date?: string | null
          status?: string
          target_date?: string | null
          unit_org_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_units_unit_org_id_fkey"
            columns: ["unit_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_team_memberships: {
        Row: {
          created_at: string | null
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "org_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_team_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_teams: {
        Row: {
          created_at: string | null
          id: string
          name: string
          organization_id: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          organization_id: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_integrations: {
        Row: {
          config: Json
          created_at: string
          id: string
          organization_id: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          organization_id: string
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          organization_id?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_memberships_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          api_key: string | null
          asaas_customer_id: string | null
          asaas_wallet_id: string | null
          city: string | null
          cnpj: string | null
          company_size: string | null
          created_at: string
          email: string | null
          employee_count: string | null
          finance_settings: Json | null
          founded_at: string | null
          id: string
          legal_name: string | null
          legal_nature: string | null
          logo_url: string | null
          name: string
          onboarding_completed: boolean | null
          parent_org_id: string | null
          phone: string | null
          product_types: string[] | null
          referral_code: string | null
          saas_commission_percent: number | null
          segment: string | null
          state: string | null
          trade_name: string | null
          type: Database["public"]["Enums"]["org_type"]
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          api_key?: string | null
          asaas_customer_id?: string | null
          asaas_wallet_id?: string | null
          city?: string | null
          cnpj?: string | null
          company_size?: string | null
          created_at?: string
          email?: string | null
          employee_count?: string | null
          finance_settings?: Json | null
          founded_at?: string | null
          id?: string
          legal_name?: string | null
          legal_nature?: string | null
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          parent_org_id?: string | null
          phone?: string | null
          product_types?: string[] | null
          referral_code?: string | null
          saas_commission_percent?: number | null
          segment?: string | null
          state?: string | null
          trade_name?: string | null
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          api_key?: string | null
          asaas_customer_id?: string | null
          asaas_wallet_id?: string | null
          city?: string | null
          cnpj?: string | null
          company_size?: string | null
          created_at?: string
          email?: string | null
          employee_count?: string | null
          finance_settings?: Json | null
          founded_at?: string | null
          id?: string
          legal_name?: string | null
          legal_nature?: string | null
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          parent_org_id?: string | null
          phone?: string | null
          product_types?: string[] | null
          referral_code?: string | null
          saas_commission_percent?: number | null
          segment?: string | null
          state?: string | null
          trade_name?: string | null
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_profiles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_error_logs: {
        Row: {
          created_at: string
          error_message: string
          error_stack: string | null
          function_name: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          source: string
        }
        Insert: {
          created_at?: string
          error_message: string
          error_stack?: string | null
          function_name?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          source?: string
        }
        Update: {
          created_at?: string
          error_message?: string
          error_stack?: string | null
          function_name?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_error_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepted_terms_at: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          job_title: string | null
          notification_preferences: Json | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          accepted_terms_at?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          job_title?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          accepted_terms_at?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rankings: {
        Row: {
          created_at: string
          id: string
          metrics: Json | null
          month: number
          organization_id: string
          position: number | null
          score: number | null
          unit_org_id: string | null
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          metrics?: Json | null
          month: number
          organization_id: string
          position?: number | null
          score?: number | null
          unit_org_id?: string | null
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          metrics?: Json | null
          month?: number
          organization_id?: string
          position?: number | null
          score?: number | null
          unit_org_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "rankings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rankings_unit_org_id_fkey"
            columns: ["unit_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_discounts: {
        Row: {
          created_at: string
          discount_percent: number
          id: string
          is_active: boolean
          organization_id: string
          uses_count: number
        }
        Insert: {
          created_at?: string
          discount_percent?: number
          id?: string
          is_active?: boolean
          organization_id: string
          uses_count?: number
        }
        Update: {
          created_at?: string
          discount_percent?: number
          id?: string
          is_active?: boolean
          organization_id?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "referral_discounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_commissions: {
        Row: {
          asaas_payment_id: string | null
          client_org_id: string
          commission_percent: number
          commission_value: number
          created_at: string
          franchisee_org_id: string
          id: string
          month: string | null
          payment_value: number
          status: string
        }
        Insert: {
          asaas_payment_id?: string | null
          client_org_id: string
          commission_percent?: number
          commission_value?: number
          created_at?: string
          franchisee_org_id: string
          id?: string
          month?: string | null
          payment_value?: number
          status?: string
        }
        Update: {
          asaas_payment_id?: string | null
          client_org_id?: string
          commission_percent?: number
          commission_value?: number
          created_at?: string
          franchisee_org_id?: string
          id?: string
          month?: string | null
          payment_value?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "saas_commissions_client_org_id_fkey"
            columns: ["client_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_commissions_franchisee_org_id_fkey"
            columns: ["franchisee_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_plans: {
        Row: {
          answers: Json
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          score: number | null
          updated_at: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          score?: number | null
          updated_at?: string
        }
        Update: {
          answers?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_art_feedback: {
        Row: {
          art_id: string
          created_at: string
          feedback_note: string | null
          format: string | null
          id: string
          nivel: string | null
          organization_id: string
          prompt_used: string | null
          status: string
          style: string | null
        }
        Insert: {
          art_id: string
          created_at?: string
          feedback_note?: string | null
          format?: string | null
          id?: string
          nivel?: string | null
          organization_id: string
          prompt_used?: string | null
          status?: string
          style?: string | null
        }
        Update: {
          art_id?: string
          created_at?: string
          feedback_note?: string | null
          format?: string | null
          id?: string
          nivel?: string | null
          organization_id?: string
          prompt_used?: string | null
          status?: string
          style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_art_feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          asaas_billing_type: string | null
          asaas_subscription_id: string | null
          created_at: string
          discount_percent: number | null
          expires_at: string | null
          id: string
          marketing_plan: string | null
          modules: string
          organization_id: string
          plan: string
          referral_org_id: string | null
          sales_plan: string | null
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          asaas_billing_type?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          marketing_plan?: string | null
          modules?: string
          organization_id: string
          plan?: string
          referral_org_id?: string | null
          sales_plan?: string | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          asaas_billing_type?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          marketing_plan?: string | null
          modules?: string
          organization_id?: string
          plan?: string
          referral_org_id?: string | null
          sales_plan?: string | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_referral_org_id_fkey"
            columns: ["referral_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          attachments: string[] | null
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          ticket_id: string
          user_id: string
        }
        Update: {
          attachments?: string[] | null
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          attachments: string[] | null
          category: string | null
          closed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          organization_id: string
          priority: string
          status: string
          subcategory: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: string[] | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          organization_id: string
          priority?: string
          status?: string
          subcategory?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: string[] | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          organization_id?: string
          priority?: string
          status?: string
          subcategory?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      traffic_strategies: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          organization_id: string
          platforms: Json
          source_data: Json
          status: string | null
          strategy_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          platforms?: Json
          source_data?: Json
          status?: string | null
          strategy_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          platforms?: Json
          source_data?: Json
          status?: string | null
          strategy_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traffic_strategies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traffic_strategies_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "marketing_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_documents: {
        Row: {
          created_at: string | null
          file_url: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          type: string | null
          unit_id: string
          uploaded_by: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          type?: string | null
          unit_id: string
          uploaded_by?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          type?: string | null
          unit_id?: string
          uploaded_by?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_documents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          financial_notes: string | null
          id: string
          manager_name: string | null
          name: string
          opened_at: string | null
          organization_id: string
          phone: string | null
          royalty_percent: number | null
          saas_commission_percent: number | null
          state: string | null
          status: string
          system_active: boolean | null
          system_fee: number | null
          transfer_percent: number | null
          unit_org_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          financial_notes?: string | null
          id?: string
          manager_name?: string | null
          name: string
          opened_at?: string | null
          organization_id: string
          phone?: string | null
          royalty_percent?: number | null
          saas_commission_percent?: number | null
          state?: string | null
          status?: string
          system_active?: boolean | null
          system_fee?: number | null
          transfer_percent?: number | null
          unit_org_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          financial_notes?: string | null
          id?: string
          manager_name?: string | null
          name?: string
          opened_at?: string | null
          organization_id?: string
          phone?: string | null
          royalty_percent?: number | null
          saas_commission_percent?: number | null
          state?: string | null
          status?: string
          system_active?: boolean | null
          system_fee?: number | null
          transfer_percent?: number | null
          unit_org_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_unit_org_id_fkey"
            columns: ["unit_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_evaluations: {
        Row: {
          categories: Json | null
          comment: string | null
          created_at: string | null
          evaluator_id: string
          id: string
          organization_id: string
          period: string
          score: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          categories?: Json | null
          comment?: string | null
          created_at?: string | null
          evaluator_id: string
          id?: string
          organization_id: string
          period: string
          score: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          categories?: Json | null
          comment?: string | null
          created_at?: string | null
          evaluator_id?: string
          id?: string
          organization_id?: string
          period?: string
          score?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_evaluations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      website_chat_messages: {
        Row: {
          content: string | null
          created_at: string
          direction: string
          id: string
          organization_id: string
          session_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          direction?: string
          id?: string
          organization_id: string
          session_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          direction?: string
          id?: string
          organization_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_chat_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "website_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      website_chat_sessions: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          status: string
          updated_at: string
          visitor_email: string | null
          visitor_metadata: Json | null
          visitor_name: string | null
          whatsapp_contact_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          status?: string
          updated_at?: string
          visitor_email?: string | null
          visitor_metadata?: Json | null
          visitor_name?: string | null
          whatsapp_contact_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          status?: string
          updated_at?: string
          visitor_email?: string | null
          visitor_metadata?: Json | null
          visitor_name?: string | null
          whatsapp_contact_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_chat_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_chat_sessions_whatsapp_contact_id_fkey"
            columns: ["whatsapp_contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contacts: {
        Row: {
          agent_id: string | null
          attending_mode: string
          contact_type: string | null
          created_at: string
          crm_lead_id: string | null
          followup_config: Json | null
          id: string
          instance_id: string | null
          last_message_at: string | null
          last_message_preview: string | null
          name: string | null
          organization_id: string
          participant_count: number | null
          phone: string
          photo_url: string | null
          unread_count: number
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          attending_mode?: string
          contact_type?: string | null
          created_at?: string
          crm_lead_id?: string | null
          followup_config?: Json | null
          id?: string
          instance_id?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          name?: string | null
          organization_id: string
          participant_count?: number | null
          phone: string
          photo_url?: string | null
          unread_count?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          attending_mode?: string
          contact_type?: string | null
          created_at?: string
          crm_lead_id?: string | null
          followup_config?: Json | null
          id?: string
          instance_id?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          name?: string | null
          organization_id?: string
          participant_count?: number | null
          phone?: string
          photo_url?: string | null
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "client_ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          client_token: string
          created_at: string
          id: string
          instance_id: string
          label: string | null
          organization_id: string
          phone_number: string | null
          status: string
          token: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          client_token: string
          created_at?: string
          id?: string
          instance_id: string
          label?: string | null
          organization_id: string
          phone_number?: string | null
          status?: string
          token: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          client_token?: string
          created_at?: string
          id?: string
          instance_id?: string
          label?: string | null
          organization_id?: string
          phone_number?: string | null
          status?: string
          token?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          contact_id: string
          content: string | null
          created_at: string
          direction: string
          id: string
          media_url: string | null
          message_id_zapi: string | null
          metadata: Json
          organization_id: string
          status: string
          type: string
        }
        Insert: {
          contact_id: string
          content?: string | null
          created_at?: string
          direction?: string
          id?: string
          media_url?: string | null
          message_id_zapi?: string | null
          metadata?: Json
          organization_id: string
          status?: string
          type?: string
        }
        Update: {
          contact_id?: string
          content?: string | null
          created_at?: string
          direction?: string
          id?: string
          media_url?: string | null
          message_id_zapi?: string | null
          metadata?: Json
          organization_id?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      debit_credits: {
        Args: {
          _amount: number
          _description: string
          _org_id: string
          _source?: string
        }
        Returns: number
      }
      generate_org_api_key: { Args: { _org_id: string }; Returns: string }
      get_academy_reports: {
        Args: { _org_id: string }
        Returns: {
          avg_completion: number
          certificates_count: number
          quizzes_passed: number
          unit_id: string
          unit_name: string
          users_count: number
        }[]
      }
      get_announcements_with_parent: {
        Args: { _org_id: string }
        Returns: {
          attachment_url: string | null
          content: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          organization_id: string
          priority: string
          published_at: string | null
          require_confirmation: boolean
          show_dashboard: boolean
          show_popup: boolean
          status: string
          target_roles: string[] | null
          target_unit_ids: string[] | null
          title: string
          type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "announcements"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_calendar_events_with_parent: {
        Args: { _end?: string; _org_id: string; _start?: string }
        Returns: {
          all_day: boolean | null
          calendar_id: string | null
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string
          google_event_id: string | null
          id: string
          location: string | null
          organization_id: string
          readonly: boolean | null
          recurrence: string | null
          start_at: string
          title: string
          unit_id: string | null
          updated_at: string
          visibility: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "calendar_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_closings_with_parent: {
        Args: { _org_id: string }
        Returns: {
          created_at: string
          created_by: string | null
          file_url: string | null
          id: string
          month: number
          notes: string | null
          organization_id: string
          status: string
          title: string
          unit_id: string | null
          year: number
        }[]
        SetofOptions: {
          from: "*"
          to: "finance_closings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_contact_last_messages: {
        Args: { p_contact_ids: string[]; p_org_id: string }
        Returns: {
          contact_id: string
          content: string
          created_at: string
          direction: string
          status: string
          type: string
        }[]
      }
      get_contract_templates_with_parent: {
        Args: { _org_id: string }
        Returns: {
          content: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          template_type: string | null
          updated_at: string
          variables: Json | null
        }[]
        SetofOptions: {
          from: "*"
          to: "contract_templates"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_contracts_for_unit: {
        Args: { _org_id: string }
        Returns: {
          client_address: string | null
          client_document: string | null
          client_phone: string | null
          content: string | null
          contract_type: string | null
          created_at: string
          created_by: string | null
          duration_months: number | null
          end_date: string | null
          id: string
          lead_id: string | null
          monthly_value: number | null
          organization_id: string
          owner_type: string | null
          payment_day: number | null
          service_description: string | null
          signed_at: string | null
          signer_email: string | null
          signer_name: string | null
          start_date: string | null
          status: string
          surplus_issuer: string | null
          surplus_value: number | null
          template_id: string | null
          title: string
          total_value: number | null
          unit_org_id: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "contracts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_daily_message_with_parent: {
        Args: { _org_id: string }
        Returns: {
          author: string | null
          created_at: string
          date: string
          id: string
          message: string
          organization_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "daily_messages"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_goals_with_parent: {
        Args: { _org_id: string }
        Returns: {
          assigned_to: string | null
          created_at: string
          current_value: number | null
          id: string
          metric: string
          organization_id: string
          period_end: string | null
          period_start: string | null
          priority: string
          scope: string
          status: string
          target_unit_ids: string[] | null
          target_value: number
          team_id: string | null
          title: string
          type: string
          unit_org_id: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "goals"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_network_client_stats: {
        Args: { _org_id: string }
        Returns: {
          active_clients: number
          expiring_soon: number
          total_clients: number
          total_credits: number
          total_leads: number
          total_mrr: number
        }[]
      }
      get_network_contracts: {
        Args: { _org_id: string }
        Returns: {
          client_address: string
          client_document: string
          client_phone: string
          content: string
          contract_type: string
          created_at: string
          duration_months: number
          end_date: string
          id: string
          monthly_value: number
          org_name: string
          organization_id: string
          owner_type: string
          payment_day: number
          service_description: string
          signer_email: string
          signer_name: string
          start_date: string
          status: string
          surplus_issuer: string
          surplus_value: number
          template_id: string
          title: string
          total_value: number
          unit_org_id: string
          updated_at: string
        }[]
      }
      get_network_crm_data: {
        Args: { _org_id: string }
        Returns: {
          activity_created_at: string
          activity_id: string
          activity_type: string
          activity_user_id: string
          lead_assigned_to: string
          lead_created_at: string
          lead_id: string
          lead_stage: string
          lead_value: number
          lead_won_at: string
        }[]
      }
      get_network_tickets: {
        Args: { _parent_org_id: string }
        Returns: {
          assigned_to: string
          category: string
          closed_at: string
          created_at: string
          created_by: string
          description: string
          id: string
          org_name: string
          organization_id: string
          priority: string
          status: string
          subcategory: string
          title: string
          updated_at: string
        }[]
      }
      get_parent_org_id: { Args: { _org_id: string }; Returns: string }
      get_rankings_with_parent: {
        Args: { _org_id: string }
        Returns: {
          created_at: string
          id: string
          metrics: Json | null
          month: number
          organization_id: string
          position: number | null
          score: number | null
          unit_org_id: string | null
          year: number
        }[]
        SetofOptions: {
          from: "*"
          to: "rankings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_referral_by_code: {
        Args: { _code: string }
        Returns: {
          discount_percent: number
          is_active: boolean
          org_name: string
          organization_id: string
        }[]
      }
      get_saas_clients_for_org: {
        Args: { _org_id: string }
        Returns: {
          created_at: string
          credits_balance: number
          discount_percent: number
          expires_at: string
          org_id: string
          org_name: string
          plan: string
          plan_status: string
          referral_org_id: string
        }[]
      }
      get_saas_commissions_for_org: {
        Args: { _org_id: string }
        Returns: {
          client_name: string
          client_org_id: string
          commission_percent: number
          commission_value: number
          created_at: string
          id: string
          month: string
          payment_value: number
          status: string
        }[]
      }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_referral_uses: { Args: { _org_id: string }; Returns: undefined }
      is_member_of_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_member_or_parent_of_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      seed_default_teams: { Args: { _org_id: string }; Returns: undefined }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "franqueado"
        | "cliente_admin"
        | "cliente_user"
      org_type: "franqueadora" | "franqueado" | "cliente"
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
      app_role: [
        "super_admin",
        "admin",
        "franqueado",
        "cliente_admin",
        "cliente_user",
      ],
      org_type: ["franqueadora", "franqueado", "cliente"],
    },
  },
} as const
