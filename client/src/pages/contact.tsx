import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { SEOHead } from "@/components/seo-head";
import { ContactForm } from "@/components/contact-form";
import { LocationSection } from "@/components/location-section";
import { BUSINESS_INFO } from "@/lib/constants";

export default function Contact() {
  return (
    <>
      <SEOHead
        title="Contact CrawlGuard LLC - Free Waterproofing Estimates in Asheville, NC"
        description="Contact CrawlGuard LLC for free waterproofing estimates in Asheville, NC. Call (828) 206-5924 or fill out our contact form. Professional service guaranteed."
        keywords="contact CrawlGuard, free estimate, Asheville NC waterproofing, phone consultation, schedule service"
        canonicalUrl="https://crawlguardllc.com/contact"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-crawlguard-primary/10 to-blue-50 py-20" data-testid="contact-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-crawlguard-dark mb-6" data-testid="contact-hero-title">
            Get Your Free Estimate
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="contact-hero-description">
            Contact us today for professional waterproofing services in Asheville and surrounding areas. 
            We provide free consultations and competitive estimates.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white" data-testid="contact-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Contact Form */}
            <ContactForm />

            {/* Business Information */}
            <div className="space-y-8" data-testid="business-info">
              <div className="bg-white p-8 rounded-xl shadow-sm" data-testid="contact-info-card">
                <h3 className="text-xl font-bold text-crawlguard-dark mb-6" data-testid="contact-info-title">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4" data-testid="contact-phone">
                    <Phone className="w-6 h-6 text-crawlguard-primary mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-crawlguard-dark">Phone</div>
                      <a 
                        href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, '')}`}
                        className="text-crawlguard-primary hover:underline text-lg font-semibold"
                        data-testid="contact-phone-link"
                      >
                        {BUSINESS_INFO.phone}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4" data-testid="contact-email">
                    <Mail className="w-6 h-6 text-crawlguard-primary mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-crawlguard-dark">Email</div>
                      <a 
                        href={`mailto:${BUSINESS_INFO.email}`}
                        className="text-crawlguard-primary hover:underline"
                        data-testid="contact-email-link"
                      >
                        {BUSINESS_INFO.email}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4" data-testid="contact-location">
                    <MapPin className="w-6 h-6 text-crawlguard-primary mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-crawlguard-dark">Service Area</div>
                      <div className="text-gray-600">{BUSINESS_INFO.address.full}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4" data-testid="contact-hours">
                    <Clock className="w-6 h-6 text-crawlguard-primary mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-crawlguard-dark">Business Hours</div>
                      <div className="text-gray-600">
                        <div>{BUSINESS_INFO.hours.weekdays}</div>
                        <div>{BUSINESS_INFO.hours.weekends}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Why Choose Us */}
              <div className="bg-white p-8 rounded-xl shadow-sm" data-testid="why-choose-card">
                <h3 className="text-xl font-bold text-crawlguard-dark mb-4" data-testid="why-choose-title">
                  Why Choose CrawlGuard LLC?
                </h3>
                <ul className="space-y-3">
                  {[
                    "Free consultations and estimates",
                    "Licensed and insured professionals", 
                    "High-quality materials and workmanship",
                    "Local expertise and personalized service"
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-start space-x-3" data-testid={`benefit-${index}`}>
                      <svg className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-gray-600">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Emergency Contact */}
              <div className="bg-crawlguard-secondary/10 p-6 rounded-xl border border-crawlguard-secondary/20" data-testid="emergency-contact">
                <h4 className="font-semibold text-crawlguard-dark mb-2" data-testid="emergency-title">
                  Need Emergency Service?
                </h4>
                <p className="text-gray-600 mb-3">
                  Water damage emergencies can't wait. Call us immediately for urgent waterproofing needs.
                </p>
                <a 
                  href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, '')}`}
                  className="inline-flex items-center bg-crawlguard-secondary text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-semibold"
                  data-testid="emergency-phone"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now: {BUSINESS_INFO.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-20 bg-crawlguard-light" data-testid="service-areas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-crawlguard-dark mb-4" data-testid="service-areas-title">
              Serving These Areas
            </h2>
            <p className="text-lg text-gray-600" data-testid="service-areas-description">
              Professional waterproofing services throughout Western North Carolina
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {[
              "Asheville", "Marshall", "Mars Hill", "Weaverville", "Candler", "Hendersonville",
              "Maggie Valley", "Burnsville", "Leicester", "Hot Springs", "Enka", "Woodfin",
              "Fairview", "Walnut Creek", "Fletcher", "Arden"
            ].map((area) => (
              <div 
                key={area}
                className="bg-white p-4 rounded-lg text-center shadow-sm hover:shadow-md transition-shadow"
                data-testid={`service-area-${area.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="text-crawlguard-dark font-medium">{area}, NC</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
