import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SectionList, ActivityIndicator, 
  TouchableOpacity, TextInput, Alert, StatusBar, ScrollView, Platform, Modal 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { ProductCard } from '../components/restaurant/ProductCard';
import { COLORS } from '../utils/constants'; 
import { useCart } from '../context/CartContext'; 
import { getMenu, getProductRecipe } from '../services/products';

export const MenuScreen = ({ navigation }) => {
  const { totalItems, total, addToCart } = useCart();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // --- Estados del Modal de Personalización ---
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recipe, setRecipe] = useState([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  
  const [quantity, setQuantity] = useState(1);
  const [excludedIds, setExcludedIds] = useState([]);
  const [excludedNames, setExcludedNames] = useState([]);
  const [notes, setNotes] = useState('');

  // 1. CARGA DE DATOS
  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    setLoading(true);
    try {
      const data = await getMenu(1); // Usando tu servicio de API reparado
      setProducts(data);
    } catch (error) {
      console.error("Error cargando menú:", error);
      Alert.alert("Error", "No se pudo cargar el menú. Revisa tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  // 2. LÓGICA DEL MODAL
  const openCustomizationModal = async (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setExcludedIds([]);
    setExcludedNames([]);
    setNotes('');
    setModalVisible(true);
    setLoadingRecipe(true);

    try {
      const recipeData = await getProductRecipe(product.id);
      setRecipe(recipeData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingRecipe(false);
    }
  };

  const toggleIngredient = (ingredient) => {
    if (excludedIds.includes(ingredient.id_ingrediente)) {
      setExcludedIds(prev => prev.filter(id => id !== ingredient.id_ingrediente));
      setExcludedNames(prev => prev.filter(name => name !== ingredient.nombre));
    } else {
      setExcludedIds(prev => [...prev, ingredient.id_ingrediente]);
      setExcludedNames(prev => [...prev, ingredient.nombre]);
    }
  };

  const handleAddToCart = () => {
    addToCart(selectedProduct, quantity, excludedIds, excludedNames, notes);
    setModalVisible(false);
  };

  // 3. LÓGICA DE FILTRADO (Tuya)
  const getSectionedProducts = () => {
    let filtered = products.filter(p => 
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(p => p.categoria === selectedCategory);
    }

    const grouped = filtered.reduce((acc, product) => {
      const category = product.categoria || 'Varios';
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});

    return Object.keys(grouped).sort().map(key => ({
      title: key,
      data: grouped[key]
    }));
  };

  const categories = ['Todos', ...new Set(products.map(p => p.categoria || 'Varios'))];

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title.toUpperCase()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* HEADER CON BUSCADOR */}
      <View style={styles.headerContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#999" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="¿Qué se te antoja hoy?"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CATEGORÍAS */}
      {!loading && (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipSelected]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* LISTA DE PRODUCTOS */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <SectionList
          sections={getSectionedProducts() || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ProductCard product={item} onAddPress={() => openCustomizationModal(item)} />}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={[styles.listContent, totalItems > 0 && { paddingBottom: 100 }]}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No encontramos productos 😢</Text>
            </View>
          }
        />
      )}

      {/* BARRA CARRITO FLOTANTE */}
      {totalItems > 0 && (
        <TouchableOpacity style={styles.cartBar} onPress={() => navigation.navigate('Cart')} activeOpacity={0.9}>
          <View style={styles.cartInfo}>
            <View style={styles.badge}><Text style={styles.badgeText}>{totalItems}</Text></View>
            <Text style={styles.viewCartText}>Ver pedido</Text>
          </View>
          <Text style={styles.totalText}>${total.toFixed(2)}</Text>
        </TouchableOpacity>
      )}

      {/* MODAL DE PERSONALIZACIÓN */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedProduct?.nombre}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={30} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.sectionTitle}>Ingredientes (Desmarca para quitar)</Text>
              
              {loadingRecipe ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (recipe && recipe.length > 0) ? (
                recipe.map((ing) => {
                  const isExcluded = excludedIds.includes(ing.id_ingrediente);
                  return (
                    <TouchableOpacity key={ing.id_ingrediente} style={styles.ingredientRow} onPress={() => toggleIngredient(ing)}>
                      <Ionicons 
                        name={isExcluded ? "square-outline" : "checkbox"} 
                        size={24} 
                        color={isExcluded ? "#bdc3c7" : COLORS.success} 
                      />
                      <Text style={[styles.ingredientText, isExcluded && styles.ingredientExcluded]}>{ing.nombre}</Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={{ color: '#7f8c8d', fontStyle: 'italic' }}>Este producto no tiene ingredientes personalizables o hubo un error de red.</Text>
              )}

              <Text style={styles.sectionTitle}>Notas especiales</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. Sin picante, poco cocido..."
                value={notes}
                onChangeText={setNotes}
                multiline={true}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <View style={styles.quantityControl}>
                <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qBtn}>
                  <Ionicons name="remove" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.qText}>{quantity}</Text>
                <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qBtn}>
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddToCart}>
                <Text style={styles.confirmText}>Añadir ${(parseFloat(selectedProduct?.precio || 0) * quantity).toFixed(2)}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
};

// ... Todo tu StyleSheet original más los del Modal ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  headerContainer: { backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 50, paddingBottom: 10, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', elevation: 2, shadowOpacity: 0.05 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f2f5', borderRadius: 10, paddingHorizontal: 12, height: 45 },
  searchInput: { flex: 1, fontSize: 16, color: '#333', height: '100%' },
  categoriesContainer: { paddingHorizontal: 15, paddingVertical: 12 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#e0e0e0' },
  categoryChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryText: { color: '#666', fontWeight: '600' },
  categoryTextSelected: { color: '#fff', fontWeight: 'bold' },
  listContent: { paddingHorizontal: 15, paddingBottom: 20 },
  sectionHeader: { backgroundColor: '#f9f9f9', paddingVertical: 15, marginTop: 5 },
  sectionHeaderText: { fontSize: 18, fontWeight: '800', color: '#333', letterSpacing: 0.5 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', fontSize: 16 },
  cartBar: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  cartInfo: { flexDirection: 'row', alignItems: 'center' },
  badge: { backgroundColor: '#fff', width: 25, height: 25, borderRadius: 12.5, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  badgeText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 12 },
  viewCartText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  totalText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Estilos del Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#34495e', marginTop: 15, marginBottom: 10 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ingredientText: { fontSize: 16, marginLeft: 10, color: '#2c3e50' },
  ingredientExcluded: { textDecorationLine: 'line-through', color: '#bdc3c7' },
  textInput: { borderWidth: 1, borderColor: '#dcdde1', borderRadius: 10, padding: 10, height: 80, textAlignVertical: 'top', fontSize: 16 },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e67e22', borderRadius: 25 },
  qBtn: { padding: 10 },
  qText: { color: '#fff', fontSize: 18, fontWeight: 'bold', paddingHorizontal: 15 },
  confirmBtn: { backgroundColor: '#2c3e50', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 25, flex: 1, marginLeft: 15, alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default MenuScreen;