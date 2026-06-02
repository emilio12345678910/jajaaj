import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS } from '../utils/constants';
import { CartContext } from '../context/CartContext';

const QRScannerScreen = ({ navigation }) => {
    const { setRestaurantData } = useContext(CartContext);
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const lockRef = useRef(false); 

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setScanned(false);
            lockRef.current = false;
        });
        return unsubscribe;
    }, [navigation]);

    const handleBarCodeScanned = ({ data }) => {
        if (scanned || lockRef.current) return;
        lockRef.current = true; 
        setScanned(true);
        
        try {
            console.log("QR Data:", data);
            const parsedData = JSON.parse(data);

            // VALIDACIÓN: Solo necesitamos saber que es un QR de tu sistema
            // El JSON del QR web trae: { id_restaurante, nombre, api_url ... }
            if (parsedData.id_restaurante) {
                
                // 1. Guardamos ID del restaurante para que el menú sepa qué cargar
                setRestaurantData({
                    restaurantId: parsedData.id_restaurante,
                    name: parsedData.nombre || "Restaurante"
                });

                // 2. Navegamos directo al Menú (Sin pedir PIN aún)
                navigation.navigate('Menu', { 
                    restaurantId: parsedData.id_restaurante
                });

            } else {
                throw new Error("QR sin ID de restaurante");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("QR No Reconocido", "Escanea el código QR del restaurante.", 
                [{ text: "Reintentar", onPress: () => { setScanned(false); lockRef.current = false; } }]);
        }
    };

    if (!permission || !permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.infoText}>Necesitamos la cámara para ver el menú 📸</Text>
                <TouchableOpacity style={styles.btn} onPress={requestPermission}>
                    <Text style={styles.btnText}>Permitir Cámara</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            />
            <View style={styles.overlay}>
                <View style={styles.frame}>
                  <View style={styles.cornerTL} /><View style={styles.cornerTR} />
                  <View style={styles.cornerBL} /><View style={styles.cornerBR} />
                </View>
                <Text style={styles.overlayText}>Escanea el QR del Restaurante</Text>
                <Text style={styles.subText}>para ver el menú</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    infoText: { color: '#fff', marginBottom: 20, textAlign: 'center', fontSize: 16 },
    btn: { backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
    frame: { width: 260, height: 260, position: 'relative', marginBottom: 20 },
    cornerTL: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 5, borderLeftWidth: 5, borderColor: COLORS.primary, borderTopLeftRadius: 10 },
    cornerTR: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 5, borderRightWidth: 5, borderColor: COLORS.primary, borderTopRightRadius: 10 },
    cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 5, borderLeftWidth: 5, borderColor: COLORS.primary, borderBottomLeftRadius: 10 },
    cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 5, borderRightWidth: 5, borderColor: COLORS.primary, borderBottomRightRadius: 10 },
    overlayText: { color: '#fff', fontSize: 20, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10 },
    subText: { color: '#ddd', fontSize: 16, marginTop: 5 }
});

export default QRScannerScreen;