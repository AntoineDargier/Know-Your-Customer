
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Fonction robuste pour capturer tous les onglets du rapport
export const generatePDF = async (elementId: string, filename: string = 'rapport_fournisseur.pdf') => {
  try {
    console.log(`Démarrage de la génération du PDF pour l'élément ${elementId}`);
    
    // Récupérer le conteneur principal
    const reportContainer = document.getElementById(elementId);
    
    if (!reportContainer) {
      throw new Error(`Élément avec l'ID ${elementId} introuvable`);
    }
    
    // S'assurer que le contenu est visible et complètement rendu
    reportContainer.style.opacity = '1';
    reportContainer.style.display = 'block';
    
    // A4 dimensions: 210 x 297 mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Fonction pour ajouter un en-tête au PDF
    const addHeader = (title: string, page: number, totalPages: number) => {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${title} - Page ${page}/${totalPages}`, 10, 10);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(10, 12, 200, 12);
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
    };

    // Options standard pour html2canvas
    const htmlCanvasOptions = {
      scale: 2, // Échelle plus élevée pour meilleure qualité
      useCORS: true, // Autoriser images cross-origin
      allowTaint: true, // Permettre de traiter les images de domaines différents
      backgroundColor: "#ffffff", // Fond blanc
      logging: true, // Activer la journalisation pour le débogage
      letterRendering: true, // Améliorer le rendu du texte
      scrollX: 0, // Éviter les problèmes de défilement
      scrollY: 0,
      windowWidth: document.documentElement.offsetWidth, // Utiliser la largeur complète
      windowHeight: document.documentElement.offsetHeight // Utiliser la hauteur complète
    };

    // Obtenir les entêtes du rapport (titre, nom du fournisseur)
    const headerElement = reportContainer.querySelector('.p-6.border-b');
    let headerImgData;
    let headerHeight = 0;
    
    if (headerElement) {
      console.log('Capture de l\'en-tête du rapport');
      try {
        const headerCanvas = await html2canvas(headerElement as HTMLElement, htmlCanvasOptions);
        headerImgData = headerCanvas.toDataURL('image/png');
        const headerImgWidth = 190;
        headerHeight = (headerCanvas.height * headerImgWidth) / headerCanvas.width;
        console.log('En-tête capturé avec succès');
      } catch (headerError) {
        console.error('Erreur lors de la capture de l\'en-tête:', headerError);
        // Continuer sans en-tête en cas d'erreur
      }
    }

    // Sélectionner les onglets à capturer
    const tabTriggers = Array.from(document.querySelectorAll('[role="tab"]'));
    const tabValues = tabTriggers
      .map(trigger => trigger.getAttribute('data-value'))
      .filter(Boolean) as string[];
    
    if (tabValues.length === 0) {
      console.log('Aucun onglet trouvé, utilisation de la méthode de capture simple');
      // Si on ne trouve pas les onglets, on revient à la méthode simple
      try {
        const canvas = await html2canvas(reportContainer, htmlCanvasOptions);
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Ajouter l'en-tête si disponible
        if (headerImgData) {
          pdf.addImage(headerImgData, 'PNG', 10, 15, 190, headerHeight);
          pdf.addImage(imgData, 'PNG', 10, 20 + headerHeight, imgWidth, imgHeight);
        } else {
          pdf.addImage(imgData, 'PNG', 10, 20, imgWidth, imgHeight);
        }
        
        pdf.save(filename);
        console.log('PDF généré avec succès (méthode simple)');
        return true;
      } catch (canvasError) {
        console.error('Erreur lors de la capture de l\'élément complet:', canvasError);
        throw canvasError;
      }
    }
    
    // Enregistrer l'état actif initial pour le restaurer à la fin
    const activeTrigger = document.querySelector('[role="tab"][aria-selected="true"]');
    const initialTabId = activeTrigger?.getAttribute('data-value') || tabValues[0] || 'general';
    
    // Préparer les noms d'onglets
    const tabNames: {[key: string]: string} = {
      'general': 'Informations générales',
      'ownership': 'Structure',
      'financial': 'Financier',
      'compliance': 'Conformité',
      'risk': 'Risques',
    };
    
    // Ajouter l'en-tête général au PDF (première page)
    if (headerImgData) {
      pdf.addImage(headerImgData, 'PNG', 10, 10, 190, headerHeight);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(10, 15 + headerHeight, 200, 15 + headerHeight);
    }
    
    // Boucle sur chaque onglet pour le capturer
    console.log(`Préparation de la capture des ${tabValues.length} onglets`);
    
    for (let i = 0; i < tabValues.length; i++) {
      const tabValue = tabValues[i];
      const pageNum = i + 1;
      
      console.log(`Capture de l'onglet ${tabValue} (${pageNum}/${tabValues.length})`);
      
      // Trouver le trigger de l'onglet
      const tabTrigger = document.querySelector(`[role="tab"][data-value="${tabValue}"]`);
      if (!tabTrigger) {
        console.log(`Onglet ${tabValue} non trouvé, passage au suivant`);
        continue;
      }
      
      try {
        // Activer l'onglet et attendre son affichage
        (tabTrigger as HTMLElement).click();
        
        // Attendre que l'onglet soit complètement affiché (temps d'attente plus long)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Trouver le panneau d'onglet actif
        const activePanel = document.querySelector(`[role="tabpanel"][data-state="active"]`) || 
                            document.querySelector(`[role="tabpanel"][data-value="${tabValue}"]`);
        
        if (!activePanel) {
          console.log(`Panneau pour l'onglet ${tabValue} non trouvé, passage au suivant`);
          continue;
        }
        
        // Forcer la visibilité du panneau pour la capture
        const originalDisplay = (activePanel as HTMLElement).style.display;
        const originalVisibility = (activePanel as HTMLElement).style.visibility;
        (activePanel as HTMLElement).style.display = 'block';
        (activePanel as HTMLElement).style.visibility = 'visible';
        
        // Attendre un moment supplémentaire pour s'assurer que tous les éléments sont rendus
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Capturer l'onglet
        const canvas = await html2canvas(activePanel as HTMLElement, {
          ...htmlCanvasOptions,
          onclone: (clonedDoc, clonedElement) => {
            // S'assurer que l'élément cloné est visible
            (clonedElement as HTMLElement).style.display = 'block';
            (clonedElement as HTMLElement).style.visibility = 'visible';
            return;
          }
        });
        
        // Restaurer les styles originaux
        (activePanel as HTMLElement).style.display = originalDisplay;
        (activePanel as HTMLElement).style.visibility = originalVisibility;
        
        // Traiter l'image capturée
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 250); // Limiter la hauteur
        
        // Ajouter une nouvelle page si ce n'est pas la première
        if (i > 0) {
          pdf.addPage();
        }
        
        // Ajouter l'en-tête général à chaque page
        if (headerImgData) {
          pdf.addImage(headerImgData, 'PNG', 10, 10, 190, headerHeight);
          pdf.setDrawColor(200, 200, 200);
          pdf.line(10, 15 + headerHeight, 200, 15 + headerHeight);
        }
        
        // Ajouter le titre de l'onglet
        const tabTitle = tabNames[tabValue] || `Onglet ${tabValue}`;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(79, 181, 131); // #4FB583
        pdf.text(tabTitle, 10, headerHeight + 25);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(10, headerHeight + 28, 200, headerHeight + 28);
        
        // Ajouter le contenu de l'onglet
        pdf.addImage(imgData, 'PNG', 10, headerHeight + 35, imgWidth, imgHeight);
        
        console.log(`Onglet ${tabValue} capturé avec succès`);
      } catch (tabError) {
        console.error(`Erreur lors de la capture de l'onglet ${tabValue}:`, tabError);
        // Continuer avec les autres onglets même en cas d'erreur
      }
    }
    
    // Revenir à l'onglet initialement actif
    try {
      const initialTabTrigger = document.querySelector(`[role="tab"][data-value="${initialTabId}"]`);
      if (initialTabTrigger) {
        (initialTabTrigger as HTMLElement).click();
      }
    } catch (error) {
      console.warn("Erreur lors du retour à l'onglet initial:", error);
      // Ne pas échouer juste pour cette étape
    }
    
    // Sauvegarder le PDF
    pdf.save(filename);
    console.log('PDF généré avec succès');
    return true;
  } catch (error) {
    console.error('Erreur de génération du PDF:', error);
    alert("Erreur lors de la génération du PDF. Veuillez réessayer.");
    return false;
  }
};
