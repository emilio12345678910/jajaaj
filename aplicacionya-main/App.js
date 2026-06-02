// Archivo: App.js (Modificado)

import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { NavigationContainer } from '@react-navigation/native';
// Importamos el proveedor del carrito que acabamos de crear
import { CartProvider } from './src/context/CartContext'; 

export default function App() {
  return (
    <NavigationContainer>
      {/* ¡Envolvemos todo el navegador en el proveedor del carrito! */}
      <CartProvider>
        <AppNavigator />
      </CartProvider>
    </NavigationContainer>
  );
}