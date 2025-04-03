import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const WomensServices = () => {
  // Female services
  const femaleServices = [
    { name: "Women's Cut", description: "Professional women's haircut tailored to your face shape and personal style", price: 35, duration: 45 },
    { name: "Hair Styling", description: "Expert blow dry and styling for any occasion", price: 28, duration: 40 },
    { name: "Hair Coloring", description: "Professional coloring service using premium products", price: 65, duration: 90 },
    { name: "Meshes & Color Touch-up", description: "Highlights, lowlights and color touch-ups for a refreshed look", price: 75, duration: 120 }
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-primary sm:text-5xl">Women's Services</h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">Professional styling and coloring services</p>
        </div>

        {/* Hero Banner */}
        <div className="relative mt-12 overflow-hidden rounded-xl">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&h=600&q=80" 
              alt="Women's hair styling services" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-primary opacity-75"></div>
          </div>
          <div className="relative py-20 px-8 md:px-12 text-center">
            <h2 className="text-3xl font-bold text-white">Expert Styling</h2>
            <p className="mt-4 text-lg text-gray-100 max-w-2xl mx-auto">Our professional stylists are trained to create the perfect look for you.</p>
            <div className="mt-8">
              <Link href="/booking">
                <a className="inline-block bg-amber-600 px-5 py-3 rounded-md text-white font-medium hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600">
                  Book Now
                </a>
              </Link>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-primary text-center mb-8">Our Services</h3>
          <div className="grid gap-8 md:grid-cols-2">
            {femaleServices.map((service, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-2/5 bg-gray-100">
                    {/* Service image or icon could go here */}
                    <div className="h-full flex items-center justify-center p-8">
                      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold">{service.name.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>
                  <div className="md:w-3/5">
                    <CardHeader className="p-4">
                      <CardTitle className="text-xl">{service.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-gray-500 mb-4">{service.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-lg">${(service.price).toFixed(2)}</span>
                        <span className="text-sm text-gray-500">{service.duration} min</span>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Styling Tips */}
        <div className="mt-16 p-8 bg-gray-50 rounded-xl">
          <h3 className="text-2xl font-bold text-primary text-center mb-4">Expert Hair Care Tips</h3>
          <div className="grid gap-6 md:grid-cols-3 mt-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-bold text-lg mb-2">Maintain Your Color</h4>
              <p className="text-gray-500">Use color-safe shampoos and conditioners to keep your color vibrant and long-lasting.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-bold text-lg mb-2">Heat Protection</h4>
              <p className="text-gray-500">Always use heat protection products before styling with hot tools to prevent damage.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-bold text-lg mb-2">Regular Trims</h4>
              <p className="text-gray-500">Schedule regular trims every 6-8 weeks to prevent split ends and maintain healthy hair.</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-primary mb-4">Ready for a New Look?</h3>
          <p className="text-gray-500 mb-8 max-w-2xl mx-auto">Book your appointment today and let our experts help you achieve the perfect style.</p>
          <div className="flex justify-center space-x-4">
            <Link href="/booking">
              <a>
                <Button variant="default" className="bg-primary hover:bg-primary-light">
                  Book Appointment
                </Button>
              </a>
            </Link>
            <Link href="/mens-services">
              <a>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  View Men's Services
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WomensServices;