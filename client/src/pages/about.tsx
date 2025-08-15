import { CheckCircle, Users, Award, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/seo-head";
import { BUSINESS_INFO } from "@/lib/constants";
import { Link } from "wouter";
import aboutImage from "@assets/CG2_1755280257030.webp";

export default function About() {
  return (
    <>
      <SEOHead
        title="About CrawlGuard LLC - Asheville, NC Waterproofing Experts"
        description="Learn about CrawlGuard LLC's mission, expertise, and commitment to protecting homes in Asheville, NC. Professional waterproofing services since 2008."
        keywords="CrawlGuard LLC, about us, waterproofing company, Asheville NC, local business, professional contractors"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-crawlguard-primary/10 to-blue-50 py-20" data-testid="about-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-crawlguard-dark mb-6" data-testid="about-hero-title">
                Protecting Homes Across Western NC
              </h1>
              <p className="text-xl text-gray-600 mb-6" data-testid="about-hero-description">
                At CrawlGuard LLC, we are committed to protecting homes throughout Asheville, NC, and neighboring communities. 
                From wet basements to crawl space moisture and foundation issues, we deliver expert waterproofing services to 
                keep your home dry, safe, and mold-free.
              </p>
              <div className="space-y-4">
                {[
                  {
                    title: "Latest Technology & Techniques",
                    description: "We use cutting-edge materials and proven methods to identify and solve waterproofing problems quickly and effectively."
                  },
                  {
                    title: "Local Expertise",
                    description: "As a locally owned business, we understand the unique challenges that homes in Western NC face due to climate and soil conditions."
                  },
                  {
                    title: "Comprehensive Solutions",
                    description: "From waterproofing and encapsulation to mold remediation, we provide complete, long-lasting solutions for your home."
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3" data-testid={`about-feature-${index}`}>
                    <CheckCircle className="w-6 h-6 text-crawlguard-primary mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-crawlguard-dark">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button 
                  asChild
                  size="lg"
                  className="bg-crawlguard-secondary hover:bg-red-600 text-white font-semibold"
                  data-testid="about-hero-cta"
                >
                  <Link href="/contact">Schedule Consultation</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src={aboutImage} 
                alt="Professional CrawlGuard LLC waterproofing work on Asheville area home foundation" 
                className="rounded-xl shadow-lg w-full h-auto"
                data-testid="about-hero-image"
              />
              <div className="absolute -bottom-4 -right-4 bg-crawlguard-primary text-white p-6 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold" data-testid="homes-protected">500+</div>
                  <div className="text-sm">Homes Protected</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white" data-testid="mission-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-crawlguard-dark mb-4" data-testid="mission-title">
              Our Mission
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto" data-testid="mission-description">
              Your Trusted Waterproofing Experts in Asheville, NC, and Surrounding Areas
            </p>
          </div>

          <div className="bg-crawlguard-light p-8 rounded-xl">
            <p className="text-lg text-gray-700 leading-relaxed" data-testid="mission-statement">
              At <strong>CrawlGuard LLC</strong>, we are committed to protecting homes throughout <strong>Asheville, NC</strong>, 
              and neighboring towns including Marshall, Mars Hill, Weaverville, Candler, Hendersonville, Maggie Valley, 
              Burnsville, Leicester, Hot Springs, Enka, Woodfin, Fairview, Walnut Creek, Fletcher, and Arden. 
              From wet basements to crawl space moisture and foundation issues, we deliver expert waterproofing services 
              to keep your home dry, safe, and mold-free.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-crawlguard-light" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                number: "15+",
                label: "Years Experience",
                description: "Serving Western NC with reliable waterproofing solutions"
              },
              {
                icon: Award,
                number: "500+",
                label: "Homes Protected",
                description: "Successfully waterproofed homes across the region"
              },
              {
                icon: Clock,
                number: "24hr",
                label: "Response Time",
                description: "Quick response to your waterproofing emergencies"
              }
            ].map((stat, index) => (
              <Card key={index} className="text-center" data-testid={`stat-${index}`}>
                <CardContent className="p-8">
                  <stat.icon className="w-12 h-12 text-crawlguard-primary mx-auto mb-4" />
                  <div className="text-4xl font-bold text-crawlguard-dark mb-2">
                    {stat.number}
                  </div>
                  <div className="text-xl font-semibold text-crawlguard-dark mb-2">
                    {stat.label}
                  </div>
                  <p className="text-gray-600">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white" data-testid="values-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-crawlguard-dark mb-4" data-testid="values-title">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="values-description">
              These core principles guide everything we do at CrawlGuard LLC
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Quality Workmanship",
                description: "We take pride in every project, using high-quality materials and proven techniques to ensure long-lasting results that protect your home for years to come."
              },
              {
                title: "Honest Communication",
                description: "We believe in transparent communication, providing clear explanations of our process, realistic timelines, and upfront pricing with no hidden fees."
              },
              {
                title: "Customer Satisfaction",
                description: "Your satisfaction is our priority. We work closely with you throughout the project and stand behind our work with comprehensive warranties."
              },
              {
                title: "Local Commitment",
                description: "As a locally owned business, we're invested in our community. We understand local conditions and are here when you need us."
              }
            ].map((value, index) => (
              <Card key={index} data-testid={`value-${index}`}>
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold text-crawlguard-dark mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service Areas Detail */}
      <section className="py-20 bg-crawlguard-light" data-testid="service-areas-detail">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-crawlguard-dark mb-4" data-testid="service-areas-title">
              Complete Waterproofing Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto" data-testid="service-areas-description">
              At CrawlGuard LLC, we deliver comprehensive and affordable waterproofing services across Asheville and 
              surrounding towns. Protect your home with trusted experts who understand the local climate, soil, 
              and building conditions—and who are always just a call away.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Basement Waterproofing",
              "Crawl Space Waterproofing", 
              "Wet Basement Solutions",
              "Mold Prevention",
              "Foundation Waterproofing",
              "Exterior Waterproofing",
              "Residential Waterproofing"
            ].map((service, index) => (
              <Card key={index} className="text-center" data-testid={`detailed-service-${index}`}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-crawlguard-dark">{service}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-crawlguard-primary to-teal-600 text-white" data-testid="about-cta">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="about-cta-title">
            Ready to Work With Us?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto" data-testid="about-cta-description">
            Experience the CrawlGuard difference. Contact us today to schedule your free consultation and learn how 
            we can protect your home from water damage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild
              size="lg"
              className="bg-crawlguard-secondary hover:bg-red-600 text-white font-semibold"
              data-testid="about-cta-contact"
            >
              <Link href="/contact">Get Free Estimate</Link>
            </Button>
            <Button 
              asChild
              variant="secondary"
              size="lg"
              className="bg-white text-crawlguard-primary hover:bg-gray-100 font-semibold"
              data-testid="about-cta-phone"
            >
              <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, '')}`}>
                Call {BUSINESS_INFO.phone}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
