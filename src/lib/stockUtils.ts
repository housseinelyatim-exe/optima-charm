import { supabase } from "@/integrations/supabase/client";

/**
 * Updates product stock in the database
 * Note: The database has triggers that automatically handle stock reduction
 * when order items are created. This function provides a programmatic way
 * to update stock when needed outside of the order flow.
 * 
 * @param productId - The ID of the product to update
 * @param purchasedQty - The quantity purchased (will be subtracted from stock)
 * @returns Object with success status and optional error message
 */
export const updateStock = async (
  productId: string,
  purchasedQty: number
): Promise<{ success: boolean; newStock?: number; error?: string }> => {
  try {
    // Fetch current stock
    const { data, error: fetchError } = await supabase
      .from("products")
      .select("stock")
      .eq("id", productId)
      .single();

    if (fetchError || !data) {
      return {
        success: false,
        error: fetchError?.message || "Product not found",
      };
    }

    const currentStock = data.stock;
    const newStock = currentStock - purchasedQty;

    // Prevent negative stock
    if (newStock < 0) {
      return {
        success: false,
        error: "Insufficient stock available",
      };
    }

    // Update stock
    const { error: updateError } = await supabase
      .from("products")
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", productId);

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      };
    }

    return {
      success: true,
      newStock,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Get stock badge variant based on stock level
 * @param stock - Current stock level
 * @returns Badge variant for UI display
 */
export const getStockBadgeVariant = (
  stock: number
): "default" | "secondary" | "destructive" | "outline" => {
  if (stock === 0) return "destructive";
  if (stock <= 5) return "outline"; // Low stock warning
  return "secondary";
};

/**
 * Get stock status text
 * @param stock - Current stock level
 * @returns Human-readable stock status
 */
export const getStockStatus = (stock: number): string => {
  if (stock === 0) return "Rupture de stock";
  if (stock <= 5) return `Stock faible (${stock})`;
  return `${stock} en stock`;
};
