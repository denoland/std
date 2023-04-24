export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      comments: {
        Row: {
          created_at: string
          id: string
          item_id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          text: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          text?: string
          user_id?: string
        }
      }
      customers: {
        Row: {
          is_subscribed: boolean | null
          stripe_customer_id: string | null
          user_id: string
        }
        Insert: {
          is_subscribed?: boolean | null
          stripe_customer_id?: string | null
          user_id?: string
        }
        Update: {
          is_subscribed?: boolean | null
          stripe_customer_id?: string | null
          user_id?: string
        }
      }
      items: {
        Row: {
          author_id: string
          created_at: string
          id: string
          score: number
          title: string
          url: string
        }
        Insert: {
          author_id?: string
          created_at?: string
          id?: string
          score?: number
          title: string
          url: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          score?: number
          title?: string
          url?: string
        }
      }
      todos: {
        Row: {
          id: string
          name: string | null
          user_id: string
        }
        Insert: {
          id?: string
          name?: string | null
          user_id?: string
        }
        Update: {
          id?: string
          name?: string | null
          user_id?: string
        }
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

