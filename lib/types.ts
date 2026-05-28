// データベーステーブルの型定義

export type OilType = "軽油" | "重油" | "灯油";

export type DeliveryStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Driver {
  id: string;
  name: string;
  vehicle_no: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  tel: string | null;
  created_at: string;
}

export interface Delivery {
  id: string;
  date: string;
  driver_id: string | null;
  company_id: string | null;
  company_name: string;
  site_name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  oil_type: OilType;
  quantity: number | null;
  vehicle_no: string | null;
  time_spec: string | null;
  tel: string | null;
  contact_name: string | null;
  notes: string | null;
  tax_exempt_number: string | null;
  unit_price: number | null;
  status: DeliveryStatus;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryWithDriver extends Delivery {
  driver: Driver | null;
}

export interface RecurringSchedule {
  id: string;
  driver_id: string | null;
  company_name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  oil_type: OilType;
  days_of_week: number[];
  time_spec: string | null;
  tel: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

// フォーム用の型
export interface DeliveryFormData {
  date: string;
  driver_id: string;
  company_name: string;
  site_name?: string;
  address?: string;
  oil_type: OilType;
  quantity?: number;
  vehicle_no?: string;
  time_spec?: string;
  tel?: string;
  contact_name?: string;
  notes?: string;
  tax_exempt_number?: string;
  unit_price?: number;
}

// フィルター用の型
export interface DeliveryFilter {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  driver_id?: string;
  oil_type?: OilType;
  status?: DeliveryStatus;
}

// 地図マーカー用の型
export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  company_name: string;
  address: string;
  oil_type: OilType;
  time_spec: string | null;
  driver: Driver;
  vehicle_no: string | null;
  tel: string | null;
  notes: string | null;
}

// Supabase Database型（自動生成の代わり）
export interface Database {
  public: {
    Tables: {
      drivers: {
        Row: Driver;
        Insert: Omit<Driver, "id" | "created_at">;
        Update: Partial<Omit<Driver, "id" | "created_at">>;
      };
      companies: {
        Row: Company;
        Insert: Omit<Company, "id" | "created_at">;
        Update: Partial<Omit<Company, "id" | "created_at">>;
      };
      deliveries: {
        Row: Delivery;
        Insert: Omit<Delivery, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Delivery, "id" | "created_at" | "updated_at">>;
      };
      recurring_schedules: {
        Row: RecurringSchedule;
        Insert: Omit<RecurringSchedule, "id" | "created_at">;
        Update: Partial<Omit<RecurringSchedule, "id" | "created_at">>;
      };
    };
  };
}
