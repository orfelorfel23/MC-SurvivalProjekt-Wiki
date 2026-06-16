import { useState } from "react";
import { uploadImageFn } from "@/server/functions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";

export function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await uploadImageFn({ data: formData as any });
      if (res && res.url) {
        onChange(res.url);
        toast.success("Bild hochgeladen!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input 
          value={value || ""} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder="/items/example.png" 
          className="flex-1"
        />
        <div className="relative">
          <Button variant="outline" disabled={uploading} type="button">
            {uploading ? "..." : "Upload"}
          </Button>
          <input 
            type="file" 
            accept="image/*" 
            className="absolute inset-0 opacity-0 cursor-pointer w-full"
            onChange={handleUpload}
            disabled={uploading}
          />
        </div>
      </div>
      {value && (
        <div className="mt-2 w-16 h-16 rounded border border-border flex items-center justify-center bg-black/50 overflow-hidden">
          <img src={value} alt="Preview" className="w-12 h-12 object-contain" style={{ imageRendering: "pixelated" }} />
        </div>
      )}
    </div>
  );
}
