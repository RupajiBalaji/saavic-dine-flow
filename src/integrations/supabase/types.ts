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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          object_id: string | null
          object_type: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          object_id?: string | null
          object_type?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          object_id?: string | null
          object_type?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cafe_tables: {
        Row: {
          active: boolean
          capacity: number
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["table_status"]
        }
        Insert: {
          active?: boolean
          capacity?: number
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["table_status"]
        }
        Update: {
          active?: boolean
          capacity?: number
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["table_status"]
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      discounts: {
        Row: {
          active: boolean
          code: string
          created_at: string
          ends_at: string | null
          id: string
          min_order: number
          starts_at: string | null
          type: string
          usage_limit: number | null
          used_count: number
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          ends_at?: string | null
          id?: string
          min_order?: number
          starts_at?: string | null
          type?: string
          usage_limit?: number | null
          used_count?: number
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          min_order?: number
          starts_at?: string | null
          type?: string
          usage_limit?: number | null
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          cost: number
          created_at: string
          id: string
          min_stock: number
          name: string
          stock: number
          supplier: string | null
          unit: string
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          min_stock?: number
          name: string
          stock?: number
          supplier?: string | null
          unit?: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          min_stock?: number
          name?: string
          stock?: number
          supplier?: string | null
          unit?: string
        }
        Relationships: []
      }
      modifier_options: {
        Row: {
          id: string
          modifier_id: string
          name: string
          price_delta: number
          sort_order: number
        }
        Insert: {
          id?: string
          modifier_id: string
          name: string
          price_delta?: number
          sort_order?: number
        }
        Update: {
          id?: string
          modifier_id?: string
          name?: string
          price_delta?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "modifier_options_modifier_id_fkey"
            columns: ["modifier_id"]
            isOneToOne: false
            referencedRelation: "modifiers"
            referencedColumns: ["id"]
          },
        ]
      }
      modifiers: {
        Row: {
          id: string
          name: string
          required: boolean
          selection_type: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          required?: boolean
          selection_type?: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          required?: boolean
          selection_type?: string
          sort_order?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          line_total: number
          modifiers: Json
          notes: string | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          line_total: number
          modifiers?: Json
          notes?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          id?: string
          line_total?: number
          modifiers?: Json
          notes?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          cancel_reason: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number
          id: string
          idempotency_key: string | null
          notes: string | null
          order_number: string
          ready_at: string | null
          served_at: string | null
          session_id: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          table_id: string
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          cancel_reason?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_number: string
          ready_at?: string | null
          served_at?: string | null
          session_id: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id: string
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          cancel_reason?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_number?: string
          ready_at?: string | null
          served_at?: string | null
          session_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "cafe_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          idempotency_key: string | null
          method: string | null
          notes: string | null
          provider: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          recorded_by: string | null
          session_id: string
          status: Database["public"]["Enums"]["payment_txn_status"]
          table_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string | null
          method?: string | null
          notes?: string | null
          provider?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          recorded_by?: string | null
          session_id: string
          status?: Database["public"]["Enums"]["payment_txn_status"]
          table_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string | null
          method?: string | null
          notes?: string | null
          provider?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          recorded_by?: string | null
          session_id?: string
          status?: Database["public"]["Enums"]["payment_txn_status"]
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "cafe_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      product_modifiers: {
        Row: {
          modifier_id: string
          product_id: string
        }
        Insert: {
          modifier_id: string
          product_id: string
        }
        Update: {
          modifier_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_modifiers_modifier_id_fkey"
            columns: ["modifier_id"]
            isOneToOne: false
            referencedRelation: "modifiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_modifiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allergens: string | null
          calories: number | null
          carbs_g: number | null
          category_id: string | null
          created_at: string
          description: string | null
          fats_g: number | null
          id: string
          image_url: string | null
          ingredients: string | null
          is_meal_plan: boolean
          name: string
          plan_days: number | null
          prep_minutes: number
          price: number
          protein_g: number | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["product_status"]
          updated_at: string
        }
        Insert: {
          allergens?: string | null
          calories?: number | null
          carbs_g?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          fats_g?: number | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          is_meal_plan?: boolean
          name: string
          plan_days?: number | null
          prep_minutes?: number
          price: number
          protein_g?: number | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
        }
        Update: {
          allergens?: string | null
          calories?: number | null
          carbs_g?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          fats_g?: number | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          is_meal_plan?: boolean
          name?: string
          plan_days?: number | null
          prep_minutes?: number
          price?: number
          protein_g?: number | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      table_sessions: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          code: string
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number
          discount_code: string | null
          id: string
          opened_at: string
          payment_state: Database["public"]["Enums"]["payment_state"]
          status: Database["public"]["Enums"]["session_status"]
          table_id: string
          token: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          code: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          discount_code?: string | null
          id?: string
          opened_at?: string
          payment_state?: Database["public"]["Enums"]["payment_state"]
          status?: Database["public"]["Enums"]["session_status"]
          table_id: string
          token: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          code?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          discount_code?: string | null
          id?: string
          opened_at?: string
          payment_state?: Database["public"]["Enums"]["payment_state"]
          status?: Database["public"]["Enums"]["session_status"]
          table_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "cafe_tables"
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      next_order_number: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "SUPER_ADMIN" | "MANAGER" | "KITCHEN_STAFF" | "CASHIER"
      order_status:
        | "PLACED"
        | "ACCEPTED"
        | "PREPARING"
        | "READY"
        | "SERVED"
        | "COMPLETED"
        | "CANCELLED"
      payment_state:
        | "UNPAID"
        | "PAYMENT_PENDING"
        | "PAID"
        | "FAILED"
        | "REFUND_PENDING"
        | "REFUNDED"
        | "CASH_PAID"
        | "REFUND_REQUIRED"
      payment_txn_status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED"
      product_status: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN"
      session_status: "ACTIVE" | "CLOSED"
      table_status:
        | "AVAILABLE"
        | "OCCUPIED"
        | "ORDERING"
        | "FOOD_PREPARING"
        | "READY"
        | "BILL_REQUESTED"
        | "PAYMENT_PENDING"
        | "PAID"
        | "CLOSED"
        | "DISABLED"
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
      app_role: ["SUPER_ADMIN", "MANAGER", "KITCHEN_STAFF", "CASHIER"],
      order_status: [
        "PLACED",
        "ACCEPTED",
        "PREPARING",
        "READY",
        "SERVED",
        "COMPLETED",
        "CANCELLED",
      ],
      payment_state: [
        "UNPAID",
        "PAYMENT_PENDING",
        "PAID",
        "FAILED",
        "REFUND_PENDING",
        "REFUNDED",
        "CASH_PAID",
        "REFUND_REQUIRED",
      ],
      payment_txn_status: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      product_status: ["AVAILABLE", "OUT_OF_STOCK", "HIDDEN"],
      session_status: ["ACTIVE", "CLOSED"],
      table_status: [
        "AVAILABLE",
        "OCCUPIED",
        "ORDERING",
        "FOOD_PREPARING",
        "READY",
        "BILL_REQUESTED",
        "PAYMENT_PENDING",
        "PAID",
        "CLOSED",
        "DISABLED",
      ],
    },
  },
} as const
