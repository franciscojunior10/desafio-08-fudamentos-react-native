import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsInCart = await AsyncStorage.getItem('@GoMarketplace:cart');

      if (productsInCart) {
        setProducts(JSON.parse(productsInCart));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async (id: string) => {
      const productIndex = products.findIndex(product => product.id === id);

      const product = products[productIndex];

      const updatedProduct = {
        ...product,
        quantity: product.quantity + 1,
      };

      const updatedProducts = products;

      updatedProducts[productIndex] = updatedProduct;

      setProducts([...updatedProducts]);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async (id: string) => {
      const productIndex = products.findIndex(product => product.id === id);

      const product = products[productIndex];

      const updatedProducts = [...products];

      if (!product.quantity) {
        return;
      }

      if (product.quantity > 1) {
        product.quantity -= 1;

        updatedProducts[productIndex] = product;
      } else {
        updatedProducts.splice(productIndex, 1);
      }

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const productIndex = products.find(
        productItem => productItem.id === product.id,
      );

      if (productIndex) {
        increment(product.id);
        return;
      }

      const updatedProducts = products;

      updatedProducts.push({ ...product, quantity: 1 });

      setProducts([...updatedProducts]);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(updatedProducts),
      );
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
