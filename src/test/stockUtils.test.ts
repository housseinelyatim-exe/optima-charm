import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateStock, getStockBadgeVariant, getStockStatus } from "@/lib/stockUtils";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("Stock Management Utils", () => {
  describe("updateStock", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should successfully update stock when sufficient quantity available", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { stock: 10 },
        error: null,
      });
      const mockUpdate = vi.fn().mockReturnThis();
      const mockUpdateEq = vi.fn().mockResolvedValue({ 
        data: null, 
        error: null 
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "products") {
          return {
            select: mockSelect,
            update: mockUpdate,
            delete: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
          } as unknown as ReturnType<typeof supabase.from>;
        }
        return {
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
        } as unknown as ReturnType<typeof supabase.from>;
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockUpdate.mockReturnValue({
        eq: mockUpdateEq,
      });

      const result = await updateStock("product-123", 3);

      expect(result.success).toBe(true);
      expect(result.newStock).toBe(7);
      expect(result.error).toBeUndefined();
    });

    it("should fail when trying to purchase more than available stock", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { stock: 2 },
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: mockSelect,
      } as unknown as ReturnType<typeof supabase.from>));

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await updateStock("product-123", 5);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Insufficient stock available");
    });

    it("should fail when product is not found", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Product not found" },
      });

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: mockSelect,
      } as unknown as ReturnType<typeof supabase.from>));

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await updateStock("invalid-id", 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Product not found");
    });

    it("should allow stock to reach exactly zero", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { stock: 5 },
        error: null,
      });
      const mockUpdate = vi.fn().mockReturnThis();
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: mockSelect,
        update: mockUpdate,
      } as unknown as ReturnType<typeof supabase.from>));

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockUpdate.mockReturnValue({
        eq: mockUpdateEq,
      });

      const result = await updateStock("product-123", 5);

      expect(result.success).toBe(true);
      expect(result.newStock).toBe(0);
    });
  });

  describe("getStockBadgeVariant", () => {
    it("should return destructive variant when stock is 0", () => {
      expect(getStockBadgeVariant(0)).toBe("destructive");
    });

    it("should return outline variant when stock is low (1-5)", () => {
      expect(getStockBadgeVariant(1)).toBe("outline");
      expect(getStockBadgeVariant(3)).toBe("outline");
      expect(getStockBadgeVariant(5)).toBe("outline");
    });

    it("should return secondary variant when stock is sufficient (>5)", () => {
      expect(getStockBadgeVariant(6)).toBe("secondary");
      expect(getStockBadgeVariant(10)).toBe("secondary");
      expect(getStockBadgeVariant(100)).toBe("secondary");
    });
  });

  describe("getStockStatus", () => {
    it("should return out of stock message when stock is 0", () => {
      expect(getStockStatus(0)).toBe("Rupture de stock");
    });

    it("should return in stock message when stock is greater than 0", () => {
      expect(getStockStatus(1)).toBe("En stock");
      expect(getStockStatus(5)).toBe("En stock");
      expect(getStockStatus(100)).toBe("En stock");
    });
  });
});
