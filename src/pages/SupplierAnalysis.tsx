
import FileUpload from "@/components/FileUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/utils/pdfUtils";
import { AlertCircle, ArrowLeft, CheckCircle, Download, FileSearch, Info, Search } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

const SupplierAnalysis = () => {
  const [supplierName, setSupplierName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  const handleFilesUploaded = (uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    toast({
      title: "Génération du PDF en cours",
      description: "Veuillez patienter pendant la création du fichier PDF...",
    });
    
    setTimeout(async () => {
      try {
        reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const success = await generatePDF(
          "supplier-report", 
          `Rapport_KYC_${result.generalInfo.name.replace(/\s+/g, '_')}.pdf`
        );
        
        if (success) {
          toast({
            title: "Téléchargement réussi",
            description: "Le rapport a été téléchargé avec succès.",
          });
        } else {
          toast({
            title: "Erreur de téléchargement",
            description: "Une erreur s'est produite lors de la génération du PDF.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erreur lors de la génération du PDF:", error);
        toast({
          title: "Erreur de téléchargement",
          description: "Une erreur s'est produite lors de la génération du PDF. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    }, 300);
  };

  const processFileContents = async (files: File[]) => {
    if (!files.length) return { fileContents: "", extractedText: "" }; 
    
    let fileContents = "Documents fournis par le fournisseur:\n";
    let extractedText = "";
    
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        fileContents += `\n- ${file.name} (${Math.round(file.size / 1024)} KB)`;
        
        try {
          if (file.type === "application/pdf") {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            // Get text from just the first page to limit content size
            const numPages = Math.min(pdf.numPages, 1);
            let fullText = "";
            
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .filter((item: any) => 'str' in item)
                .map((item: any) => item.str)
                .join(' ');
                
              fullText += pageText + "\n";
            }
            
            // Limit text to 2000 characters per file
            extractedText += fullText.substring(0, 2000) + "\n";
            fileContents += `\nContenu extrait du document: ${fullText.substring(0, 500)}...\n`;
          } else if (file.type === "text/plain" || file.type.includes("text/")) {
            const text = await file.text();
            extractedText += text.substring(0, 2000) + "\n";
            fileContents += `\nContenu: ${text.slice(0, 300)}...\n`;
          }
        } catch (error) {
          console.error(`Erreur de lecture du fichier ${file.name}:`, error);
          fileContents += `\nImpossible d'extraire le contenu\n`;
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement de PDF.js:", error);
    }
    
    return { fileContents, extractedText };
  };

  const parseAnalysisResult = (apiResponse: any) => {
    try {
      console.log("Parsing API response:", apiResponse);
      
      const content = apiResponse.choices?.[0]?.message?.content || "";
      
      if (!content) {
        console.error("Empty content in API response");
        throw new Error("Invalid API response format");
      }
      
      console.log("Extracted content:", content);
      
      // Extract sources from the content
      let extractedSources: string[] = [];
      
      // Try to extract sources section with numbered references like [1], [2]
      const sourcesSection = content.match(/Sources\s*:?\s*\n?([\s\S]*$)/i);
      if (sourcesSection && sourcesSection[1]) {
        const sourceLines = sourcesSection[1].split('\n').filter(line => line.trim());
        const sourceUrlPattern = /\[(.*?)\]\s*(https?:\/\/[^\s]+)/g;
        let match;
        
        while ((match = sourceUrlPattern.exec(sourcesSection[1])) !== null) {
          extractedSources.push(match[2]);
        }
      }
      
      // Also look for any URLs in the content as fallback
      if (extractedSources.length === 0) {
        const urlMatches = content.match(/(https?:\/\/[^\s\n]+)/g);
        if (urlMatches) {
          extractedSources = [...new Set(urlMatches as string[])];
        }
      }
      
      console.log("Extracted sources:", extractedSources);
      setSources(extractedSources);
      
      // Now parse the structured data from the content
      
      // We'll try to extract structured information from the text output
      // since Perplexity API doesn't always return perfect JSON
      
      // Create a more flexible parser for the structured data
      const parseSection = (content: string, sectionName: string): Record<string, string> => {
        const result: Record<string, string> = {};
        
        // Get the section content
        const sectionRegex = new RegExp(`###\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=###|$)`, 'i');
        const sectionMatch = content.match(sectionRegex);
        
        if (!sectionMatch) return result;
        
        const sectionContent = sectionMatch[1];
        
        // Extract field values using bullet points or key-value patterns
        const bulletPointPattern = /-\s*\*\*([^:]+)\*\*\s*:\s*([^\n]+)/g;
        const keyValuePattern = /\*\*([^:]+)\*\*\s*:\s*([^\n]+)/g;
        
        let bulletMatch;
        while ((bulletMatch = bulletPointPattern.exec(sectionContent)) !== null) {
          const key = bulletMatch[1].trim();
          const value = bulletMatch[2].trim();
          result[key.toLowerCase()] = value;
        }
        
        // If no bullet matches, try key-value pattern
        if (Object.keys(result).length === 0) {
          let kvMatch;
          while ((kvMatch = keyValuePattern.exec(sectionContent)) !== null) {
            const key = kvMatch[1].trim();
            const value = kvMatch[2].trim();
            result[key.toLowerCase()] = value;
          }
        }
        
        console.log(`Parsed ${sectionName} section:`, result);
        return result;
      };
      
      // Match sections to our expected data structure
      const generalInfo = parseSection(content, "Généralités");
      const ownership = parseSection(content, "Propriété");
      const financial = parseSection(content, "Financières");
      const regulatory = parseSection(content, "Réglementaires");
      const geographic = parseSection(content, "Géographiques");
      const reputation = parseSection(content, "Réputation");
      const documents = parseSection(content, "Documents");
      const riskAssessment = parseSection(content, "Évaluation globale du risque");
      
      // Helper function to get values with fallbacks
      const getValue = (obj: Record<string, string>, key: string, fallback: string = "Information non disponible"): string => {
        // Try different variations of the key
        const possibleKeys = [
          key.toLowerCase(),
          key.toUpperCase(),
          key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
        ];
        
        for (const possibleKey of possibleKeys) {
          if (obj[possibleKey] !== undefined) {
            return obj[possibleKey];
          }
        }
        
        // Handle common field variations
        if (key.toLowerCase() === "name" || key.toLowerCase() === "nom") {
          if (obj["raison sociale"]) return obj["raison sociale"];
          if (obj["nom"]) return obj["nom"];
        }
        
        if (key.toLowerCase() === "beneficialowners" || key.toLowerCase() === "propriétaires bénéficiaires") {
          if (obj["propriétaires"]) return obj["propriétaires"];
          if (obj["bénéficiaires effectifs"]) return obj["bénéficiaires effectifs"];
        }
        
        return fallback;
      };
      
      // Function to translate risk levels
      const translateRiskLevel = (riskLevel: string): string => {
        const lowRiskPatterns = [/faible/i, /low/i, /bas/i];
        const mediumRiskPatterns = [/moyen/i, /medium/i, /modéré/i];
        const highRiskPatterns = [/élevé/i, /high/i, /haut/i];
        
        for (const pattern of lowRiskPatterns) {
          if (pattern.test(riskLevel)) return "Faible";
        }
        
        for (const pattern of mediumRiskPatterns) {
          if (pattern.test(riskLevel)) return "Moyen";
        }
        
        for (const pattern of highRiskPatterns) {
          if (pattern.test(riskLevel)) return "Elevé";
        }
        
        return "Moyen"; // Default to medium
      };
      
      console.log("Structured data extraction complete, building final result");
      
      return {
        generalInfo: {
          name: getValue(generalInfo, "nom") || supplierName,
          legalForm: getValue(generalInfo, "forme juridique"),
          creationDate: getValue(generalInfo, "date de création"),
          address: getValue(generalInfo, "adresse"),
          country: getValue(generalInfo, "pays"),
          idNumber: getValue(generalInfo, "identifiant"),
          siret: getValue(generalInfo, "siret"),
        },
        ownership: {
          beneficialOwners: getValue(ownership, "propriétaires bénéficiaires"),
          capital: getValue(ownership, "capital"),
          directors: getValue(ownership, "dirigeants"),
          publicEntities: getValue(ownership, "liens publics"),
          riskLevel: translateRiskLevel(getValue(ownership, "niveau de risque", "Moyen")),
        },
        financial: {
          keyIndicators: getValue(financial, "indicateurs clés") || getValue(financial, "indicateurs"),
          solvency: getValue(financial, "solvabilité"),
          recentEvolution: getValue(financial, "évolution récente") || getValue(financial, "évolution"),
          riskLevel: translateRiskLevel(getValue(financial, "niveau de risque", "Moyen")),
        },
        regulatory: {
          sanctions: getValue(regulatory, "sanctions"),
          watchlists: getValue(regulatory, "listes de surveillance"),
          sectorStandards: getValue(regulatory, "normes sectorielles"),
          riskLevel: translateRiskLevel(getValue(regulatory, "niveau de risque", "Moyen")),
        },
        geographic: {
          operationLocations: getValue(geographic, "lieux d'opération"),
          jurisdictionalRisks: getValue(geographic, "risques juridictionnels"),
          taxHavens: getValue(geographic, "paradis fiscaux"),
          riskLevel: translateRiskLevel(getValue(geographic, "niveau de risque", "Moyen")),
        },
        reputation: {
          pressReview: getValue(reputation, "revue de presse"),
          litigationHistory: getValue(reputation, "litiges") || getValue(reputation, "antécédents de litiges"),
          eReputation: getValue(reputation, "e-réputation"),
          riskLevel: translateRiskLevel(getValue(reputation, "niveau de risque", "Moyen")),
        },
        documents: {
          legalDocs: getValue(documents, "documents légaux") || (files.length > 0 ? "Documents fournis" : "Aucun document fourni"),
          complianceDocs: getValue(documents, "documents de conformité"),
          completeness: getValue(documents, "complétude") || (files.length > 0 ? "Dossier partiellement complet" : "Dossier incomplet"),
          riskLevel: translateRiskLevel(getValue(documents, "niveau de risque", "Moyen")),
        },
        riskAssessment: {
          overallRisk: translateRiskLevel(getValue(riskAssessment, "niveau global du risque", "Moyen")),
          attentionPoints: getValue(riskAssessment, "points d'attention"),
          recommendations: getValue(riskAssessment, "recommandations")
        }
      };
    } catch (error) {
      console.error("Error parsing API response:", error);
      return {
        generalInfo: {
          name: supplierName,
          legalForm: "Information non disponible",
          creationDate: "Information non disponible",
          address: "Information non disponible",
          country: "Information non disponible",
          idNumber: "Information non disponible",
          siret: "Information non disponible",
        },
        ownership: {
          beneficialOwners: "Information non disponible",
          capital: "Information non disponible",
          directors: "Information non disponible",
          publicEntities: "Information non disponible",
          riskLevel: "Moyen"
        },
        financial: {
          keyIndicators: "Information non disponible",
          solvency: "Information non disponible",
          recentEvolution: "Information non disponible",
          riskLevel: "Moyen"
        },
        regulatory: {
          sanctions: "Information non disponible",
          watchlists: "Information non disponible",
          sectorStandards: "Information non disponible",
          riskLevel: "Moyen"
        },
        geographic: {
          operationLocations: "Information non disponible",
          jurisdictionalRisks: "Information non disponible",
          taxHavens: "Information non disponible",
          riskLevel: "Moyen"
        },
        reputation: {
          pressReview: "Information non disponible",
          litigationHistory: "Information non disponible",
          eReputation: "Information non disponible",
          riskLevel: "Moyen"
        },
        documents: {
          legalDocs: files.length > 0 ? "Documents fournis" : "Aucun document fourni",
          complianceDocs: "Information non disponible",
          completeness: files.length > 0 ? "Dossier partiellement complet" : "Dossier incomplet",
          riskLevel: "Moyen"
        },
        riskAssessment: {
          overallRisk: "Moyen",
          attentionPoints: "Données insuffisantes pour une analyse complète",
          recommendations: "Collecter davantage d'informations sur ce fournisseur"
        }
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir le nom du fournisseur",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let extractedText = "";
      
      if (files.length > 0) {
        const { extractedText: text } = await processFileContents(files);
        extractedText = text;
      }

      const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
      
      if (!apiKey) {
        throw new Error("Clé API Perplexity non disponible");
      }

      let documentContent = "";
      if (files.length > 0 && extractedText.length > 0) {
        const maxTextLength = 3000;
        if (extractedText.length > maxTextLength) {
          documentContent = extractedText.substring(0, maxTextLength) + "... (texte tronqué pour l'API)";
          console.log("Text was truncated from", extractedText.length, "to", maxTextLength, "characters");
        } else {
          documentContent = extractedText;
        }
      }

      const promptMessages = [
        {
          role: "system",
          content: `Vous êtes un assistant d'analyse KYC qui fournit des informations structurées sur les entreprises. Utilisez uniquement des informations factuelles et vérifiables provenant de sources fiables. Votre réponse doit être structurée avec des sections clairement délimitées par des en-têtes '### [Nom de section]' comme indiqué ci-dessous.

          Format attendu:
          
          ### Généralités
          - **Nom** : Nom de l'entreprise
          - **Forme juridique** : Forme juridique
          - **Date de création** : Date de création
          - **Adresse** : Adresse
          - **Pays** : Pays
          - **Identifiant** : Identifiant
          - **SIRET** : SIRET
          
          ### Propriété
          - **Propriétaires bénéficiaires** : Propriétaires
          - **Capital** : Capital
          - **Dirigeants** : Dirigeants
          - **Liens publics** : Liens avec entités publiques
          - **Niveau de risque** : Faible/Moyen/Elevé
          
          ### Financières
          - **Indicateurs clés** : Indicateurs financiers
          - **Solvabilité** : Solvabilité
          - **Évolution récente** : Évolution
          - **Niveau de risque** : Faible/Moyen/Elevé
          
          ### Réglementaires
          - **Sanctions** : Sanctions
          - **Listes de surveillance** : Listes
          - **Normes sectorielles** : Normes
          - **Niveau de risque** : Faible/Moyen/Elevé
          
          ### Géographiques
          - **Lieux d'opération** : Lieux
          - **Risques juridictionnels** : Risques
          - **Paradis fiscaux** : Paradis fiscaux
          - **Niveau de risque** : Faible/Moyen/Elevé
          
          ### Réputation
          - **Revue de presse** : Revue
          - **Litiges** : Litiges
          - **E-réputation** : E-réputation
          - **Niveau de risque** : Faible/Moyen/Elevé
          
          ### Documents
          - **Documents légaux** : Documents
          - **Documents de conformité** : Documents
          - **Complétude** : Complétude
          - **Niveau de risque** : Faible/Moyen/Elevé
          
          ### Évaluation globale du risque
          - **Niveau global du risque** : Faible/Moyen/Elevé
          - **Points d'attention** : Points
          - **Recommandations** : Recommandations
          
          ### Sources
          - [1] URL1
          - [2] URL2
          etc.`
        },
        {
          role: "user",
          content: `Effectuez une analyse KYC détaillée pour l'entreprise "${supplierName}". Recherchez des informations publiques fiables pour construire une évaluation factuelle complète.
          
          ${documentContent ? `
          IMPORTANT: Voici le contenu extrait des documents fournis par le fournisseur. Basez-vous EN PRIORITÉ sur ces informations pour votre analyse, et complétez avec des informations publiques si nécessaire:
          
          ${documentContent}
          ` : "Aucun document n'a été fourni par le fournisseur."}`
        }
      ];

      console.log("Sending request to Perplexity API...");
      console.log("Using model: llama-3.1-sonar-small-128k-online");
      
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: promptMessages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error response:", errorText);
        throw new Error(`Erreur API: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Perplexity API response:", data);
      
      const analysisResult = parseAnalysisResult(data);
      console.log("Parsed analysis result:", analysisResult);
      setResult(analysisResult);
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Erreur d'analyse",
        description: `Une erreur s'est produite: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-8">
          <Link to="/home" className="mr-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: "#4FB583" }}>Analyse d'un nouveau fournisseur</h1>
        </div>

        {!result ? (
          <div className="max-w-xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5 text-primary" />
                  Analyser un nouveau fournisseur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="supplier-name" className="text-sm font-medium">
                      Nom du fournisseur
                    </label>
                    <Input
                      id="supplier-name"
                      type="text"
                      placeholder="Entrez le nom du fournisseur à analyser"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Documents du fournisseur (optionnel)
                    </label>
                    <FileUpload onFilesUploaded={handleFilesUploaded} />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>Analyse en cours...</>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Lancer l'analyse
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div id="supplier-report" className="max-w-4xl mx-auto bg-white rounded-lg shadow overflow-visible" ref={reportRef}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{result.generalInfo.name}</h2>
                  <p className="text-gray-500">{result.generalInfo.legalForm}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger PDF
                  </Button>
                  
                  <Badge 
                    variant={result.riskAssessment.overallRisk === "Faible" ? "outline" : "destructive"}
                    className="text-sm"
                  >
                    {result.riskAssessment.overallRisk === "Faible" ? (
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    )}
                    Risque {result.riskAssessment.overallRisk}
                  </Badge>
                </div>
              </div>
            </div>

            <Tabs defaultValue="general">
              <div className="px-6 pt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="general">Général</TabsTrigger>
                  <TabsTrigger value="ownership">Structure</TabsTrigger>
                  <TabsTrigger value="financial">Financier</TabsTrigger>
                  <TabsTrigger value="compliance">Conformité</TabsTrigger>
                  <TabsTrigger value="risk">Risques</TabsTrigger>
                  <TabsTrigger value="sources">Sources</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="general" className="p-6">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-medium mb-3">Informations générales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Raison sociale</p>
                        <p>{result.generalInfo.name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Forme juridique</p>
                        <p>{result.generalInfo.legalForm}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Date de création</p>
                        <p>{result.generalInfo.creationDate}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Pays d'immatriculation</p>
                        <p>{result.generalInfo.country}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Numéro d'identification</p>
                        <p>{result.generalInfo.idNumber}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Numéro SIRET</p>
                        <p>{result.generalInfo.siret}</p>
                      </div>
                    </div>
                  </section>

                  <Separator />
                  
                  <section>
                    <h3 className="text-lg font-medium mb-3">Localisation</h3>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Adresse du siège</p>
                      <p>{result.generalInfo.address}</p>
                    </div>
                    <div className="mt-4 space-y-1">
                      <p className="text-sm text-gray-500">Lieux d'exploitation</p>
                      <p>{result.geographic.operationLocations}</p>
                    </div>
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="ownership" className="p-6">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-medium mb-3">Structure et gouvernance</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Bénéficiaires effectifs</p>
                        <p>{result.ownership.beneficialOwners}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Composition du capital</p>
                        <p>{result.ownership.capital}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Dirigeants et administrateurs</p>
                        <p>{result.ownership.directors}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Liens avec entités publiques</p>
                        <p>{result.ownership.publicEntities}</p>
                      </div>
                    </div>
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="p-6">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-medium mb-3">Situation financière</h3>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Indicateurs clés</p>
                        <p>{result.financial.keyIndicators}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Solvabilité</p>
                        <p>{result.financial.solvency}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Évolution récente</p>
                        <p>{result.financial.recentEvolution}</p>
                      </div>
                    </div>
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="compliance" className="p-6">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-medium mb-3">Conformité réglementaire</h3>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Sanctions ou contentieux</p>
                        <p>{result.regulatory.sanctions}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Listes de surveillance</p>
                        <p>{result.regulatory.watchlists}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Normes sectorielles</p>
                        <p>{result.regulatory.sectorStandards}</p>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-medium mb-3">Réputation et antécédents</h3>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Revue de presse</p>
                        <p>{result.reputation.pressReview}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Antécédents de litiges</p>
                        <p>{result.reputation.litigationHistory}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">E-réputation</p>
                        <p>{result.reputation.eReputation}</p>
                      </div>
                    </div>
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="risk" className="p-6">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-medium mb-3">Évaluation des risques</h3>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-medium">Niveau de risque global</p>
                        <Badge 
                          variant={result.riskAssessment.overallRisk === "Faible" ? "outline" : "destructive"}
                          className="text-sm"
                        >
                          {result.riskAssessment.overallRisk === "Faible" ? (
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 mr-1" />
                          )}
                          {result.riskAssessment.overallRisk}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Points d'attention</p>
                        <p>{result.riskAssessment.attentionPoints}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Recommandations</p>
                        <p>{result.riskAssessment.recommendations}</p>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h3 className="text-lg font-medium mb-3">Documents collectés</h3>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Documents légaux</p>
                        <p>{result.documents.legalDocs}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Documents de conformité</p>
                        <p>{result.documents.complianceDocs}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Complétude du dossier</p>
                        <div className="flex items-center gap-2">
                          <p>{result.documents.completeness}</p>
                          <Badge variant="outline" className="text-yellow-500 border-yellow-200 bg-yellow-50">
                            <Info className="h-3.5 w-3.5 mr-1" />
                            Attention
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="sources" className="p-6">
                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-medium mb-3">Sources d'information</h3>
                    {sources && sources.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">Les informations présentées dans ce rapport proviennent des sources suivantes :</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {sources.map((source, index) => (
                            <li key={index}>
                              <a 
                                href={source} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline break-all"
                              >
                                {source}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-gray-500">Aucune source externe n'a été citée pour cette analyse.</p>
                    )}
                  </section>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierAnalysis;
