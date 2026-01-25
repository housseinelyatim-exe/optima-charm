import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useState, useEffect } from "react";

import categoryMenDefault from "@/assets/category-men.jpg";
import categoryWomenDefault from "@/assets/category-women.jpg";
import categoryKidsDefault from "@/assets/category-kids.jpg";

interface HomepageCategory {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  link: string;
  display_order: number;
}

const defaultImages: Record<string, string> = {
  men: categoryMenDefault,
  women: categoryWomenDefault,
  kids: categoryKidsDefault,
};

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editedCategories, setEditedCategories] = useState<Record<string, HomepageCategory>>({});

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-homepage-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as HomepageCategory[];
    },
  });

  useEffect(() => {
    if (categories) {
      const categoriesMap: Record<string, HomepageCategory> = {};
      categories.forEach((cat) => {
        categoriesMap[cat.id] = cat;
      });
      setEditedCategories(categoriesMap);
    }
  }, [categories]);

  const updateMutation = useMutation({
    mutationFn: async (category: HomepageCategory) => {
      const { error } = await supabase
        .from("homepage_categories")
        .update({
          title: category.title,
          subtitle: category.subtitle,
          image_url: category.image_url,
        })
        .eq("id", category.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-homepage-categories"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-categories"] });
      toast({ title: "Succès", description: "Catégorie mise à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour", variant: "destructive" });
    },
  });

  const handleImageChange = (categoryId: string, images: string[]) => {
    setEditedCategories((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        image_url: images.length > 0 ? images[0] : null,
      },
    }));
  };

  const handleFieldChange = (categoryId: string, field: "title" | "subtitle", value: string) => {
    setEditedCategories((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [field]: value,
      },
    }));
  };

  const handleSave = (categoryId: string) => {
    const category = editedCategories[categoryId];
    if (category) {
      updateMutation.mutate(category);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Catégories de la page d'accueil</h1>
          <p className="text-muted-foreground">
            Modifiez les images et textes des 3 catégories affichées sur la page d'accueil
          </p>
        </div>

        <div className="grid gap-6">
          {categories?.map((category) => {
            const edited = editedCategories[category.id] || category;
            const currentImage = edited.image_url || defaultImages[category.id];

            return (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle>{category.title}</CardTitle>
                  <CardDescription>
                    Personnalisez l'apparence de la catégorie "{category.title}"
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Image preview and upload */}
                    <div className="space-y-3">
                      <Label>Image actuelle</Label>
                      <div className="relative aspect-[3/4] max-w-[200px] rounded-lg overflow-hidden border">
                        <img
                          src={currentImage}
                          alt={category.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <Label>Nouvelle image</Label>
                        <ImageUpload
                          images={edited.image_url ? [edited.image_url] : []}
                          onChange={(images) => handleImageChange(category.id, images)}
                          maxImages={1}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Format recommandé : portrait (3:4), minimum 600x800px
                        </p>
                      </div>
                    </div>

                    {/* Text fields */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`title-${category.id}`}>Titre</Label>
                        <Input
                          id={`title-${category.id}`}
                          value={edited.title}
                          onChange={(e) => handleFieldChange(category.id, "title", e.target.value)}
                          placeholder="Ex: Homme"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`subtitle-${category.id}`}>Sous-titre</Label>
                        <Input
                          id={`subtitle-${category.id}`}
                          value={edited.subtitle}
                          onChange={(e) => handleFieldChange(category.id, "subtitle", e.target.value)}
                          placeholder="Ex: Collection masculine"
                        />
                      </div>

                      <Button
                        onClick={() => handleSave(category.id)}
                        disabled={updateMutation.isPending}
                        className="w-full md:w-auto"
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;