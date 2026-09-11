import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, FlatList, Alert } from 'react-native';
import * as SQLite from 'expo-sqlite';

export default function App() {
  const [db, setDb] = useState(null);
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  // Inicializa la base de datos y crea la tabla
  useEffect(() => {
    async function setup() {
      try {
        const database = await SQLite.openDatabaseAsync('store.db');
        // Crear tabla con llave primaria y 4 campos extra
        await database.execAsync(`
          PRAGMA journal_mode = WAL;
          CREATE TABLE IF NOT EXISTS Products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            brand TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL
          );
        `);
        setDb(database);
        fetchProducts(database);
      } catch (error) {
        console.error('Error al inicializar BD', error);
      }
    }
    setup();
  }, []);

  // Consultar registros (Lectura)
  const fetchProducts = async (database = db) => {
    if (!database) return;
    try {
      const allRows = await database.getAllAsync('SELECT * FROM Products');
      setProducts(allRows);
    } catch (error) {
      console.log('Error obteniendo productos', error);
    }
  };

  // Insertar o Actualizar un registro
  const handleSave = async () => {
    if (!name || !brand || !category || !price) {
      Alert.alert('Error', 'Por favor llena todos los campos');
      return;
    }
    
    try {
      if (selectedId) {
        // Actualizar registro
        await db.runAsync(
          'UPDATE Products SET name = ?, brand = ?, category = ?, price = ? WHERE id = ?',
          [name, brand, category, parseFloat(price), selectedId]
        );
        setSelectedId(null);
      } else {
        // Insertar nuevo registro
        await db.runAsync(
          'INSERT INTO Products (name, brand, category, price) VALUES (?, ?, ?, ?)',
          [name, brand, category, parseFloat(price)]
        );
      }
      // Limpiar formulario
      setName('');
      setBrand('');
      setCategory('');
      setPrice('');
      fetchProducts(); // Refrescar lista
    } catch (error) {
      console.log('Error guardando producto', error);
    }
  };

  // Preparar formulario para actualizar
  const handleEdit = (item) => {
    setSelectedId(item.id);
    setName(item.name);
    setBrand(item.brand);
    setCategory(item.category);
    setPrice(item.price.toString());
  };

  // Eliminar un registro
  const handleDelete = async (id) => {
    try {
      await db.runAsync('DELETE FROM Products WHERE id = ?', [id]);
      fetchProducts();
    } catch (error) {
      console.log('Error eliminando producto', error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text>Marca: {item.brand}</Text>
        <Text>Categoría: {item.category}</Text>
        <Text>Precio: ${item.price}</Text>
      </View>
      <View style={styles.actionButtons}>
        <Button title="Editar" onPress={() => handleEdit(item)} />
        <View style={{ height: 10 }} />
        <Button title="Borrar" color="#d32f2f" onPress={() => handleDelete(item.id)} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CRUD SQLite - Productos</Text>
      
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Nombre del producto" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Marca" value={brand} onChangeText={setBrand} />
        <TextInput style={styles.input} placeholder="Categoría" value={category} onChangeText={setCategory} />
        <TextInput style={styles.input} placeholder="Precio" value={price} onChangeText={setPrice} keyboardType="numeric" />
        
        <Button title={selectedId ? "Actualizar Registro" : "Insertar Registro"} onPress={handleSave} />
        
        {selectedId && (
          <View style={{ marginTop: 10 }}>
            <Button title="Cancelar Edición" color="grey" onPress={() => {
              setSelectedId(null);
              setName('');
              setBrand('');
              setCategory('');
              setPrice('');
            }} />
          </View>
        )}
      </View>

      <FlatList
        data={products}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        style={styles.list}
        ListEmptyComponent={<Text style={{textAlign: 'center'}}>No hay registros aún.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  form: {
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4
  },
  actionButtons: {
    minWidth: 80,
  }
});
