async function loadProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();
  const container = document.getElementById('products');
  container.innerHTML = products.map(p => `
    <div class="card">
      <img src="${p.image || 'https://via.placeholder.com/200x200'}" alt="${p.title}">
      <h3>${p.title}</h3>
      <p>₹ ${p.price}</p>
      <p><a href="/product.html?id=${p.id}">View</a></p>
      <button data-id="${p.id}" class="buyBtn">Buy Now</button>
    </div>
  `).join('');
  document.querySelectorAll('.buyBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      await fetch('/api/cart/add', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ productId: id, qty: 1 })
      });
      updateCartCount();
      alert('Added to cart 😊');
    });
  });
}

async function updateCartCount() {
  const r = await fetch('/api/cart');
  const data = await r.json();
  const count = data.items.reduce((s,i)=>s+i.qty,0);
  document.getElementById('cartLink').innerText = `Cart (${count})`;
}

loadProducts();
updateCartCount();
