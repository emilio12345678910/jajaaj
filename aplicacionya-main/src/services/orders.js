const API_URL = 'https://proyectoyaweb.onrender.com/'; 
import api from './api';
export const createOrder = async (pin, items) => {
  const payload = {
    pin,
    items: items.map(item => ({
      id_producto: item.id_producto,
      cantidad: item.quantity,
      notas_adicionales: item.notas_adicionales || "",
      ingredientes_excluidos: item.ingredientes_excluidos || [] // Se manda el arreglo de IDs [24, 1]
    }))
  };
  const response = await api.post('/movil/pedido', payload);
  return response.data;
};
export const sendOrder = async (restaurantId, tableId, pin, items, status) => {
    const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, tableId, pin, items, status })
    });
    if (!response.ok) throw new Error('Error al enviar pedido');
    return await response.json();
};

// ESTA ES LA NUEVA FUNCIÓN PARA EL PAGO
export const updateOrderStatus = async (orderId, newStatus, paymentMethod) => {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            status: newStatus, 
            metodo_pago: paymentMethod 
        }),
    });
    if (!response.ok) throw new Error('Error al actualizar el estado de pago');
    return await response.json();
};
