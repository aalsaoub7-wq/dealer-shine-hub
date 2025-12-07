import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import CarDetail from "./pages/CarDetail";
import SharedPhotos from "./pages/SharedPhotos";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Documentation from "./pages/Documentation";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NativeRouter } from "./components/NativeRouter";
import { NativeLayout } from "./components/NativeLayout";
import { isNativeApp } from '@/lib/utils';
import { hideSplashScreen, setupAppListeners, removeAppListeners } from '@/lib/nativeCapabilities';

const queryClient = new QueryClient();

const App = () => {
  // Native app initialization
  useEffect(() => {
    const initNative = async () => {
      if (isNativeApp()) {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        const { Keyboard } = await import('@capacitor/keyboard');

        // Status bar styling
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setBackgroundColor({ color: '#0a0a0f' });
        StatusBar.setOverlaysWebView({ overlay: true });

        // Hide splash screen after app is ready
        setTimeout(() => {
          hideSplashScreen();
        }, 500);

        // Setup app listeners for back button and deep links
        setupAppListeners();

        // Keyboard configuration
        Keyboard.setAccessoryBarVisible({ isVisible: true });
      }
    };

    initNative();

    return () => {
      if (isNativeApp()) {
        removeAppListeners();
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <NativeRouter>
              <NativeLayout>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/car/:id" element={<ProtectedRoute><CarDetail /></ProtectedRoute>} />
                  <Route path="/shared/:token" element={<SharedPhotos />} />
                  <Route path="/integritetspolicy" element={<PrivacyPolicy />} />
                  <Route path="/användarvillkor" element={<TermsOfService />} />
                  <Route path="/docs" element={<Documentation />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </NativeLayout>
            </NativeRouter>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
