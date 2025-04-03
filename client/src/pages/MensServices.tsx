import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const MensServices = () => {
  // Male beard services
  const maleBeardServices = [
    { name: "Beard Definition", description: "Expert beard definition to enhance your facial features", price: 15, duration: 20 },
    { name: "Beard Shaping", description: "Precise beard shaping for the perfect contour", price: 18, duration: 25 },
    { name: "Beard Shaping & Definition", description: "Complete beard grooming with shaping and definition", price: 25, duration: 35 },
    { name: "Traditional Shaving", description: "Classic straight razor shave with hot towel treatment", price: 30, duration: 40 }
  ];

  // Male hair services
  const maleHairServices = [
    { name: "Skin Cleansing", description: "Deep cleansing treatment for healthy scalp", price: 22, duration: 30 },
    { name: "Anti-Fall Lotion", description: "Specialized treatment to prevent hair loss", price: 28, duration: 25 },
    { name: "Shading on the Sides", description: "Precision fading and shading on the sides", price: 20, duration: 30 },
    { name: "Cut & Definition", description: "Stylish haircut with detailed definition", price: 25, duration: 35 },
    { name: "Baby Cut", description: "Gentle haircut for the little ones", price: 15, duration: 20 },
    { name: "Men's Cut", description: "Classic men's haircut tailored to your style", price: 22, duration: 30 }
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-primary sm:text-5xl">Men's Services</h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">Traditional barbering with a modern touch</p>
        </div>

        {/* Hero Banner */}
        <div className="relative mt-12 overflow-hidden rounded-xl">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&h=600&q=80" 
              alt="Men's barbering services" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-primary opacity-75"></div>
          </div>
          <div className="relative py-20 px-8 md:px-12 text-center">
            <h2 className="text-3xl font-bold text-white">Expert Barbering</h2>
            <p className="mt-4 text-lg text-gray-100 max-w-2xl mx-auto">Our skilled barbers are trained in the latest techniques and classic styles.</p>
            <div className="mt-8">
              <Link href="/booking">
                <a className="inline-block bg-amber-600 px-5 py-3 rounded-md text-white font-medium hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600">
                  Book Now
                </a>
              </Link>
            </div>
          </div>
        </div>

        {/* Services Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="beard" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="beard">Beard Services</TabsTrigger>
                <TabsTrigger value="hair">Hair Services</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="beard">
              <div className="animate-in fade-in duration-300">
                <h3 className="text-2xl font-bold text-primary text-center mb-8">Beard Services</h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {maleBeardServices.map((service, index) => (
                    <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm text-gray-500 mb-4">{service.description}</p>
                        <div className="flex justify-between">
                          <span className="font-medium">${(service.price).toFixed(2)}</span>
                          <span className="text-sm text-gray-500">{service.duration} min</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="hair">
              <div className="animate-in fade-in duration-300">
                <h3 className="text-2xl font-bold text-primary text-center mb-8">Hair Services</h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {maleHairServices.map((service, index) => (
                    <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm text-gray-500 mb-4">{service.description}</p>
                        <div className="flex justify-between">
                          <span className="font-medium">${(service.price).toFixed(2)}</span>
                          <span className="text-sm text-gray-500">{service.duration} min</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-primary mb-4">Ready to Experience Expert Grooming?</h3>
          <p className="text-gray-500 mb-8 max-w-2xl mx-auto">Book your appointment now and experience the difference with our professional barbers.</p>
          <div className="flex justify-center space-x-4">
            <Link href="/booking">
              <a>
                <Button variant="default" className="bg-primary hover:bg-primary-light">
                  Book Appointment
                </Button>
              </a>
            </Link>
            <Link href="/womens-services">
              <a>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  View Women's Services
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MensServices;