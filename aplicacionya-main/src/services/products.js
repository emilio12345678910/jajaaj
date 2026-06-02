import api from './api';
import { API_URLS } from '../utils/constants';

export const getProducts = async (restaurantId, tableId) => {
  try {
    const response = await api.get(API_URLS.PRODUCTS, {
      params: { 
        restaurant_id: restaurantId,
        table_id: tableId 
      }
    });
    
    const rawData = response.data;

    // CORRECCIÓN: Usamos las mismas llaves que usan tus componentes (MenuScreen y ProductCard)
    const adaptedData = rawData.map(item => ({
      id: item.id_producto,           
      nombre: item.nombre,            // Mantenemos "nombre" (no "name")
      descripcion: item.descripcion,  // Mantenemos "descripcion" (no "description")
      precio: parseFloat(item.precio_venta), // Mantenemos "precio"
      imagen: item.imagen,
      // AGREGADO IMPORTANTÍSIMO: Necesitamos la categoría para las secciones
      categoria: item.categoria || item.nombre_categoria || 'General' 
    }));

    return adaptedData; 
    
  } catch (error) {
    console.error("Error al obtener productos:", error);
    throw error; 
  }
};
export const getMenu = async (restaurantId = 1) => {
  // 1. Agregamos el /api a la ruta para evitar el 404
  const response = await api.get(`/api/movil/menu?restaurant_id=${restaurantId}`);
  
  // 2. Mapeamos los datos para que ProductCard entienda el idioma de la base de datos
  const menuAdaptado = response.data.map(item => ({
    ...item,
    id: item.id_producto,           
    precio: parseFloat(item.precio_venta), 
    categoria: item.categoria || item.nombre_categoria || 'General' 
  }));

  return menuAdaptado;
};

// NUEVA FUNCIÓN: Trae los ingredientes de un producto
export const getProductRecipe = async (productId) => {
  // Agregamos el /api a la ruta
  const response = await api.get(`/api/movil/producto-receta/${productId}`);
  return response.data;
};