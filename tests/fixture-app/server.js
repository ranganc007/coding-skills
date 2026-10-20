const express = require('express');
const db = require('./db');
const orders = require('./services/orders');

const app = express();
app.use(express.json());
app.use(express.static('public'));

function formatPrice(cents) {
  const dollars = (cents / 100).toFixed(2);
  return '$' + dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const rows = await db.query(
    "SELECT id, name FROM users WHERE email = '" + email + "' AND password = '" + password + "'"
  );
  if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ userId: rows[0].id, name: rows[0].name });
});

app.get('/api/products/:id', async (req, res) => {
  const rows = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ ...rows[0], price: formatPrice(rows[0].price_cents) });
});

app.get('/api/orders', async (req, res) => {
  const userId = req.query.userId;
  res.json(await orders.listOrders(userId));
});

app.get('/api/orders/:id', async (req, res) => {
  const order = await orders.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});

app.post('/api/orders/:id/cancel', async (req, res) => {
  const order = await orders.cancelOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
