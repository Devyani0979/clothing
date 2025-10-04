const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: 'replace_this_with_a_strong_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}));

app.use(express.static(path.join(__dirname, 'public')));

// Utility: read products
function readProducts() {
  if (!fs.existsSync(PRODUCTS_FILE)) return [];
  const raw = fs.readFileSync(PRODUCTS_FILE, 'utf8');
  return JSON.parse(raw || '[]');
}

// API: get all products
app.get('/api/products', (req, res) => {
  const products = readProducts();
  res.json(products);
});

// API: get product by id
app.get('/api/products/:id', (req, res) => {
  const products = readProducts();
  const p = products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(p);
});

// Cart helpers using session
function ensureCart(req) {
  if (!req.session.cart) req.session.cart = { items: [] };
  return req.session.cart;
}

// API: add to cart
app.post('/api/cart/add', (req, res) => {
  const { productId, qty } = req.body;
  const products = readProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return res.status(400).json({ error: 'Invalid product' });
  const cart = ensureCart(req);
  const existing = cart.items.find(i => i.product.id === productId);
  if (existing) existing.qty += Number(qty || 1);
  else cart.items.push({ product, qty: Number(qty || 1), lineId: uuidv4() });
  res.json({ cart });
});

// API: get cart
app.get('/api/cart', (req, res) => {
  const cart = ensureCart(req);
  // calculate totals
  const subtotal = cart.items.reduce((s, it) => s + it.qty * it.product.price, 0);
  res.json({ ...cart, subtotal });
});

// API: update cart item quantity
app.post('/api/cart/update', (req, res) => {
  const { lineId, qty } = req.body;
  const cart = ensureCart(req);
  const item = cart.items.find(i => i.lineId === lineId);
  if (!item) return res.status(400).json({ error: 'Item not found' });
  if (qty <= 0) cart.items = cart.items.filter(i => i.lineId !== lineId);
  else item.qty = Number(qty);
  res.json({ cart });
});

// API: checkout (simple)
app.post('/api/checkout', (req, res) => {
  const cart = ensureCart(req);
  if (!cart.items.length) return res.status(400).json({ error: 'Cart empty' });
  // In real app: save order to DB, process payment, etc.
  // Here: return a fake order id and clear cart
  const order = {
    orderId: uuidv4(),
    items: cart.items,
    total: cart.items.reduce((s, it) => s + it.qty * it.product.price, 0),
    createdAt: new Date()
  };
  req.session.cart = { items: [] };
  res.json({ success: true, order });
});

// Admin-ish: add product (for quick testing) - not secured
app.post('/api/products', (req, res) => {
  const { title, price, image, description } = req.body;
  const products = readProducts();
  const newP = { id: uuidv4(), title, price: Number(price), image: image || '', description: description || '' };
  products.push(newP);
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  res.json(newP);
});

// Fallback to serve index
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
