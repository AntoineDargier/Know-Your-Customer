
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Shield, AlertCircle, AlertTriangle, CheckCircle, Search, ListFilter, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend, Sector } from "recharts";

interface Supplier {
  id: string;
  name: string;
  industry: string;
  riskLevel: 'high' | 'medium' | 'low';
  redFlags: number;
  lastChecked: string;
}

interface CategoryRisk {
  name: string;
  value: number;
}

// État pour suivre l'ouverture/fermeture des fournisseurs à risque
interface SupplierDetailState {
  [key: string]: boolean;
}

const GlobalScan = () => {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categoryRisks, setCategoryRisks] = useState<CategoryRisk[]>([]);
  const [openSuppliers, setOpenSuppliers] = useState<SupplierDetailState>({});
  
  // Fonction pour basculer l'état d'ouverture d'un fournisseur
  const toggleSupplierDetail = (supplierId: string) => {
    setOpenSuppliers(prev => ({
      ...prev,
      [supplierId]: !prev[supplierId]
    }));
  };

  const startScan = () => {
    setScanning(true);
    setProgress(0);
    setScanComplete(false);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setScanComplete(true);
            setScanning(false);
            // Generate mock supplier data
            const mockSuppliers = generateMockSuppliers();
            setSuppliers(mockSuppliers);
            
            // Generate category risk data
            setCategoryRisks(generateCategoryRiskData(mockSuppliers));
          }, 500);
          return 100;
        }
        return prev + 6.66; // Completes in ~15 seconds
      });
    }, 1000);
  };

  const generateCategoryRiskData = (suppliers: Supplier[]): CategoryRisk[] => {
    // Count suppliers per industry
    const industries = suppliers.reduce<Record<string, {high: number, medium: number, low: number}>>((acc, supplier) => {
      if (!acc[supplier.industry]) {
        acc[supplier.industry] = { high: 0, medium: 0, low: 0 };
      }
      
      acc[supplier.industry][supplier.riskLevel]++;
      return acc;
    }, {});

    // Convert to chart data format
    // Calculate risk score - high: 3, medium: 2, low: 1
    return Object.entries(industries).map(([industry, counts]) => {
      const total = counts.high + counts.medium + counts.low;
      const riskScore = (counts.high * 3 + counts.medium * 2 + counts.low) / total;
      
      return {
        name: industry,
        value: Math.round(riskScore * 100) / 100
      };
    }).sort((a, b) => b.value - a.value);
  };

  const generateMockSuppliers = (): Supplier[] => {
    // Create array with risk distribution: 60% low, 30% medium, 10% high
    return [
      // 10% high risk (1)
      {
        id: "SUP1",
        name: "Apex Electronics Co.",
        industry: "Electronics",
        riskLevel: "high",
        redFlags: 7,
        lastChecked: "05/03/2023",
      },
      
      // 30% medium risk (3)
      {
        id: "SUP2",
        name: "First Financial Services",
        industry: "Financial",
        riskLevel: "medium",
        redFlags: 4,
        lastChecked: "01/03/2023",
      },
      {
        id: "SUP3",
        name: "Pacific Shipping Ltd",
        industry: "Logistics",
        riskLevel: "medium",
        redFlags: 3,
        lastChecked: "12/02/2023",
      },
      {
        id: "SUP4",
        name: "TechPro Solutions",
        industry: "IT Services",
        riskLevel: "medium",
        redFlags: 2,
        lastChecked: "10/03/2023",
      },
      
      // 60% low risk (6)
      {
        id: "SUP5",
        name: "Global Manufacturing Inc.",
        industry: "Manufacturing",
        riskLevel: "low",
        redFlags: 1,
        lastChecked: "18/02/2023",
      },
      {
        id: "SUP6",
        name: "EcoGreen Energy",
        industry: "Energy",
        riskLevel: "low",
        redFlags: 0,
        lastChecked: "08/03/2023",
      },
      {
        id: "SUP7",
        name: "Secure Logistics Partners",
        industry: "Logistics",
        riskLevel: "low",
        redFlags: 0,
        lastChecked: "03/03/2023",
      },
      {
        id: "SUP8",
        name: "MediPharm Labs",
        industry: "Pharmaceuticals",
        riskLevel: "low",
        redFlags: 0,
        lastChecked: "20/02/2023",
      },
      {
        id: "SUP9",
        name: "Reliable Office Supplies",
        industry: "Retail",
        riskLevel: "low",
        redFlags: 0,
        lastChecked: "15/03/2023",
      },
      {
        id: "SUP10",
        name: "ClearWater Utilities",
        industry: "Utilities",
        riskLevel: "low",
        redFlags: 0,
        lastChecked: "25/02/2023",
      },
    ];
  };

  const getSuppliersByRiskLevel = (riskLevel: string) => {
    return suppliers.filter(supplier => supplier.riskLevel === riskLevel);
  };

  // Get rating on a scale of 0-3 based on value
  const getRiskRating = (value: number) => {
    if (value >= 2.5) return "Élevé";
    if (value >= 1.5) return "Moyen";
    if (value >= 0.5) return "Faible";
    return "Fiable";
  };

  // Get color based on risk level
  const getRiskColor = (value: number) => {
    if (value >= 2.5) return "#f87171"; // red-400
    if (value >= 1.5) return "#fbbf24"; // amber-400
    if (value >= 0.5) return "#4ade80"; // green-400
    return "#a3e635"; // lime-400
  };

  // Automatically start scan when component mounts
  useEffect(() => {
    startScan();
  }, []);

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
          <h1 className="text-2xl font-bold" style={{ color: "#333399" }}>Analyse de vos fournisseurs actuels</h1>
        </div>

        {!scanComplete ? (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-secondary" />
                  Analyse globale des fournisseurs en cours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Scan en cours...</span>
                    <span>{Math.min(Math.round(progress), 100)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span>Analyse des informations financières</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span>Vérification des listes de sanctions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {progress > 33 ? (
                      <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-gray-100"></div>
                    )}
                    <span>Évaluation des risques géographiques</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {progress > 66 ? (
                      <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-gray-100"></div>
                    )}
                    <span>Génération du rapport de conformité</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-sm text-gray-500">
              Analysez l'ensemble de votre écosystème de fournisseurs pour identifier les modèles de risques
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <p className="font-semibold">Fournisseurs fiables</p>
                      </div>
                      <p className="text-xs text-gray-500">Partenaires à faible risque</p>
                    </div>
                    <span className="text-4xl font-bold">{getSuppliersByRiskLevel('low').length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <p className="font-semibold">Risque modéré</p>
                      </div>
                      <p className="text-xs text-gray-500">Fournisseurs nécessitant attention</p>
                    </div>
                    <span className="text-4xl font-bold">{getSuppliersByRiskLevel('medium').length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <p className="font-semibold">Risque élevé</p>
                      </div>
                      <p className="text-xs text-gray-500">Attention critique requise</p>
                    </div>
                    <span className="text-4xl font-bold">{getSuppliersByRiskLevel('high').length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="dashboard">
              <div className="flex items-center border-b border-gray-200">
                <TabsList className="bg-transparent">
                  <TabsTrigger value="dashboard" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Tableau de bord
                  </TabsTrigger>
                  <TabsTrigger value="list" className="flex items-center gap-2">
                    <ListFilter className="h-4 w-4" />
                    Liste des fournisseurs
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="dashboard" className="pt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Distribution des risques fournisseurs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: "Risque faible", value: getSuppliersByRiskLevel('low').length, color: "#4ade80" },
                                { name: "Risque moyen", value: getSuppliersByRiskLevel('medium').length, color: "#fbbf24" },
                                { name: "Risque élevé", value: getSuppliersByRiskLevel('high').length, color: "#f87171" }
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={90}
                              innerRadius={40}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {[
                                { name: "Risque faible", value: getSuppliersByRiskLevel('low').length, color: "#4ade80" },
                                { name: "Risque moyen", value: getSuppliersByRiskLevel('medium').length, color: "#fbbf24" },
                                { name: "Risque élevé", value: getSuppliersByRiskLevel('high').length, color: "#f87171" }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [`${value}%`, 'Proportion']}
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                borderRadius: '8px', 
                                border: 'none', 
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                padding: '8px 12px',
                                fontSize: '12px'
                              }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                          <span className="text-sm">Risque faible: {getSuppliersByRiskLevel('low').length} ({Math.round(getSuppliersByRiskLevel('low').length/suppliers.length*100)}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-amber-400 rounded-sm"></div>
                          <span className="text-sm">Risque moyen: {getSuppliersByRiskLevel('medium').length} ({Math.round(getSuppliersByRiskLevel('medium').length/suppliers.length*100)}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-400 rounded-sm"></div>
                          <span className="text-sm">Risque élevé: {getSuppliersByRiskLevel('high').length} ({Math.round(getSuppliersByRiskLevel('high').length/suppliers.length*100)}%)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Risque par catégorie</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={categoryRisks}
                            layout="vertical"
                            margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                            <XAxis 
                              type="number" 
                              domain={[0, 3]} 
                              ticks={[0, 1, 2, 3]} 
                              tickFormatter={(value) => {
                                if (value === 0) return "Faible";
                                if (value === 1) return "Faible";
                                if (value === 2) return "Moyen";
                                if (value === 3) return "Élevé";
                                return "";
                              }}
                              stroke="#888"
                              fontSize={12}
                              axisLine={{ stroke: '#e5e7eb' }}
                              tickLine={{ stroke: '#e5e7eb' }}
                            />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              width={100} 
                              tickLine={false}
                              tick={{ fontSize: 12, fill: '#4b5563' }}
                              axisLine={{ stroke: '#e5e7eb' }}
                            />
                            <Tooltip
                              formatter={(value) => [`Risque: ${getRiskRating(Number(value))} (${value})`, 'Niveau de risque']}
                              labelFormatter={(label) => `Catégorie: ${label}`}
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                borderRadius: '8px', 
                                border: 'none', 
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                padding: '8px 12px',
                                fontSize: '12px'
                              }}
                            />
                            <Bar 
                              dataKey="value" 
                              name="Niveau de risque"
                              animationDuration={1000}
                              barSize={24}
                              radius={[0, 6, 6, 0]}
                              fill="#4f46e5"
                            >
                              {categoryRisks.map((entry, index) => {
                                let color = '#4ade80'; // low risk - green
                                if (entry.value >= 2.5) {
                                  color = '#f87171'; // high risk - red
                                } else if (entry.value >= 1.5) {
                                  color = '#fbbf24'; // medium risk - amber
                                }
                                return <Cell key={`cell-${index}`} fill={color} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <CardTitle className="text-lg">Fournisseurs à risque élevé</CardTitle>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Ces fournisseurs nécessitent une attention immédiate
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                      {getSuppliersByRiskLevel('high').map((supplier) => {
                        // Génération de 7 points d'attention pour chaque fournisseur à risque
                        const riskPoints = [
                          "Sanctions internationales identifiées",
                          "Litiges en cours avec des clients",
                          "Situation financière instable",
                          "Changements fréquents dans la structure de direction",
                          "Liens avec des entités à risque",
                          "Présence dans des zones géographiques sensibles",
                          "Non-conformité aux normes du secteur"
                        ];
                        
                        // Utiliser l'état global pour l'ouverture/fermeture
                        const isOpen = openSuppliers[supplier.id] || false;
                        
                        return (
                          <div key={supplier.id} className="hover:bg-gray-50">
                            <div className="p-4">
                              <div 
                                className="flex justify-between items-start cursor-pointer"
                                onClick={() => toggleSupplierDetail(supplier.id)}
                              >
                                <div>
                                  <h3 className="font-medium mb-1">{supplier.name}</h3>
                                  <p className="text-sm text-gray-500">{supplier.industry}</p>
                                  <div className="text-sm text-red-500 flex items-center gap-1 mt-1">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {supplier.redFlags} points d'attention détectés
                                    <span className="text-gray-400 text-xs ml-2">
                                      Dernière vérification: {supplier.lastChecked}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="destructive" className="text-xs">
                                    Risque élevé
                                  </Badge>
                                  <button 
                                    className="p-1 rounded hover:bg-gray-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSupplierDetail(supplier.id);
                                    }}
                                  >
                                    {isOpen ? (
                                      <span className="text-gray-500">▼</span>
                                    ) : (
                                      <span className="text-gray-500">►</span>
                                    )}
                                  </button>
                                </div>
                              </div>
                              
                              {isOpen && (
                                <div className="mt-3 pl-4 border-l-2 border-red-300">
                                  <h4 className="font-medium text-sm mb-2">Points d'attention :</h4>
                                  <ul className="space-y-1">
                                    {riskPoints.map((point, index) => (
                                      <li key={index} className="text-sm flex items-start gap-2">
                                        <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5" />
                                        <span>{point}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  <div className="mt-3">
                                    <Button variant="outline" size="sm" className="text-xs">
                                      Voir le détail complet
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="list" className="pt-6">
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                      {suppliers.sort((a, b) => {
                        // Sort by risk level (high, medium, low)
                        const riskOrder = { high: 0, medium: 1, low: 2 };
                        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
                      }).map((supplier) => (
                        <div key={supplier.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium mb-1">{supplier.name}</h3>
                              <p className="text-sm text-gray-500">{supplier.industry}</p>
                              {supplier.redFlags > 0 && (
                                <div className={`text-sm flex items-center gap-1 mt-1 ${
                                  supplier.riskLevel === 'high' ? 'text-red-500' : 
                                  supplier.riskLevel === 'medium' ? 'text-amber-500' : 'text-gray-500'
                                }`}>
                                  {supplier.riskLevel === 'high' ? <AlertCircle className="h-3.5 w-3.5" /> : 
                                   supplier.riskLevel === 'medium' ? <AlertTriangle className="h-3.5 w-3.5" /> :
                                   <Info className="h-3.5 w-3.5" />}
                                  {supplier.redFlags} signalement{supplier.redFlags !== 1 ? 's' : ''} détecté{supplier.redFlags !== 1 ? 's' : ''}
                                  <span className="text-gray-400 text-xs ml-2">
                                    Dernière vérification: {supplier.lastChecked}
                                  </span>
                                </div>
                              )}
                            </div>
                            <Badge 
                              variant={
                                supplier.riskLevel === 'high' ? 'destructive' : 
                                supplier.riskLevel === 'medium' ? 'outline' : 'secondary'
                              } 
                              className="text-xs"
                            >
                              {supplier.riskLevel === 'high' ? 'Risque élevé' : 
                               supplier.riskLevel === 'medium' ? 'Risque moyen' : 'Risque faible'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalScan;
