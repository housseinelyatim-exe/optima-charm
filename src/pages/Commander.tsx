import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Truck, Store, ArrowLeft, Loader2, Tag, X } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";

interface AppliedCoupon {
  code: string;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
}

const checkoutSchema = z.object({
  customer_name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  customer_phone: z
    .string()
    .min(8, "Numéro de téléphone invalide")
    .max(20, "Numéro de téléphone invalide")
    .regex(/^[+]?[0-9\s-]+$/, "Format de téléphone invalide"),
  customer_address: z.string().optional(),
  delivery_method: z.enum(["pickup", "delivery"]),
  notes: z.string().max(500, "Les notes ne peuvent pas dépasser 500 caractères").optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const Commander = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { items, total, clearCart } = useCart();
  const { toast } = useToast();
  const { data: settings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get coupon from location state (passed from Panier)
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    location.state?.coupon || null
  );
  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const deliveryPrice = parseFloat(settings?.delivery_price || "7") || 7;

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      customer_address: "",
      delivery_method: "delivery",
      notes: "",
    },
  });

  const deliveryMethod = form.watch("delivery_method");

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

  const discountAmount = appliedCoupon?.discount_amount || 0;
  const shippingCost = deliveryMethod === "delivery" ? deliveryPrice : 0;
  const finalTotal = Math.max(0, total - discountAmount + shippingCost);

  const onSubmit = async (data: CheckoutForm) => {
    if (items.length === 0) {
      toast({
        title: "Panier vide",
        description: "Ajoutez des produits à votre panier avant de commander",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order using RPC function (bypasses RLS for guest checkout)
      const { data: orderResult, error: orderError } = await supabase
        .rpc('create_order', {
          p_customer_name: data.customer_name,
          p_customer_phone: data.customer_phone,
          p_customer_address: data.delivery_method === "delivery" ? data.customer_address : null,
          p_delivery_method: data.delivery_method,
          p_notes: data.notes || null,
          p_total: finalTotal,
          p_coupon_code: appliedCoupon?.code || null,
          p_discount_amount: discountAmount,
        });

      if (orderError) throw orderError;
      
      const order = orderResult?.[0];
      if (!order) throw new Error("Failed to create order");

      // Create order items using RPC function
      for (const item of items) {
        const { error: itemError } = await supabase
          .rpc('create_order_item', {
            p_order_id: order.id,
            p_product_id: item.id || null,
            p_product_name: item.name,
            p_quantity: item.quantity,
            p_price_at_purchase: item.price,
          });
        
        if (itemError) {
          console.error("Order item error:", itemError);
          // Continue with other items even if one fails
        }
      }

      // Increment coupon usage if applied
      if (appliedCoupon) {
        await supabase.rpc("increment_coupon_usage", {
          coupon_code: appliedCoupon.code,
        });
      }

      // Clear cart and invalidate product queries
      clearCart();
      
      // Invalidate product-related queries to refresh stock across the app
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      
      navigate(`/confirmation/${order.order_number}`);
    } catch (error) {
      console.error("Order error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la commande. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Panier vide</h1>
          <p className="text-muted-foreground mb-8">
            Ajoutez des produits à votre panier avant de commander.
          </p>
          <Button onClick={() => navigate("/boutique")}>Voir la boutique</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/panier")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au panier
        </Button>

        <h1 className="text-3xl md:text-4xl font-display font-bold mb-8">
          Passer Commande
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout form */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h2 className="font-semibold text-lg">Vos Informations</h2>

                    <FormField
                      control={form.control}
                      name="customer_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom complet *</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre nom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro de téléphone *</FormLabel>
                          <FormControl>
                            <Input placeholder="+216 XX XXX XXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h2 className="font-semibold text-lg">Mode de Livraison</h2>

                    <FormField
                      control={form.control}
                      name="delivery_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="space-y-3"
                            >
                              <label
                                htmlFor="pickup"
                                className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                                  field.value === "pickup"
                                    ? "border-primary bg-primary/5"
                                    : "hover:bg-secondary/50"
                                }`}
                              >
                                <RadioGroupItem value="pickup" id="pickup" />
                                <Store className="h-5 w-5 text-primary mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-medium">Retrait en boutique</p>
                                  <p className="text-sm text-muted-foreground">
                                    Gratuit - Le Krib, Siliana
                                  </p>
                                </div>
                              </label>

                              <label
                                htmlFor="delivery"
                                className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                                  field.value === "delivery"
                                    ? "border-primary bg-primary/5"
                                    : "hover:bg-secondary/50"
                                }`}
                              >
                                <RadioGroupItem value="delivery" id="delivery" />
                                <Truck className="h-5 w-5 text-primary mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-medium">Livraison à domicile</p>
                                  <p className="text-sm text-muted-foreground">
                                    Frais à calculer selon votre adresse
                                  </p>
                                </div>
                              </label>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {deliveryMethod === "delivery" && (
                      <FormField
                        control={form.control}
                        name="customer_address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresse de livraison *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Votre adresse complète"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h2 className="font-semibold text-lg">Notes (optionnel)</h2>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Instructions spéciales, questions..."
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
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    "Confirmer la commande"
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-lg">Votre Commande</h2>
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 text-sm">
                      <div className="w-12 h-12 rounded bg-secondary flex-shrink-0">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="h-full w-full object-cover rounded"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{item.name}</p>
                        <p className="text-muted-foreground">
                          {item.quantity} x {item.price.toFixed(2)} TND
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon section */}
                <div className="border-t pt-4 space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Code promo
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <div>
                        <span className="font-mono font-bold text-sm text-green-700 dark:text-green-400">
                          {appliedCoupon.code}
                        </span>
                        <p className="text-xs text-green-600 dark:text-green-500">
                          -{appliedCoupon.discount_amount.toFixed(2)} TND
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-green-700 hover:text-red-600"
                        onClick={removeCoupon}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())}
                        className="font-mono text-sm"
                      />
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={handleApplyCoupon}
                        disabled={isValidating || !couponCode.trim()}
                      >
                        {isValidating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "OK"
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{total.toFixed(2)} TND</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Réduction</span>
                      <span>-{discountAmount.toFixed(2)} TND</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Livraison</span>
                    <span>
                      {deliveryMethod === "pickup" ? "Gratuit" : `${deliveryPrice.toFixed(2)} TND`}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>{finalTotal.toFixed(2)} TND</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Commander;