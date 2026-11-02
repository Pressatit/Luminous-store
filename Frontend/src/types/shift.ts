export interface Activeshifts {
    id:string;
    status:string;
    opened_at:string;
    opening_balance:number;
    cashier_name:string;
}

export interface Openshift {
    id:string;
    status:string;
    opening_balance:number;
    opened_at:string;
    cashier_name:string;
    store_name:string;
    message:string;
}