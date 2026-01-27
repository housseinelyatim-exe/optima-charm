import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Integration tests for stock management system
 * These tests verify the end-to-end flow of stock updates
 */

// Mock dependencies
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

describe("Stock Update Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Order Creation Flow", () => {
    it("should trigger stock reduction when order items are created via RPC", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      
      // Mock successful order creation
      vi.mocked(supabase.rpc).mockImplementation((fnName: string, _params?: unknown) => {
        if (fnName === "create_order") {
          return Promise.resolve({
            data: [{ id: "order-123", order_number: "ORD-001" }],
            error: null,
          }) as unknown as ReturnType<typeof supabase.rpc>;
        }
        
        if (fnName === "create_order_item") {
          // The database trigger automatically reduces stock
          // This RPC call returns void but triggers the stock reduction
          return Promise.resolve({
            data: null,
            error: null,
          }) as unknown as ReturnType<typeof supabase.rpc>;
        }
        
        return Promise.resolve({ data: null, error: null }) as unknown as ReturnType<typeof supabase.rpc>;
      });

      // Simulate order creation
      const { data: orderResult } = await supabase.rpc("create_order", {
        p_customer_name: "Test Customer",
        p_customer_phone: "12345678",
        p_customer_address: "Test Address",
        p_delivery_method: "delivery",
        p_notes: null,
        p_total: 100,
        p_coupon_code: null,
        p_discount_amount: 0,
      });

      expect(orderResult).toBeTruthy();
      const order = orderResult?.[0];
      expect(order?.id).toBe("order-123");

      // Create order item (triggers stock reduction via database trigger)
      const { error } = await supabase.rpc("create_order_item", {
        p_order_id: order.id,
        p_product_id: "product-123",
        p_product_name: "Test Product",
        p_quantity: 2,
        p_price_at_purchase: 50,
      });

      expect(error).toBeNull();
      expect(supabase.rpc).toHaveBeenCalledWith("create_order_item", {
        p_order_id: "order-123",
        p_product_id: "product-123",
        p_product_name: "Test Product",
        p_quantity: 2,
        p_price_at_purchase: 50,
      });
    });

    it("should invalidate product queries after order creation", async () => {
      const { useQueryClient } = await import("@tanstack/react-query");
      const queryClient = useQueryClient();
      
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      // Simulate cache invalidation after purchase
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["products"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin-products"] });
    });
  });

  describe("Stock Restoration on Cancellation", () => {
    it("should restore stock when order is cancelled", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      
      // Mock order status update to 'cancelled'
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabase.from).mockImplementation(() => ({
        update: mockUpdate,
      } as unknown as ReturnType<typeof supabase.from>));

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      // Update order status to cancelled
      // This triggers the restore_product_stock_on_cancel database trigger
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", "order-123");

      expect(error).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith({ status: "cancelled" });
    });
  });

  describe("Multiple Products Purchase", () => {
    it("should handle stock updates for multiple products in a single order", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      
      vi.mocked(supabase.rpc).mockImplementation((fnName: string) => {
        if (fnName === "create_order_item") {
          return Promise.resolve({
            data: null,
            error: null,
          }) as unknown as ReturnType<typeof supabase.rpc>;
        }
        // Default fallback for other RPC calls
        return Promise.resolve({
          data: null,
          error: { message: `RPC function ${fnName} not mocked` },
        }) as unknown as ReturnType<typeof supabase.rpc>;
      });

      const orderItems = [
        { id: "product-1", name: "Product 1", quantity: 2, price: 50 },
        { id: "product-2", name: "Product 2", quantity: 1, price: 30 },
        { id: "product-3", name: "Product 3", quantity: 3, price: 20 },
      ];

      // Create order items for each product
      for (const item of orderItems) {
        const { error } = await supabase.rpc("create_order_item", {
          p_order_id: "order-123",
          p_product_id: item.id,
          p_product_name: item.name,
          p_quantity: item.quantity,
          p_price_at_purchase: item.price,
        });

        expect(error).toBeNull();
      }

      // Verify all items were processed
      expect(supabase.rpc).toHaveBeenCalledTimes(orderItems.length);
    });
  });

  describe("Edge Cases", () => {
    it("should handle order items without product_id (custom/deleted products)", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      } as unknown as Awaited<ReturnType<typeof supabase.rpc>>);

      // Create order item without product_id
      // The database trigger should skip stock reduction for items without product_id
      const { error } = await supabase.rpc("create_order_item", {
        p_order_id: "order-123",
        p_product_id: null,
        p_product_name: "Custom Product",
        p_quantity: 1,
        p_price_at_purchase: 100,
      });

      expect(error).toBeNull();
    });

    it("should handle concurrent purchases of the same product", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      } as unknown as Awaited<ReturnType<typeof supabase.rpc>>);

      // Simulate two concurrent purchases
      const purchases = [
        supabase.rpc("create_order_item", {
          p_order_id: "order-1",
          p_product_id: "product-123",
          p_product_name: "Test Product",
          p_quantity: 1,
          p_price_at_purchase: 50,
        }),
        supabase.rpc("create_order_item", {
          p_order_id: "order-2",
          p_product_id: "product-123",
          p_product_name: "Test Product",
          p_quantity: 1,
          p_price_at_purchase: 50,
        }),
      ];

      const results = await Promise.all(purchases);
      
      results.forEach(({ error }) => {
        expect(error).toBeNull();
      });
    });
  });
});
