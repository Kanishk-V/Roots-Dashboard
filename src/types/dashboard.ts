export interface ChartData {
  labels: string[];
  values: number[];
}

export interface LocationData {
  latitude: number;
  longitude: number;
  price: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  loanType?: string;
}

export interface RecentListing {
  address: string;
  city: string;
  state: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  createdAt: Date;
  loanType?: string;
}

export interface Metrics {
  averagePrice: number;
}

export interface DashboardData {
  totalListings: number;
  metrics: Metrics;
  assumableListings: ChartData;
}

export interface DashboardResponse {
  data: DashboardData;
  error?: string;
} 