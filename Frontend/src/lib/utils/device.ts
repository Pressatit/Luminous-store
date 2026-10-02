// src/utils/device.ts

import { toast } from "sonner";


let IsInitializing =false;

const DEVICE_KEY="JORISA_DEVICE_TOKEN"
const Backend     = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

// Call this once on app mount
export const initDevice = async (): Promise<string> => {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing && existing !== "undefined") return existing;  // already registered

  // First visit — register with backend
  // Ask user for a label (or default to hostname)
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

    localStorage.setItem(DEVICE_KEY, data.token);
    toast.info(data.message)

    return data.device_token;
  } catch {
    // Fallback — generate locally if server unreachable
    // This won't be in DB so cashier login will fail until server is reached
    const fallback = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, fallback);
    return fallback;
  }
  finally{
    IsInitializing=false;
  }
};

export const getDeviceToken = (): string => {
  return localStorage.getItem(DEVICE_KEY) ?? "";
};