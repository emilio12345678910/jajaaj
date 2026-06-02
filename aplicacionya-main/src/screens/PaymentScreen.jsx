import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../context/CartContext';
import { COLORS, API_URL } from '../utils/constants';

const PaymentScreen = ({ navigation, route }) => {
  const { pin, clearCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  // Recibimos los datos REALES desde la pantalla de OrderDetails
  const { total, items } = route.params || { total: 0, items: [] };

  const handleRequestBill = async () => {
    if (!selectedMethod) {
      Alert.alert("Falta información", "Por favor selecciona cómo vas a pagar.");
      return;
    }

    setLoading(true);

    try {
      console.log(`Solicitando cuenta para PIN: ${pin} - Método: ${selectedMethod}`);
      
      const response = await fetch(`${API_URL}/api/movil/cuenta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            pin: pin, 
            metodo_pago: selectedMethod 
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
            "¡Mesero Notificado! 🔔", 
            "Tu cuenta ha sido solicitada. El mesero vendrá en breve con la terminal o el cambio.",
            [{ 
                text: "Entendido", 
                onPress: () => {
                    // Volvemos a Detalles para que vea el cambio de estado
                    navigation.navigate('OrderDetails'); 
                } 
            }]
        );
      } else {
        Alert.alert("Error", data.message || "No se pudo solicitar la cuenta.");
      }

    } catch (error) {
      console.error("Error pidiendo cuenta:", error);
      Alert.alert("Error de conexión", "Revisa tu internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Ionicons name="wallet-outline" size={60} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Cierre de Mesa</Text>
        <Text style={styles.headerSubtitle}>Por favor confirma tu consumo</Text>
      </View>

      {/* Resumen del Consumo */}
      <View style={styles.billCard}>
        <Text style={styles.sectionTitle}>Resumen</Text>
        
        {items && items.map((item, index) => (
            <View key={index} style={styles.row}>
                <Text style={styles.itemText}>{item.cantidad} x {item.nombre}</Text>
                <Text style={styles.priceText}>${(item.cantidad * item.precio).toFixed(2)}</Text>
            </View>
        ))}

        <View style={styles.divider} />
        
        <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL A PAGAR</Text>
            <Text style={styles.totalAmount}>${parseFloat(total).toFixed(2)}</Text>
        </View>
      </View>

      {/* Selección de Método */}
      <Text style={styles.methodTitle}>¿Cómo deseas pagar?</Text>
      <View style={styles.methodsContainer}>
        
        <TouchableOpacity 
            style={[styles.methodCard, selectedMethod === 'tarjeta' && styles.selectedCard]}
            onPress={() => setSelectedMethod('tarjeta')}
            activeOpacity={0.8}
        >
            <Ionicons name="card-outline" size={32} color={selectedMethod === 'tarjeta' ? COLORS.primary : '#666'} />
            <Text style={[styles.methodText, selectedMethod === 'tarjeta' && styles.selectedText]}>Tarjeta</Text>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.methodCard, selectedMethod === 'efectivo' && styles.selectedCard]}
            onPress={() => setSelectedMethod('efectivo')}
            activeOpacity={0.8}
        >
            <Ionicons name="cash-outline" size={32} color={selectedMethod === 'efectivo' ? COLORS.primary : '#666'} />
            <Text style={[styles.methodText, selectedMethod === 'efectivo' && styles.selectedText]}>Efectivo</Text>
        </TouchableOpacity>

      </View>

      {/* Botón Final */}
      <TouchableOpacity 
        style={[styles.payButton, (!selectedMethod || loading) && styles.disabledButton]}
        onPress={handleRequestBill}
        disabled={!selectedMethod || loading}
      >
        {loading ? (
            <ActivityIndicator color="#fff" />
        ) : (
            <Text style={styles.payButtonText}>👋 Solicitar Cuenta</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Volver</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8', padding: 20 },
  header: { alignItems: 'center', marginTop: 30, marginBottom: 30 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', marginTop: 10 },
  headerSubtitle: { fontSize: 16, color: '#7f8c8d' },
  
  billCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 25, elevation: 3, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity:0.1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemText: { color: '#555', fontSize: 15, flex: 1 },
  priceText: { color: '#333', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  totalAmount: { fontSize: 24, fontWeight: 'bold', color: '#e74c3c' },

  methodTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#2c3e50', marginLeft: 5 },
  methodsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  methodCard: { flex: 0.48, backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#eee' },
  selectedCard: { borderColor: COLORS.primary, backgroundColor: '#ebf5fb' },
  methodText: { marginTop: 10, fontWeight: '600', color: '#666' },
  selectedText: { color: COLORS.primary, fontWeight: 'bold' },

  payButton: { backgroundColor: '#27ae60', padding: 18, borderRadius: 15, alignItems: 'center', elevation: 4 },
  disabledButton: { backgroundColor: '#bdc3c7' },
  payButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelButton: { alignItems: 'center', marginTop: 20 },
  cancelText: { color: '#7f8c8d', fontSize: 16 }
});

export default PaymentScreen;