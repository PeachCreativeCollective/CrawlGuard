import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/seo-head";
import { BUSINESS_INFO, SERVICES } from "@/lib/constants";
import { Link } from "wouter";
import * as Icons from "lucide-react";

export default function Services() {
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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "CrawlGuard LLC Waterproofing Services",
    itemListElement: SERVICES.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://crawlguardllc.com/services/${service.id}`,
      name: service.name,
      item: {
        "@type": "Service",
        name: service.name,
        description: service.description,
        serviceType: service.name,
        provider: {
          "@type": "LocalBusiness",
          name: BUSINESS_INFO.name,
          telephone: BUSINESS_INFO.phone,
          areaServed: BUSINESS_INFO.address.full,
        },
      },
    })),
  };

  return (
    <>
      <SEOHead
        title="Waterproofing Services - CrawlGuard LLC Asheville, NC"
        description="Professional crawl space encapsulation, basement waterproofing, mold remediation, and moisture control services in Asheville, NC. Free estimates available."
        keywords="crawl space encapsulation, basement waterproofing, mold remediation, vapor barriers, sump pumps, French drains, Asheville NC"
        canonicalUrl="https://crawlguardllc.com/services"
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-crawlguard-primary/10 to-blue-50 py-20" data-testid="services-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-crawlguard-dark mb-6" data-testid="services-hero-title">
            Professional Waterproofing Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8" data-testid="services-hero-description">
            Comprehensive waterproofing solutions to protect your home from water damage, mold, and moisture issues. 
            Serving Asheville, NC and surrounding areas with expert craftsmanship and reliable results.
          </p>
          <Button 
            asChild
            size="lg"
            className="bg-crawlguard-secondary hover:bg-red-600 text-white font-semibold"
            data-testid="services-hero-cta"
          >
            <Link href="/contact">Get Free Estimate</Link>
          </Button>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white" data-testid="services-grid-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {SERVICES.map((service) => {
              const IconComponent = getServiceIcon(service.icon);
              return (
                <Card key={service.id} className="h-full" data-testid={`detailed-service-${service.id}`}>
                  <CardHeader>
                    <div className="w-16 h-16 bg-crawlguard-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="w-8 h-8 text-crawlguard-primary" />
                    </div>
                    <CardTitle className="text-2xl text-crawlguard-dark">
                      {service.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-6">{service.description}</p>
                    <div className="space-y-2">
                      {getServiceBenefits(service.id).map((benefit, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{benefit}</span>
                        </div>
                      ))}
                    </div>
                    <Link
                      href={`/services/${service.id}`}
                      className="inline-flex items-center text-crawlguard-primary font-semibold hover:underline mt-6"
                    >
                      View detailed service →
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-crawlguard-light" data-testid="why-choose-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-crawlguard-dark mb-4" data-testid="why-choose-title">
              Why Choose CrawlGuard LLC?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="why-choose-description">
              We're committed to providing the highest quality waterproofing services with exceptional customer care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Free Consultations",
                description: "Comprehensive home assessments at no cost to you"
              },
              {
                title: "Licensed & Insured",
                description: "Fully licensed professionals with complete insurance coverage"
              },
              {
                title: "Quality Materials",
                description: "High-grade materials and proven waterproofing systems"
              },
              {
                title: "Local Expertise",
                description: "Deep knowledge of Western NC climate and building conditions"
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center" data-testid={`feature-${index}`}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-crawlguard-dark mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white" data-testid="process-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-crawlguard-dark mb-4" data-testid="process-title">
              Our Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="process-description">
              We use the latest technology and techniques to identify and solve your waterproofing problems quickly and effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                step: "1",
                title: "Free Inspection",
                description: "Comprehensive assessment of your crawl space, basement, or foundation to identify moisture issues and potential problems."
              },
              {
                step: "2", 
                title: "Custom Solution",
                description: "We develop a tailored waterproofing plan using proven techniques and high-quality materials specific to your home's needs."
              },
              {
                step: "3",
                title: "Professional Installation",
                description: "Our experienced team implements the solution with precision, ensuring long-lasting protection for your home."
              }
            ].map((process, index) => (
              <Card key={index} className="text-center" data-testid={`process-step-${index}`}>
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-crawlguard-primary text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                    {process.step}
                  </div>
                  <h3 className="text-xl font-semibold text-crawlguard-dark mb-4">
                    {process.title}
                  </h3>
                  <p className="text-gray-600">{process.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-crawlguard-primary to-teal-600 text-white" data-testid="services-cta">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="services-cta-title">
            Ready to Protect Your Home?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto" data-testid="services-cta-description">
            Contact us today for your free consultation and estimate. Our experts are ready to help solve your waterproofing needs.
          </p>
          <Button 
            asChild
            size="lg"
            className="bg-crawlguard-secondary hover:bg-red-600 text-white font-semibold"
            data-testid="services-cta-button"
          >
            <Link href="/contact">Schedule Free Consultation</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function getServiceBenefits(serviceId: string): string[] {
  const benefits: Record<string, string[]> = {
    "crawl-space-encapsulation": [
      "Prevents moisture and mold growth",
      "Improves indoor air quality",
      "Increases energy efficiency",
      "Deters pests and rodents",
      "Protects structural integrity"
    ],
    "basement-waterproofing": [
      "Interior and exterior solutions",
      "Advanced drainage systems",
      "Foundation crack repair",
      "Moisture barrier installation",
      "Sump pump integration"
    ],
    "mold-remediation": [
      "Safe mold removal techniques",
      "Air quality testing",
      "Contaminated material removal",
      "Moisture source elimination",
      "Prevention strategies"
    ],
    "sump-pump": [
      "Reliable water removal",
      "Battery backup systems",
      "Professional installation",
      "Regular maintenance service",
      "Emergency response"
    ],
    "french-drain": [
      "Effective water diversion",
      "Foundation protection",
      "Landscape preservation",
      "Long-lasting solutions",
      "Professional excavation"
    ],
    "insulation-dehumidification": [
      "Energy efficiency improvement",
      "Moisture level control",
      "Air quality enhancement",
      "Temperature regulation",
      "Mold prevention"
    ]
  };
  
  return benefits[serviceId] || [];
}
