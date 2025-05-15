export interface ChartData {
  labels: string[];
  values: number[];
}

export interface TimeSeriesData {
  dates: string[];
  values: number[];
}

export interface MortgageMetrics {
  originalBalance: number;
  currentBalance: number;
  interestRate: number;
  originationDate: Date;
  remainingTerm: number;
}

export interface ListingLifecycle {
  createdAt: Date;
  updatedAt: Date;
  lastStatusChange: Date;
  daysOnMarket: number;
  statusHistory: Array<{
    status: string;
    date: Date;
  }>;
}

export interface GeoDistribution {
  latitude: number;
  longitude: number;
  count: number;
  loanType: string;
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
  averageDaysOnMarket: number;
  averageUpdateFrequency: number; // in days
  totalNewListingsLast30Days: number;
}

export interface DashboardData {
  totalListings: number;
  metrics: Metrics;
  assumableListings: ChartData;
  priceDistribution: ChartData;
  // New metrics
  listingTrends: {
    daily: TimeSeriesData;
    weekly: TimeSeriesData;
    monthly: TimeSeriesData;
  };
  mortgageAnalytics: {
    ageDistribution: ChartData;
    balanceDistribution: ChartData;
    interestRateDistribution: ChartData;
  };
  geographicData: GeoDistribution[];
  listingLifecycle: {
    statusDistribution: ChartData;
    daysOnMarketByType: ChartData;
    updateFrequency: ChartData;
  };
}

export interface DashboardResponse {
  data: DashboardData;
  error?: string;
} 