import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const socket = io("http://localhost:5000");

const COLORS = {
  bg: "#1B1B24",
  surface: "#242430",
  ink: "#EDEBF2",
  muted: "#9B96AE",
  signal: "#B9A6F0",
  amber: "#F7C9A0",
  red: "#F5A6A6",
  border: "#34333F"
};

const PALETTE = ["#B9A6F0", "#A6E3D4", "#F7C9A0", "#F5A6B9", "#A6C8F0", "#D9A6F0"];
const ALL_CITIES = ["Chennai", "Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Kolkata", "Pune", "Salem"];

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function App() {
  const [status, setStatus] = useState("connecting");
  const [orders, setOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("All");

  useEffect(() => {
    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));

    socket.on("new_order", (order) => {
      setOrders((prev) => [order, ...prev].slice(0, 200));
      setChartData((prev) => {
        const updated = [
          ...prev,
          { time: new Date(order.timestamp).toLocaleTimeString(), amount: order.amount }
        ];
        return updated.slice(-20);
      });
    });

    socket.on("trending_update", (data) => setTrending(data));

    fetch("http://localhost:5000/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.slice(0, 200)))
      .catch((err) => console.log("Failed to load initial orders:", err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const twoMinutesAgo = now - 120000;
  const ordersLastMinute = orders.filter(
    (o) => new Date(o.timestamp).getTime() > oneMinuteAgo
  ).length;

  const recentRevenue = orders
    .filter((o) => new Date(o.timestamp).getTime() > oneMinuteAgo)
    .reduce((sum, o) => sum + o.amount, 0);
  const priorRevenue = orders
    .filter((o) => {
      const t = new Date(o.timestamp).getTime();
      return t > twoMinutesAgo && t <= oneMinuteAgo;
    })
    .reduce((sum, o) => sum + o.amount, 0);

  const alerts = [];
  if (priorRevenue > 0 && recentRevenue < priorRevenue * 0.6) {
    alerts.push({
      type: "warning",
      text: `Revenue dip detected — down ${Math.round((1 - recentRevenue / priorRevenue) * 100)}% vs the previous minute`
    });
  }
  trending.forEach((item) => {
    if (item.count >= 4) {
      alerts.push({
        type: "info",
        text: `High demand: "${truncate(item.product, 30)}" — ${item.count} orders in 5 min, consider restocking`
      });
    }
  });

  const cityMap = {};
  orders.forEach((o) => {
    cityMap[o.city] = (cityMap[o.city] || 0) + o.amount;
  });
  const cityData = Object.entries(cityMap)
    .map(([city, revenue]) => ({ city, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const productMap = {};
  orders.forEach((o) => {
    productMap[o.product] = (productMap[o.product] || 0) + 1;
  });
  const productData = Object.entries(productMap)
    .map(([name, value]) => ({ name: truncate(name, 18), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === "All" || o.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap');
          body { margin: 0; background: ${COLORS.bg}; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .spinner {
            width: 28px;
            height: 28px;
            border: 3px solid ${COLORS.border};
            border-top-color: ${COLORS.signal};
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
        `}</style>
        <div className="spinner" />
        <p style={{ color: COLORS.muted, fontFamily: "Inter, sans-serif", marginTop: "16px", fontSize: "14px" }}>
          Loading Nexus dashboard...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: ${COLORS.bg}; }
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0 rgba(185, 166, 240, 0.55); }
          70%  { box-shadow: 0 0 0 8px rgba(185, 166, 240, 0); }
          100% { box-shadow: 0 0 0 0 rgba(185, 166, 240, 0); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${COLORS.signal};
          animation: pulse 1.8s infinite;
          flex-shrink: 0;
        }
        .order-row { animation: rowIn 0.35s ease-out; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 8px; }
        .nexus-input, .nexus-select {
          background: ${COLORS.bg};
          border: 1px solid ${COLORS.border};
          color: ${COLORS.ink};
          border-radius: 8px;
          padding: 8px 12px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          outline: none;
        }
        .nexus-input:focus, .nexus-select:focus { border-color: ${COLORS.signal}; }
        .nexus-input::placeholder { color: ${COLORS.muted}; }
      `}</style>

      <header style={styles.header}>
        <div>
          <h1 style={styles.h1}>Nexus</h1>
          <p style={styles.subtitle}>Real-time e-commerce pulse</p>
        </div>
        <div style={styles.statusPill}>
          <span className="pulse-dot" />
          <span style={styles.statusText}>
            {status === "connected" ? "Live" : status}
          </span>
        </div>
      </header>

      {alerts.length > 0 && (
        <section style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {alerts.map((a, i) => (
            <div
              key={i}
              style={{
                background: COLORS.surface,
                border: `1px solid ${a.type === "warning" ? COLORS.red : COLORS.amber}`,
                borderRadius: "10px",
                padding: "12px 16px",
                fontSize: "13px",
                color: COLORS.ink,
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}
            >
              <span style={{ color: a.type === "warning" ? COLORS.red : COLORS.amber, fontWeight: 700 }}>
                {a.type === "warning" ? "⚠" : "●"}
              </span>
              {a.text}
            </div>
          ))}
        </section>
      )}

      <section style={styles.kpiRow}>
        <KpiCard label="Total orders" value={totalOrders} />
        <KpiCard label="Total revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} />
        <KpiCard label="Avg order value" value={`₹${avgOrderValue.toLocaleString("en-IN")}`} />
        <KpiCard label="Orders / last min" value={ordersLastMinute} accent={COLORS.amber} />
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Trending now (last 5 min)</h2>
        {trending.length === 0 ? (
          <p style={{ color: COLORS.muted, fontSize: "13px" }}>Waiting for order activity...</p>
        ) : (
          <div style={{ display: "flex", gap: "16px" }}>
            {trending.map((item, i) => (
              <div
                key={item.product}
                style={{
                  ...styles.kpiCard,
                  flex: 1,
                  borderLeft: `4px solid ${PALETTE[i % PALETTE.length]}`
                }}
              >
                <div style={styles.kpiLabel}>#{i + 1} trending</div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: COLORS.ink, marginTop: "4px" }}>
                  {truncate(item.product, 22)}
                </div>
                <div style={{ fontSize: "12px", color: COLORS.muted, marginTop: "4px" }}>
                  {item.count} order{item.count !== 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Revenue over time</h2>
        {chartData.length === 0 ? (
          <EmptyState text="No live data yet — waiting for the first order..." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: COLORS.muted, fontSize: 12, fontFamily: "Inter" }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
              <YAxis tick={{ fill: COLORS.muted, fontSize: 12, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontFamily: "Inter", fontSize: 13, color: COLORS.ink }} />
              <Line type="monotone" dataKey="amount" stroke={COLORS.signal} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>

      <section style={styles.chartGrid}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Revenue by city</h2>
          {cityData.length === 0 ? (
            <EmptyState text="No orders yet" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cityData} margin={{ bottom: 10 }}>
                <CartesianGrid stroke={COLORS.border} strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="city" interval={0} tick={{ fill: COLORS.muted, fontSize: 10, fontFamily: "Inter" }} axisLine={{ stroke: COLORS.border }} tickLine={false} angle={-40} textAnchor="end" height={65} />
                <YAxis tick={{ fill: COLORS.muted, fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontFamily: "Inter", fontSize: 13, color: COLORS.ink }} />
                <Bar dataKey="revenue" fill={COLORS.signal} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Orders by product</h2>
          {productData.length === 0 ? (
            <EmptyState text="No orders yet" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={productData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="42%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {productData.map((entry, index) => (
                    <Cell key={entry.name + index} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontFamily: "Inter", fontSize: 13, color: COLORS.ink }} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconSize={9}
                  wrapperStyle={{
                    fontSize: 11,
                    fontFamily: "Inter",
                    color: COLORS.ink,
                    paddingTop: 12
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <h2 style={{ ...styles.sectionTitle, margin: 0 }}>Live orders</h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              className="nexus-input"
              type="text"
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="nexus-select"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="All">All cities</option>
              {ALL_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState text={orders.length === 0 ? "No orders yet — new orders will appear here instantly." : "No orders match your filter."} />
        ) : (
          <div style={styles.feed}>
            {filteredOrders.slice(0, 50).map((order, i, arr) => (
              <div
                key={order._id + i}
                className="order-row"
                style={{
                  ...styles.orderRow,
                  borderBottom: i === arr.length - 1 ? "none" : `1px solid ${COLORS.border}`
                }}
              >
                <div style={styles.orderLeft}>
                  <div style={styles.product}>{order.product}</div>
                  <div style={styles.city}>{order.city}</div>
                </div>
                <div style={styles.amount}>₹{order.amount.toLocaleString("en-IN")}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({ label, value, accent }) {
  return (
    <div style={{ ...styles.kpiCard, borderLeft: `4px solid ${accent || COLORS.signal}` }}>
      <div style={styles.kpiLabel}>{label}</div>
      <div style={styles.kpiValue}>{value}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ padding: "32px 0", textAlign: "center", color: COLORS.muted, fontSize: "13px" }}>
      {text}
    </div>
  );
}

const styles = {
  loadingPage: {
    minHeight: "100vh",
    background: COLORS.bg,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  page: {
    minHeight: "100vh",
    background: COLORS.bg,
    color: COLORS.ink,
    fontFamily: "'Inter', sans-serif",
    padding: "40px 48px",
    maxWidth: "1200px",
    margin: "0 auto"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "32px"
  },
  h1: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "36px",
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-0.02em",
    color: COLORS.ink
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: "14px",
    margin: "4px 0 0 0"
  },
  statusPill: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "999px",
    padding: "8px 14px"
  },
  statusText: {
    fontSize: "13px",
    fontWeight: 500,
    color: COLORS.ink
  },
  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "24px"
  },
  kpiCard: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "12px",
    padding: "20px 22px"
  },
  kpiLabel: {
    fontSize: "12px",
    fontWeight: 500,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "10px"
  },
  kpiValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "26px",
    fontWeight: 700,
    color: COLORS.ink
  },
  card: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px"
  },
  chartGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px"
  },
  sectionTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "17px",
    fontWeight: 500,
    margin: "0 0 16px 0",
    color: COLORS.ink
  },
  feed: {
    maxHeight: "360px",
    overflowY: "auto"
  },
  orderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 4px"
  },
  orderLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    textAlign: "left"
  },
  product: {
    fontSize: "14px",
    fontWeight: 500,
    color: COLORS.ink,
    textAlign: "left"
  },
  city: {
    fontSize: "12px",
    color: COLORS.muted,
    marginTop: "2px",
    textAlign: "left"
  },
  amount: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "14px",
    fontWeight: 700,
    color: COLORS.ink
  }
};

export default App;
