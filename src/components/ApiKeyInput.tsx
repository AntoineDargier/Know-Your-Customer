
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Shield } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// IMPORTANT NOTE:
// This component is kept for legacy purposes but is no longer used in the main workflow.
// The Perplexity API key is now stored as an environment variable in Azure.
// This component can be used as a fallback during development or if environment variables are not available.

const ApiKeyInput = () => {
  const [apiKey, setApiKey] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: "Clé API Requise",
        description: "Veuillez entrer votre clé API Perplexity pour continuer.",
        variant: "destructive",
      });
      return;
    }

    // Store the API key in localStorage - for development/testing only
    // In production, the API key should be stored as an environment variable in Azure
    localStorage.setItem("perplexityApiKey", apiKey);
    
    toast({
      title: "Information",
      description: "Cette méthode est destinée uniquement au développement. En production, utilisez les variables d'environnement Azure.",
      variant: "default",
    });
    
    // Navigate to the home page
    navigate("/home");
  };

  return (
    <div className="max-w-md w-full mx-auto px-6 py-8 bg-white rounded-lg shadow-md">
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Shield className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-center">Bienvenue sur Auditia</h1>
        <p className="text-muted-foreground text-center mt-2">
          Veuillez entrer votre clé API Perplexity pour continuer
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Entrez votre clé API Perplexity"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full">
            Continuer
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ApiKeyInput;
