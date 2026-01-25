import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { DollarSign, ShoppingCart, TrendingUp, Package } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const COLORS = ["hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

const AdminStatistiques = () => {
  const { data: ordersData } = useQuery({
    queryKey: ["admin-stats-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, total, created_at");

      if (error) throw error;
      return data;
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ["admin-stats-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("product_name, quantity");

      if (error) throw error;
      return data;
    },
  });

  // Calculate stats
  const totalOrders = ordersData?.length || 0;
  const confirmedOrders = ordersData?.filter((o) => o.status === "confirmed").length || 0;
  const pendingOrders = ordersData?.filter((o) => o.status === "pending").length || 0;
  const cancelledOrders = ordersData?.filter((o) => o.status === "cancelled").length || 0;
  const totalRevenue = ordersData
    ?.filter((o) => o.status === "confirmed")
    .reduce((sum, o) => sum + Number(o.total), 0) || 0;
  const avgOrderValue = confirmedOrders > 0 ? totalRevenue / confirmedOrders : 0;

  // Order status distribution
  const statusData = [
    { name: "Confirmées", value: confirmedOrders },
    { name: "En attente", value: pendingOrders },
    { name: "Annulées", value: cancelledOrders },
  ];

  // Weekly orders trend
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayOrders = ordersData?.filter(
      (o) => format(new Date(o.created_at), "yyyy-MM-dd") === dateStr
    ) || [];
    
    return {
      date: format(date, "EEE", { locale: fr }),
      commandes: dayOrders.length,
      revenus: dayOrders
        .filter((o) => o.status === "confirmed")
        .reduce((sum, o) => sum + Number(o.total), 0),
    };
  });

  // Top products
  const productCounts: Record<string, number> = {};
  productsData?.forEach((item) => {
    productCounts[item.product_name] = (productCounts[item.product_name] || 0) + item.quantity;
  });
  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name: name.length > 20 ? name.substring(0, 20) + "..." : name, ventes: count }));

  const statCards = [
    {
      title: "Chiffre d'affaires",
      value: `${totalRevenue.toFixed(2)} TND`,
      icon: DollarSign,
      description: "Revenus confirmés",
    },
    {
      title: "Commandes totales",
      value: totalOrders,
      icon: ShoppingCart,
      description: `${pendingOrders} en attente`,
    },
    {
      title: "Panier moyen",
      value: `${avgOrderValue.toFixed(2)} TND`,
      icon: TrendingUp,
      description: "Par commande confirmée",
    },
    {
      title: "Produits vendus",
      value: productsData?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      icon: Package,
      description: "Articles totaux",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Statistiques</h1>
          <p className="text-muted-foreground">
            Analysez les performances de votre boutique
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly trend */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution hebdomadaire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="commandes"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Commandes"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenus"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      name="Revenus (TND)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Order status distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition des commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle>Produits les plus vendus</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Bar
                      dataKey="ventes"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">
                  Aucune donnée de vente disponible
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminStatistiques;
