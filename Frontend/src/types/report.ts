export interface ReportRow {
  id:               number;
  item_name:        string;
  quantity:         number;
  served_by:        string;
  time:             string;
  date:             string;
  transaction_type: string;
  total_amount:     number;
  reason?:          string;
  created_at:       string;
}