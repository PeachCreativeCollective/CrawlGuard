import { Link } from "wouter";
import { CheckCircle, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/contact-form";
import { LocationSection } from "@/components/location-section";
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

  const reviewsUrl = `${BUSINESS_INFO.socialMedia.facebook}/reviews/`;

  return (
    <>
      <SEOHead
        canonicalUrl="https://crawlguardllc.com/"
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section 
        className="relative min-h-[85vh] sm:min-h-screen bg-black p-4 sm:p-6 lg:p-8 flex items-center" 
        data-testid="hero-section"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/60"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 xl:gap-14 items-start">
            <div className="hero-content-slide-right">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-4 md:mb-6 leading-tight hero-title-fade" data-testid="hero-title">
                Expert Crawl Space <span className="text-crawlguard-primary">Waterproofing</span> in Asheville, NC
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white mb-4 sm:mb-6 md:mb-8 leading-relaxed hero-description-fade" data-testid="hero-description">
                Protect your home from water damage, mold, and moisture with our professional waterproofing solutions.
                Serving Asheville and surrounding areas with reliable, long-lasting results.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 hero-buttons-fade">
                <Button
                  asChild
                  size="lg"
                  className="bg-crawlguard-secondary hover:bg-red-600 text-white font-semibold transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  data-testid="hero-cta-primary"
                >
                  <Link href="/contact">Get Free Estimate</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-2 border-crawlguard-primary text-crawlguard-primary bg-white/10 backdrop-blur-sm hover:bg-crawlguard-primary hover:text-white font-semibold transform transition-all duration-300 hover:scale-105"
                  data-testid="hero-cta-phone"
                >
                  <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, '')}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    {BUSINESS_INFO.phone}
                  </a>
                </Button>
              </div>
              <div className="mt-6 sm:mt-8 flex flex-wrap gap-4 sm:gap-6 text-sm text-white hero-features-fade">
                {[
                  "Free Consultations",
                  "Licensed & Insured",
                  "Local Experts"
                ].map((feature, index) => (
                  <div
                    key={feature}
                    className="flex items-center hero-feature-item"
                    style={{
                      animationDelay: `${1.0 + index * 0.1}s`
                    }}
                    data-testid={`feature-${feature.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-crawlguard-primary mr-2 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-content-slide-right">
              <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-5 sm:p-6 border border-white/40 w-full">
                <h2 className="text-2xl font-bold text-crawlguard-dark mb-4">Request Your Inspection</h2>
                <ContactForm variant="compact" />
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
              Comprehensive solutions to protect your home from water damage, mold, and moisture issues across the greater Asheville metro and Western North Carolina.
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
                  href={`/services/${service.id}`}
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
              Serving the Greater Asheville Metro
            </h2>
            <p className="text-lg text-gray-600" data-testid="areas-description">
              Professional waterproofing services across Buncombe, Henderson, Haywood, and Madison counties
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
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
                {...testimonial}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <a
              href={reviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-crawlguard-primary font-semibold text-lg hover:underline"
              data-testid="testimonials-cta"
            >
              Read Verified Reviews →
            </a>
          </div>
        </div>
      </section>

      <LocationSection className="bg-crawlguard-light" />

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
