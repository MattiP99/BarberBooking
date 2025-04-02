import { Barber } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

interface BarberCardProps {
  barber: Barber;
  isSelectable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

const BarberCard = ({ 
  barber, 
  isSelectable = false, 
  isSelected = false, 
  onClick 
}: BarberCardProps) => {
  return (
    <Card 
      className={`
        overflow-hidden transition-all hover:shadow-md
        ${isSelectable ? 'cursor-pointer hover:border-amber-600' : ''}
        ${isSelected ? 'border-2 border-amber-600' : ''}
      `}
      onClick={isSelectable ? onClick : undefined}
    >
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3">
          <img 
            src={barber.image || 'https://images.unsplash.com/photo-1534368786749-b63e05c90863?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80'} 
            alt={barber.user?.fullName || "Barber"}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="md:w-2/3 p-6">
          <h3 className="text-xl font-bold text-primary">{barber.user?.fullName}</h3>
          <p className="text-sm text-amber-600 font-medium mt-1">{barber.speciality}</p>
          <p className="mt-4 text-gray-600">{barber.bio}</p>
          {isSelectable && (
            <div className="mt-6">
              <button 
                className={`
                  inline-block px-4 py-2 rounded-md text-white text-sm font-medium 
                  ${isSelected 
                    ? 'bg-amber-700 hover:bg-amber-800' 
                    : 'bg-amber-600 hover:bg-amber-700'}
                `}
              >
                Book with {barber.user?.fullName?.split(' ')[0]}
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BarberCard;
