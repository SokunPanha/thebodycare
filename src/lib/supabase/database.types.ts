export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      generation_runs: {
        Row: {
          cost_usd: number
          created_at: string
          duration_ms: number | null
          error: string | null
          finished_at: string | null
          id: string
          model: string
          post_id: string | null
          prompt_version: string
          scope_verdict: Json | null
          status: Database["public"]["Enums"]["run_status"]
          step: string | null
          tokens_in: number
          tokens_out: number
          topic_id: string | null
        }
        Insert: {
          cost_usd?: number
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          model: string
          post_id?: string | null
          prompt_version: string
          scope_verdict?: Json | null
          status?: Database["public"]["Enums"]["run_status"]
          step?: string | null
          tokens_in?: number
          tokens_out?: number
          topic_id?: string | null
        }
        Update: {
          cost_usd?: number
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          model?: string
          post_id?: string | null
          prompt_version?: string
          scope_verdict?: Json | null
          status?: Database["public"]["Enums"]["run_status"]
          step?: string | null
          tokens_in?: number
          tokens_out?: number
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_runs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_runs_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topic_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      post_embeddings: {
        Row: {
          content_hash: string
          created_at: string
          embedding: string
          model: string
          post_id: string
        }
        Insert: {
          content_hash: string
          created_at?: string
          embedding: string
          model: string
          post_id: string
        }
        Update: {
          content_hash?: string
          created_at?: string
          embedding?: string
          model?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_embeddings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_performance: {
        Row: {
          avg_position: number | null
          clicks: number
          impressions: number
          post_id: string
          source: string
          synced_at: string
          week_of: string
        }
        Insert: {
          avg_position?: number | null
          clicks?: number
          impressions?: number
          post_id: string
          source?: string
          synced_at?: string
          week_of: string
        }
        Update: {
          avg_position?: number | null
          clicks?: number
          impressions?: number
          post_id?: string
          source?: string
          synced_at?: string
          week_of?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_performance_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_sources: {
        Row: {
          created_at: string
          id: string
          post_id: string
          publisher: string
          sort_order: number
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          publisher: string
          sort_order?: number
          title: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          publisher?: string
          sort_order?: number
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_sources_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          body_md: string
          category_id: string
          cover_alt: string | null
          cover_height: number | null
          cover_path: string | null
          cover_source: string | null
          cover_width: number | null
          created_at: string
          excerpt: string
          faq: Json
          id: string
          key_points: string[]
          next_review_at: string | null
          published_at: string | null
          reading_time_min: number
          review_note: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          search_vector: unknown
          seo_description: string | null
          seo_title: string | null
          slug: string
          source: Database["public"]["Enums"]["post_source"]
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string
          when_to_seek_care: string
        }
        Insert: {
          author_id?: string | null
          body_md: string
          category_id: string
          cover_alt?: string | null
          cover_height?: number | null
          cover_path?: string | null
          cover_source?: string | null
          cover_width?: number | null
          created_at?: string
          excerpt: string
          faq?: Json
          id?: string
          key_points: string[]
          next_review_at?: string | null
          published_at?: string | null
          reading_time_min?: number
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          source?: Database["public"]["Enums"]["post_source"]
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string
          when_to_seek_care: string
        }
        Update: {
          author_id?: string | null
          body_md?: string
          category_id?: string
          cover_alt?: string | null
          cover_height?: number | null
          cover_path?: string | null
          cover_source?: string | null
          cover_width?: number | null
          created_at?: string
          excerpt?: string
          faq?: Json
          id?: string
          key_points?: string[]
          next_review_at?: string | null
          published_at?: string | null
          reading_time_min?: number
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          source?: Database["public"]["Enums"]["post_source"]
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          updated_at?: string
          when_to_seek_care?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          credentials: string | null
          display_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          credentials?: string | null
          display_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          credentials?: string | null
          display_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      topic_matrix: {
        Row: {
          angle: string
          audience: string
          category_id: string
          created_at: string
          embedding: string | null
          format: string
          id: string
          performance_score: number
          priority: number
          status: Database["public"]["Enums"]["matrix_status"]
          subtopic: string
          target_query: string
          updated_at: string
        }
        Insert: {
          angle: string
          audience: string
          category_id: string
          created_at?: string
          embedding?: string | null
          format: string
          id?: string
          performance_score?: number
          priority?: number
          status?: Database["public"]["Enums"]["matrix_status"]
          subtopic: string
          target_query: string
          updated_at?: string
        }
        Update: {
          angle?: string
          audience?: string
          category_id?: string
          created_at?: string
          embedding?: string | null
          format?: string
          id?: string
          performance_score?: number
          priority?: number
          status?: Database["public"]["Enums"]["matrix_status"]
          subtopic?: string
          target_query?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_matrix_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_queue: {
        Row: {
          created_at: string
          dedup_score: number | null
          embedding: string | null
          id: string
          matrix_id: string | null
          reject_reason: string | null
          status: Database["public"]["Enums"]["topic_status"]
          target_keyword: string
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dedup_score?: number | null
          embedding?: string | null
          id?: string
          matrix_id?: string | null
          reject_reason?: string | null
          status?: Database["public"]["Enums"]["topic_status"]
          target_keyword: string
          topic: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dedup_score?: number | null
          embedding?: string | null
          id?: string
          matrix_id?: string | null
          reject_reason?: string | null
          status?: Database["public"]["Enums"]["topic_status"]
          target_keyword?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_queue_matrix_id_fkey"
            columns: ["matrix_id"]
            isOneToOne: false
            referencedRelation: "topic_matrix"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_post: {
        Args: { p_post_id: string }
        Returns: {
          category_slug: string
          slug: string
        }[]
      }
      dashboard_stats: { Args: never; Returns: Json }
      match_posts: {
        Args: {
          exclude_post_id?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          post_id: string
          similarity: number
        }[]
      }
      reject_post: {
        Args: { p_post_id: string; p_reason: string }
        Returns: undefined
      }
      related_posts: {
        Args: { match_count?: number; target_post_id: string }
        Returns: {
          post_id: string
          similarity: number
        }[]
      }
      search_posts: {
        Args: { match_limit?: number; match_offset?: number; query: string }
        Returns: {
          post_id: string
          rank: number
          total: number
        }[]
      }
    }
    Enums: {
      matrix_status: "open" | "queued" | "drafted" | "published" | "exhausted"
      post_source: "human" | "ai" | "ai_reviewed"
      post_status: "draft" | "in_review" | "published" | "archived"
      run_status: "running" | "success" | "failed" | "rejected" | "skipped"
      topic_status:
        | "pending"
        | "generating"
        | "drafted"
        | "rejected"
        | "published"
      user_role: "admin" | "editor" | "reader"
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
    Enums: {
      matrix_status: ["open", "queued", "drafted", "published", "exhausted"],
      post_source: ["human", "ai", "ai_reviewed"],
      post_status: ["draft", "in_review", "published", "archived"],
      run_status: ["running", "success", "failed", "rejected", "skipped"],
      topic_status: [
        "pending",
        "generating",
        "drafted",
        "rejected",
        "published",
      ],
      user_role: ["admin", "editor", "reader"],
    },
  },
} as const

