import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [productsRes, ordersRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("orders").select("id, status, total"),
      ]);

      const products = productsRes.count || 0;
      const orders = ordersRes.data || [];
      
      const totalOrders = orders.length;
      const confirmedOrders = orders.filter((o) => o.status === "confirmed").length;
      const pendingOrders = orders.filter((o) => o.status === "pending").length;
      const revenue = orders
        .filter((o) => o.status === "confirmed")
        .reduce((sum, o) => sum + Number(o.total), 0);

      return {
        products,
        totalOrders,
        confirmedOrders,
        pendingOrders,
        revenue,
      };
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const statCards = [
    {
      title: "Produits",
      value: stats?.products || 0,
      icon: Package,
      description: "Total des produits",
    },
    {
      title: "Commandes",
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      description: `${stats?.pendingOrders || 0} en attente`,
    },
    {
      title: "Confirmées",
      value: stats?.confirmedOrders || 0,
      icon: TrendingUp,
      description: "Commandes livrées",
    },
    {
      title: "Chiffre d'affaires",
      value: `${(stats?.revenue || 0).toFixed(2)} TND`,
      icon: DollarSign,
      description: "Revenus confirmés",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de votre boutique
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent orders */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.order_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{Number(order.total).toFixed(2)} TND</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          order.status === "confirmed"
                            ? "bg-success/10 text-success"
                            : order.status === "cancelled"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {order.status === "pending"
                          ? "En attente"
                          : order.status === "confirmed"
                          ? "Confirmée"
                          : "Annulée"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Aucune commande pour le moment
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
