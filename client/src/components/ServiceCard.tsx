import { Service } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/utils/dateUtils";

interface ServiceCardProps {
  service: Service;
  isSelectable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

const ServiceCard = ({ 
  service, 
  isSelectable = false, 
  isSelected = false, 
  onClick 
}: ServiceCardProps) => {
  return (
    <Card 
      className={`
        overflow-hidden transition-all hover:shadow-md
        ${isSelectable ? 'cursor-pointer hover:border-amber-600' : ''}
        ${isSelected ? 'border-2 border-amber-600' : ''}
      `}
      onClick={isSelectable ? onClick : undefined}
    >
      <div className="h-48 w-full overflow-hidden">
        <img 
          src={service.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=400&q=80'} 
          alt={service.name}
          className="h-full w-full object-cover"
        />
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-primary">{service.name}</h3>
        <p className="mt-2 text-gray-600 line-clamp-2">{service.description}</p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-2xl font-bold text-amber-600">{formatPrice(service.price)}</span>
          <span className="text-sm text-gray-500">{service.duration} mins</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
