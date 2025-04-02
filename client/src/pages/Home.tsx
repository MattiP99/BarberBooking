import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Service, Barber } from "@/types";
import ServiceCard from "@/components/ServiceCard";
import BarberCard from "@/components/BarberCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const Home = () => {
  // Query for services
  const servicesQuery = useQuery({
    queryKey: ['/api/services'],
  });

  // Query for barbers
  const barbersQuery = useQuery({
    queryKey: ['/api/barbers'],
  });

  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-primary">
        <div className="absolute inset-0">
          <img 
            className="w-full h-full object-cover" 
            src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&h=600&q=80" 
            alt="Barber shop interior" 
          />
          <div className="absolute inset-0 bg-primary opacity-75"></div>
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">Premium Grooming Experience</h1>
          <p className="mt-6 text-xl text-gray-200 max-w-3xl">Book your appointment today at BarbeShop and experience the art of traditional barbering with a modern twist.</p>
          <div className="mt-10">
            <Link href="/booking">
              <a className="inline-block bg-amber-600 px-5 py-3 rounded-md text-white font-medium hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600">
                Book Now
              </a>
            </Link>
            <Button 
              variant="outline" 
              className="ml-4 border-white text-white hover:bg-primary-light"
            >
              Our Services
            </Button>
          </div>
        </div>
      </div>

      {/* Services Preview */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">Our Services</h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">Choose from our range of premium grooming services.</p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {servicesQuery.isLoading ? (
              // Skeleton loading state
              [...Array(3)].map((_, index) => (
                <div key={index} className="bg-gray-50 rounded-lg shadow-md overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </div>
              ))
            ) : servicesQuery.isError ? (
              <div className="col-span-3 text-center text-red-500">
                Error loading services: {servicesQuery.error.message}
              </div>
            ) : (
              servicesQuery.data.slice(0, 3).map((service: Service) => (
                <ServiceCard key={service.id} service={service} />
              ))
            )}
          </div>

          <div className="mt-10 text-center">
            <Button variant="default" className="bg-primary hover:bg-primary-light">
              View All Services
            </Button>
          </div>
        </div>
      </div>

      {/* Meet Our Barbers */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">Meet Our Barbers</h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">Skilled professionals dedicated to perfecting your style.</p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {barbersQuery.isLoading ? (
              // Skeleton loading state
              [...Array(2)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3">
                      <Skeleton className="h-full w-full aspect-[3/4]" />
                    </div>
                    <div className="md:w-2/3 p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-10 w-32" />
                    </div>
                  </div>
                </div>
              ))
            ) : barbersQuery.isError ? (
              <div className="col-span-2 text-center text-red-500">
                Error loading barbers: {barbersQuery.error.message}
              </div>
            ) : (
              barbersQuery.data.map((barber: Barber) => (
                <BarberCard key={barber.id} barber={barber} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
