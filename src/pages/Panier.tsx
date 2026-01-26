import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AppliedCoupon {
  code: string;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
}

const Panier = () => {
  const { items, updateQuantity, removeItem, total } = useCart();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsValidating(true);
    try {
      const { data, error } = await supabase.rpc("validate_coupon", {
        coupon_code: couponCode.trim(),
        order_total: total,
      });

      if (error) throw error;

      const result = data?.[0];
      if (result?.valid) {
        setAppliedCoupon({
          code: couponCode.toUpperCase(),
          discount_type: result.discount_type,
          discount_value: result.discount_value,
          discount_amount: result.discount_amount,
        });
        toast({
          title: "Code promo appliqué !",
          description: `Réduction de ${result.discount_amount.toFixed(2)} TND`,
        });
        setCouponCode("");
      } else {
        toast({
          title: "Code invalide",
          description: result?.message || "Ce code promo n'est pas valide",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Coupon validation error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de valider le code promo",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast({ title: "Code promo retiré" });
  };

  const finalTotal = appliedCoupon 
    ? Math.max(0, total - appliedCoupon.discount_amount)
    : total;

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Votre panier est vide</h1>
          <p className="text-muted-foreground mb-8">
            Découvrez notre collection et ajoutez des produits à votre panier.
          </p>
          <Link to="/boutique">
            <Button size="lg">Voir la boutique</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-8">
          Votre Panier
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-3 md:gap-4">
                    {/* Image - smaller on mobile */}
                    <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-md overflow-hidden bg-secondary">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    
                    {/* Content - full width on mobile, flex on desktop */}
                    <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm md:text-base line-clamp-2 mb-1">
                          {item.name}
                        </h3>
                        <p className="text-primary font-semibold text-sm md:text-base">
                          {item.price.toFixed(2)} TND
                        </p>
                      </div>
                      
                      {/* Price - move to top right on mobile */}
                      <div className="md:text-right order-first md:order-last">
                        <p className="font-semibold text-sm md:text-base">
                          {(item.price * item.quantity).toFixed(2)} TND
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quantity controls - full width on mobile */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t md:border-0 md:pt-0 md:ml-24">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-10 text-center font-medium text-sm">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 ml-auto text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-lg">Résumé</h2>
                
                {/* Coupon input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Code promo
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <div>
                        <span className="font-mono font-bold text-green-700 dark:text-green-400">
                          {appliedCoupon.code}
                        </span>
                        <p className="text-xs text-green-600 dark:text-green-500">
                          -{appliedCoupon.discount_type === "percentage" 
                            ? `${appliedCoupon.discount_value}%` 
                            : `${appliedCoupon.discount_value} TND`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-700 hover:text-red-600"
                        onClick={removeCoupon}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Entrez votre code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                        className="font-mono"
                      />
                      <Button 
                        variant="outline" 
                        onClick={handleApplyCoupon}
                        disabled={isValidating || !couponCode.trim()}
                      >
                        {isValidating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Appliquer"
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{total.toFixed(2)} TND</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Réduction</span>
                      <span>-{appliedCoupon.discount_amount.toFixed(2)} TND</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Livraison</span>
                    <span className="text-success">À calculer</span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{finalTotal.toFixed(2)} TND</span>
                  </div>
                </div>
                <Link 
                  to="/commander" 
                  state={{ coupon: appliedCoupon }}
                  className="block"
                >
                  <Button size="lg" className="w-full gap-2">
                    Commander
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/boutique" className="block">
                  <Button variant="outline" className="w-full">
                    Continuer mes achats
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Panier;