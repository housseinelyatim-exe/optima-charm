import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/hooks/useCart";
import Index from "./pages/Index";
import Categorie from "./pages/Categorie";
import Boutique from "./pages/Boutique";
import ProductDetail from "./pages/ProductDetail";
import Panier from "./pages/Panier";
import Commander from "./pages/Commander";
import Confirmation from "./pages/Confirmation";
import Contact from "./pages/Contact";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProduits from "./pages/admin/AdminProduits";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminCommandes from "./pages/admin/AdminCommandes";
import AdminStatistiques from "./pages/admin/AdminStatistiques";
import AdminParametres from "./pages/admin/AdminParametres";
import AdminInstagram from "./pages/admin/AdminInstagram";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCoupons from "./pages/admin/AdminCoupons";
import Marques from "./pages/Marques";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/categorie" element={<Categorie />} />
            <Route path="/boutique" element={<Boutique />} />
            <Route path="/produit/:slug" element={<ProductDetail />} />
            <Route path="/panier" element={<Panier />} />
            <Route path="/commander" element={<Commander />} />
            <Route path="/confirmation/:orderNumber" element={<Confirmation />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/marques/:slug" element={<Marques />} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/produits" element={<AdminProduits />} />
            <Route path="/admin/produits/nouveau" element={<AdminProductForm />} />
            <Route path="/admin/produits/:id" element={<AdminProductForm />} />
            <Route path="/admin/commandes" element={<AdminCommandes />} />
            <Route path="/admin/statistiques" element={<AdminStatistiques />} />
            <Route path="/admin/parametres" element={<AdminParametres />} />
            <Route path="/admin/instagram" element={<AdminInstagram />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
