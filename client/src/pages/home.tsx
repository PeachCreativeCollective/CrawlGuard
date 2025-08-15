import { Link } from "wouter";
import { CheckCircle, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo-head";
import { ServiceCard } from "@/components/service-card";
import { TestimonialCard } from "@/components/testimonial-card";
import { BUSINESS_INFO, SERVICES, SERVICE_AREAS, TESTIMONIALS } from "@/lib/constants";
import * as Icons from "lucide-react";
import heroImage from "@assets/CG3_1755280257029.webp";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "CrawlGuard LLC",
    "description": "Professional crawl space waterproofing, basement waterproofing, and mold remediation services in Asheville, NC and surrounding areas.",
    "url": "https://crawlguardllc.com",
    "telephone": "+1-828-206-5924",
    "email": "CrawlguardLLC@gmail.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Asheville",
      "addressRegion": "NC",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "35.5951",
      "longitude": "-82.5515"
    },
    "openingHours": ["Mo-Fr 09:00-17:00"],
    "serviceArea": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": "35.5951",
        "longitude": "-82.5515"
      },
      "geoRadius": "50000"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Waterproofing Services",
      "itemListElement": SERVICES.map(service => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": service.name
        }
      }))
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "50"
    }
  };

  const getServiceIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      home: Icons.Home,
      droplets: Icons.Droplets,
      "shield-check": Icons.ShieldCheck,
      zap: Icons.Zap,
      "trending-down": Icons.TrendingDown,
      sun: Icons.Sun,
    };
    return iconMap[iconName] || Icons.Home;
  };

  return (
    <>
      <SEOHead structuredData={structuredData} />
      
      {/* Hero Section */}
      <section className="relative bg-black py-20" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6" data-testid="hero-title">
                Expert Crawl Space <span className="text-crawlguard-primary">Waterproofing</span> in Asheville, NC
              </h1>
              <p className="text-xl text-white mb-8" data-testid="hero-description">
                Protect your home from water damage, mold, and moisture with our professional waterproofing solutions. 
                Serving Asheville and surrounding areas with reliable, long-lasting results.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  asChild 
                  size="lg"
                  className="bg-crawlguard-secondary hover:bg-red-600 text-white font-semibold"
                  data-testid="hero-cta-primary"
                >
                  <Link href="/contact">Get Free Estimate</Link>
                </Button>
                <Button 
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-2 border-crawlguard-primary text-crawlguard-primary hover:bg-crawlguard-primary hover:text-white font-semibold"
                  data-testid="hero-cta-phone"
                >
                  <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, '')}`}>
                    {BUSINESS_INFO.phone}
                  </a>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 text-sm text-white">
                {[
                  "Free Consultations",
                  "Licensed & Insured", 
                  "Local Experts"
                ].map((feature) => (
                  <div key={feature} className="flex items-center" data-testid={`feature-${feature.toLowerCase().replace(/\s+/g, '-')}`}>
                    <CheckCircle className="w-5 h-5 text-crawlguard-primary mr-2" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Professional CrawlGuard LLC crawl space encapsulation with vapor barrier installation" 
                className="rounded-xl shadow-2xl w-full h-auto"
                data-testid="hero-image"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-lg shadow-lg">
                <div className="text-2xl font-bold text-crawlguard-primary" data-testid="experience-years">15+</div>
                <div className="text-sm text-gray-600">Years Experience</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white" data-testid="services-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-crawlguard-dark mb-4" data-testid="services-title">
              Our Waterproofing Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="services-description">
              Comprehensive solutions to protect your home from water damage, mold, and moisture issues throughout Western North Carolina.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((service) => {
              const IconComponent = getServiceIcon(service.icon);
              return (
                <ServiceCard
                  key={service.id}
                  title={service.name}
                  description={service.description}
                  icon={IconComponent}
                  href="/services"
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Service Areas Section */}
      <section className="py-16 bg-crawlguard-light" data-testid="service-areas-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-crawlguard-dark mb-4" data-testid="areas-title">
              Serving Asheville & Surrounding Areas
            </h2>
            <p className="text-lg text-gray-600" data-testid="areas-description">
              Professional waterproofing services throughout Western North Carolina
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {SERVICE_AREAS.map((area) => (
              <div 
                key={area}
                className="bg-white p-4 rounded-lg text-center shadow-sm hover:shadow-md transition-shadow"
                data-testid={`area-${area.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="text-crawlguard-dark font-medium">{area}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-crawlguard-dark mb-4" data-testid="testimonials-title">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600" data-testid="testimonials-description">
              Read reviews from satisfied homeowners across Western North Carolina
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial) => (
              <TestimonialCard
                key={testimonial.name}
                name={testimonial.name}
                location={testimonial.location}
                rating={testimonial.rating}
                text={testimonial.text}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link 
              href="/contact"
              className="text-crawlguard-primary font-semibold text-lg hover:underline"
              data-testid="testimonials-cta"
            >
              Read More Reviews →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-crawlguard-primary to-teal-600 text-white" data-testid="cta-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="cta-title">
            Don't Wait - Protect Your Home Today
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto" data-testid="cta-description">
            Water damage gets worse over time. Schedule your free consultation now and get expert waterproofing solutions 
            that will protect your home for years to come.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              asChild
              size="lg"
              className="bg-crawlguard-secondary hover:bg-red-600 text-white font-semibold"
              data-testid="cta-phone"
            >
              <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, '')}`} className="flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Call {BUSINESS_INFO.phone}
              </a>
            </Button>
            <Button 
              asChild
              variant="secondary"
              size="lg"
              className="bg-white text-crawlguard-primary hover:bg-gray-100 font-semibold"
              data-testid="cta-estimate"
            >
              <Link href="/contact">Schedule Free Estimate</Link>
            </Button>
          </div>
          <p className="text-sm opacity-80 mt-4" data-testid="cta-hours">
            Available {BUSINESS_INFO.hours.weekdays}
          </p>
        </div>
      </section>
    </>
  );
}
