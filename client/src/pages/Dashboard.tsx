import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import EnhancedBarberDashboard from "@/components/EnhancedBarberDashboard";

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }
  
  // Redirect if not barber or admin
  if (!user || user.role === 'client') {
    return <Redirect to="/" />;
  }
  
  return <EnhancedBarberDashboard />;
};

export default Dashboard;
