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
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          department: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: string
          department?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: string
          department?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      barangays: {
        Row: {
          id: string
          name: string
          district: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          district?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          district?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      population_stats: {
        Row: {
          id: string
          barangay_id: string
          year: number
          month_updated: number | null
          total_population: number | null
          total_households: number | null
          male_count: number | null
          female_count: number | null
          age_under_18: number | null
          age_19_to_59: number | null
          age_60_plus: number | null
          household_heads_m: number | null
          household_heads_f: number | null
          household_heads_total: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          barangay_id: string
          year: number
          month_updated?: number | null
          total_population?: number | null
          total_households?: number | null
          male_count?: number | null
          female_count?: number | null
          age_under_18?: number | null
          age_19_to_59?: number | null
          age_60_plus?: number | null
          household_heads_m?: number | null
          household_heads_f?: number | null
          household_heads_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          barangay_id?: string
          year?: number
          month_updated?: number | null
          total_population?: number | null
          total_households?: number | null
          male_count?: number | null
          female_count?: number | null
          age_under_18?: number | null
          age_19_to_59?: number | null
          age_60_plus?: number | null
          household_heads_m?: number | null
          household_heads_f?: number | null
          household_heads_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      social_dev_stats: {
        Row: {
          id: string
          barangay_id: string
          year: number
          month_updated: number | null
          student_enrollment_m: number | null
          student_enrollment_f: number | null
          student_enrollment_total: number | null
          drop_out_m: number | null
          drop_out_f: number | null
          drop_out_total: number | null
          osy_m: number | null
          osy_f: number | null
          osy_total: number | null
          malnourished_m: number | null
          malnourished_f: number | null
          malnourished_total: number | null
          teenage_pregnancy: number | null
          maternal_mortality: number | null
          pwd_m: number | null
          pwd_f: number | null
          pwd_total: number | null
          four_ps_m: number | null
          four_ps_f: number | null
          four_ps_total: number | null
          senior_citizens_m: number | null
          senior_citizens_f: number | null
          senior_citizens_total: number | null
          solo_parents_m: number | null
          solo_parents_f: number | null
          solo_parents_total: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          barangay_id: string
          year: number
          month_updated?: number | null
          student_enrollment_m?: number | null
          student_enrollment_f?: number | null
          student_enrollment_total?: number | null
          drop_out_m?: number | null
          drop_out_f?: number | null
          drop_out_total?: number | null
          osy_m?: number | null
          osy_f?: number | null
          osy_total?: number | null
          malnourished_m?: number | null
          malnourished_f?: number | null
          malnourished_total?: number | null
          teenage_pregnancy?: number | null
          maternal_mortality?: number | null
          pwd_m?: number | null
          pwd_f?: number | null
          pwd_total?: number | null
          four_ps_m?: number | null
          four_ps_f?: number | null
          four_ps_total?: number | null
          senior_citizens_m?: number | null
          senior_citizens_f?: number | null
          senior_citizens_total?: number | null
          solo_parents_m?: number | null
          solo_parents_f?: number | null
          solo_parents_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          barangay_id?: string
          year?: number
          month_updated?: number | null
          student_enrollment_m?: number | null
          student_enrollment_f?: number | null
          student_enrollment_total?: number | null
          drop_out_m?: number | null
          drop_out_f?: number | null
          drop_out_total?: number | null
          osy_m?: number | null
          osy_f?: number | null
          osy_total?: number | null
          malnourished_m?: number | null
          malnourished_f?: number | null
          malnourished_total?: number | null
          teenage_pregnancy?: number | null
          maternal_mortality?: number | null
          pwd_m?: number | null
          pwd_f?: number | null
          pwd_total?: number | null
          four_ps_m?: number | null
          four_ps_f?: number | null
          four_ps_total?: number | null
          senior_citizens_m?: number | null
          senior_citizens_f?: number | null
          senior_citizens_total?: number | null
          solo_parents_m?: number | null
          solo_parents_f?: number | null
          solo_parents_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      econ_dev_stats: {
        Row: {
          id: string
          barangay_id: string
          year: number
          month_updated: number | null
          employed_m: number | null
          employed_f: number | null
          employed_total: number | null
          unemployed_m: number | null
          unemployed_f: number | null
          unemployed_total: number | null
          farmers_m: number | null
          farmers_f: number | null
          farmers_total: number | null
          fisherfolks_m: number | null
          fisherfolks_f: number | null
          fisherfolks_total: number | null
          business_owners_m: number | null
          business_owners_f: number | null
          business_owners_total: number | null
          ambulant_vendors_m: number | null
          ambulant_vendors_f: number | null
          ambulant_vendors_total: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          barangay_id: string
          year: number
          month_updated?: number | null
          employed_m?: number | null
          employed_f?: number | null
          employed_total?: number | null
          unemployed_m?: number | null
          unemployed_f?: number | null
          unemployed_total?: number | null
          farmers_m?: number | null
          farmers_f?: number | null
          farmers_total?: number | null
          fisherfolks_m?: number | null
          fisherfolks_f?: number | null
          fisherfolks_total?: number | null
          business_owners_m?: number | null
          business_owners_f?: number | null
          business_owners_total?: number | null
          ambulant_vendors_m?: number | null
          ambulant_vendors_f?: number | null
          ambulant_vendors_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          barangay_id?: string
          year?: number
          month_updated?: number | null
          employed_m?: number | null
          employed_f?: number | null
          employed_total?: number | null
          unemployed_m?: number | null
          unemployed_f?: number | null
          unemployed_total?: number | null
          farmers_m?: number | null
          farmers_f?: number | null
          farmers_total?: number | null
          fisherfolks_m?: number | null
          fisherfolks_f?: number | null
          fisherfolks_total?: number | null
          business_owners_m?: number | null
          business_owners_f?: number | null
          business_owners_total?: number | null
          ambulant_vendors_m?: number | null
          ambulant_vendors_f?: number | null
          ambulant_vendors_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      infra_stats: {
        Row: {
          id: string
          barangay_id: string
          year: number
          month_updated: number | null
          safe_water_m: number | null
          safe_water_f: number | null
          safe_water_total: number | null
          sanitary_toilet_m: number | null
          sanitary_toilet_f: number | null
          sanitary_toilet_total: number | null
          informal_settlers_m: number | null
          informal_settlers_f: number | null
          informal_settlers_total: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          barangay_id: string
          year: number
          month_updated?: number | null
          safe_water_m?: number | null
          safe_water_f?: number | null
          safe_water_total?: number | null
          sanitary_toilet_m?: number | null
          sanitary_toilet_f?: number | null
          sanitary_toilet_total?: number | null
          informal_settlers_m?: number | null
          informal_settlers_f?: number | null
          informal_settlers_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          barangay_id?: string
          year?: number
          month_updated?: number | null
          safe_water_m?: number | null
          safe_water_f?: number | null
          safe_water_total?: number | null
          sanitary_toilet_m?: number | null
          sanitary_toilet_f?: number | null
          sanitary_toilet_total?: number | null
          informal_settlers_m?: number | null
          informal_settlers_f?: number | null
          informal_settlers_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      governance_stats: {
        Row: {
          id: string
          barangay_id: string
          year: number
          month_updated: number | null
          elected_officials_m: number | null
          elected_officials_f: number | null
          elected_officials_total: number | null
          appointed_heads_m: number | null
          appointed_heads_f: number | null
          appointed_heads_total: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          barangay_id: string
          year: number
          month_updated?: number | null
          elected_officials_m?: number | null
          elected_officials_f?: number | null
          elected_officials_total?: number | null
          appointed_heads_m?: number | null
          appointed_heads_f?: number | null
          appointed_heads_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          barangay_id?: string
          year?: number
          month_updated?: number | null
          elected_officials_m?: number | null
          elected_officials_f?: number | null
          elected_officials_total?: number | null
          appointed_heads_m?: number | null
          appointed_heads_f?: number | null
          appointed_heads_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      justice_stats: {
        Row: {
          id: string
          barangay_id: string
          year: number
          month_updated: number | null
          vawc_cases_reported: number | null
          cicl_m: number | null
          cicl_f: number | null
          cicl_total: number | null
          sexual_assault_m: number | null
          sexual_assault_f: number | null
          sexual_assault_total: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          barangay_id: string
          year: number
          month_updated?: number | null
          vawc_cases_reported?: number | null
          cicl_m?: number | null
          cicl_f?: number | null
          cicl_total?: number | null
          sexual_assault_m?: number | null
          sexual_assault_f?: number | null
          sexual_assault_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          barangay_id?: string
          year?: number
          month_updated?: number | null
          vawc_cases_reported?: number | null
          cicl_m?: number | null
          cicl_f?: number | null
          cicl_total?: number | null
          sexual_assault_m?: number | null
          sexual_assault_f?: number | null
          sexual_assault_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      gad_stats: {
        Row: {
          id: string
          year: number
          month_updated: number | null
          total_lgu_budget: number | null
          gad_allocated_amount: number | null
          gad_utilized_amount: number | null
          number_of_gad_trainings: number | null
          participants_trained: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          year: number
          month_updated?: number | null
          total_lgu_budget?: number | null
          gad_allocated_amount?: number | null
          gad_utilized_amount?: number | null
          number_of_gad_trainings?: number | null
          participants_trained?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          year?: number
          month_updated?: number | null
          total_lgu_budget?: number | null
          gad_allocated_amount?: number | null
          gad_utilized_amount?: number | null
          number_of_gad_trainings?: number | null
          participants_trained?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      data_approvals: {
        Row: {
          id: string
          module: string
          tab: string
          year: number
          submitted_by: string | null
          status: string
          changes: Json
          comments: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          module: string
          tab: string
          year: number
          submitted_by?: string | null
          status?: string
          changes: Json
          comments?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          module?: string
          tab?: string
          year?: number
          submitted_by?: string | null
          status?: string
          changes?: Json
          comments?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          is_read: boolean | null
          type: string
          reference_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          is_read?: boolean | null
          type: string
          reference_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          is_read?: boolean | null
          type?: string
          reference_id?: string | null
          created_at?: string | null
        }
      }
      dynamic_schemas: {
        Row: {
          id: string
          department: string
          tab_name: string
          schema: Json
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          department: string
          tab_name: string
          schema?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          department?: string
          tab_name?: string
          schema?: Json
          created_at?: string | null
          updated_at?: string | null
        }
      }
      dynamic_data: {
        Row: {
          id: string
          barangay_id: string
          year: number
          month_updated: string
          schema_id: string
          data: Json
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          barangay_id: string
          year: number
          month_updated: string
          schema_id: string
          data?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          barangay_id?: string
          year?: number
          month_updated?: string
          schema_id?: string
          data?: Json
          created_at?: string | null
          updated_at?: string | null
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
