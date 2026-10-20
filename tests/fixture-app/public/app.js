let currentUser = null;

function formatPrice(cents) {
  const dollars = (cents / 100).toFixed(2);
  return '$' + dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

document.getElementById('login-btn').addEventListener('click', async () => {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    })
  });
  if (res.ok) currentUser = await res.json();
});

document.getElementById('orders-btn').addEventListener('click', async () => {
  const res = await fetch('/api/orders?userId=' + currentUser.userId);
  const list = await res.json();
  document.getElementById('orders').innerHTML = list
    .map(o => '<li>#' + o.id + ' ' + o.status + ' ' + o.total + '</li>')
    .join('');
});

document.getElementById('cancel-btn').addEventListener('click', async () => {
  const id = prompt('Order id to cancel');
  await fetch('/api/orders/' + id, { method: 'DELETE' });
});
