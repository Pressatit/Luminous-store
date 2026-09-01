export interface CartItem {
  id:        number;
  itemName:  string;
  quantity:  number;
  unitCost:  number;
  unitPrice: number;
  total:     number;
}

// New — dispatch cart has reason + stockQuantity for validation
export interface DispatchCartItem {
  id:            number;
  itemName:      string;
  quantity:      number;    // qty being removed
  unitPrice:     number;    // from existing stock
  stockQuantity: number;    // current qty in inventory — for validation
  reason:        string;    // Sale | Spoilt | Internal use
  total:         number;
}