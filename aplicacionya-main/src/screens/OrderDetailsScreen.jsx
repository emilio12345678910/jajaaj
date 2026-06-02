import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { CartContext } from '../context/CartContext';
import { API_URL, COLORS } from '../utils/constants';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function OrderDetailsScreen({ navigation }) {
    const { pin, tableId } = useContext(CartContext);
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrderData = async () => {
        try {
            if(!pin) return; 
            const response = await fetch(`${API_URL}/api/movil/seguimiento/${pin}`);
            const data = await response.json();
            
            if (data.activo) {
                setOrderData(data);
            } else {
                setOrderData(null); 
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrderData();
    }, []);

    const generatePdf = async () => {
        try {
            // 1. El frontend le pide la materia prima (JSON enriquecido) al backend
            const response = await fetch(`${API_URL}/api/movil/ticket?numero_mesa=${tableId}`);
            
            if (!response.ok) {
                Alert.alert("Error", "No se pudo obtener el formato del ticket.");
                return;
            }
            
            const data = await response.json();

            // 2. El frontend actúa como impresora térmica usando HTML/CSS
            const html = `
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        /* Estética de impresora térmica */
                        body { 
                            font-family: 'Courier New', Courier, monospace; 
                            font-size: 14px; 
                            color: #000; 
                            padding: 20px; 
                            max-width: 350px; /* Ancho típico de un rollo de 80mm */
                            margin: auto; 
                        }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .bold { font-weight: bold; }
                        .divider { border-top: 1px dashed #000; margin: 12px 0; }
                        .flex-between { display: flex; justify-content: space-between; }
                        .info-grid { 
                            display: grid; 
                            grid-template-columns: 1fr 1fr; 
                            gap: 6px; 
                            font-size: 12px; 
                            margin-bottom: 10px; 
                        }
                        .item-row { 
                            display: flex; 
                            justify-content: space-between; 
                            margin-bottom: 6px; 
                            font-size: 13px; 
                        }
                        p { margin: 4px 0; }
                    </style>
                </head>
                <body>
                    <div class="text-center">
                        <h2 style="margin:0; font-size: 20px;">${data.establecimiento.nombre_comercial}</h2>
                        <p style="font-size:12px;">${data.establecimiento.razon_social}</p>
                        <p style="font-size:12px;">RFC: ${data.establecimiento.rfc}</p>
                        <p style="font-size:12px; margin-top: 8px;">Régimen fiscal:<br>${data.establecimiento.regimen_fiscal}</p>
                    </div>

                    <div class="divider"></div>
                    <div class="text-center bold">Información de la operación</div>
                    <div class="divider"></div>

                    <div class="info-grid">
                        <div>Folio / ref:</div><div class="text-right">${data.operacion.folio_referencia}</div>
                        <div>Fecha:</div><div class="text-right">${data.operacion.fecha}</div>
                        <div>Hora:</div><div class="text-right">${data.operacion.hora}</div>
                        <div>Mesa:</div><div class="text-right">${data.operacion.mesa}</div>
                        <div>Clientes:</div><div class="text-right">${data.operacion.clientes}</div>
                        <div>Num de orden:</div><div class="text-right">${data.operacion.numero_ticket}</div>
                        <div>Mesero:</div><div class="text-right">${data.operacion.mesero}</div>
                        <div>Cajero:</div><div class="text-right">${data.operacion.cajero}</div>
                        <div>Reimpresión:</div><div class="text-right">${data.operacion.reimpresion}</div>
                        <div>Tipo pedido:</div><div class="text-right">${data.operacion.tipo_pedido}</div>
                    </div>

                    <div class="divider"></div>
                    <div class="text-center bold">Consumo</div>
                    <div class="divider"></div>

                    <p style="font-size:12px; margin-bottom: 10px;">Artículos: ${data.items.length}</p>
                    
                    ${data.items.map(item => `
                        <div class="item-row">
                            <span style="flex:2;">${item.cantidad}x ${item.descripcion}</span>
                            <span style="flex:1;" class="text-right">$${item.importe}</span>
                        </div>
                    `).join('')}

                    <div class="divider"></div>
                    
                    <div class="flex-between bold">
                        <span>Subtotal:</span>
                        <span>$${data.financiero.subtotal}</span>
                    </div>
                    <div class="flex-between bold">
                        <span>Total (antes propina):</span>
                        <span>$${data.financiero.total_antes_propina}</span>
                    </div>

                    <div class="divider"></div>
                    <div class="text-center bold">Pago</div>
                    <div class="divider"></div>

                    <div class="flex-between" style="color: #555;">
                        <span>Propina sugerida (10%):</span>
                        <span>$${data.financiero.propina_sugerida}</span>
                    </div>
                    <div class="flex-between bold" style="font-size:16px; margin-top:8px;">
                        <span>Total final:</span>
                        <span>$${data.financiero.total_final}</span>
                    </div>
                    <div class="flex-between" style="margin-top:8px;">
                        <span>Balance restante:</span>
                        <span>$${data.financiero.balance_restante}</span>
                    </div>

                    <div class="divider"></div>
                    <div class="text-center bold">Sucursal</div>
                    <div class="divider"></div>
                    <p class="text-center" style="font-size:12px;">
                        ${data.establecimiento.direccion.replace(/, /g, '<br>')}
                    </p>

                    <div class="divider"></div>
                    <div class="text-center bold">Facturación</div>
                    <div class="divider"></div>
                    <p class="text-center" style="font-size:12px;">
                        Indica que se puede facturar en:<br>
                        <strong>${data.facturacion.url}</strong><br><br>
                        ${data.facturacion.leyenda}
                    </p>
                </body>
                </html>
            `;

            // 3. Convertimos esa estructura en un PDF físico y abrimos el menú para compartir
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Ocurrió un problema al descargar el ticket.");
        }
    };

    if (loading) return <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />;

    if (!orderData) {
        return (
            <View style={styles.center}>
                <Text style={styles.msg}>No tienes pedidos activos.</Text>
                <TouchableOpacity style={styles.btnSmall} onPress={() => navigation.navigate('Home')}>
                    <Text style={{color:'#fff'}}>Volver al Inicio</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Lógica visual: ¿Ya pidieron la cuenta?
    const esPorPagar = orderData.estado === 'por_pagar';

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrderData(); }} />}
        >
            <View style={styles.card}>
                <Text style={styles.status}>
                    Estado: {esPorPagar ? "ESPERANDO CUENTA" : orderData.estado.toUpperCase().replace('_', ' ')}
                </Text>
                <Text style={styles.mesa}>Mesa: {tableId || orderData.ticket.mesa}</Text>
                
                <View style={styles.divider}/>
                
                {/* LISTA DE ITEMS MEJORADA */}
                {orderData.ticket.items.map((item, index) => (
                    <View key={index} style={styles.row}>
                        <View style={{flex: 1}}>
                            <Text style={{fontSize: 16}}>
                                {item.cantidad}x {item.nombre}
                            </Text>
                            {/* Etiqueta de estado individual */}
                            <Text style={{fontSize: 12, color: item.estado_producto === 'completado' ? '#2ecc71' : '#f39c12'}}>
                                {item.estado_producto === 'completado' ? '✅ Servido' : '🍳 Cocinando'}
                            </Text>
                        </View>
                        <Text style={{fontWeight:'bold'}}>${item.subtotal}</Text>
                    </View>
                ))}
                
                <View style={styles.divider}/>
                <Text style={styles.total}>Total: ${orderData.ticket.total}</Text>
            </View>

            <View style={styles.actions}>
                {/* LOGICA DE BOTONES:
                   1. Si ya pidió cuenta ('por_pagar') -> Solo PDF y mensaje de espera.
                   2. Si sigue comiendo -> Botón Pedir Más y Botón Pagar.
                */}
                
                {esPorPagar ? (
                    <View>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>🔔 El mesero ya viene en camino.</Text>
                        </View>
                        <TouchableOpacity style={styles.btnPdf} onPress={generatePdf}>
                            <Text style={styles.btnText}>📄 Descargar Ticket PDF</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        {/* BOTÓN PEDIR MÁS (Arriba del terminar) */}
                        <TouchableOpacity 
                            style={styles.btnMore} 
                            onPress={() => navigation.navigate('Menu')}
                        >
                            <Text style={styles.btnText}>🍽️ Pedir Algo Más</Text>
                        </TouchableOpacity>

                        {/* BOTÓN TERMINAR (Pagar) */}
                        <TouchableOpacity 
                            style={styles.btnPay} 
                            onPress={() => navigation.navigate('Payment', { 
                                total: orderData.ticket.total,
                                items: orderData.ticket.items 
                            })}
                        >
                            <Text style={styles.btnText}>👋 ¡YA terminé! (Pagar)</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
    loader: { marginTop: 50 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    msg: { fontSize: 18, color: '#666', marginBottom: 20 },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 20, elevation: 3 },
    status: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 5 },
    mesa: { textAlign: 'center', color: '#666', marginBottom: 15 },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
    row: { flexDirection: 'row', marginBottom: 8 },
    total: { fontSize: 22, fontWeight: 'bold', textAlign: 'right', marginTop: 10, color: COLORS.success },
    actions: { gap: 15, paddingBottom: 30 },
    
    // Estilos de Botones
    btnMore: { backgroundColor: '#3498db', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 }, // Azul
    btnPay: { backgroundColor: '#e74c3c', padding: 15, borderRadius: 10, alignItems: 'center' }, // Rojo
    btnPdf: { backgroundColor: '#2c3e50', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 }, // Gris oscuro
    btnSmall: { backgroundColor: COLORS.primary, padding: 10, borderRadius: 8 },
    
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    
    // Caja de información
    infoBox: { backgroundColor: '#e8f6f3', padding: 15, borderRadius: 8, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#d1f2eb' },
    infoText: { color: '#16a085', fontWeight: 'bold' }
});