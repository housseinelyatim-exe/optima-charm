import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const productSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  slug: z.string().min(2, "Le slug doit contenir au moins 2 caractères").max(100)
    .regex(/^[a-z0-9-]+$/, "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets"),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().min(0, "Le prix doit être positif"),
  stock: z.coerce.number().int().min(0, "Le stock doit être positif"),
  category_id: z.string().uuid().optional().nullable(),
  is_published: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  images: z.array(z.string()).default([]),
});

type ProductForm = z.infer<typeof productSchema>;

const AdminProductForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = id && id !== "nouveau";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      stock: 0,
      category_id: null,
      is_published: true,
      is_featured: false,
      images: [],
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  // Fetch product if editing
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!isEditing,
  });

  // Populate form when product is loaded
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        slug: product.slug,
        description: product.description || "",
        price: Number(product.price),
        stock: product.stock,
        category_id: product.category_id,
        is_published: product.is_published ?? true,
        is_featured: product.is_featured ?? false,
        images: product.images || [],
      });
    }
  }, [product, form]);

  // Auto-generate slug from name
  const watchName = form.watch("name");
  useEffect(() => {
    if (!isEditing && watchName) {
      const slug = watchName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      form.setValue("slug", slug);
    }
  }, [watchName, isEditing, form]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const productData = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        price: data.price,
        stock: data.stock,
        category_id: data.category_id || null,
        is_published: data.is_published,
        is_featured: data.is_featured,
        images: data.images,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert([productData] as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({
        title: isEditing ? "Produit mis à jour" : "Produit créé",
        description: "Les modifications ont été enregistrées",
      });
      navigate("/admin/produits");
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le produit",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductForm) => {
    saveMutation.mutate(data);
  };

  if (isEditing && isLoadingProduct) {
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/produits")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Modifier le produit" : "Nouveau produit"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Modifiez les informations du produit" : "Ajoutez un nouveau produit au catalogue"}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main content */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom du produit *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Ray-Ban Aviator Classic" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug (URL) *</FormLabel>
                          <FormControl>
                            <Input placeholder="ray-ban-aviator-classic" {...field} />
                          </FormControl>
                          <FormDescription>
                            Identifiant unique pour l'URL du produit
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Décrivez le produit..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <ImageUpload
                              images={field.value}
                              onChange={field.onChange}
                              maxImages={5}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Prix & Stock</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix (TND) *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock *</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Organisation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégorie</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une catégorie" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Visibilité</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="is_published"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Publié</FormLabel>
                            <FormDescription>
                              Visible dans la boutique
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_featured"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Mise en avant</FormLabel>
                            <FormDescription>
                              Affiché en page d'accueil
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {isEditing ? "Mettre à jour" : "Créer le produit"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
};

export default AdminProductForm;
