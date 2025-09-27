import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Home from "@/pages/home";
import Services from "@/pages/services";
import ServiceDetail from "@/pages/service-detail";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Gallery from "@/pages/gallery";
import Admin from "@/pages/admin";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/services/:serviceId" component={ServiceDetail} />
        <Route path="/services" component={Services} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/gallery" component={Gallery} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/admin">{() => <ProtectedRoute component={Admin} />}</Route>
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <Router />
              </main>
              <Footer />
            </div>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
