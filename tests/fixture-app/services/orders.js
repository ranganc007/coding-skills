const db = require('../db');

function formatPrice(cents) {
  const dollars = (cents / 100).toFixed(2);
  return '$' + dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

async function listOrders(userId) {
  const orders = await db.query('SELECT * FROM orders WHERE user_id = ?', [userId]);
  const result = [];
  for (const order of orders) {
    const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    let total = 0;
    for (const item of items) {
      const rows = await db.query('SELECT * FROM products WHERE id = ?', [item.product_id]);
      total += rows[0].price_cents * item.qty;
    }
    result.push({ id: order.id, status: order.status, total: formatPrice(total) });
  }
  return result;
}

async function getOrder(id) {
  const rows = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
  return rows[0] || null;
}

async function cancelOrder(id) {
  const order = await getOrder(id);
  if (!order) return null;
  order.status = 'cancelled';
  return order;
}

module.exports = { listOrders, getOrder, cancelOrder, formatPrice };
