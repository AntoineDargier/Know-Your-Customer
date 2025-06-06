import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./pages/Home";
import ApiKeyInput from "./components/ApiKeyInput";
import SupplierAnalysis from "./pages/SupplierAnalysis";
import GlobalScan from "./pages/GlobalScan";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// This component is removed since we now use environment variables on the server
// The ApiKeyInput component is kept for legacy purposes, but is not used in the main workflow
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/supplier-analysis" element={<SupplierAnalysis />} />
            <Route path="/global-scan" element={<GlobalScan />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
