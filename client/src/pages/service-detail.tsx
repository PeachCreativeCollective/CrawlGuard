import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LocationSection } from "@/components/location-section";
import { SEOHead } from "@/components/seo-head";
import { SERVICE_DETAILS } from "@/data/service-details";
import { BUSINESS_INFO } from "@/lib/constants";
import { Link, useParams } from "wouter";
import { AlertTriangle, ArrowRight, CheckCircle, Phone } from "lucide-react";

export default function ServiceDetail() {
  const params = useParams<{ serviceId: string }>();
  const service = params?.serviceId ? SERVICE_DETAILS[params.serviceId] : undefined;

  if (!service) {
    return <ServiceNotFound />;
  }

  const relatedServices = service.relatedServices
    .map((relatedId) => SERVICE_DETAILS[relatedId])
    .filter((related): related is NonNullable<typeof related> => Boolean(related));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    serviceType: service.serviceType,
    description: service.metaDescription,
    provider: {
      "@type": "LocalBusiness",
      name: BUSINESS_INFO.name,
      telephone: BUSINESS_INFO.phone,
      areaServed: BUSINESS_INFO.address.full,
    },
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: "35.5951",
        longitude: "-82.5515",
      },
      geoRadius: "50000",
    },
  };

  return (
    <>
      <SEOHead
        title={`${service.name} | CrawlGuard LLC`}
        description={service.metaDescription}
        canonicalUrl={`https://crawlguardllc.com/services/${service.id}`}
        structuredData={structuredData}
      />

      <section className="bg-gradient-to-br from-crawlguard-primary/10 to-blue-50 py-20" data-testid="service-detail-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <nav aria-label="Breadcrumb" className="text-sm text-crawlguard-primary font-semibold">
                <Link href="/services" className="hover:underline">
                  Services
                </Link>
                <span className="mx-2 text-gray-500">/</span>
                <span className="text-crawlguard-dark">{service.name}</span>
              </nav>
              <h1 className="text-4xl md:text-5xl font-bold text-crawlguard-dark" data-testid="service-detail-title">
                {service.headline}
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed" data-testid="service-detail-intro">
                {service.intro}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-crawlguard-secondary hover:bg-red-600 text-white font-semibold"
                >
                  <Link href="/contact">Schedule Your Consultation</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-2 border-crawlguard-primary text-crawlguard-primary"
                >
                  <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`} className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    Call {BUSINESS_INFO.phone}
                  </a>
                </Button>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-crawlguard-primary/10">
              <h2 className="text-2xl font-semibold text-crawlguard-dark mb-4">Why Asheville homeowners choose us</h2>
              <ul className="space-y-3 text-gray-600">
                {service.benefits.slice(0, 3).map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-crawlguard-primary mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="inline-flex items-center text-crawlguard-primary font-semibold hover:underline mt-6"
              >
                Request a moisture assessment <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white" data-testid="service-detail-benefits">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-crawlguard-dark mb-6">Key Benefits</h2>
              <ul className="space-y-4 text-gray-700">
                {service.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-crawlguard-primary mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-crawlguard-dark mb-6">Warning Signs to Watch For</h2>
              <ul className="space-y-4 text-gray-700">
                {service.warningSigns.map((sign, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-crawlguard-secondary mt-0.5 flex-shrink-0" />
                    <span>{sign}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-crawlguard-light" data-testid="service-detail-process">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-crawlguard-dark mb-12 text-center">Our Proven Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {service.processSteps.map((step, index) => (
              <Card key={index} className="h-full text-center">
                <CardContent className="p-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-crawlguard-primary/10 text-crawlguard-primary flex items-center justify-center text-2xl font-bold mx-auto">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-crawlguard-dark">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {relatedServices.length > 0 && (
        <section className="py-20 bg-white" data-testid="service-detail-related">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-crawlguard-dark mb-6">Complementary Services</h2>
            <p className="text-lg text-gray-600 mb-8">
              Combine this service with additional CrawlGuard solutions for a complete moisture management strategy.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedServices.map((related) => (
                <Card key={related.id} className="h-full">
                  <CardContent className="p-6 space-y-3">
                    <h3 className="text-xl font-semibold text-crawlguard-dark">{related.name}</h3>
                    <p className="text-gray-600 text-sm">{related.metaDescription}</p>
                    <Link
                      href={`/services/${related.id}`}
                      className="inline-flex items-center text-crawlguard-primary font-semibold hover:underline"
                    >
                      Explore service <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 bg-gradient-to-r from-crawlguard-primary to-teal-600 text-white" data-testid="service-detail-cta">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-3xl mx-auto">
            Book a free on-site assessment with CrawlGuard LLC and receive a custom plan tailored to your home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-crawlguard-secondary hover:bg-red-600 text-white font-semibold">
              <Link href="/contact">Book Free Assessment</Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="bg-white text-crawlguard-primary font-semibold">
              <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`} className="flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Call {BUSINESS_INFO.phone}
              </a>
            </Button>
          </div>
        </div>
      </section>

      <LocationSection className="bg-crawlguard-light/70" />
    </>
  );
}

function ServiceNotFound() {
  return (
    <>
      <SEOHead
        title="Service Not Found | CrawlGuard LLC"
        description="The requested waterproofing service could not be found. Browse our full list of services to learn more."
        canonicalUrl="https://crawlguardllc.com/services"
      />
      <section className="min-h-[60vh] flex items-center bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-4xl font-bold text-crawlguard-dark">Service not found</h1>
          <p className="text-lg text-gray-600">
            We couldn’t locate that service. Visit our services page to explore crawl space encapsulation, basement waterproofing, and more.
          </p>
          <Button asChild size="lg" className="bg-crawlguard-secondary hover:bg-red-600 text-white font-semibold">
            <Link href="/services">View all services</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
