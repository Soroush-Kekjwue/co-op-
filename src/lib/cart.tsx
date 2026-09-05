import type { Id } from "@/convex/_generated/dataModel";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Cart with guest support: localStorage-backed cart, merged into the server
 * on sign-in (server is source of truth), then cleared locally.
 */

export interface CartItem {
  productId: Id<"products">;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  add: (productId: Id<"products">, quantity?: number) => void;
  update: (productId: Id<"products">, quantity: number) => void;
  remove: (productId: Id<"products">) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "cooperative-cart-v1";

function readLocal(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (i) => i && typeof i.productId === "string" && i.quantity > 0,
        )
      : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readLocal());

  // Persist the cart across sessions (guest and signed-in alike).
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((productId: Id<"products">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(i.quantity + quantity, 99) }
            : i,
        );
      }
      return [...prev, { productId, quantity: Math.min(quantity, 99) }];
    });
  }, []);

  const update = useCallback(
    (productId: Id<"products">, quantity: number) => {
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((i) => i.productId !== productId)
          : prev.map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.min(quantity, 99) }
                : i,
            ),
      );
    },
    [],
  );

  const remove = useCallback((productId: Id<"products">) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      add,
      update,
      remove,
      clear,
    }),
    [items, add, update, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
