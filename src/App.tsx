import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import Home from "./pages/Home";
import Layanan from "./pages/Layanan";
import Produk from "./pages/Produk";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Kontak from "./pages/Kontak";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import TestAdmin from "./pages/test-admin";
import DeleteProducts from "./pages/delete-products";
import AddProductPage from "./pages/add-product";
import AddAdmin from "./pages/add-admin";
import EditProfile from "./pages/edit-profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/layanan" element={<Layanan />} />
            <Route path="/produk" element={<Produk />} />
            <Route path="/produk/:id" element={<ProductDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/kontak" element={<Kontak />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/test-admin" element={<TestAdmin />} />
            <Route path="/delete-products" element={<DeleteProducts />} />
            <Route path="/add-product" element={<AddProductPage />} />
            <Route path="/add-admin" element={<AddAdmin />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
