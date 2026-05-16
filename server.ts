import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mock Database (can be replaced with SQLite or similar)
  // For the purpose of this demo, we'll use in-memory storage.
  const db = {
    customers: [
      { id: "1", name: "Alpha Constructions", contact: "John Doe", email: "john@alpha.com", phone: "123-456-7890", address: "123 Industrial Way" },
      { id: "2", name: "Beta Electricals", contact: "Jane Smith", email: "jane@beta.com", phone: "098-765-4321", address: "456 Power St" },
    ],
    orders: [
      { id: "ORD001", customerId: "1", amount: 5000, status: "Pending", category: "LV", date: "2026-05-15", salesPersonId: "S001" },
      { id: "ORD002", customerId: "2", amount: 12000, status: "Completed", category: "CMS", date: "2026-05-10", salesPersonId: "S002" },
    ],
    salesPersons: [
      { id: "S001", name: "Kamal Perera", performance: 85, history: ["ORD001"] },
      { id: "S002", name: "Nimal Silva", performance: 92, history: ["ORD002"] },
    ],
    salesManagers: [
      { id: "M001", name: "Aruna Jay", department: "LV Units" },
    ],
    categories: ["LV", "CMS", "MEP"]
  };

  app.get("/api/dashboard", (req, res) => {
    const totalSales = db.orders.reduce((acc, curr) => acc + curr.amount, 0);
    const activeOrders = db.orders.filter(o => o.status === "Pending").length;
    const statsByCategory = db.categories.map(cat => ({
      name: cat,
      value: db.orders.filter(o => o.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
    }));
    res.json({ totalSales, activeOrders, totalCustomers: db.customers.length, statsByCategory });
  });

  app.get("/api/customers", (req, res) => res.json(db.customers));
  app.post("/api/customers", (req, res) => {
    const newCustomer = { ...req.body, id: Date.now().toString() };
    db.customers.push(newCustomer);
    res.json(newCustomer);
  });

  app.get("/api/orders", (req, res) => res.json(db.orders));
  app.post("/api/orders", (req, res) => {
    const newOrder = { ...req.body, id: `ORD${Date.now()}` };
    db.orders.push(newOrder);
    res.json(newOrder);
  });

  app.get("/api/sales", (req, res) => res.json({ persons: db.salesPersons, managers: db.salesManagers }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
