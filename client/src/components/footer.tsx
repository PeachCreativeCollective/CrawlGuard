import { Link } from "wouter";
import { Facebook } from "lucide-react";
import { BUSINESS_INFO, SERVICES, SERVICE_AREAS } from "@/lib/constants";
import logoPath from "@assets/CRAWLGUARD LOGO 25_1755279513803.png";

export function Footer() {
  return (
    <footer className="bg-crawlguard-dark text-white py-16" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div data-testid="footer-company">
            <img 
              src={logoPath} 
              alt="CrawlGuard LLC Logo" 
              className="h-12 w-auto mb-4 brightness-0 invert"
              data-testid="footer-logo"
            />
            <p className="text-gray-300 mb-4">
              Professional waterproofing and crawl space solutions serving Asheville, NC and surrounding areas. 
              Protecting homes from water damage since 2008.
            </p>
            <div className="flex space-x-4">
              <a 
                href={BUSINESS_INFO.socialMedia.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
                data-testid="footer-facebook"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6" />
              </a>
            </div>
          </div>
          
          {/* Services */}
          <div data-testid="footer-services">
            <h3 className="text-lg font-semibold mb-4">Our Services</h3>
            <ul className="space-y-2">
              {SERVICES.slice(0, 6).map((service) => (
                <li key={service.id}>
                  <Link 
                    href="/services"
                    className="text-gray-300 hover:text-white transition-colors"
                    data-testid={`footer-service-${service.id}`}
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Service Areas */}
          <div data-testid="footer-areas">
            <h3 className="text-lg font-semibold mb-4">Service Areas</h3>
            <ul className="space-y-2">
              {SERVICE_AREAS.slice(0, 6).map((area) => (
                <li key={area}>
                  <span className="text-gray-300">{area}, NC</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Contact Info */}
          <div data-testid="footer-contact">
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div>
                <a 
                  href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, '')}`}
                  className="text-crawlguard-primary hover:text-teal-300 font-semibold text-lg"
                  data-testid="footer-phone"
                >
                  {BUSINESS_INFO.phone}
                </a>
              </div>
              <div>
                <a 
                  href={`mailto:${BUSINESS_INFO.email}`}
                  className="text-gray-300 hover:text-white transition-colors"
                  data-testid="footer-email"
                >
                  {BUSINESS_INFO.email}
                </a>
              </div>
              <div className="text-gray-300" data-testid="footer-hours">
                <div>{BUSINESS_INFO.hours.weekdays}</div>
                <div>{BUSINESS_INFO.hours.weekends}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-700 mt-12 pt-8 text-center" data-testid="footer-copyright">
          <p className="text-gray-300">
            © 2025 {BUSINESS_INFO.name}. All rights reserved. Licensed and insured waterproofing contractor serving Western North Carolina.
          </p>
        </div>
      </div>
    </footer>
  );
}
