import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, GripVertical, Loader2, Eye, EyeOff, Link, Upload } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface InstagramPost {
  id: string;
  image_url: string;
  alt_text: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const AdminInstagram = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newPost, setNewPost] = useState({ image_url: "", alt_text: "" });
  const [instagramUrl, setInstagramUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [addMethod, setAddMethod] = useState<"url" | "upload">("url");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-instagram-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instagram_posts")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as InstagramPost[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (post: { image_url: string; alt_text: string }) => {
      const maxOrder = posts?.reduce((max, p) => Math.max(max, p.display_order), 0) || 0;
      const { error } = await supabase.from("instagram_posts").insert({
        image_url: post.image_url,
        alt_text: post.alt_text,
        display_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-instagram-posts"] });
      queryClient.invalidateQueries({ queryKey: ["instagram-posts"] });
      setNewPost({ image_url: "", alt_text: "" });
      setIsAdding(false);
      toast({ title: "Succès", description: "Publication ajoutée" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'ajouter la publication", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InstagramPost> }) => {
      const { error } = await supabase.from("instagram_posts").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-instagram-posts"] });
      queryClient.invalidateQueries({ queryKey: ["instagram-posts"] });
      toast({ title: "Succès", description: "Publication mise à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("instagram_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-instagram-posts"] });
      queryClient.invalidateQueries({ queryKey: ["instagram-posts"] });
      toast({ title: "Succès", description: "Publication supprimée" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
    },
  });

  const handleImageUpload = (images: string[]) => {
    if (images.length > 0) {
      setNewPost((prev) => ({ ...prev, image_url: images[0] }));
    }
  };

  const handleFetchInstagramPost = async () => {
    if (!instagramUrl.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer un lien Instagram", variant: "destructive" });
      return;
    }

    setIsFetchingUrl(true);
    try {
      const { data, error } = await supabase.functions.invoke("instagram-fetch", {
        body: { url: instagramUrl },
      });

      if (error) throw error;

      if (data?.success && data?.data?.image_url) {
        setNewPost({
          image_url: data.data.image_url,
          alt_text: data.data.title || data.data.author_name || "Publication Instagram",
        });
        toast({ title: "Succès", description: "Image récupérée avec succès" });
      } else {
        throw new Error(data?.error || "Impossible de récupérer l'image");
      }
    } catch (error) {
      console.error("Error fetching Instagram post:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de récupérer le post Instagram",
        variant: "destructive",
      });
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleResetForm = () => {
    setNewPost({ image_url: "", alt_text: "" });
    setInstagramUrl("");
    setIsAdding(false);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Publications Instagram</h1>
            <p className="text-muted-foreground">
              Gérez les images affichées dans la section Instagram
            </p>
          </div>
          <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {/* Add new post form */}
        {isAdding && (
          <Card>
            <CardHeader>
              <CardTitle>Nouvelle publication</CardTitle>
              <CardDescription>Ajoutez une nouvelle image à la section Instagram</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={addMethod} onValueChange={(v) => setAddMethod(v as "url" | "upload")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url" className="gap-2">
                    <Link className="h-4 w-4" />
                    Lien Instagram
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload manuel
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="url" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="instagram_url">Lien du post Instagram</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="instagram_url"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        placeholder="https://www.instagram.com/p/ABC123..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleFetchInstagramPost}
                        disabled={isFetchingUrl || !instagramUrl.trim()}
                      >
                        {isFetchingUrl ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Récupérer"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Collez le lien d'un post Instagram public pour récupérer automatiquement l'image
                    </p>
                  </div>

                  {newPost.image_url && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                      <img
                        src={newPost.image_url}
                        alt="Aperçu"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="upload" className="space-y-4 mt-4">
                  <div>
                    <Label>Image</Label>
                    <ImageUpload
                      images={newPost.image_url ? [newPost.image_url] : []}
                      onChange={handleImageUpload}
                      maxImages={1}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div>
                <Label htmlFor="alt_text">Description (alt text)</Label>
                <Input
                  id="alt_text"
                  value={newPost.alt_text}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, alt_text: e.target.value }))}
                  placeholder="Description de l'image"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => addMutation.mutate(newPost)}
                  disabled={!newPost.image_url || addMutation.isPending}
                >
                  {addMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Ajouter
                </Button>
                <Button variant="outline" onClick={handleResetForm}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts list */}
        <div className="grid gap-4">
          {posts?.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                
                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={post.image_url}
                    alt={post.alt_text}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <Input
                    value={post.alt_text}
                    onChange={(e) =>
                      updateMutation.mutate({
                        id: post.id,
                        updates: { alt_text: e.target.value },
                      })
                    }
                    placeholder="Description de l'image"
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ordre: {post.display_order}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {post.is_active ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={post.is_active}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({
                          id: post.id,
                          updates: { is_active: checked },
                        })
                      }
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(post.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {posts?.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              Aucune publication Instagram. Cliquez sur "Ajouter" pour en créer une.
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminInstagram;
