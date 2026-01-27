# Stock Management System Documentation

## Overview

The Optima Charm e-commerce platform implements an automated stock management system that ensures product inventory remains accurate across purchases and order cancellations. This document describes the implementation and its components.

## Architecture

The stock management system operates on three levels:

### 1. Database Level (Primary) - Supabase Triggers

The core stock management logic resides in the database layer using PostgreSQL triggers:

**File:** `/supabase/migrations/20260126210924_rebuild-stock-management-system.sql`

#### Key Components:

1. **Stock Reduction Trigger**
   - **Trigger:** `reduce_stock_on_order`
   - **Function:** `reduce_product_stock()`
   - **Fires:** AFTER INSERT on `order_items` table
   - **Action:** Automatically reduces product stock when order items are created
   - **Edge Cases:**
     - Skips reduction if `product_id` is NULL (custom/deleted products)
     - Logs warnings if stock becomes negative
     - Updates `updated_at` timestamp

2. **Stock Restoration Trigger**
   - **Trigger:** `restore_stock_on_cancel`
   - **Function:** `restore_product_stock_on_cancel()`
   - **Fires:** AFTER UPDATE on `orders` table (when status changes to 'cancelled')
   - **Action:** Restores product stock for all items in the cancelled order
   - **Logging:** Tracks restoration count and stock changes

#### RPC Functions:

1. **`create_order()`**
   - Creates a new order with customer details
   - Bypasses Row Level Security (RLS) for guest checkout
   - Returns order ID and order number

2. **`create_order_item()`**
   - Creates order items linked to orders
   - **Automatically triggers stock reduction** via `reduce_stock_on_order` trigger
   - Logs stock changes for debugging

### 2. Application Level - TypeScript Utilities

**File:** `/src/lib/stockUtils.ts`

Provides defensive programming utilities for stock management:

#### Functions:

```typescript
// Manual stock update (defensive layer)
updateStock(productId: string, purchasedQty: number): Promise<{
  success: boolean;
  newStock?: number;
  error?: string;
}>

// Get badge variant based on stock level
getStockBadgeVariant(stock: number): "default" | "secondary" | "destructive" | "outline"

// Get human-readable stock status
getStockStatus(stock: number): string
```

#### Stock Level Indicators:

- **0 units:** "Rupture de stock" (Out of stock) - Destructive badge
- **1-5 units:** "Stock faible (X)" (Low stock) - Outline badge (warning)
- **6+ units:** "X en stock" (In stock) - Secondary badge

### 3. Frontend Level - React Query Cache Invalidation

**File:** `/src/pages/Commander.tsx`

After order submission, the checkout page invalidates all product-related queries to ensure the admin dashboard displays updated stock:

```typescript
// Lines 194-199
queryClient.invalidateQueries({ queryKey: ["products"] });
queryClient.invalidateQueries({ queryKey: ["product"] });
queryClient.invalidateQueries({ queryKey: ["featured-products"] });
queryClient.invalidateQueries({ queryKey: ["latest-products"] });
queryClient.invalidateQueries({ queryKey: ["admin-products"] });
queryClient.invalidateQueries({ queryKey: ["products-by-brand"] });
```

**File:** `/src/pages/admin/AdminProduits.tsx`

The admin products page automatically displays updated stock levels with color-coded badges:

```typescript
// Enhanced stock display with utility functions
<Badge variant={getStockBadgeVariant(product.stock)}>
  {getStockStatus(product.stock)}
</Badge>
```

## Purchase Flow

### Step-by-Step Process:

1. **Customer adds items to cart** (`/src/hooks/useCart.tsx`)
   - Items stored in localStorage
   - No stock validation at this stage

2. **Customer proceeds to checkout** (`/src/pages/Commander.tsx`)
   - Validates customer information
   - Calculates total with delivery and discount

3. **Order creation** (Line 149-164)
   ```typescript
   await supabase.rpc('create_order', {
     p_customer_name, p_customer_phone, p_customer_address,
     p_delivery_method, p_notes, p_total,
     p_coupon_code, p_discount_amount
   })
   ```

4. **Order items creation** (Lines 167-181)
   ```typescript
   for (const item of items) {
     await supabase.rpc('create_order_item', {
       p_order_id: order.id,
       p_product_id: item.id,
       p_product_name: item.name,
       p_quantity: item.quantity,
       p_price_at_purchase: item.price,
     });
   }
   ```
   - **Database trigger automatically reduces stock here**

5. **Cache invalidation** (Lines 194-199)
   - Invalidates all product queries
   - Ensures fresh data on next admin dashboard load

6. **Cart cleared and redirect** (Lines 191, 201)
   - User redirected to confirmation page
   - Cart is cleared

## Admin Dashboard Updates

The admin dashboard (`/src/pages/admin/AdminProduits.tsx`) displays real-time stock levels:

- **Query Key:** `["admin-products"]`
- **Data Fetching:** Automatic via React Query
- **Update Trigger:** Cache invalidation after purchases
- **Display:** Color-coded badges based on stock level

### Stock Badge Colors:

| Stock Level | Badge Variant | Color | Status Text |
|-------------|---------------|-------|-------------|
| 0 | destructive | Red | "Rupture de stock" |
| 1-5 | outline | Orange/Yellow | "Stock faible (X)" |
| 6+ | secondary | Gray | "X en stock" |

## Testing

### Test Files:

1. **`/src/test/stockUtils.test.ts`** - Unit tests for utility functions
   - Stock update logic validation
   - Badge variant selection
   - Stock status text generation
   - Edge cases (zero stock, negative attempts, etc.)

2. **`/src/test/stockIntegration.test.ts`** - Integration tests
   - Order creation flow
   - Multiple products in single order
   - Stock restoration on cancellation
   - Cache invalidation verification
   - Concurrent purchase handling

### Running Tests:

```bash
npm test              # Run all tests once
npm run test:watch    # Run tests in watch mode
```

## Important Notes

### Database-First Approach

⚠️ **The stock management is primarily handled by database triggers.** The TypeScript `updateStock()` function is provided as a defensive utility but is **not used in the main purchase flow**. The database automatically handles stock reduction when `create_order_item()` RPC is called.

### Race Conditions

PostgreSQL transactions and triggers ensure atomic stock updates, preventing race conditions when multiple customers purchase the same product simultaneously.

### Stock Restoration

When an order is cancelled, stock is automatically restored via the `restore_stock_on_cancel` trigger. This applies to all products in the order.

### Negative Stock

The system logs warnings but allows negative stock in the database. This is intentional to prevent order failures while alerting admins to inventory issues that need attention.

### Guest Checkout

RPC functions bypass Row Level Security (RLS) to allow guest users (not authenticated) to place orders. Stock reduction still works correctly for guest orders.

## Maintenance

### Database Logs

Check Supabase Dashboard > Database > Logs to view:
- Stock reduction confirmations
- Stock restoration events
- Warnings for negative stock
- Product not found errors

### Monitoring Stock Levels

Admins can monitor stock via:
1. Admin Dashboard (`/admin/produits`)
2. Supabase Database > Tables > `products` table
3. Database logs for real-time updates

### Manual Stock Adjustments

To manually adjust stock:
1. Navigate to Admin Dashboard
2. Edit product (`/admin/produits/{id}`)
3. Update stock field in the form
4. Save changes

## Future Enhancements

Potential improvements to consider:

1. **Stock Reservations:** Hold stock during checkout process
2. **Low Stock Alerts:** Email notifications when stock is low
3. **Stock History:** Track all stock changes with timestamps
4. **Restock Management:** Automated restock ordering system
5. **Multi-location Inventory:** Support for multiple warehouses
