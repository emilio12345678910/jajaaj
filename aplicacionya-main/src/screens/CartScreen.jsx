import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { CartContext } from '../context/CartContext';
import { COLORS, API_URL } from '../utils/constants';
import { CartItem } from '../components/restaurant/CartItem'; // O import CartItem, dependiendo de cómo lo hayas exportado

const CartScreen = ({ navigation }) => {
  const { cartItems, total, clearCart, pin, setPin, setTableId } = useContext(CartContext);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckout = () => {
    if (cartItems.length === 0) return Alert.alert("Carrito vacío", "Agrega algo primero.");
    if (pin) {
      sendOrderToBackend(pin);
    } else {
      setModalVisible(true);
    }
  };

  const confirmPin = () => {
    if (!inputPin || inputPin.length < 3) return Alert.alert("Error", "PIN muy corto.");
    setPin(inputPin);
    setModalVisible(false);
    sendOrderToBackend(inputPin);
  };

  const sendOrderToBackend = async (pinCode) => {
    setLoading(true);
    try {
      // CÓDIGO CORREGIDO en CartScreen.jsx
      const orderPayload = {
        pin: pinCode,
        items: cartItems.map(item => ({
          id_producto: item.id || item.id_producto, // Programación defensiva
          cantidad: item.quantity,
          // Agregamos los nuevos datos para que viajen al backend
          notas_adicionales: item.notas_adicionales || null,
          ingredientes_excluidos: item.ingredientes_excluidos || []
        }))
      };

      const response = await fetch(`${API_URL}/api/movil/pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();

      if (response.ok) {
        // AQUÍ ESTÁ LA SOLUCIÓN AL "SIN ASIGNAR"
        if(data.mesa) setTableId(data.mesa); 

        clearCart();
        navigation.navigate('OrderDetails'); // Navegación directa, sin alertas molestas
      } else {
        Alert.alert("Error", data.message || "No se pudo enviar.");
        if (response.status === 401) setPin(null); // Si el PIN estaba mal, lo borramos para pedirlo de nuevo
      }

    } catch (error) {
      Alert.alert("Error", "Fallo de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Text style={styles.itemName}>{item.quantity}x {item.nombre}</Text>
      <Text style={styles.itemPrice}>${(item.precio_venta * item.quantity).toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirmar 🛒</Text>
      <FlatList
        data={cartItems}
        keyExtractor={(item, index) => item.cartItemId ? item.cartItemId.toString() : index.toString()}
        renderItem={({ item }) => (
          <CartItem
            item={item}
            onRemove={() => removeFromCart(item.cartItemId)}
            onUpdateQuantity={(change) => updateQuantity(item.cartItemId, change)}
          />
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
        {loading ? <ActivityIndicator color={COLORS.primary}/> : (
            <TouchableOpacity style={styles.btn} onPress={handleCheckout}>
                <Text style={styles.btnText}>ENVIAR ORDEN</Text>
            </TouchableOpacity>
        )}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ingresa PIN del Mesero</Text>
            <TextInput style={styles.input} placeholder="PIN" keyboardType="numeric" onChangeText={setInputPin} />
            <TouchableOpacity style={styles.btn} onPress={confirmPin}><Text style={styles.btnText}>CONFIRMAR</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{marginTop:15, color:'red'}}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  itemCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  itemName: { fontSize: 16 },
  itemPrice: { fontWeight: 'bold' },
  footer: { marginTop: 20, borderTopWidth: 1, borderColor: '#ddd', paddingTop: 20 },
  total: { fontSize: 22, fontWeight: 'bold', textAlign: 'right', marginBottom: 15 },
  btn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '80%', backgroundColor: '#fff', padding: 25, borderRadius: 15, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 15, textAlign: 'center', fontSize: 18 }
});

export default CartScreen;