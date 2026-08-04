import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { BUSINESS_INFO } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LocationSectionProps {
  className?: string;
}

export function LocationSection({ className }: LocationSectionProps) {
  return (
    <section className={cn("py-20 bg-white", className)} data-testid="location-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-crawlguard-dark">
              CrawlGuard LLC
            </h2>
            <p className="text-lg text-gray-600">
              Asheville-based crawl space and basement waterproofing experts traveling throughout North Carolina for residential moisture-control projects.
            </p>
            <div className="space-y-4">
              <div className="flex items-start space-x-3" data-testid="location-address">
                <MapPin className="w-5 h-5 text-crawlguard-primary mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-crawlguard-dark">Address</div>
                  <p className="text-gray-600">{BUSINESS_INFO.address.full}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3" data-testid="location-phone">
                <Phone className="w-5 h-5 text-crawlguard-primary mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-crawlguard-dark">Phone</div>
                  <a
                    href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}
                    className="text-crawlguard-primary hover:underline font-semibold"
                  >
                    {BUSINESS_INFO.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-3" data-testid="location-email">
                <Mail className="w-5 h-5 text-crawlguard-primary mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-crawlguard-dark">Email</div>
                  <a
                    href={`mailto:${BUSINESS_INFO.email}`}
                    className="text-crawlguard-primary hover:underline"
                  >
                    {BUSINESS_INFO.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-3" data-testid="location-hours">
                <Clock className="w-5 h-5 text-crawlguard-primary mt-1 flex-shrink-0" />
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
          <div className="w-full h-full">
            <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-lg border border-gray-200" data-testid="location-map">
              <iframe
                title="CrawlGuard LLC service area map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d415622.2241905679!2d-82.70570694999999!3d35.527795999999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8849f22d8ef06a37%3A0xba9a57bbf0ee7ae0!2sCrawl%20Guard!5e0!3m2!1sen!2sus!4v1785856576632!5m2!1sen!2sus"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <div className="mt-3 text-sm text-gray-500">
              <a
                href="https://www.google.com/maps/search/?api=1&query=CrawlGuard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-crawlguard-primary hover:underline"
              >
                View larger map
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
