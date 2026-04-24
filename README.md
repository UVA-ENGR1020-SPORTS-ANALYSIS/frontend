# Tabletop Basketball — Frontend

This is the frontend for the Tabletop Basketball application. It provides a real-time web interface for players to join games, submit their shots, view their personal statistics, and see the interactive leaderboard and zone heatmaps.

## 🚀 Tech Stack

- **Framework:** React + TypeScript
- **Build Tool:** Vite
- **Styling:** Vanilla CSS (responsive and dark-mode ready)

## 📦 Setup & Running locally

### 1. Install Dependencies

Make sure you have Node.js (v18+ recommended) installed. Then run:

```bash
npm install
```

### 2. Environment Variables

Create a `.env.development` file in the `frontend` root directory. By default, the app expects the backend to be running on `http://localhost:8000`.

```ini
VITE_API_URL=http://localhost:8000
```

### 3. Run the Development Server

Start the Vite development server:

```bash
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173).

## 📁 Project Structure

```
src/
├── api/             # API wrappers for communicating with the FastAPI backend
├── assets/          # Static assets like images and logos
├── components/      # Reusable React components (modals, scorecards, lists)
├── hooks/           # Custom React hooks (e.g., polling hooks)
├── routes/          # Page-level components corresponding to React Router routes
├── App.tsx          # Main application router and state provider
└── index.css        # Global CSS variables and utility classes
```

## 🏗️ Building for Production

To create a production-ready build:

```bash
npm run build
```

The compiled assets will be output to the `dist/` folder, which can be served by any static web server (e.g., Nginx, Vercel, Netlify).
