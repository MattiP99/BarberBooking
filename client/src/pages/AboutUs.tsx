import { useQuery } from "@tanstack/react-query";
import { Barber } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const AboutUs = () => {
  // Query for barbers
  const barbersQuery = useQuery<Barber[]>({
    queryKey: ['/api/barbers'],
  });

  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-primary">
        <div className="absolute inset-0">
          <img 
            className="w-full h-full object-cover" 
            src="https://images.unsplash.com/photo-1516382799247-87df95d790b7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&h=600&q=80" 
            alt="Barbershop interior" 
          />
          <div className="absolute inset-0 bg-primary opacity-75"></div>
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">About Our Barbershop</h1>
          <p className="mt-6 text-xl text-gray-200 max-w-3xl">We're a team of skilled professionals dedicated to providing the best grooming experience for our clients.</p>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">Our Story</h2>
            <p className="mt-4 text-lg text-gray-500">
              Founded in 2015, BarbeShop has been committed to providing exceptional grooming services to both men and women.
              What started as a small barbershop has now grown into a full-service salon offering a wide range of services.
              Our focus has always been on combining traditional techniques with modern styles to create a unique experience for all our clients.
            </p>
          </div>
        </div>
      </div>

      {/* Meet Our Barbers - Detailed */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">Our Professional Team</h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">Meet the skilled professionals behind our exceptional services.</p>
          </div>

          {barbersQuery.isLoading ? (
            <div className="grid gap-12 md:grid-cols-1 lg:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white shadow overflow-hidden rounded-lg">
                  <Skeleton className="h-96 w-full" />
                  <div className="p-8">
                    <Skeleton className="h-8 w-1/2 mb-4" />
                    <Skeleton className="h-6 w-1/3 mb-6" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : barbersQuery.isError ? (
            <div className="text-center text-red-500">
              Error loading barber information: {(barbersQuery.error as Error)?.message || 'Unknown error'}
            </div>
          ) : (
            <div className="grid gap-12 md:grid-cols-1 lg:grid-cols-2">
              {barbersQuery.data?.map((barber) => (
                <div key={barber.id} className="bg-white shadow overflow-hidden rounded-lg">
                  <div className="relative h-96">
                    <img
                      src={barber.image || "https://images.unsplash.com/photo-1580518324671-c2f0833a3af1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=600&q=80"}
                      alt={`${barber.user?.fullName} portrait`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-primary opacity-20"></div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-primary">{barber.user?.fullName}</h3>
                    <p className="text-lg text-amber-600 mb-4">{barber.speciality}</p>
                    <div className="prose max-w-none">
                      <p className="text-gray-600">{barber.bio}</p>
                    </div>
                    <div className="mt-6">
                      <h4 className="text-lg font-medium text-primary mb-2">Professional Journey</h4>
                      {barber.id === 1 ? (
                        <p className="text-gray-600">
                          Marco began his career as an apprentice in a classic Italian barbershop, learning traditional techniques passed down through generations. 
                          After mastering his craft, he traveled throughout Europe, picking up new styles and approaches before settling down to open BarbeShop.
                          His passion for precision cutting and beard grooming has earned him a loyal clientele who appreciate his meticulous attention to detail.
                        </p>
                      ) : (
                        <p className="text-gray-600">
                          Luca's journey into the world of hair styling began at a prestigious academy in Milan. After graduating at the top of his class,
                          he honed his skills working with fashion brands and editorial shoots. His creative approach to hair brings a contemporary edge to our shop,
                          making him the go-to stylist for clients looking for modern trends and innovative techniques.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Our Values */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">Our Values</h2>
          </div>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-amber-600 text-white mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-medium text-primary">Quality</h3>
              <p className="mt-2 text-gray-500">We use only premium products and techniques to ensure the best results for our clients.</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-amber-600 text-white mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-medium text-primary">Inclusivity</h3>
              <p className="mt-2 text-gray-500">We welcome all clients and provide services for both men and women in a comfortable environment.</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-amber-600 text-white mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-medium text-primary">Personalization</h3>
              <p className="mt-2 text-gray-500">Every service is tailored to the individual needs and preferences of our clients.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;