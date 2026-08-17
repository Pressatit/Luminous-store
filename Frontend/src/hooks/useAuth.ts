
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authstore";

export function useAuth(){
    const { setUser ,setToken , setLoading , logout} =useAuthStore()

    useEffect(()=>{
        async function initAuth() {
            const savedToken=localStorage.getItem("JORISA_TOKEN")
            const savedUser=localStorage.getItem("JORISA_USER")

            if (!savedToken && !savedUser){
                logout()
                return
            }
        try {
        // Validate saved token with FastAPI backend
              const response = await fetch('http://localhost:8000/users/me', {
               headers: {
               Authorization: `Bearer ${savedToken}`,
            },
            })

        if (response.ok) {
          const freshUserData = await response.json()
          setToken(savedToken)
          setUser(freshUserData)
        } else {
          // Token expired or invalid
          logout()
        }
      } catch (err) {
        console.error('Failed to authenticate stored session:', err)
        logout()
      } finally {
        setLoading(false)
      }
    }

    void initAuth()},[setLoading,setToken,setUser,logout])
    return useAuthStore()

}