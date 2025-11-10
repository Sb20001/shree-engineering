import { useState, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { AnimatePresence } from "motion/react";
import { createClient } from "@supabase/supabase-js";
import { Toaster, toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "./utils/supabase/info";

// Components
import { SplashScreen } from "./components/SplashScreen";
import { Header } from "./components/Header";
import { Home } from "./components/Home";
import { Services } from "./components/Services";
import { Products } from "./components/Products";
import { ProductDetail } from "./components/ProductDetail";
import { Cart } from "./components/Cart";
import { Auth } from "./components/Auth";
import { Profile } from "./components/Profile";
import { Dashboard } from "./components/Dashboard";
import { Attendance } from "./components/Attendance";
import { Contact } from "./components/Contact";
import { AIChat } from "./components/AIChat";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [location, setLocation] = useLocation();

  const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchUser();
      fetchCartCount();
    }
  }, [accessToken]);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && !error) {
        setAccessToken(session.access_token);
      }
    } catch (error) {
      console.error("Session check error:", error);
    }
  };

  const fetchUser = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7ef5248e/auth/user`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchCartCount = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7ef5248e/cart`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCartCount(data.cart?.items?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  };

  const handleLogin = (token: string) => {
    setAccessToken(token);
    setLocation("/");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    setUser(null);
    setCartCount(0);
    setLocation("/");
    toast.success("Logged out successfully");
  };

  const handleAddToCart = async (productId: string, quantity: number = 1) => {
    if (!accessToken) {
      toast.error("Please login to add items to cart");
      setLocation("/login");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7ef5248e/cart`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ productId, quantity }),
        }
      );

      if (response.ok) {
        toast.success("Added to cart!");
        fetchCartCount();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("An error occurred");
    }
  };

  // Splash screen handling
  if (showSplash) {
    return (
      <AnimatePresence>
        <SplashScreen onComplete={() => setShowSplash(false)} />
      </AnimatePresence>
    );
  }

  // Login page (no header/footer)
  if (location === "/login" && !accessToken) {
    return (
      <>
        <Auth onLogin={handleLogin} />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} cartCount={cartCount} onLogout={handleLogout} />
      
      <Switch>
        <Route path="/">
          <Home />
        </Route>

        <Route path="/services">
          <Services />
        </Route>

        <Route path="/products">
          <Products onAddToCart={(id) => handleAddToCart(id, 1)} />
        </Route>

        <Route path="/products/:id">
          <ProductDetail onAddToCart={handleAddToCart} />
        </Route>

        <Route path="/cart">
          {accessToken ? (
            <Cart accessToken={accessToken} onCartUpdate={fetchCartCount} />
          ) : (
            <Auth onLogin={handleLogin} />
          )}
        </Route>

        <Route path="/profile">
          {accessToken && user ? (
            <Profile accessToken={accessToken} user={user} onUpdate={fetchUser} />
          ) : (
            <Auth onLogin={handleLogin} />
          )}
        </Route>

        <Route path="/dashboard">
          {accessToken && user && (user.role === 'member' || user.role === 'owner') ? (
            <Dashboard accessToken={accessToken} user={user} />
          ) : (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl mb-4 text-gray-900">Access Denied</h2>
                <p className="text-gray-600 mb-6">
                  You don't have permission to access this page
                </p>
                <button
                  onClick={() => setLocation("/")}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          )}
        </Route>

        <Route path="/attendance">
          {accessToken && user && user.role === 'employee' ? (
            <Attendance accessToken={accessToken} user={user} />
          ) : accessToken && user && user.role === 'owner' ? (
            <Attendance accessToken={accessToken} user={user} />
          ) : (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl mb-4 text-gray-900">Access Denied</h2>
                <p className="text-gray-600 mb-6">
                  Only employees and owners can access attendance
                </p>
                <button
                  onClick={() => setLocation("/")}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          )}
        </Route>

        <Route path="/contact">
          <Contact />
        </Route>

        <Route path="/login">
          {accessToken ? (
            <Home />
          ) : (
            <Auth onLogin={handleLogin} />
          )}
        </Route>

        <Route>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl mb-4 text-gray-900">404</h1>
              <p className="text-xl text-gray-600 mb-8">Page not found</p>
              <button
                onClick={() => setLocation("/")}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </Route>
      </Switch>

      <AIChat />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
                <h3 className="text-xl mb-4">Shree Engineering</h3>
              <p className="text-gray-400">
                  Your trusted partner for quality machinery components worldwide.
              </p>
            </div>
            <div>
              <h4 className="mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/" className="text-gray-400 hover:text-white transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a href="/services" className="text-gray-400 hover:text-white transition-colors">
                    Services
                  </a>
                </li>
                <li>
                  <a href="/products" className="text-gray-400 hover:text-white transition-colors">
                    Products
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-gray-400 hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Support</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">FAQ</li>
                <li className="text-gray-400">Shipping Info</li>
                <li className="text-gray-400">Returns</li>
                <li className="text-gray-400">Warranty</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>+91 7797102003</li>
                <li>shreeengineering@gmail.com</li>
                <li>123 Industrial Way</li>
                <li>west bengal, District  :north 24 pgs</li>
                <li>kolkata, pin 700001 </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Shree Engineering. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <Toaster position="top-right" richColors />
    </div>
  );
}
