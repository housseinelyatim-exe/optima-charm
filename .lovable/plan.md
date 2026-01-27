
# Fix: Automatic Stock Reduction on Purchase

## Problem Identified

When a customer makes a purchase, the product stock is not being updated. Investigation revealed:

1. **The trigger is missing**: The `reduce_stock_on_order` trigger that should reduce stock when order items are created does not exist
2. **The functions are missing**: The `reduce_product_stock()` and `restore_product_stock_on_cancel()` functions were never created
3. **Migration was not applied**: The file `20260126210924_rebuild-stock-management-system.sql` exists in the codebase but the changes were never applied to the database

## Solution

Apply a new database migration to create:

1. **`reduce_product_stock()`** - A trigger function that automatically reduces product stock when an order item is inserted
2. **`reduce_stock_on_order`** - A trigger that fires AFTER INSERT on `order_items` table
3. **`restore_product_stock_on_cancel()`** - A trigger function that restores stock when an order is cancelled
4. **`restore_stock_on_cancel`** - A trigger that fires AFTER UPDATE on `orders` when status changes to 'cancelled'

## How It Will Work

```text
Customer places order
        │
        ▼
Commander.tsx calls supabase.rpc('create_order_item', {...})
        │
        ▼
create_order_item() function inserts row into order_items table
        │
        ▼
reduce_stock_on_order TRIGGER fires automatically
        │
        ▼
reduce_product_stock() function runs:
  - Finds the product by product_id
  - Reduces stock by quantity ordered
  - Updates the updated_at timestamp
  - Logs the change
        │
        ▼
Stock is now updated in the products table
```

## Technical Details

### Database Changes

Create two trigger functions and their associated triggers:

```sql
-- Function 1: Reduce stock on order item insert
CREATE FUNCTION reduce_product_stock() RETURNS TRIGGER
  - Subtracts NEW.quantity from products.stock
  - Updates products.updated_at
  - Handles NULL product_id (for deleted products)

-- Trigger 1: Fire after order_items insert
CREATE TRIGGER reduce_stock_on_order
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION reduce_product_stock()

-- Function 2: Restore stock on order cancellation  
CREATE FUNCTION restore_product_stock_on_cancel() RETURNS TRIGGER
  - Loops through all order_items for the cancelled order
  - Adds quantity back to products.stock
  - Updates products.updated_at

-- Trigger 2: Fire when order status changes to 'cancelled'
CREATE TRIGGER restore_stock_on_cancel
  AFTER UPDATE ON orders
  WHEN (OLD.status != 'cancelled' AND NEW.status = 'cancelled')
  EXECUTE FUNCTION restore_product_stock_on_cancel()
```

### No Code Changes Required

The existing `Commander.tsx` already:
- Calls `create_order_item()` RPC for each item
- Invalidates product queries after order completion

Once the triggers are in place, stock will update automatically.

### Stock Display

The admin dashboard already has stock display with color-coded badges:
- **Red (destructive)**: Out of stock (0 units)
- **Orange (outline)**: Low stock (1-5 units)
- **Gray (secondary)**: In stock (6+ units)

## Benefits

- **Automatic**: No manual stock updates needed
- **Atomic**: Stock changes happen in the same transaction as order creation
- **Reversible**: If an order is cancelled, stock is automatically restored
- **Guest-friendly**: Works for both logged-in users and guest checkout
