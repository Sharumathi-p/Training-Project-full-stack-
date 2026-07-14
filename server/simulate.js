const axios = require("axios");

const cities = [
  "Chennai", "Mumbai", "Bengaluru", "Delhi",
  "Hyderabad", "Kolkata", "Pune", "Salem"
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

let products = [];

// Fetch real product data once at startup from a public product API
async function loadRealProducts() {
  try {
    const res = await axios.get("https://dummyjson.com/products?limit=100");
    products = res.data.products.map((p) => ({
      name: p.title,
      // Convert USD price to INR (approx conversion) and round
      price: Math.round(p.price * 83)
    }));
    console.log("Loaded " + products.length + " real products from DummyJSON API");
  } catch (err) {
    console.log("Failed to load real products:", err.message);
  }
}

async function createFakeOrder() {
  if (products.length === 0) return;

  const product = randomFrom(products);
  // Add small random variation (+/- 10%) to simulate discounts/quantity differences
  const variation = 0.9 + Math.random() * 0.2;
  const amount = Math.round(product.price * variation);

  const order = {
    product: product.name,
    city: randomFrom(cities),
    amount: amount
  };

  try {
    const res = await axios.post("http://localhost:5000/orders", order);
    console.log("Created order:", res.data.product, "-", res.data.city, "- Rs" + res.data.amount);
  } catch (err) {
    console.log("Error creating order:", err.message);
  }
}

async function start() {
  await loadRealProducts();
  console.log("Simulator running... creating a real-product order every 4 seconds");
  setInterval(createFakeOrder, 4000);
}

start();
