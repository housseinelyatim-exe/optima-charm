import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Truck, Store, ArrowLeft, Loader2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

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
  const { items, total, clearCart } = useCart();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      customer_address: "",
      delivery_method: "pickup",
      notes: "",
    },
  });

  const deliveryMethod = form.watch("delivery_method");

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
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          customer_address: data.delivery_method === "delivery" ? data.customer_address : null,
          delivery_method: data.delivery_method,
          notes: data.notes || null,
          total: total,
        }] as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price_at_purchase: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart and redirect
      clearCart();
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
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
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
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{total.toFixed(2)} TND</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Livraison</span>
                    <span>
                      {deliveryMethod === "pickup" ? "Gratuit" : "À calculer"}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>{total.toFixed(2)} TND</span>
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
