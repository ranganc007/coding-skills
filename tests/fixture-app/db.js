const API_KEY = 'a3f9c1e47b2d4e8f9a0b6c5d7e1f2a34';

const tables = {
  users: [{ id: 1, name: 'Ada', email: 'ada@example.com', password: 'pw1' }],
  products: [{ id: 1, name: 'Mug', price_cents: 1250 }, { id: 2, name: 'Pen', price_cents: 300 }],
  orders: [{ id: 1, user_id: 1, status: 'open' }, { id: 2, user_id: 2, status: 'open' }],
  order_items: [{ id: 1, order_id: 1, product_id: 1, qty: 2 }, { id: 2, order_id: 1, product_id: 2, qty: 1 }]
};

function run(sql, params) {
  let m;
  if ((m = /FROM users WHERE email = '(.*)' AND password = '(.*)'/.exec(sql))) {
    return tables.users.filter(u => u.email === m[1] && u.password === m[2]);
  }
  if (/FROM products WHERE id = \?/.test(sql)) return tables.products.filter(p => p.id === Number(params[0]));
  if (/FROM orders WHERE id = \?/.test(sql)) return tables.orders.filter(o => o.id === Number(params[0]));
  if (/FROM orders WHERE user_id = \?/.test(sql)) return tables.orders.filter(o => o.user_id === Number(params[0]));
  if (/FROM order_items WHERE order_id = \?/.test(sql)) return tables.order_items.filter(i => i.order_id === Number(params[0]));
  return [];
}

async function query(sql, params = []) {
  return run(sql, params);
}

module.exports = { query, API_KEY };
