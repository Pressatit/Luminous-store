import { useState, useRef,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ReactBarcode } from "react-jsbarcode";
import {  Upload, Camera, Download, Printer,CheckCircle, ToggleLeft, ToggleRight,} from "lucide-react";
import { toast } from "sonner";



// ── Generates a unique barcode string: category prefix + timestamp + random ──
const generateBarcodeValue = (categoryId: string) => {
  const prefix = categoryId.padStart(2, "0");
  const ts     = Date.now().toString().slice(-7);
  const rand   = Math.floor(Math.random() * 999).toString().padStart(3, "0");
  return `JRS${prefix}${ts}${rand}`;
};



export const RegisterItem = () => {

interface Category {
  id: number | string;
  name: string;
}


  const navigate = useNavigate();
  const Backend=import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"


  // Form state
  const [itemName,    setItemName]    = useState("");
  const [categoryId,  setCategoryId]  = useState("");
  //const [unitCost,    setUnitCost]    = useState("");
  //const [unitPrice,   setUnitPrice]   = useState("");
  const [isBinItem,   setIsBinItem]   = useState(false);
  const [imageFile,   setImageFile]   = useState<File | null>(null);
  const [imagePreview,setImagePreview]= useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Barcode state
  const [barcodeValue, setBarcodeValue] = useState<string | null>(null);
  const [isRegistering,setIsRegistering]= useState(false);
  const [registered,   setRegistered]   = useState(false);

  const fileInputRef   = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const barcodeRef     = useRef<HTMLDivElement>(null);

  // Fetch categories
  useEffect(() => {
  async function fetchCategories() {
    try {
      const savedToken = localStorage.getItem("JORISA_TOKEN");
      const res = await fetch(`${Backend}/categories`, {
        headers: { 
          Authorization: `Bearer ${savedToken}`,
          "ngrok-skip-browser-warning": "true",

       }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }
  fetchCategories();
}, []);



  // Validation 

  const canGenerate = itemName.trim() && categoryId;

  // Image handling 

  const handleImage = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Generate barcode 

  const handleGenerate = () => {
    if (!canGenerate) return;
    setBarcodeValue(generateBarcodeValue(categoryId));
  };

  // Download barcode as SVG 

  const handleDownload = () => {
    if (!barcodeRef.current || !barcodeValue) return;
    const svg = barcodeRef.current.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `barcode-${barcodeValue}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  //  Print barcode
  const handlePrint = () => {
    if (!barcodeRef.current || !barcodeValue) return;
    const svg = barcodeRef.current.querySelector("svg");
    if (!svg) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Barcode — ${itemName}</title>
      <style>
        body { display:flex; flex-direction:column; align-items:center;
               justify-content:center; min-height:100vh; margin:0; font-family:sans-serif; }
        p { font-size:14px; margin-top:8px; color:#333; }
      </style></head>
      <body>${svg.outerHTML}<p>${itemName}</p></body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  // Register item 
  const handleRegister = async () => {
    if (!barcodeValue || !canGenerate) return;
    setIsRegistering(true);

   try {
    const savedToken = localStorage.getItem("JORISA_TOKEN");
    const formData = new FormData();

    formData.append("name", itemName);
    formData.append("category_id", categoryId);
    formData.append("barcode", barcodeValue);
    formData.append("is_bin_item", String(isBinItem));
    
    if (imageFile) {
      formData.append("image", imageFile);
    }

    const response = await fetch(`${Backend}/item`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${savedToken}`, // Note: Do NOT set Content-Type header when passing FormData!
        "ngrok-skip-browser-warning":"true"
      },
      body: formData
    });

    if (!response.ok) {
      const errData = await response.json();
      toast.error("Item registration failed")
      throw new Error(errData.detail || "Item registration failed");
    }

    toast.success("Item registered successfully!");
    setRegistered(true);

    setTimeout(() => {
      navigate("/inventory");
    }, 1000);

  } catch (err: any) {
    toast.error(err.message || "Failed to register item");
  } finally {
    setIsRegistering(false);
  }
  };

  //  Shared label style 
  const label = "text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block";
  const input = "w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1B2B4B] placeholder:text-gray-300 focus:outline-none focus:border-[#0EA5A0] focus:ring-2 focus:ring-[#0EA5A0]/20 transition-all";

  return (
    <div className="w-full max-w-2xl mx-auto md:mx-0 pb-6">

      <div className="space-y-5">

        {/* ── Row 1: Item name + Category ── */}
        <div className="flex flex-col md:flex-row gap-4">

          <div className="flex-1">
            <label className={label}>Item name</label>
            <input
              type="text"
              placeholder="e.g. Bulb holder E27"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className={input}
            />
          </div>

          <div className="flex-1">
            <label className={label}>Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`${input} cursor-pointer`}
            >
              <option value="" disabled>Choose category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>


        {/* ── Bin item toggle ── */}
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[#1B2B4B]">Bin item</p>
            <p className="text-xs text-gray-400">Loose items stored in a bin (screws, nails, etc.)</p>
          </div>
          <button
            type="button"
            onClick={() => setIsBinItem(!isBinItem)}
            className="text-[#0EA5A0] transition-transform active:scale-95"
          >
            {isBinItem
              ? <ToggleRight size={32} className="text-[#0EA5A0]" />
              : <ToggleLeft  size={32} className="text-gray-300"  />
            }
          </button>
        </div>

        {/* ── Image upload ── */}
        <div>
          <label className={label}>Item image</label>
          <div className="flex flex-col sm:flex-row gap-4">

            {/* Upload options */}
            <div className="flex sm:flex-col gap-3 flex-shrink-0">
              {/* Hidden file inputs */}
              <input ref={fileInputRef}   type="file" accept="image/*"           className="hidden" onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])} />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5 px-4 py-3 bg-white border border-gray-200
                           rounded-xl hover:border-[#0EA5A0] hover:bg-[#F0FAFA] transition-all text-gray-500 hover:text-[#0EA5A0]"
              >
                <Upload size={20} />
                <span className="text-xs font-medium whitespace-nowrap">From gallery</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5 px-4 py-3 bg-white border border-gray-200
                           rounded-xl hover:border-[#0EA5A0] hover:bg-[#F0FAFA] transition-all text-gray-500 hover:text-[#0EA5A0]"
              >
                <Camera size={20} />
                <span className="text-xs font-medium">Take photo</span>
              </button>
            </div>

            {/* Image preview */}
            <div className="flex-1 min-h-[140px] bg-gray-50 border-2 border-dashed border-gray-200
                            rounded-xl flex items-center justify-center overflow-hidden relative">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Item preview" className="w-full h-full object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center hover:bg-black/70"
                  >✕</button>
                </>
              ) : (
                <p className="text-xs text-gray-300 font-medium">Item image preview</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-gray-100" />

        {/* ── Barcode section ── */}
        <div>
          <label className={label}>Barcode</label>

          {/* Generate button — only shown before barcode exists */}
          {!barcodeValue && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`w-full h-10 rounded-xl text-sm font-semibold transition-all
                ${canGenerate
                  ? "bg-[#1B2B4B] text-white hover:bg-[#243a5e] active:scale-[0.98]"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
            >
              {canGenerate ? "Generate barcode" : "Fill in item details first"}
            </button>
          )}

          {/* Barcode display */}
          {barcodeValue && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">

              {/* SVG barcode render */}
              <div ref={barcodeRef} className="flex justify-center overflow-x-auto">
                <ReactBarcode
                  value={barcodeValue}
                  options={{
                    format:      "CODE128",
                    width:       1.8,
                    height:      70,
                    displayValue: true,
                    fontSize:    11,
                    margin:      8,
                  }}
                  
                />
              </div>

              {/* Barcode string */}
              <p className="text-center text-xs font-mono text-gray-400">{barcodeValue}</p>

              {/* Download + Print */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl
                             bg-[#1B2B4B] text-white text-sm font-semibold
                             hover:bg-[#243a5e] active:scale-[0.98] transition-all"
                >
                  <Download size={15} />
                  Download
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl
                             bg-white border border-gray-200 text-[#1B2B4B] text-sm font-semibold
                             hover:bg-gray-50 active:scale-[0.98] transition-all"
                >
                  <Printer size={15} />
                  Print
                </button>
              </div>

              {/* Regenerate option */}
              <button
                type="button"
                onClick={() => setBarcodeValue(null)}
                className="w-full text-xs text-gray-400 hover:text-[#0EA5A0] transition-colors text-center"
              >
                Regenerate barcode
              </button>
            </div>
          )}
        </div>

        {/* ── Register button ── */}
        <button
          type="button"
          onClick={handleRegister}
          disabled={!barcodeValue || isRegistering || registered}
          className={`w-full h-12 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]
            ${registered
              ? "bg-green-500 text-white"
              : barcodeValue
                ? "bg-[#0EA5A0] text-white hover:bg-[#0c9490] shadow-lg shadow-[#0EA5A0]/25"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
        >
          {registered ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle size={16} /> Item registered!
            </span>
          ) : isRegistering ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Registering...
            </span>
          ) : (
            "Register Item"
          )}
        </button>

      </div>
    </div>
  );
};

