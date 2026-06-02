import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CartContext } from '../context/CartContext';
import { COLORS } from '../utils/constants';

const HomeScreen = ({ navigation }) => {
  const { pin, exitSession, tableId, restaurantData } = useContext(CartContext);

  const handleExit = () => {
    Alert.alert("Salir", "¿Cerrar sesión en esta mesa?", [
        { text: "Cancelar" },
        { text: "Salir", onPress: exitSession, style: 'destructive' }
    ]);
  };

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>Proyecto YA</Text>
            {pin && <TouchableOpacity onPress={handleExit}><Text style={{color:'#fff'}}>Salir</Text></TouchableOpacity>}
        </View>

        <View style={styles.content}>
            {!pin ? (
                <View style={styles.center}>
                    <Text style={styles.welcome}>¡Bienvenido!</Text>
                    <Text style={styles.sub}>Escanea el código QR de tu restaurante para comenzar.</Text>
                    <TouchableOpacity style={styles.btnMain} onPress={() => navigation.navigate('QRScanner')}>
                        <Text style={styles.btnText}>📸 ESCANEAR QR</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.menuGrid}>
                    <Text style={styles.tableInfo}>Mesa: {tableId || "Pendiente de pedido"}</Text>
                    <Text style={styles.restInfo}>{restaurantData.name}</Text>

                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Menu')}>
                        <Text style={styles.cardIcon}>🍔</Text>
                        <Text style={styles.cardTitle}>Ver Menú</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OrderDetails')}>
                        <Text style={styles.cardIcon}>📄</Text>
                        <Text style={styles.cardTitle}>Ver Mi Pedido</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f2' },
    header: { backgroundColor: COLORS.primary, padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    content: { flex: 1, padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    welcome: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
    sub: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
    btnMain: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    menuGrid: { gap: 15 },
    tableInfo: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: COLORS.primary },
    restInfo: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 20 },
    card: { backgroundColor: '#fff', padding: 25, borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 3 },
    cardIcon: { fontSize: 30, marginRight: 20 },
    cardTitle: { fontSize: 18, fontWeight: 'bold' }
});

export default HomeScreen;