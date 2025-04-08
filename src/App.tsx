import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Farm } from "./pages/Farm";
import { TokenLocker } from "./pages/TokenLocker";
import PoolDetails from "./pages/PoolDetails";
import MyPositions from "./pages/MyPositions";
import { BackgroundProvider } from "./contexts/BackgroundContext";

const App = () => {
  return (
    <BackgroundProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/farm" element={<Farm />} />
            <Route path="/token-locker" element={<TokenLocker />} />
            <Route path="/pool/:typeString" element={<PoolDetails />} />
            <Route path="/my-positions" element={<MyPositions />} />
            {/* Add a catch-all redirect */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Layout>

        {/* Fixed Toaster implementation */}
        <Toaster
          position="top-right"
          expand={false}
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "rgba(15, 23, 42, 0.95)",
              color: "white",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            },
            duration: 5000,
            classNames: {
              toast: "font-medium text-sm",
            },
          }}
        />
      </Router>
    </BackgroundProvider>
  );
};

export default App;
