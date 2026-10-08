"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

export interface CartItem {
  productId: string;
  title: string;
  slug: string;
  price: number;
  originalPrice?: number | null;
  thumbnailUrl?: string | null;
  quantity: number;
  minQuantity: number;
  maxQuantity?: number | null;
  stockCount: number;
  fulfillmentType: string;
  categorySlug?: string;
  requiresLink?: boolean;
  targetLink?: string;
  selected: boolean;
}

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (item: Omit<CartItem, "selected"> & { selected?: boolean }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, deltaOrQuantity: number, isAbsolute?: boolean) => void;
  updateItemLink: (productId: string, link: string) => void;
  toggleSelectItem: (productId: string) => void;
  selectAll: (select: boolean) => void;
  clearCart: () => void;
  itemCount: number;
  selectedItems: CartItem[];
  selectedCount: number;
  selectedSubtotal: number;
  isAllSelected: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "daitruong_cart_items";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Load from LocalStorage once on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
    setIsMounted(true);
  }, []);

  // Save to LocalStorage whenever items change after mount
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore quota errors
    }
  }, [items, isMounted]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const addToCart = (newItem: Omit<CartItem, "selected"> & { selected?: boolean }) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.productId === newItem.productId);
      const minQty = Math.max(1, newItem.minQuantity || 1);
      const initialQty = Math.max(minQty, newItem.quantity || minQty);

      if (existingIndex > -1) {
        // Item already in cart: increase quantity within bounds
        const current = prevItems[existingIndex];
        const maxQty = current.maxQuantity || (current.fulfillmentType === "LOCAL_STOCK" ? current.stockCount : 100000);
        const nextQty = Math.min(maxQty, current.quantity + (newItem.quantity || 1));

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...current,
          quantity: nextQty,
          selected: true, // Auto-select when modified
          targetLink: newItem.targetLink || current.targetLink,
        };
        return updated;
      }

      // New item added
      return [
        ...prevItems,
        {
          ...newItem,
          quantity: initialQty,
          selected: newItem.selected !== undefined ? newItem.selected : true,
          targetLink: newItem.targetLink || "",
        },
      ];
    });

    // Auto open drawer on desktop
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, val: number, isAbsolute = false) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        const minQty = Math.max(1, item.minQuantity || 1);
        const maxQty = item.maxQuantity || (item.fulfillmentType === "LOCAL_STOCK" ? Math.max(minQty, item.stockCount) : 100000);

        let nextQty = isAbsolute ? val : item.quantity + val;
        if (nextQty < minQty) nextQty = minQty;
        if (nextQty > maxQty) nextQty = maxQty;

        return {
          ...item,
          quantity: nextQty,
        };
      })
    );
  };

  const updateItemLink = (productId: string, targetLink: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        return {
          ...item,
          targetLink,
        };
      })
    );
  };

  const toggleSelectItem = (productId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        return {
          ...item,
          selected: !item.selected,
        };
      })
    );
  };

  const selectAll = (select: boolean) => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        selected: select,
      }))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const selectedItems = useMemo(() => {
    return items.filter((item) => item.selected);
  }, [items]);

  const selectedCount = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [selectedItems]);

  const selectedSubtotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [selectedItems]);

  const isAllSelected = useMemo(() => {
    return items.length > 0 && items.every((i) => i.selected);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemLink,
        toggleSelectItem,
        selectAll,
        clearCart,
        itemCount,
        selectedItems,
        selectedCount,
        selectedSubtotal,
        isAllSelected,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
