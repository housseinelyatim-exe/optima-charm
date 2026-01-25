import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  MapPin,
  Package,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  delivery_method: string;
  status: string;
  total: number;
  notes: string | null;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
}

const AdminCommandes = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
  });

  const { data: orderItems } = useQuery({
    queryKey: ["order-items", selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", selectedOrder.id);

      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!selectedOrder,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Statut mis à jour" });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery);

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case "confirmed":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmée
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="h-3 w-3 mr-1" />
            Annulée
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Commandes</h1>
          <p className="text-muted-foreground">
            Gérez et suivez les commandes clients
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une commande..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="confirmed">Confirmées</SelectItem>
              <SelectItem value="cancelled">Annulées</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Livraison</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredOrders && filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.order_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(order.created_at), "dd MMM yyyy", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(order.total).toFixed(2)} TND
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {order.delivery_method === "pickup"
                          ? "Retrait"
                          : "Livraison"}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Aucune commande trouvée</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Order detail dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Commande {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Status actions */}
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Statut actuel</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                {selectedOrder.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        updateStatus.mutate({
                          id: selectedOrder.id,
                          status: "cancelled",
                        });
                        setSelectedOrder({
                          ...selectedOrder,
                          status: "cancelled",
                        });
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      className="bg-success hover:bg-success/90"
                      onClick={() => {
                        updateStatus.mutate({
                          id: selectedOrder.id,
                          status: "confirmed",
                        });
                        setSelectedOrder({
                          ...selectedOrder,
                          status: "confirmed",
                        });
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirmer
                    </Button>
                  </div>
                )}
              </div>

              {/* Customer info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Client</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                  <a
                    href={`tel:${selectedOrder.customer_phone}`}
                    className="flex items-center text-sm text-muted-foreground hover:text-primary"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    {selectedOrder.customer_phone}
                  </a>
                  {selectedOrder.customer_address && (
                    <p className="flex items-start text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      {selectedOrder.customer_address}
                    </p>
                  )}
                  <Badge variant="outline">
                    {selectedOrder.delivery_method === "pickup"
                      ? "Retrait en boutique"
                      : "Livraison à domicile"}
                  </Badge>
                </CardContent>
              </Card>

              {/* Order items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Articles commandés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orderItems?.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} x {Number(item.price_at_purchase).toFixed(2)} TND
                          </p>
                        </div>
                        <p className="font-semibold">
                          {(item.quantity * Number(item.price_at_purchase)).toFixed(2)} TND
                        </p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-4 border-t font-bold">
                      <span>Total</span>
                      <span>{Number(selectedOrder.total).toFixed(2)} TND</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedOrder.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{selectedOrder.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCommandes;
