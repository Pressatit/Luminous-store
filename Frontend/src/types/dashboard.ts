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
  itemName: string;
  category: string;
  quantityAvailable: number;
  lowStockThreshold: number;
}

export interface ActivityItem {
  id: string;
  itemName: string;
  transactionType: "receive" | "dispatch";
  quantity: number;
  servedBy: string;
  createdAt: string;
}
