
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface IconCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  buttonText: string;
  buttonIcon: ReactNode;
  onClick: () => void;
  features: string[];
  accentColor?: string;
}

const IconCard = ({
  title,
  description,
  icon,
  buttonText,
  buttonIcon,
  onClick,
  features,
  accentColor = "primary",
}: IconCardProps) => {
  // Définir les couleurs en fonction de accentColor
  const getStyles = () => {
    if (accentColor === "primary") {
      return {
        buttonBg: "#4FB583",
        buttonHover: "#45a376",
        iconColor: "#4FB583"
      };
    } else if (accentColor === "secondary") {
      return {
        buttonBg: "#333399",
        buttonHover: "#2d2d8a",
        iconColor: "#333399"
      };
    } else {
      return {
        buttonBg: "hsl(var(--primary))",
        buttonHover: "hsl(var(--primary))/90",
        iconColor: "hsl(var(--primary))"
      };
    }
  };

  const styles = getStyles();

  return (
    <div className="flex flex-col h-full p-8 bg-white rounded-lg border border-gray-100 shadow-sm">
      <div className="flex flex-col gap-6">
        <div className="mx-auto">
          <div className="w-20 h-20 rounded-full bg-opacity-10 flex items-center justify-center" 
               style={{ backgroundColor: `${styles.iconColor}10` }}>
            {icon}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="space-y-2 mt-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <CheckCircle 
                className="w-5 h-5 mt-0.5" 
                style={{ color: styles.iconColor }}
              />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Button 
          onClick={onClick} 
          style={{ 
            backgroundColor: styles.buttonBg
          }}
          className="w-full text-white hover:opacity-90"
        >
          {buttonIcon}
          <span className="ml-2">{buttonText}</span>
        </Button>
      </div>
    </div>
  );
};

export default IconCard;
