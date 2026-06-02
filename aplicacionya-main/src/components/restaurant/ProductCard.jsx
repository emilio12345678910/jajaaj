import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

export const ProductCard = ({ product, onAddPress }) => {
  const priceValue = parseFloat(product.precio_venta || product.precio || 0);

  return (
    <TouchableOpacity activeOpacity={0.7} style={styles.card} onPress={onAddPress}>
      <View style={styles.info}>
        <Text style={styles.name}>{product.nombre}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {product.descripcion || 'Sin descripción disponible.'}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>${priceValue.toFixed(2)}</Text>
          <View style={styles.addButton}>
            <Ionicons name="add" size={20} color="#fff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 18, 
    marginBottom: 16, 
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  info: { 
    flex: 1, 
    justifyContent: 'space-between',
    paddingVertical: 2
  },
  name: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1A1A1A',
    letterSpacing: -0.5
  },
  description: { 
    fontSize: 14, 
    color: '#777', 
    marginTop: 4,
    lineHeight: 20
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12
  },
  price: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: COLORS.primary 
  },
  addButton: { 
    width: 36, 
    height: 36, 
    borderRadius: 12, 
    backgroundColor: COLORS.primary, 
    justifyContent: 'center', 
    alignItems: 'center',
  }
});

export default ProductCard;