async function loadCart() {
  const r = await fetch('/api/cart');
  const data = await r.json();
  const c = data.items;
  const container = document.getElementById('cart');
  if (!c.length) {
    container.innerHTML = '<p>Your cart is empty</p>';
    return;
  }
  container.innerHTML = c.map(it => `
    <div class="cart-item" data-line="${it.lineId}">
      <img src="${it.product.image || 'https://via.placeholder.com/100'}" />
      <div>
        <h4>${it.product.title}</h4>
        <p>₹ ${it.product.price} x <input class="qty" data-line="${it.lineId}" value="${it.qty}" style="width:50px"></p>
        <p>Line total: ₹ ${it.product.price * it.qty}</p>
        <button class="remove" data-line="${it.lineId}">Remove</button>
      </div>
    </div>
  `).join('') + `<hr><p>Subtotal: ₹ ${data.subtotal}</p><button id="checkout">Checkout</button>`;

  document.querySelectorAll('.qty').forEach(inp => {
    inp.addEventListener('change', async (e) => {
      const lineId = e.target.dataset.line;
      const qty = Number(e.target.value);
      await fetch('/api/cart/update', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ lineId, qty })
      });
      loadCart();
    });
  });
  document.querySelectorAll('.remove').forEach(btn => {
    btn.addEventListener('click', async () => {
      const lineId = btn.dataset.line;
      await fetch('/api/cart/update', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ lineId, qty: 0 })
      });
      loadCart();
    });
  });

  document.getElementById('checkout').addEventListener('click', async () => {
    const r = await fetch('/api/checkout', { method: 'POST' });
    const res = await r.json();
    if (res.success) {
      alert('Order placed! Order ID: ' + res.order.orderId);
      window.location = '/';
    } else {
      alert('Checkout failed: ' + (res.error || 'Unknown'));
    }
  });
}

loadCart();
