import { Link } from "wouter";
import { Scissors, MapPin, Mail, Phone } from "lucide-react";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center">
              <Scissors className="h-8 w-8 text-amber-600" />
              <span className="ml-2 text-xl font-bold tracking-wider">BARBESHOP</span>
            </div>
            <p className="mt-4 text-gray-400">Premium grooming experience for the modern gentleman.</p>
            <div className="mt-6 flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Facebook</span>
                <FaFacebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Instagram</span>
                <FaInstagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Twitter</span>
                <FaTwitter className="h-6 w-6" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">Contact Us</h3>
            <ul className="mt-4 space-y-4">
              <li className="flex">
                <MapPin className="h-6 w-6 text-amber-600" />
                <span className="ml-3 text-gray-300">123 Barber Street, Milano, Italy</span>
              </li>
              <li className="flex">
                <Mail className="h-6 w-6 text-amber-600" />
                <span className="ml-3 text-gray-300">info@barbeshop.com</span>
              </li>
              <li className="flex">
                <Phone className="h-6 w-6 text-amber-600" />
                <span className="ml-3 text-gray-300">+39 02 1234 5678</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">Opening Hours</h3>
            <ul className="mt-4 space-y-2">
              <li className="flex justify-between">
                <span className="text-gray-300">Monday - Friday</span>
                <span className="text-gray-400">9:00 AM - 7:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-300">Saturday</span>
                <span className="text-gray-400">9:00 AM - 6:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-300">Sunday</span>
                <span className="text-gray-400">Closed</span>
              </li>
            </ul>
            <div className="mt-6">
              <Link href="/booking">
                <a className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-900 bg-amber-600 hover:bg-amber-700">
                  Book Now
                </a>
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-8 md:flex md:items-center md:justify-between">
          <div className="flex space-x-6 md:order-2">
            <p className="text-sm text-gray-400">
              <a href="#" className="text-gray-400 hover:text-gray-300">Privacy Policy</a>
            </p>
            <p className="text-sm text-gray-400">
              <a href="#" className="text-gray-400 hover:text-gray-300">Terms of Service</a>
            </p>
          </div>
          <p className="mt-8 text-sm text-gray-400 md:mt-0 md:order-1">
            &copy; {new Date().getFullYear()} BarbeShop. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
