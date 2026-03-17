import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ScrollToTop } from "./components/ScrollToTop";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { OwnerLayout } from "./components/OwnerLayout";
import Home from "./pages/Home";
import AddToQueue from "./pages/AddToQueue";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import GuestSignIn from "./pages/GuestSignIn";
import StoreList from "./pages/StoreList";
import Landing from "./pages/Landing";
import Scan from "./pages/Scan";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route element={<OwnerLayout />}>
              <Route path="/:storeId" element={<Home />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/:storeId/add" element={<AddToQueue />} />
              <Route element={<OwnerLayout />}>
                <Route path="/:storeId/settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="/" element={<Landing />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/stores" element={<StoreList />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/guest" element={<GuestSignIn />} />

{/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
