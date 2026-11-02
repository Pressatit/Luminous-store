// src/utils/device.ts

import { toast } from "sonner";


let IsInitializing =false;

const DEVICE_KEY="JORISA_DEVICE_TOKEN"
const Backend     = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

let registrationPromise: Promise<string> | null = null;

export const getDeviceToken = (): string => {
  const t = localStorage.getItem(DEVICE_KEY);
  return t && t !== "undefined" ? t : "";
};

// Call this once on app mount
export const initDevice = async (): Promise<string> => {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing ) return Promise.resolve(existing); 
    
  
  if (registrationPromise) return registrationPromise;
  // First visit — register with backend
  // Ask user for a label (or default to hostname)
  
  registrationPromise=(async()=> {
    
  const label = window.prompt(
    "First time setup: enter a name for this device (e.g. 'Counter 1')"
  ) ?? `Device-${Date.now()}`;

  if (IsInitializing){
    return "";
  }

  IsInitializing = true;

  try {
    const res  = await fetch(`${Backend}/device/register?label=${encodeURIComponent(label)}`, {
      method: "POST",
    });

     if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();

    const token = data.token
    if (!token) throw new Error("No token in register response");

    localStorage.setItem(DEVICE_KEY, data.token);
    toast.info(data.message)

    return token as string;
  } catch(err) {
    console.error("Device registration failed:", err);
      toast.error("Could not register this device. Check your connection.");
      return "";

  }
  finally{
    registrationPromise = null;
  }
  })();

  return registrationPromise;
};

