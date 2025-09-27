import { SERVICES } from "@/lib/constants";

export interface ServiceDetailContent {
  id: string;
  name: string;
  headline: string;
  metaDescription: string;
  intro: string;
  benefits: string[];
  warningSigns: string[];
  processSteps: { title: string; description: string }[];
  relatedServices: string[];
  serviceType: string;
}

const detailLookup: Record<string, ServiceDetailContent> = {
  "crawl-space-encapsulation": {
    id: "crawl-space-encapsulation",
    name: "Crawl Space Encapsulation",
    headline: "Seal Out Moisture with Crawl Space Encapsulation",
    metaDescription:
      "Full crawl space encapsulation service that stops moisture, mold, and pests with heavy-duty vapor barriers, drainage, and humidity control for Asheville homes.",
    intro:
      "Our encapsulation team installs a continuous vapor barrier, seals vents, insulates walls, and manages drainage to keep your crawl space clean, dry, and energy efficient year-round.",
    benefits: [
      "Eliminates ground moisture and standing water",
      "Improves indoor air quality by blocking mold spores",
      "Protects floor framing from rot and structural damage",
      "Lowers heating and cooling costs through better insulation",
    ],
    warningSigns: [
      "Musty odors or persistent mildew smells",
      "Sagging insulation or damp subfloor",
      "Condensation on ductwork and HVAC equipment",
      "Visible mold growth or insect activity",
    ],
    processSteps: [
      {
        title: "Moisture & Structural Assessment",
        description:
          "We document current moisture levels, look for leaks, evaluate airflow, and note any structural repairs needed before encapsulation begins.",
      },
      {
        title: "Drainage & Vapor Barrier Installation",
        description:
          "A heavy-duty vapor barrier is sealed to the walls and piers, and interior drainage or sump solutions are added where necessary.",
      },
      {
        title: "Sealing, Insulation & Conditioning",
        description:
          "Vents are sealed, rim joists insulated, and optional dehumidification keeps relative humidity within the recommended range.",
      },
    ],
    relatedServices: ["mold-remediation", "insulation-dehumidification", "french-drain"],
    serviceType: "Crawl space encapsulation",
  },
  "basement-waterproofing": {
    id: "basement-waterproofing",
    name: "Basement Waterproofing",
    headline: "Keep Your Basement Dry and Ready to Use",
    metaDescription:
      "Basement waterproofing solutions including drainage, sump pumps, and foundation sealing to prevent flooding and moisture damage in Asheville basements.",
    intro:
      "Whether you are dealing with seepage, hydrostatic pressure, or foundation cracks, our basement waterproofing systems keep water out and protect finished living areas.",
    benefits: [
      "Stops seepage and hydrostatic pressure",
      "Prevents mold growth and musty odors",
      "Protects finished floors, walls, and stored belongings",
      "Maintains property value with a dry, healthy basement",
    ],
    warningSigns: [
      "Water lines on block or poured walls",
      "Floor cracks or efflorescence on concrete",
      "Pooling water after heavy rain",
      "Damp carpets, drywall, or wood framing",
    ],
    processSteps: [
      {
        title: "Diagnostic Inspection",
        description:
          "We track how water is entering your basement, review grading, guttering, and foundation drainage, and map a custom solution.",
      },
      {
        title: "Interior & Exterior Water Management",
        description:
          "Depending on the property, we install perimeter drains, sump pumps, foundation sealers, or exterior membranes to direct water away.",
      },
      {
        title: "Finish Protection & Monitoring",
        description:
          "After waterproofing, we add moisture monitoring and optional dehumidification to maintain a dry living space long term.",
      },
    ],
    relatedServices: ["sump-pump", "french-drain", "mold-remediation"],
    serviceType: "Basement waterproofing",
  },
  "mold-remediation": {
    id: "mold-remediation",
    name: "Mold Remediation",
    headline: "Remove Mold Safely and Prevent Future Growth",
    metaDescription:
      "Certified mold remediation that removes contamination, treats affected materials, and addresses moisture sources for long-term prevention.",
    intro:
      "Our certified team isolates the work area, removes contaminated materials, treats surfaces, and addresses the moisture source so mold cannot return.",
    benefits: [
      "Improves indoor air quality and reduces allergens",
      "Protects occupants from harmful mycotoxins",
      "Prevents structural deterioration from decay",
      "Includes moisture control strategies to stop regrowth",
    ],
    warningSigns: [
      "Visible fungal growth on wood or drywall",
      "Persistent musty odors or allergic reactions",
      "Discoloration around HVAC registers",
      "Condensation or leaks feeding moisture",
    ],
    processSteps: [
      {
        title: "Testing & Containment",
        description:
          "We identify the extent of mold, isolate affected zones with negative air pressure, and set up HEPA filtration for safety.",
      },
      {
        title: "Safe Removal & Cleaning",
        description:
          "Contaminated materials are removed or cleaned using professional antimicrobial products and HEPA vacuuming.",
      },
      {
        title: "Moisture Source Correction",
        description:
          "We correct the underlying moisture issue and recommend encapsulation, drainage, or dehumidification to prevent recurrence.",
      },
    ],
    relatedServices: ["crawl-space-encapsulation", "basement-waterproofing", "insulation-dehumidification"],
    serviceType: "Mold remediation",
  },
  "sump-pump": {
    id: "sump-pump",
    name: "Sump Pump Installation",
    headline: "Reliable Sump Pump Systems with Backup Protection",
    metaDescription:
      "Professional sump pump installation with battery backups, discharge routing, and maintenance plans to keep crawl spaces and basements dry.",
    intro:
      "We size and install primary and backup sump pumps, integrate drainage piping, and provide maintenance to make sure water is removed before it reaches your floor.",
    benefits: [
      "Automates groundwater removal during storms",
      "Protects finished areas from sudden flooding",
      "Includes battery backup to keep working during outages",
      "Extends life of waterproofing systems and foundations",
    ],
    warningSigns: [
      "Existing pump cycling constantly or failing",
      "Standing water around the foundation",
      "Visible rust or clogs in discharge lines",
      "No backup pump or alarm in place",
    ],
    processSteps: [
      {
        title: "Drainage Evaluation",
        description:
          "We review current drainage, water table conditions, and discharge routes to design the right pump configuration.",
      },
      {
        title: "Pump & Basin Installation",
        description:
          "A durable basin is installed with primary and optional backup pumps, check valves, and alarms for early warnings.",
      },
      {
        title: "Testing & Maintenance Plan",
        description:
          "We test flow rates, confirm discharge routing, and outline maintenance so the system stays reliable for years.",
      },
    ],
    relatedServices: ["basement-waterproofing", "french-drain", "crawl-space-encapsulation"],
    serviceType: "Sump pump installation",
  },
  "french-drain": {
    id: "french-drain",
    name: "French Drain Systems",
    headline: "Redirect Water Away from Your Foundation",
    metaDescription:
      "Custom French drain systems that capture groundwater and surface runoff, protecting foundations and landscaping in Western North Carolina.",
    intro:
      "Our crew designs and installs interior or exterior French drain systems that collect water and send it safely away from vulnerable areas.",
    benefits: [
      "Stops water from pooling around the foundation",
      "Protects landscaping and hardscapes from erosion",
      "Reduces hydrostatic pressure against basement walls",
      "Pairs with sump pumps for complete drainage",
    ],
    warningSigns: [
      "Soft, muddy soil near the home",
      "Water staining on foundation walls",
      "Erosion channels across landscaped areas",
      "Basement leaks after every rainfall",
    ],
    processSteps: [
      {
        title: "Site Grading Review",
        description:
          "We analyze how water moves across the property and determine the best drain path and depth.",
      },
      {
        title: "Drain Installation",
        description:
          "Perforated piping, gravel, and filter fabric are installed to capture water while preventing clogs.",
      },
      {
        title: "Integration & Restoration",
        description:
          "Drains are tied into sump pumps or daylight discharge and the landscape is restored so it looks clean when we leave.",
      },
    ],
    relatedServices: ["basement-waterproofing", "sump-pump", "insulation-dehumidification"],
    serviceType: "French drain installation",
  },
  "insulation-dehumidification": {
    id: "insulation-dehumidification",
    name: "Insulation & Dehumidification",
    headline: "Keep Moisture in Check with Insulation & Dehumidifiers",
    metaDescription:
      "Moisture control services that replace damaged insulation and install whole-home or crawl space dehumidifiers for balanced humidity.",
    intro:
      "We remove moldy insulation, install proper thermal barriers, and add high-capacity dehumidifiers that maintain safe humidity levels in crawl spaces and basements.",
    benefits: [
      "Maintains healthy relative humidity",
      "Improves HVAC efficiency and comfort",
      "Prevents mold regrowth after remediation",
      "Protects ducts, wiring, and stored belongings",
    ],
    warningSigns: [
      "Condensation on windows or ductwork",
      "Damp or falling insulation",
      "High indoor humidity or musty odors",
      "Rusting metal fixtures in the crawl space",
    ],
    processSteps: [
      {
        title: "Moisture Diagnostics",
        description:
          "We measure humidity, inspect insulation, and identify moisture sources feeding the problem.",
      },
      {
        title: "Removal & Replacement",
        description:
          "Damaged insulation is safely removed and replaced with moisture-resistant materials suited for crawl spaces and basements.",
      },
      {
        title: "Dehumidifier Integration",
        description:
          "Energy-efficient dehumidifiers are installed with drainage and monitoring to keep humidity within 45-55%.",
      },
    ],
    relatedServices: ["crawl-space-encapsulation", "mold-remediation", "sump-pump"],
    serviceType: "Moisture control and dehumidification",
  },
};

export const SERVICE_DETAILS = detailLookup;

export const SERVICE_DETAIL_LIST: ServiceDetailContent[] = SERVICES.map((service) => {
  const detail = detailLookup[service.id];
  return detail
    ? detail
    : {
        id: service.id,
        name: service.name,
        headline: service.name,
        metaDescription: service.description,
        intro: service.description,
        benefits: [],
        warningSigns: [],
        processSteps: [],
        relatedServices: [],
        serviceType: service.name,
      };
});
