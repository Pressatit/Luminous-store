import type { DashboardSummary, StockAlert, ActivityItem } from "../types/dashboard";

export const mockSummary: DashboardSummary = {
  stockValue: 284500,
  lowStockCount: 5,
  todayTransactions: { total: 26, in: 9, out: 17 },
  totalCategories: 12,
  activeCashier: "Kamau Njoroge",
};

export const mockAlerts: StockAlert[] = [
  { id: "1", itemName: "Bulbs",           category: "Electricals", quantityAvailable: 2,  lowStockThreshold: 10 },
  { id: "2", itemName: "Screws",          category: "Hardware",    quantityAvailable: 10, lowStockThreshold: 20 },
  { id: "3", itemName: "Extension cable", category: "Electricals", quantityAvailable: 7,  lowStockThreshold: 15 },
];

export const mockActivity: ActivityItem[] = [
  { id: "1", itemName: "Screwdrivers (Phillips)",  transactionType: "dispatch", quantity: 6,  servedBy: "Kamau", createdAt: "2026-07-21T11:42:00" },
  { id: "2", itemName: "PVC conduit pipe 20mm",    transactionType: "receive",  quantity: 50, servedBy: "Aisha", createdAt: "2026-07-21T10:15:00" },
  { id: "3", itemName: "Bulb holders (E27)",       transactionType: "dispatch", quantity: 8,  servedBy: "Kamau", createdAt: "2026-07-21T09:30:00" },
  { id: "4", itemName: "Cable ties (100pc bag)",   transactionType: "receive",  quantity: 20, servedBy: "Aisha", createdAt: "2026-07-21T08:55:00" },
  { id: "5", itemName: "3-pin plugs",              transactionType: "dispatch", quantity: 19, servedBy: "Kamau", createdAt: "2026-07-21T08:10:00" },
];
