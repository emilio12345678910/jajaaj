import React, { createContext, useState, useContext } from 'react';

// Exportamos el contexto con su nombre para que los imports con llaves {} funcionen
export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // ==========================================
  // 1. ESTADOS DE LA SESIÓN (Los que hacían funcionar el QR y el Home)
  // ==========================================
  const [pin, setPin] = useState(null);
  const [tableId, setTableId] = useState(null);
  const [restaurantData, setRestaurantData] = useState({ restaurantId: 1, name: 'Restaurante' });

  // ==========================================
  // 2. ESTADOS DEL CARRITO (Con la nueva función de exclusiones)
  // ==========================================
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product, quantity = 1, excludedIds = [], excludedNames = [], notes = '') => {
    setCartItems((prevItems) => {
      const newItem = {
        ...product,
        cartItemId: Date.now().toString() + Math.random().toString(), // ID único de variación
        quantity,
        ingredientes_excluidos: excludedIds,
        ingredientes_excluidos_nombres: excludedNames,
        notas_adicionales: notes
      };
      return [...prevItems, newItem];
    });
  };

  const removeFromCart = (cartItemId) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId, change) => {
    setCartItems((prev) => prev.map((item) => {
      if (item.cartItemId === cartItemId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }));
  };

  const clearCart = () => setCartItems([]);

  // Función para el botón de "Salir" del HomeScreen
  const exitSession = () => {
    setPin(null);
    setTableId(null);
    clearCart();
  };

  // Cálculos dinámicos para que el MenuScreen no truene
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  // Soporta tanto .precio (del front) como .precio_venta (del back) por si acaso
  const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.precio || item.precio_venta || 0) * item.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      // Exportamos las herramientas del carrito
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, total,
      
      // Exportamos las herramientas de sesión (¡ESTO REPARA EL ERROR DEL QR!)
      pin, setPin, 
      tableId, setTableId, 
      restaurantData, setRestaurantData, 
      exitSession
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);