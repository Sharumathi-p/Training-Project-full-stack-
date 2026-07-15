/**
 * Quick script to populate your deployed database with test orders
 * Usage: node populate-data.js <your-backend-url> <number-of-orders>
 * Example: node populate-data.js https://nexus-dashboard-server.onrender.com 50
 */

const axios = require("axios");

const cities = [
  "Chennai", "Mumbai", "Bengaluru", "Delhi",
  "Hyderabad", "Kolkata", "Pune", "Salem"
];

const products = [
  { name: "iPhone 14 Pro", price: 129900 },
  { name: "Samsung Galaxy S23", price: 89999 },
  { name: "MacBook Air M2", price: 114900 },
  { name: "Sony WH-1000XM5 Headphones", price: 29990 },
  { name: "iPad Pro 11-inch", price: 81900 },
  { name: "Apple Watch Series 8", price: 45900 },
  { name: "Dell XPS 13 Laptop", price: 94990 },
  { name: "Bose QuietComfort 45", price: 29990 },
  { name: "LG 55-inch 4K TV", price: 54990 },
  { name: "Canon EOS R6 Camera", price: 229990 },
  { name: "Nintendo Switch OLED", price: 32990 },
  { name: "PS5 Console", price: 49990 },
  { name: "Kindle Paperwhite", price: 13999 },
  { name: "GoPro Hero 11", price: 44990 },
  { name: "Dyson V15 Vacuum", price: 59900 },
  { name: "Fitbit Charge 5", price: 14999 },
  { name: "Samsung Galaxy Buds Pro", price: 15990 },
  { name: "Logitech MX Master 3", price: 8995 },
  { name: "Herman Miller Chair", price: 89990 },
  { name: "Philips Air Purifier", price: 24990 }
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(hoursAgo) {
  const now = Date.now();
  const randomTime = now - Math.random() * hoursAgo * 60 * 60 * 1000;
  return new Date(randomTime);
}

async function createOrder(baseUrl) {
  const product = randomFrom(products);
  const variation = 0.85 + Math.random() * 0.3; // ±15% price variation
  const amount = Math.round(product.price * variation);

  const order = {
    product: product.name,
    city: randomFrom(cities),
    amount: amount
  };

  try {
    const res = await axios.post(`${baseUrl}/orders`, order);
    return res.data;
  } catch (err) {
    throw new Error(`Failed to create order: ${err.message}`);
  }
}

async function populateData(baseUrl, count) {
  console.log(`\n🚀 Populating ${count} orders to ${baseUrl}\n`);
  
  // First, verify the backend is accessible
  try {
    const healthCheck = await axios.get(`${baseUrl}/`);
    console.log("✅ Backend health check passed:", healthCheck.data.message);
  } catch (err) {
    console.error("❌ Backend is not accessible!");
    console.error("   Make sure your backend URL is correct and the server is running.");
    console.error("   Error:", err.message);
    process.exit(1);
  }

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < count; i++) {
    try {
      const order = await createOrder(baseUrl);
      successful++;
      console.log(`✓ [${successful}/${count}] Created: ${order.product} - ${order.city} - ₹${order.amount.toLocaleString("en-IN")}`);
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      failed++;
      console.error(`✗ Failed to create order: ${err.message}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${failed}`);
  console.log(`\n🎉 Done! Check your dashboard - it should now show data!\n`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const backendUrl = args[0];
const orderCount = parseInt(args[1]) || 50;

if (!backendUrl) {
  console.error("\n❌ Error: Backend URL is required!\n");
  console.log("Usage: node populate-data.js <backend-url> [number-of-orders]");
  console.log("\nExample:");
  console.log("  node populate-data.js https://nexus-dashboard-server.onrender.com 50");
  console.log("");
  process.exit(1);
}

// Remove trailing slash if present
const cleanUrl = backendUrl.replace(/\/$/, "");

populateData(cleanUrl, orderCount);
