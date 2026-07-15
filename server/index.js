require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// CORS configuration for both HTTP and Socket.io
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: corsOrigin, credentials: true }
});

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
mongoose.connect(mongoUri)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

const orderSchema = new mongoose.Schema({
  product: String,
  city: String,
  amount: Number,
  timestamp: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", orderSchema);

// In-memory trending tracker: { productName: count }
let trendingCounts = {};

// Reset the trending window every 5 minutes
setInterval(() => {
  trendingCounts = {};
  console.log("Trending window reset");
}, 5 * 60 * 1000);

// Every 3 seconds, compute and broadcast the current top 3 trending products
setInterval(() => {
  const top3 = Object.entries(trendingCounts)
    .map(([product, count]) => ({ product, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  io.emit("trending_update", top3);
}, 3000);

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    message: "Nexus Dashboard Server is running",
    timestamp: new Date().toISOString()
  });
});

app.post("/orders", async (req, res) => {
  try {
    const { product, city, amount } = req.body;
    const newOrder = new Order({ product, city, amount });
    await newOrder.save();

    // Increment this product's trending count
    trendingCounts[product] = (trendingCounts[product] || 0) + 1;

    io.emit("new_order", newOrder);

    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/orders", async (req, res) => {
  const orders = await Order.find().sort({ timestamp: -1 });
  res.json(orders);
});

io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
