export interface DashboardSummary {
  stockValue: number;
  lowStockCount: number;
  todayTransactions: {
    total: number;
    in: number;
    out: number;
  };
  totalCategories: number;
  activeCashier: string;
}

export interface StockAlert {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  low_stock_threshold: number;
}

export interface ActivityItem {
  id: string;
  item_name: string;
  transaction_type: string;
  quantity: number;
  served_by: string;
  created_at: string;
}
