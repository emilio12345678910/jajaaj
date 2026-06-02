import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.nombre}</Text>
        <Text style={styles.price}>${parseFloat(item.precio_venta).toFixed(2)}</Text>
        
        {/* BLINDAJE AQUÍ: Verificamos que la propiedad exista antes de leer su length */}
        {item.ingredientes_excluidos_nombres && item.ingredientes_excluidos_nombres.length > 0 && (
          <Text style={styles.exclusionText}>Sin: {item.ingredientes_excluidos_nombres.join(', ')}</Text>
        )}
        
        {item.notas_adicionales ? (
          <Text style={styles.notesText}>Nota: "{item.notas_adicionales}"</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity onPress={() => onUpdateQuantity(-1)} style={styles.btn}>
            <Ionicons name="remove" size={20} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => onUpdateQuantity(1)} style={styles.btn}>
            <Ionicons name="add" size={20} color="#2c3e50" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Ionicons name="trash-outline" size={24} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, marginVertical: 8, borderRadius: 10, elevation: 2, alignItems: 'center' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  price: { fontSize: 16, color: '#e67e22', marginTop: 5 },
  exclusionText: { fontSize: 12, color: '#c0392b', fontWeight: 'bold', marginTop: 5, backgroundColor: '#fadbd8', alignSelf: 'flex-start', paddingHorizontal: 5, borderRadius: 3 },
  notesText: { fontSize: 12, color: '#b9770e', fontStyle: 'italic', marginTop: 3 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f4f8', borderRadius: 20, paddingHorizontal: 5 },
  btn: { padding: 5 },
  quantity: { paddingHorizontal: 10, fontSize: 16, fontWeight: 'bold' },
  removeBtn: { marginLeft: 15 }
});