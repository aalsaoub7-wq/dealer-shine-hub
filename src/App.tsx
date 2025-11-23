import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import CarDetail from "./pages/CarDetail";
import SharedPhotos from "./pages/SharedPhotos";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NativeRouter } from "./components/NativeRouter";
import { StatusBar, Style } from '@capacitor/status-bar';
import { isNativeApp } from '@/lib/utils';

const queryClient = new QueryClient();

const App = () => {
  // Sätt status bar styling ENDAST i native
  useEffect(() => {
    if (isNativeApp()) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#0a0a0f' });
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <NativeRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/car/:id" element={<ProtectedRoute><CarDetail /></ProtectedRoute>} />
                <Route path="/shared/:token" element={<SharedPhotos />} />
                <Route path="/integritetspolicy" element={<PrivacyPolicy />} />
                <Route path="/användarvillkor" element={<TermsOfService />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NativeRouter>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
