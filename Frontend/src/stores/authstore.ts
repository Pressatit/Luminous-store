import { create } from "zustand";

export interface userProfile{
    id:string,
    name:string,
    email:string,
    role: "admin" | "cashier" | "manager",
    storeId:number,

}

export interface AuthState{
    user:userProfile | null,
    token:string | null,
    loading:boolean,
    setUser:(user:userProfile | null) => void,
    setToken:(token:string | null ) => void,
    setLoading:(loading:boolean ) => void,
    logout:() => void

}

 export const useAuthStore = create<AuthState>((set)=> ({
    user : null,
    token : null,
    loading : true,
    setUser : (user)=>set({user}),
    setLoading : (loading) => set({loading}),
    setToken: (token) => set({token}),
    logout:()=>{
        localStorage.removeItem("JORISA_TOKEN")
        localStorage.removeItem("JORISA_USER")
        set({user:null,token:null,loading:false})
    },
}))
