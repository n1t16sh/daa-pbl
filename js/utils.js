const KEYS = {
  products:   'ims_products',
  categories: 'ims_categories',
};

function generateId() {
  return 'p_' + Date.now();
}


function getProducts() {
  const raw = localStorage.getItem(KEYS.products);  
  return raw ? JSON.parse(raw) : [];
}


function saveProducts(products) {
  localStorage.setItem(KEYS.products, JSON.stringify(products));
}


function addProduct(productObj) {
  const products = getProducts();

  const newProduct = {
    ...productObj,                        
    id:        generateId(),              
    createdAt: new Date().toLocaleDateString('en-IN'),
  };

  products.push(newProduct);
  saveProducts(products);                  
  return newProduct;
}


function updateProduct(id, updatedFields) {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);

  if (index === -1) return false;          

  products[index] = {
    ...products[index],                   
    ...updatedFields,                      
  };

  saveProducts(products);
  return true;
}


function deleteProduct(id) {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  saveProducts(filtered);
}

function getProductById(id) {
  const products = getProducts();
  return products.find(p => p.id === id) || null;
}


function getCategories() {
  const raw = localStorage.getItem(KEYS.categories);
  if (raw) return JSON.parse(raw);

  const defaults = [
    'Electronics',
    'Clothing',
    'Food & Beverages',
    'Furniture',
    'Stationery',
  ];
  saveCategories(defaults);
  return defaults;
}


function saveCategories(categories) {
  localStorage.setItem(KEYS.categories, JSON.stringify(categories));
}

function addCategory(name) {
  const trimmed = name.trim();
  if (!trimmed) return false;

  const cats = getCategories();
  const exists = cats.some(c => c.toLowerCase() === trimmed.toLowerCase());
  if (exists) return false;

  cats.push(trimmed);
  saveCategories(cats);
  return true;
}


function deleteCategory(name) {
  const cats = getCategories();
  const filtered = cats.filter(c => c !== name);
  saveCategories(filtered);
}


function isLowStock(product) {
  return Number(product.quantity) <= Number(product.threshold);
}


function formatCurrency(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function getStockBadge(product) {
  if (Number(product.quantity) === 0) {
    return '<span class="badge badge-danger">Out of Stock</span>';
  }
  if (isLowStock(product)) {
    return '<span class="badge badge-warning">Low Stock</span>';
  }
  return '<span class="badge badge-success">In Stock</span>';
}

function clearAllData() {
  localStorage.removeItem(KEYS.products);
  localStorage.removeItem(KEYS.categories);
}
