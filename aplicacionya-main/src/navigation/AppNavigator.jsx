import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CartContext } from '../context/CartContext'; // Importamos el contexto

import HomeScreen from '../screens/HomeScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import MenuScreen from '../screens/MenuScreen';
import CartScreen from '../screens/CartScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import PaymentScreen from '../screens/PaymentScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  // ESCUCHAMOS EL PIN EN TIEMPO REAL
  const { pin } = useContext(CartContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      {/* LÓGICA DE NAVEGACIÓN REACTIVA */}
      {/* Si el mesero borra el PIN (pin == null), React Navigation desmonta todo y nos manda al Stack de Invitado */}
      
      {!pin ? (
        // === MODO INVITADO (Sin Mesa Asignada) ===
        <Stack.Group>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="QRScanner" component={QRScannerScreen} />
          <Stack.Screen name="Menu" component={MenuScreen} />
          {/* El carrito está aquí para poder pedir el primer pedido */}
          <Stack.Screen name="Cart" component={CartScreen} />
        </Stack.Group>
      ) : (
        // === MODO MESA ACTIVA (Ya tenemos PIN) ===
        <Stack.Group>
          {/* Home sigue siendo la base, pero con opciones diferentes */}
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Menu" component={MenuScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
        </Stack.Group>
      )}

    </Stack.Navigator>
  );
};

export default AppNavigator;