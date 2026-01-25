import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Upload, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  hero_tagline: z.string().max(100),
  hero_subtitle: z.string().max(200),
  hero_background_image: z.string().max(500).or(z.literal("")),
  shop_phone: z.string().max(20),
  shop_email: z.string().email().max(100),
  shop_address: z.string().max(200),
  facebook_url: z.string().url().max(200).or(z.literal("")),
  instagram_url: z.string().url().max(200).or(z.literal("")),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const AdminParametres = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);

  const handleHeroImageUpload = useCallback(async (file: File, onChange: (value: string) => void) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Erreur", description: "Le fichier doit être une image", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Erreur", description: "L'image ne doit pas dépasser 10MB", variant: "destructive" });
      return;
    }

    setIsUploadingHeroImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data, error } = await supabase.functions.invoke("cloudinary-upload", { body: formData });
      if (error) throw error;
      if (!data?.url) throw new Error("URL non reçue");

      onChange(data.url);
      toast({ title: "Image uploadée", description: "L'image de fond a été ajoutée" });
    } catch (error) {
      toast({ title: "Erreur d'upload", description: "Impossible d'uploader l'image", variant: "destructive" });
    } finally {
      setIsUploadingHeroImage(false);
    }
  }, [toast]);

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      hero_tagline: "",
      hero_subtitle: "",
      hero_background_image: "",
      shop_phone: "",
      shop_email: "",
      shop_address: "",
      facebook_url: "",
      instagram_url: "",
    },
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("key, value");
      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      data.forEach((row) => {
        settingsMap[row.key] = row.value || "";
      });
      return settingsMap;
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        hero_tagline: settings.hero_tagline || "",
        hero_subtitle: settings.hero_subtitle || "",
        hero_background_image: settings.hero_background_image || "",
        shop_phone: settings.shop_phone || "",
        shop_email: settings.shop_email || "",
        shop_address: settings.shop_address || "",
        facebook_url: settings.facebook_url || "",
        instagram_url: settings.instagram_url || "",
      });
    }
  }, [settings, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      const updates = Object.entries(data).map(([key, value]) =>
        supabase.from("settings").update({ value }).eq("key", key)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({
        title: "Paramètres enregistrés",
        description: "Les modifications ont été sauvegardées",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les paramètres",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsForm) => {
    saveMutation.mutate(data);
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
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">
            Configurez les informations de votre boutique
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Homepage settings */}
            <Card>
              <CardHeader>
                <CardTitle>Page d'accueil</CardTitle>
                <CardDescription>
                  Personnalisez le contenu affiché sur la page d'accueil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="hero_tagline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre principal</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre vision, notre passion" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hero_subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sous-titre</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Découvrez notre collection exclusive..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hero_background_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image de fond</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          {field.value ? (
                            <div className="relative w-full max-w-md">
                              <img
                                src={field.value}
                                alt="Fond hero"
                                className="w-full h-40 object-cover rounded-lg border"
                              />
                              <button
                                type="button"
                                onClick={() => field.onChange("")}
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <label
                              className={`flex flex-col items-center justify-center w-full max-w-md h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-secondary/50 transition-colors ${
                                isUploadingHeroImage ? "opacity-50 pointer-events-none" : ""
                              }`}
                            >
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleHeroImageUpload(file, field.onChange);
                                }}
                                disabled={isUploadingHeroImage}
                              />
                              {isUploadingHeroImage ? (
                                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                              ) : (
                                <>
                                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                  <span className="text-sm text-muted-foreground">
                                    Cliquez pour ajouter une image
                                  </span>
                                </>
                              )}
                            </label>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de contact</CardTitle>
                <CardDescription>
                  Ces informations seront affichées dans le pied de page et la page contact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="shop_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="+216 XX XXX XXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shop_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contact@optima-optique.tn"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shop_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Le Krib, Siliana, Tunisie" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Social links */}
            <Card>
              <CardHeader>
                <CardTitle>Réseaux sociaux</CardTitle>
                <CardDescription>
                  Liens vers vos pages sur les réseaux sociaux
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="facebook_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://facebook.com/votreppage"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instagram_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://instagram.com/votrepage"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="gap-2"
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
                  Enregistrer les paramètres
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
};

export default AdminParametres;
