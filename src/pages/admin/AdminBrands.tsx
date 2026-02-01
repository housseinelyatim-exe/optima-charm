import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Search, AlertCircle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { searchBrandLogo } from "@/utils/brandfetch";

interface BrandWithCount {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  display_order: number | null;
  domain?: string;
  is_active?: boolean;
  product_count?: number;
}

// Helper to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const AdminBrands = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandWithCount | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logo_url: "",
    description: "",
    display_order: 0,
  });

  // Fetch brands with product counts using RPC function
  const { data: brands, isLoading } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      // Use RPC function for efficient query (includes all brands, not just active)
      const { data, error } = await supabase
        .rpc('get_brands_with_product_counts', { only_active: false });

      if (error) throw error;

      return data as BrandWithCount[];
    },
  });

  // Search brand logo using Brandfetch
  const handleSearchBrand = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un nom de marque",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchBrandLogo(searchQuery);
      
      if (result) {
        setFormData({
          ...formData,
          name: result.name,
          slug: generateSlug(result.name),
          logo_url: result.logoUrl,
        });
        toast({
          title: "Logo trouvé!",
          description: `Logo de ${result.name} récupéré avec succès`,
        });
      } else {
        toast({
          title: "Marque introuvable",
          description: "Essayez un autre nom ou entrez l'URL manuellement",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rechercher la marque",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const brandData = {
        name: data.name,
        slug: data.slug || generateSlug(data.name),
        logo_url: data.logo_url || null,
        description: data.description || null,
        display_order: data.display_order,
      };

      if (data.id) {
        const { error } = await supabase
          .from("brands")
          .update(brandData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brands").insert([brandData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast({ title: editingBrand ? "Marque mise à jour" : "Marque ajoutée" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("brands").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast({ title: "Marque supprimée" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", slug: "", logo_url: "", description: "", display_order: 0 });
    setSearchQuery("");
    setEditingBrand(null);
  };

  const handleEdit = (brand: typeof brands[number]) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      slug: brand.slug,
      logo_url: brand.logo_url || "",
      description: brand.description || "",
      display_order: brand.display_order || 0,
    });
    setSearchQuery(brand.name);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.logo_url) {
      toast({
        title: "Erreur",
        description: "Veuillez rechercher un logo ou entrer une URL",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(editingBrand ? { ...formData, id: editingBrand.id } : formData);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Marques</h1>
            <p className="text-muted-foreground">
              Gérez les marques affichées dans le carrousel
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une marque
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingBrand ? "Modifier la marque" : "Nouvelle marque"}
                </DialogTitle>
                <DialogDescription>
                  Recherchez une marque pour récupérer automatiquement son logo via Brandfetch
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Brandfetch Search */}
                <div className="space-y-2">
                  <Label htmlFor="search">Rechercher une marque</Label>
                  <div className="flex gap-2">
                    <Input
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ex: Ray-Ban, Oakley..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchBrand();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleSearchBrand}
                      disabled={isSearching || !searchQuery.trim()}
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Alert>
                    <AlertDescription className="text-xs">
                      💡 Entrez le nom de la marque et cliquez sur rechercher pour obtenir automatiquement le logo officiel
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Logo Preview */}
                {formData.logo_url && (
                  <div className="space-y-2">
                    <Label>Aperçu du logo</Label>
                    <div className="p-6 border rounded-lg flex items-center justify-center bg-muted min-h-[120px]">
                      <img
                        src={formData.logo_url}
                        alt="Preview"
                        className="max-h-20 max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          toast({
                            title: "Erreur de chargement",
                            description: "Le logo ne peut pas être chargé. Vérifiez l'URL ou recherchez à nouveau la marque.",
                            variant: "destructive",
                          });
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Manual fields */}
                <div className="space-y-4 pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    Ou entrez manuellement les informations:
                  </p>
                  
                  <div>
                    <Label htmlFor="name">Nom de la marque *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        name: e.target.value,
                        slug: generateSlug(e.target.value)
                      })}
                      placeholder="Ray-Ban"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="logo_url">URL du logo *</Label>
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description de la marque"
                    />
                  </div>

                  <div>
                    <Label htmlFor="display_order">Ordre d'affichage</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {editingBrand ? "Mettre à jour" : "Ajouter"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des marques</CardTitle>
            <CardDescription>
              {brands?.length || 0} marque(s) · Logos récupérés automatiquement via Brandfetch
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : brands && brands.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Logo</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Produits</TableHead>
                    <TableHead>Ordre</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell>
                        <div className="w-20 h-12 flex items-center justify-center bg-muted rounded">
                          {brand.logo_url && (
                            <img
                              src={brand.logo_url}
                              alt={brand.name}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {brand.slug}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={brand.product_count === 0 ? "text-orange-600 font-medium" : ""}>
                            {brand.product_count || 0}
                          </span>
                          {brand.product_count === 0 && (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                              Aucun produit
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{brand.display_order}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(brand)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(brand.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune marque ajoutée
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alert for brands with 0 products */}
        {brands && brands.filter(b => b.product_count === 0).length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <strong>Note :</strong> Les marques avec 0 produits ne s'affichent pas dans le carrousel ni dans la navigation du site.
              Ajoutez des produits à ces marques pour les rendre visibles aux clients.
            </AlertDescription>
          </Alert>
        )}

        {/* Info card about Brandfetch */}
        <Alert>
          <Search className="h-4 w-4" />
          <AlertDescription>
            <strong>Powered by Brandfetch</strong> - Les logos sont automatiquement récupérés depuis la base de données officielle de Brandfetch. Pas besoin de chercher les logos sur Google!
          </AlertDescription>
        </Alert>
      </div>
    </AdminLayout>
  );
};

export default AdminBrands;
