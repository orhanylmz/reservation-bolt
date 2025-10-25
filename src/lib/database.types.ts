export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'employee' | 'customer'
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'employee' | 'customer'
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'employee' | 'customer'
          phone?: string | null
          created_at?: string
        }
      }
      cleaning_requests: {
        Row: {
          id: string
          customer_id: string
          city: string
          district: string
          neighborhood: string
          address_detail: string
          address: string
          service_date: string
          service_time: string
          home_size: 'small' | 'medium' | 'large'
          special_notes: string | null
          status: 'pending' | 'assigned' | 'in_progress' | 'awaiting_confirmation' | 'completed' | 'cancelled'
          assigned_employee_id: string | null
          employee_count: number
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          city: string
          district: string
          neighborhood: string
          address_detail: string
          address?: string
          service_date: string
          service_time: string
          home_size: 'small' | 'medium' | 'large'
          special_notes?: string | null
          status?: 'pending' | 'assigned' | 'in_progress' | 'awaiting_confirmation' | 'completed' | 'cancelled'
          assigned_employee_id?: string | null
          employee_count?: number
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          city?: string
          district?: string
          neighborhood?: string
          address_detail?: string
          address?: string
          service_date?: string
          service_time?: string
          home_size?: 'small' | 'medium' | 'large'
          special_notes?: string | null
          status?: 'pending' | 'assigned' | 'in_progress' | 'awaiting_confirmation' | 'completed' | 'cancelled'
          assigned_employee_id?: string | null
          employee_count?: number
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      request_assignments: {
        Row: {
          id: string
          request_id: string
          employee_id: string
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          employee_id: string
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          employee_id?: string
          created_at?: string
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
  }
}
