import { useState, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from "browser-image-compression";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

// Compression options
const compressionOptions = {
  maxSizeMB: 2, // Max 2MB after compression
  maxWidthOrHeight: 2048, // Max dimension
  useWebWorker: true,
  fileType: "image/jpeg" as const,
  initialQuality: 0.85,
};

async function compressImage(file: File): Promise<File> {
  // Skip compression for small files (< 500KB) and already compressed formats
  if (file.size < 500 * 1024) {
    console.log("File is small, skipping compression:", file.name, file.size);
    return file;
  }

  // Check if it's a HEIC file - these need conversion
  const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                 file.name.toLowerCase().endsWith('.heif') ||
                 file.type === 'image/heic' || 
                 file.type === 'image/heif';
  
  if (isHeic) {
    throw new Error("Le format HEIC n'est pas supporté. Veuillez convertir l'image en JPG ou PNG avant de l'uploader.");
  }

  console.log("Compressing image:", file.name, "Original size:", (file.size / 1024 / 1024).toFixed(2), "MB");
  
  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    console.log("Compressed size:", (compressedFile.size / 1024 / 1024).toFixed(2), "MB");
    
    // Create a new file with proper name
    const newFileName = file.name.replace(/\.[^/.]+$/, ".jpg");
    return new File([compressedFile], newFileName, { type: "image/jpeg" });
  } catch (error) {
    console.error("Compression failed, using original:", error);
    return file;
  }
}

export function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const { toast } = useToast();

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Limite atteinte",
        description: `Maximum ${maxImages} images autorisées`,
        variant: "destructive",
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);
    setUploadProgress("Préparation...");

    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        // Validate file type
        if (!file.type.startsWith("image/") && !file.name.toLowerCase().match(/\.(heic|heif)$/)) {
          throw new Error(`${file.name} n'est pas une image valide`);
        }

        // Validate file size (max 20MB before compression)
        if (file.size > 20 * 1024 * 1024) {
          throw new Error(`${file.name} dépasse la taille maximale de 20MB`);
        }

        setUploadProgress(`Compression ${i + 1}/${filesToUpload.length}...`);
        
        // Compress the image
        const compressedFile = await compressImage(file);
        
        setUploadProgress(`Upload ${i + 1}/${filesToUpload.length}...`);

        const formData = new FormData();
        formData.append("file", compressedFile);

        const { data, error } = await supabase.functions.invoke("cloudinary-upload", {
          body: formData,
        });

        if (error) throw error;
        if (!data?.url) throw new Error("URL non reçue du serveur");

        uploadedUrls.push(data.url);
      }

      onChange([...images, ...uploadedUrls]);

      toast({
        title: "Upload réussi",
        description: `${uploadedUrls.length} image(s) ajoutée(s)`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erreur d'upload",
        description: error instanceof Error ? error.message : "Échec de l'upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  }, [images, maxImages, onChange, toast]);

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((url, index) => (
          <div key={index} className="relative aspect-square group">
            <img
              src={url}
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover rounded-lg border"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <label
            className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-secondary/50 transition-colors ${
              isUploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
              disabled={isUploading}
            />
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                <span className="text-xs text-muted-foreground mt-2">{uploadProgress}</span>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground">Ajouter</span>
              </>
            )}
          </label>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {images.length}/{maxImages} images • Max 20MB • Compression automatique + WebP
      </p>
    </div>
  );
}
