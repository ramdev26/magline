# Magline Management System

A web application for **Magline Switchboards (Pvt) Ltd** to manage customers, orders, product categories, and sales team performance in one place.

## Features

- **Dashboard** — Sales totals, active orders, customer count, and revenue by category (LV, CMS, MEP)
- **Customers** — Add and browse customer records with contact details
- **Orders** — Track orders by status, category, amount, and assigned sales person
- **Sales Team** — View sales persons, managers, and performance metrics

## Tech Stack

- [React](https://react.dev/) 19 + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for the frontend build
- [Express](https://expressjs.com/) API server with in-memory data (ready to swap for a database)
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React Router](https://reactrouter.com/) for navigation

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- npm (included with Node.js)

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/ramdev26/magline.git
   cd magline
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command        | Description                                      |
| -------------- | ------------------------------------------------ |
| `npm run dev`  | Start the app in development mode (port 3000)    |
| `npm run build`| Build the frontend and bundle the server         |
| `npm start`    | Run the production build                         |
| `npm run lint` | Type-check the project with TypeScript           |

## Production Build

```bash
npm run build
npm start
```

The server serves the built frontend from `dist/` and exposes the REST API on the same port.

## API Overview

| Method | Endpoint           | Description                    |
| ------ | ------------------ | ------------------------------ |
| GET    | `/api/health`      | Health check                   |
| GET    | `/api/dashboard`   | Dashboard statistics           |
| GET    | `/api/customers`   | List customers                 |
| POST   | `/api/customers`   | Create a customer              |
| GET    | `/api/orders`      | List orders                    |
| POST   | `/api/orders`      | Create an order                |
| GET    | `/api/sales`       | Sales persons and managers     |

Data is stored in memory during development. Replace the in-memory store in `server.ts` with SQLite, PostgreSQL, or another database for production use.

## Project Structure

```
├── server.ts              # Express API + Vite dev middleware
├── src/
│   ├── App.tsx            # Routes and layout
│   ├── components/        # Dashboard, Customers, Orders, SalesTeam, Sidebar
│   └── types.ts           # Shared TypeScript types
├── index.html
├── vite.config.ts
└── package.json
```

## License

Private — Magline Switchboards (Pvt) Ltd.
