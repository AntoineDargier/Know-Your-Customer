
import IconCard from "@/components/IconCard";
import { FileSearch, ScanSearch, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const handleSupplierAnalysis = () => {
    navigate("/supplier-analysis");
  };

  const handleGlobalScan = () => {
    navigate("/global-scan");
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <img
              src="/app-logo.png"
              alt="Logo Klear"
              className="h-36 mx-auto"
            />
          <h1 className="text-6xl font-extrabold mb-4">
            <span className="block text-gray-400 text-xl font-medium mt-2">
              by eleven strategy
            </span>
          </h1>
          <p className="text-xl text-gray-500">
            Solution IA d'analyse de conformité fournisseurs pour les directions achats
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <IconCard
            title="Analyse d'un nouveau fournisseur"
            description="Analysez en détail un fournisseur spécifique en téléversant ses documents pour obtenir une évaluation complète des risques."
            icon={<FileSearch className="w-10 h-10" style={{ color: "#4FB583" }} />}
            buttonText="Analyser un fournisseur"
            buttonIcon={<FileSearch className="w-5 h-5" />}
            onClick={handleSupplierAnalysis}
            features={[
              "Extraction automatique du contenu des documents",
              "Analyse approfondie par IA",
              "Identification des points de vigilance",
            ]}
            accentColor="primary"
          />

          <IconCard
            title="Analyse de vos fournisseurs actuels"
            description="Obtenez une vision d'ensemble de la fiabilité de tous vos fournisseurs et identifiez ceux qui présentent des risques."
            icon={<ScanSearch className="w-10 h-10" style={{ color: "#333399" }} />}
            buttonText="Analyser les fournisseurs"
            buttonIcon={<Shield className="w-5 h-5" />}
            onClick={handleGlobalScan}
            features={[
              "Analyse automatisée de tous vos fournisseurs",
              "Identification des fournisseurs à risque",
              "Mise en évidence des points critiques",
            ]}
            accentColor="secondary"
          />
        </div>
      </div>
      {/* Footer */}
      <footer className="mt-16 text-center text-gray-600">
        <div className="flex flex-col items-center gap-4 py-8">
          <img
            src="/eleven-logo.png"
            alt="Logo Eleven Strategy"
            className="h-12"
          />
          <p className="text-sm">
            Solution développée par Eleven Strategy
          </p>
          <div className="text-sm space-y-1">
            <p>
              <a
                href="https://www.linkedin.com/company/eleven-strategy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                LinkedIn
              </a>{" "}
              |{" "}
              <a
                href="https://eleven-strategy.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Site web
              </a>
            </p>
            <p>📞 +33 1 44 17 41 55</p>
            <p>🏢 5 avenue Pierre 1er de Serbie, 75 116 Paris, France</p>
            <p> All rights reserved Eleven Strategy ©2025 </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
