import { useState, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
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

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} n'est pas une image valide`);
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} dépasse la taille maximale de 10MB`);
        }

        const formData = new FormData();
        formData.append("file", file);

        const { data, error } = await supabase.functions.invoke("cloudinary-upload", {
          body: formData,
        });

        if (error) throw error;
        if (!data?.url) throw new Error("URL non reçue du serveur");

        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
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
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
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
        {images.length}/{maxImages} images • Max 10MB par image • Conversion automatique WebP
      </p>
    </div>
  );
}
