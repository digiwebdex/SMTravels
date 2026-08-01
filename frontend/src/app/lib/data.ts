// ─── SERVICES ───────────────────────────────────────────────────────────────

export interface ServiceData {
  id: string;
  path: string;
  label: string;
  shortDesc: string;
  tagline: string;
  description: string;
  heroImage: string;
  iconName: string;
  color: string;
  features: { icon: string; title: string; desc: string }[];
  process: { step: string; title: string; desc: string }[];
  includes: string[];
  excludes: string[];
  packages: { title: string; price: number; duration: string; hotel: string; badge?: string; highlights: string[] }[];
  faqs: { q: string; a: string }[];
}

export const SERVICES: ServiceData[] = [
  {
    id: "hajj",
    path: "/hajj",
    label: "Hajj Management",
    shortDesc: "Government-approved Hajj packages with full hotel, transport & guided support.",
    tagline: "Answer the Call of Allah",
    description: "SMTravel International is one of Bangladesh's most trusted Hajj management agencies, holding full government approval from the Ministry of Religious Affairs. We offer comprehensive Hajj packages designed to make your pilgrimage spiritually fulfilling and logistically seamless — from application through your safe return home.",
    heroImage: "/hero-journey.jpg",
    iconName: "star",
    color: "#F15A24",
    features: [
      { icon: "shield", title: "Govt. Approved", desc: "ATAB-licensed & Ministry of Hajj certified agency with 25+ years track record." },
      { icon: "hotel", title: "Premium Accommodation", desc: "5-star hotels within walking distance of Masjid al-Haram and Masjid an-Nabawi." },
      { icon: "users", title: "Expert Guides", desc: "Experienced Islamic scholars and Hajj guides accompany every group." },
      { icon: "plane", title: "Direct Flights", desc: "Biman Bangladesh Airlines direct flights to Jeddah for premium packages." },
      { icon: "map-pin", title: "Ziyarah Tours", desc: "Comprehensive guided Ziyarah covering all major historical sites in Makkah & Madinah." },
      { icon: "heart", title: "Full Support", desc: "24/7 support team on the ground in Saudi Arabia throughout your pilgrimage." },
    ],
    process: [
      { step: "01", title: "Registration", desc: "Submit your application with required documents. We verify eligibility and secure your slot." },
      { step: "02", title: "Visa Processing", desc: "We handle the complete Saudi Hajj visa process, biometrics, and embassy coordination." },
      { step: "03", title: "Pre-Departure Training", desc: "Mandatory Hajj training sessions covering rituals, duas, and practical guidance." },
      { step: "04", title: "Departure", desc: "Group departure from Hazrat Shahjalal International Airport with full escort." },
      { step: "05", title: "Pilgrimage", desc: "Guided performance of all Hajj rituals — Tawaf, Sa'i, Arafat, Muzdalifah, Mina, Stoning." },
      { step: "06", title: "Safe Return", desc: "Group return flight and airport reception. Post-Hajj certificate and documentation." },
    ],
    includes: [
      "Return air ticket (Dhaka–Jeddah–Dhaka)",
      "Saudi Arabia Hajj visa",
      "5-star hotel in Makkah (Haram-view, walking distance)",
      "5-star hotel in Madinah",
      "Mina tent accommodation (air-conditioned)",
      "Arafat and Muzdalifah accommodation",
      "All Ziyarah tours (Makkah & Madinah)",
      "Airport transfers and ground transportation",
      "All meals during stay (breakfast, lunch, dinner)",
      "Ihram clothing set (2 sets for men)",
      "Hajj training & orientation sessions",
      "24/7 on-ground support in Saudi Arabia",
      "Travel insurance coverage",
      "Government Hajj registration fee",
    ],
    excludes: [
      "Personal shopping and souvenirs",
      "Laundry services",
      "Medical expenses beyond basic coverage",
      "Qurbani (optional — add-on available)",
      "Phone/SIM card (available at airport)",
      "Any services not mentioned in package",
    ],
    packages: [
      {
        title: "Hajj Premium 2025",
        price: 385000,
        duration: "40 Days",
        hotel: "5-Star Haram-View",
        badge: "Best Value",
        highlights: ["Haram-view hotel", "Direct flight", "Full meals", "Guided Ziyarah", "AC Mina tent"],
      },
      {
        title: "Hajj Economy 2025",
        price: 295000,
        duration: "35 Days",
        hotel: "4-Star Near Haram",
        badge: "Popular",
        highlights: ["Near-Haram hotel", "Connecting flight", "Breakfast included", "Guided Ziyarah", "Mina tent"],
      },
      {
        title: "Hajj Government (Sarkari) 2025",
        price: 265000,
        duration: "38 Days",
        hotel: "Government Assigned",
        highlights: ["Government quota slot", "Biman Airlines", "Standard accommodation", "Group Ziyarah"],
      },
    ],
    faqs: [
      { q: "What are the basic requirements for Hajj from Bangladesh?", a: "Applicants must be Muslim, hold a valid Bangladeshi passport (at least 6 months validity), be physically fit, have a valid NID, and women under 45 must travel with a mahram (male guardian)." },
      { q: "How many Hajj seats does Bangladesh receive annually?", a: "Bangladesh receives approximately 127,000 Hajj quota slots from the Kingdom of Saudi Arabia, allocated between government and private agency categories." },
      { q: "When does registration for Hajj 2025 open?", a: "Hajj 2025 pre-registration typically opens in October–November 2024. Final registration and payment deadlines are usually in February–March 2025." },
      { q: "Can a woman perform Hajj without a mahram?", a: "Women above 45 years may travel in a group without a mahram under current Saudi regulations. Women under 45 must be accompanied by a mahram. Please consult us for the latest Ministry guidelines." },
      { q: "Is Qurbani included in the package?", a: "Qurbani (sacrifice) can be arranged as an optional add-on. The cost varies by animal type and is not included in the base package price." },
    ],
  },
  {
    id: "umrah",
    path: "/umrah",
    label: "Umrah Packages",
    shortDesc: "Year-round Umrah packages with flexible dates, premium hotels & expert guidance.",
    tagline: "A Journey of the Heart",
    description: "Perform the blessed Umrah at any time of the year with SMTravel International's carefully curated packages. From Ramadan specials to off-season economy options, we offer flexible, affordable, and spiritually enriching Umrah journeys tailored to every pilgrim's needs and budget.",
    heroImage: "/hero-journey.jpg",
    iconName: "map-pin",
    color: "#1B75BC",
    features: [
      { icon: "calendar", title: "Flexible Dates", desc: "Choose from weekly departures throughout the year. Special Ramadan packages available." },
      { icon: "hotel", title: "Top Hotels", desc: "Hand-picked hotels in Makkah and Madinah ranging from 3-star to 5-star luxury." },
      { icon: "plane", title: "Multiple Airlines", desc: "Fly with Biman, Saudia, Emirates, Qatar Airways or budget carriers based on your package." },
      { icon: "users", title: "Small Groups", desc: "Small, intimate group sizes ensure personalized attention from your dedicated guide." },
      { icon: "map", title: "Ziyarah Included", desc: "All Umrah packages include guided Ziyarah tours of sacred sites in Makkah and Madinah." },
      { icon: "shield", title: "Visa Guaranteed", desc: "99% Umrah visa approval rate. We handle everything from application to collection." },
    ],
    process: [
      { step: "01", title: "Package Selection", desc: "Choose from our curated packages or customize your own. Discuss dates and preferences." },
      { step: "02", title: "Document Collection", desc: "Submit passport, photos, and required documents. We guide you through every requirement." },
      { step: "03", title: "Visa Processing", desc: "Electronic visa processed within 3–5 working days. Hotel confirmations provided." },
      { step: "04", title: "Final Briefing", desc: "Pre-departure orientation on Umrah rituals, duas, and on-ground logistics." },
      { step: "05", title: "Pilgrimage", desc: "Arrival, check-in at premium hotel. Guided performance of Umrah rituals and Ziyarah." },
      { step: "06", title: "Return", desc: "Smooth return journey with certificate of completion and post-Umrah guidance." },
    ],
    includes: [
      "Return air ticket",
      "Saudi Arabia Umrah e-visa",
      "Hotel in Makkah (per package selection)",
      "Hotel in Madinah (3–5 nights)",
      "Makkah–Madinah–Makkah transport",
      "Airport transfers",
      "Guided Ziyarah tours",
      "Umrah training booklet",
      "Group leader support throughout",
    ],
    excludes: [
      "Meals (unless specified in package)",
      "Personal expenses",
      "Laundry",
      "SIM card",
      "Qurbani",
      "Domestic travel (home city to Dhaka airport)",
    ],
    packages: [
      {
        title: "Umrah Gold Package",
        price: 145000,
        duration: "14 Days",
        hotel: "5-Star Haram-View",
        badge: "Most Popular",
        highlights: ["5-star hotel", "Makkah + Madinah", "Visa included", "All Ziyarah", "Airport transfer"],
      },
      {
        title: "Umrah Silver Package",
        price: 95000,
        duration: "10 Days",
        hotel: "4-Star Near Haram",
        badge: "Best Value",
        highlights: ["4-star hotel", "Makkah + Madinah", "Visa included", "Guided Ziyarah"],
      },
      {
        title: "Umrah Ramadan Special",
        price: 175000,
        duration: "21 Days",
        hotel: "5-Star Premium",
        badge: "Special",
        highlights: ["Full Ramadan stay", "Iftar in Haram", "Laylatul Qadr special", "Priority service"],
      },
    ],
    faqs: [
      { q: "Can I perform Umrah anytime of the year?", a: "Yes, Umrah can be performed at any time except during the Hajj season (8–13 Dhul Hijjah). We offer departures every week throughout the year." },
      { q: "How long does the Umrah visa take to process?", a: "The Saudi Arabia Umrah e-visa typically takes 3–5 working days after submission of complete documents." },
      { q: "Is there a group size minimum?", a: "Our group packages require a minimum of 2 persons. We regularly combine individuals into group departures at no extra cost." },
      { q: "What documents are required for Umrah?", a: "Valid passport (6+ months validity), recent passport photos, NID copy, medical fitness certificate, and vaccination records (meningitis ACWY mandatory)." },
      { q: "Can I customize my Umrah package?", a: "Absolutely. We offer fully customizable Umrah packages. You can choose your preferred airline, hotel category, duration, and add-ons like city extension tours." },
    ],
  },
  {
    id: "visa",
    path: "/visa",
    label: "Visa Services",
    shortDesc: "Fast, reliable visa processing for Saudi Arabia, UAE, Malaysia, and 50+ countries.",
    tagline: "Your Visa. Our Expertise.",
    description: "SMTravel International's visa processing division has a 98% approval record across 50+ countries. Our experienced visa consultants handle everything from document preparation to embassy submission, ensuring fast and stress-free processing for individuals, families, and corporate clients.",
    heroImage: "/hero-journey.jpg",
    iconName: "shield",
    color: "#0E7C66",
    features: [
      { icon: "zap", title: "Fast Processing", desc: "Express visa processing available. Saudi visit visa in 24–48 hours in most cases." },
      { icon: "globe", title: "50+ Countries", desc: "Tourist, work, student, business, and transit visas for destinations worldwide." },
      { icon: "check-circle", title: "98% Approval Rate", desc: "Our expert team ensures complete, error-free applications for maximum approval." },
      { icon: "file-text", title: "Document Guidance", desc: "Step-by-step guidance on required documents for each visa category and country." },
      { icon: "refresh-cw", title: "Renewals & Extensions", desc: "Visa renewals, extensions, and re-entry visas handled efficiently." },
      { icon: "phone", title: "Tracking Updates", desc: "Real-time application status updates via SMS and phone. No guesswork." },
    ],
    process: [
      { step: "01", title: "Consultation", desc: "Free consultation to determine the right visa type, requirements, and timeline." },
      { step: "02", title: "Document Checklist", desc: "We provide a personalized checklist based on your nationality and destination." },
      { step: "03", title: "Application Preparation", desc: "Our experts prepare and review all forms and supporting documents." },
      { step: "04", title: "Submission", desc: "Application submitted to embassy, consulate, or online system on your behalf." },
      { step: "05", title: "Tracking", desc: "We monitor your application and provide status updates throughout the process." },
      { step: "06", title: "Collection & Delivery", desc: "Visa collected and delivered to you by courier or office pickup." },
    ],
    includes: [
      "Visa application form preparation",
      "Document checklist and verification",
      "Embassy/consulate submission",
      "Application tracking",
      "Appointment scheduling (where required)",
      "Status updates via SMS/phone",
      "Expert consultation",
    ],
    excludes: [
      "Government visa fees (paid separately)",
      "Passport photos (if not provided)",
      "Medical examination fees",
      "Travel insurance (available as add-on)",
    ],
    packages: [
      { title: "Saudi Arabia Visit Visa", price: 8500, duration: "1–3 Days Processing", hotel: "N/A", badge: "Express", highlights: ["24–48 hr processing", "Single/multiple entry", "Up to 90 days stay", "Business & tourist"] },
      { title: "UAE Tourist/Visit Visa", price: 12000, duration: "3–5 Days", hotel: "N/A", highlights: ["30/60/90 day options", "Multiple entry", "Guaranteed approval or refund"] },
      { title: "Malaysia eVisa + Travel", price: 5500, duration: "2–3 Days", hotel: "N/A", highlights: ["Online eVisa", "30 days stay", "Fast approval", "Family packages"] },
    ],
    faqs: [
      { q: "How long does a Saudi Arabia visit visa take?", a: "Saudi Arabia e-visa is typically processed within 24–48 hours for most nationalities. Physical visa may take 3–5 business days." },
      { q: "Can you guarantee visa approval?", a: "While visa approval is ultimately at the discretion of the issuing embassy, our 98% success rate reflects our thorough preparation. We offer partial refunds if a visa is rejected due to embassy error." },
      { q: "What if my visa is rejected?", a: "We provide a full re-application service at no additional consultation fee and will thoroughly review what went wrong. Government fees are non-refundable by law." },
      { q: "Do you handle work/employment visas?", a: "Yes, we handle work and employment visas for Saudi Arabia, UAE, Malaysia, Singapore, and other GCC countries. These take 2–4 weeks depending on the employer and country." },
    ],
  },
  {
    id: "air-ticket",
    path: "/air-ticket",
    label: "Air Tickets",
    shortDesc: "Best-fare domestic & international air tickets across all major airlines — no airline API, fully manual.",
    tagline: "Best Fares. Every Flight.",
    description: "SMTravel International's air ticketing division offers the best available fares on all domestic and international routes. Our experienced ticketing team has direct relationships with all major airlines and Global Distribution Systems, ensuring you always get the best available rate with flexible booking terms.",
    heroImage: "/hero-journey.jpg",
    iconName: "plane",
    color: "#2563EB",
    features: [
      { icon: "dollar-sign", title: "Best Price Match", desc: "We match or beat any published fare. Price match guarantee on all bookings." },
      { icon: "globe", title: "All Airlines", desc: "Tickets on Biman, Saudia, Emirates, Qatar Airways, Turkish, Singapore Airlines & more." },
      { icon: "calendar", title: "Flexible Changes", desc: "Help with date changes, upgrades, and cancellations across all airlines." },
      { icon: "users", title: "Group Bookings", desc: "Special group fares for 10+ travelers. Hajj/Umrah group air coordination." },
      { icon: "star", title: "Business Class", desc: "First and Business class ticketing with lounge access and priority services." },
      { icon: "clock", title: "Quick Confirmation", desc: "Ticket confirmed within hours. E-ticket delivered via email and WhatsApp." },
    ],
    process: [
      { step: "01", title: "Flight Request", desc: "Share your route, dates, and preferences. We search the best available fares." },
      { step: "02", title: "Options Presented", desc: "We present 3–5 fare options with price breakdown, layovers, and airline details." },
      { step: "03", title: "Booking Confirmation", desc: "Confirm your choice and provide passenger details. Booking made immediately." },
      { step: "04", title: "Payment", desc: "Secure payment via bank transfer, bKash, or card. Receipt issued instantly." },
      { step: "05", title: "E-Ticket Issued", desc: "PNR confirmed. E-ticket sent via email and WhatsApp within the hour." },
      { step: "06", title: "Pre-Flight Support", desc: "Seat selection, meal requests, special assistance coordination on request." },
    ],
    includes: ["Airline ticket", "E-ticket delivery", "Booking confirmation", "Basic support"],
    excludes: ["Checked baggage (if not included by airline)", "Airport taxes in some countries", "Visa fees", "Travel insurance"],
    packages: [
      { title: "Economy Class Dhaka–Riyadh", price: 45000, duration: "Per person", hotel: "N/A", badge: "Best Seller", highlights: ["Saudia / Biman", "Direct & connecting", "23kg baggage", "Meal included"] },
      { title: "Economy Class Dhaka–Dubai", price: 35000, duration: "Per person", highlights: ["Emirates / flydubai", "Regular departures", "23kg baggage"] },
      { title: "Business Class International", price: 150000, duration: "Per person", hotel: "N/A", highlights: ["All premium airlines", "Lie-flat seats", "Lounge access", "Priority boarding"] },
    ],
    faqs: [
      { q: "How do you get cheaper fares without an airline API?", a: "Our ticketing team has GDS (Global Distribution System) access and direct relationships with airline GSA offices, giving us access to all available fares including consolidator rates not available on public sites." },
      { q: "Can you help with last-minute tickets?", a: "Yes, we specialize in last-minute bookings and can often secure tickets within 2–4 hours of request, including for Hajj and Umrah emergencies." },
      { q: "What is your refund policy for cancelled tickets?", a: "Refund terms depend on the fare type and airline rules. We guide you through the process and help maximize your refund. Service fees are non-refundable." },
      { q: "Do you arrange group air tickets for Hajj?", a: "Yes, group air coordination for Hajj and Umrah is a core service. We work with Biman Bangladesh Airlines and charter operators for large group bookings." },
    ],
  },
  {
    id: "manpower",
    path: "/manpower",
    label: "Manpower Services",
    shortDesc: "Trusted international manpower recruitment for Saudi Arabia, UAE, Malaysia, and beyond.",
    tagline: "Connecting Talent with Opportunity",
    description: "SMTravel International holds a valid BOESL (Bangladesh Overseas Employment Services Ltd.) license for international manpower recruitment. We have successfully placed thousands of Bangladeshi workers in reputable companies across Saudi Arabia, UAE, Malaysia, Qatar, and other GCC countries.",
    heroImage: "/hero-journey.jpg",
    iconName: "briefcase",
    color: "#7C3AED",
    features: [
      { icon: "award", title: "BOESL Licensed", desc: "Fully licensed by Government of Bangladesh BMET for legal international recruitment." },
      { icon: "globe", title: "GCC Expertise", desc: "Saudi Arabia, UAE, Qatar, Malaysia, Oman — established employer networks." },
      { icon: "file-text", title: "Legal Processing", desc: "Complete legal documentation: Demand letter, BMET clearance, medical, attestation." },
      { icon: "shield", title: "Verified Employers", desc: "All overseas employers are verified and registered with respective embassies." },
      { icon: "users", title: "Skill Training", desc: "Pre-departure skill and language training to maximize your success abroad." },
      { icon: "phone", title: "Post-Arrival Support", desc: "24/7 support hotline for workers after arrival in destination country." },
    ],
    process: [
      { step: "01", title: "Registration", desc: "Register with us and submit your CV, passport, and relevant certificates." },
      { step: "02", title: "Skills Assessment", desc: "We assess your qualifications and match you to suitable job orders from verified employers." },
      { step: "03", title: "Employer Interview", desc: "Attend interview (in-person or video). Receive job offer letter upon selection." },
      { step: "04", title: "Medical & Fitness", desc: "Complete GAMCA-approved medical examination at our partner clinics." },
      { step: "05", title: "BMET Clearance", desc: "Government BMET clearance, smart card, and all embassy attestations processed." },
      { step: "06", title: "Departure", desc: "Pre-departure orientation, airport escort, and arrival support in destination country." },
    ],
    includes: ["Job placement service", "Employer matching", "Interview arrangement", "BMET clearance assistance", "Pre-departure briefing", "Airport assistance"],
    excludes: ["BMET government fees", "Medical examination fees", "Passport and police clearance fees", "Air ticket (where not provided by employer)"],
    packages: [
      { title: "Saudi Arabia Placement", price: 35000, duration: "Processing 30–60 Days", hotel: "N/A", badge: "High Demand", highlights: ["Construction, factories, domestic", "2-year contracts", "Employer-provided accommodation", "Monthly salary SAR 800–2000"] },
      { title: "UAE Placement", price: 40000, duration: "Processing 45–60 Days", hotel: "N/A", highlights: ["Hospitality, retail, construction", "AED 1200–3000/month", "Employer visa & ticket"] },
      { title: "Malaysia Placement", price: 30000, duration: "Processing 30–45 Days", hotel: "N/A", highlights: ["Manufacturing, plantation, construction", "MYR 1200–2000/month", "Employer visa"] },
    ],
    faqs: [
      { q: "Is SMTravel International licensed for manpower recruitment?", a: "Yes, we hold a valid BOESL/BMET license from the Government of Bangladesh for international manpower recruitment, with registration number RL-XXXX." },
      { q: "How long does the full recruitment process take?", a: "The complete process — from registration to departure — typically takes 45–90 days, depending on the destination country and employer processing times." },
      { q: "What salary can I expect abroad?", a: "Salaries vary by job category and country. Saudi Arabia ranges SAR 800–3000/month. UAE: AED 1200–4000. Malaysia: MYR 1200–2500. We provide detailed breakdowns before signing any contract." },
      { q: "What if there are problems after I arrive?", a: "We maintain a 24/7 helpline for workers abroad. In cases of contract violations or emergencies, we coordinate with the Bangladesh Embassy and relevant authorities on your behalf." },
    ],
  },
  {
    id: "tour-packages",
    path: "/tour-packages",
    label: "Tour Packages",
    shortDesc: "Curated domestic & international tour packages for individuals, families, and groups.",
    tagline: "Explore the World with Us",
    description: "From the golden sands of Dubai to the rainforests of Malaysia and the historical wonders of Turkey, SMTravel International crafts memorable tour experiences for every type of traveler. Our expert tour coordinators design itineraries that balance sightseeing, culture, leisure, and relaxation.",
    heroImage: "/hero-journey.jpg",
    iconName: "globe",
    color: "#EA580C",
    features: [
      { icon: "map", title: "Expert Itineraries", desc: "Professionally designed itineraries with the perfect balance of sightseeing and free time." },
      { icon: "hotel", title: "Premium Hotels", desc: "4 and 5-star hotel selections with excellent locations and breakfast included." },
      { icon: "users", title: "Private & Group", desc: "Choose private family tours or join our regular group departures at lower cost." },
      { icon: "camera", title: "Guided Tours", desc: "Experienced English and Bangla-speaking local guides at every destination." },
      { icon: "shield", title: "Fully Inclusive", desc: "Visa, flights, hotels, transfers, and tours — everything in one package price." },
      { icon: "star", title: "Honeymoon Specials", desc: "Romantic honeymoon packages to Maldives, Bali, Singapore, Malaysia, and beyond." },
    ],
    process: [
      { step: "01", title: "Destination Consultation", desc: "Share your preferences, budget, and travel dates. We recommend the best options." },
      { step: "02", title: "Custom Itinerary", desc: "We craft a detailed day-by-day itinerary for your approval." },
      { step: "03", title: "Visa & Documents", desc: "We handle all visa applications, hotel bookings, and airline reservations." },
      { step: "04", title: "Pre-Departure Pack", desc: "Receive your travel pack: tickets, hotel vouchers, local emergency contacts, guide info." },
      { step: "05", title: "Travel", desc: "Enjoy a smooth, guided tour experience with on-call support throughout." },
      { step: "06", title: "Safe Return", desc: "Return to Dhaka. We love hearing your stories and look forward to your next adventure!" },
    ],
    includes: ["Return international flights", "Visa processing", "4/5-star hotel accommodation", "Breakfast daily", "Airport transfers", "All guided city tours", "Tour leader support"],
    excludes: ["Lunch and dinner (unless specified)", "Personal shopping", "Optional activities", "Travel insurance (add-on available)", "Domestic travel to Dhaka"],
    packages: [
      { title: "Dubai Explorer 5N/6D", price: 85000, duration: "6 Days", hotel: "4-Star Dubai", badge: "Best Seller", highlights: ["Burj Khalifa visit", "Desert Safari", "Dubai Mall", "Marina Dhow Cruise"] },
      { title: "Malaysia Discovery 7N/8D", price: 105000, duration: "8 Days", hotel: "4-Star KL", highlights: ["Kuala Lumpur", "Genting Highlands", "Langkawi", "Batu Caves"] },
      { title: "Turkey Wonder 8N/9D", price: 145000, duration: "9 Days", hotel: "4-Star Istanbul", badge: "Premium", highlights: ["Istanbul", "Cappadocia hot air balloon", "Pamukkale", "Ephesus"] },
    ],
    faqs: [
      { q: "Can I customize a tour package?", a: "Absolutely. We specialize in tailor-made itineraries. Tell us your destination, budget, interests, and travel dates, and we'll design a perfect custom tour." },
      { q: "Do you offer honeymoon packages?", a: "Yes! We have specially curated honeymoon packages to Maldives, Bali, Singapore, Malaysia, Thailand, and more with romantic add-ons like sunset dinners and spa treatments." },
      { q: "What happens if my visa is rejected for a tour?", a: "We provide full consultation to minimize rejection risk. If a visa is rejected despite correct documentation, we offer alternative destinations or rescheduling at no additional service fee." },
      { q: "Are your tour prices per person or per group?", a: "All prices listed are per person based on double room sharing. Single room supplements apply for solo travelers. Group rates (10+ persons) are available at discounted rates." },
    ],
  },
  {
    id: "hotel-booking",
    path: "/hotel-booking",
    label: "Hotel Booking",
    shortDesc: "Exclusive rates on 5000+ hotels in Saudi Arabia, UAE, Malaysia, and worldwide.",
    tagline: "Rest Well. Travel Better.",
    description: "SMTravel International partners with thousands of hotels worldwide to bring you the best available rates with flexible booking terms. Whether you need accommodation for Hajj, Umrah, business travel, or leisure, our hotel team finds the perfect property at the best price.",
    heroImage: "/hero-journey.jpg",
    iconName: "hotel",
    color: "#0891B2",
    features: [
      { icon: "star", title: "5000+ Hotels", desc: "Extensive inventory from budget guesthouses to 5-star luxury properties worldwide." },
      { icon: "dollar-sign", title: "Best Rate Guarantee", desc: "We match any lower rate you find elsewhere. Price guarantee on all bookings." },
      { icon: "calendar", title: "Flexible Cancellation", desc: "Free cancellation options available. No penalty cancellation up to 48 hours." },
      { icon: "map-pin", title: "Strategic Locations", desc: "Hotels selected for proximity to attractions, Harams, business districts." },
      { icon: "phone", title: "Group Booking", desc: "Negotiated block rates for Hajj/Umrah groups, corporate events, and conferences." },
      { icon: "check-circle", title: "Instant Confirmation", desc: "Hotel vouchers issued within hours. Direct hotel contact details provided." },
    ],
    process: [
      { step: "01", title: "Tell Us Your Needs", desc: "Share destination, dates, number of guests, and preferences (location, star rating, budget)." },
      { step: "02", title: "Options Presented", desc: "We present the best 3–5 hotel options with rates, photos, and detailed descriptions." },
      { step: "03", title: "Booking Confirmation", desc: "Confirm your choice. We book and secure your reservation immediately." },
      { step: "04", title: "Payment & Voucher", desc: "Pay securely. Receive official hotel voucher with booking reference." },
      { step: "05", title: "Pre-Arrival Coordination", desc: "We coordinate early check-in, room upgrades, and special requests on your behalf." },
      { step: "06", title: "On-Ground Support", desc: "Any hotel issues during your stay? Contact us anytime for immediate assistance." },
    ],
    includes: ["Hotel reservation", "Official hotel voucher", "Booking confirmation", "Pre-arrival coordination", "24/7 support"],
    excludes: ["Room service", "Mini-bar", "Parking (unless free)", "Local city tax (varies by country)"],
    packages: [
      { title: "Makkah 5-Star Haram-View", price: 18000, duration: "Per Night", hotel: "5-Star", badge: "Exclusive", highlights: ["Walking distance Haram", "Haram view rooms", "Buffet breakfast", "Prayer facilities"] },
      { title: "Dubai Business Hotel", price: 9500, duration: "Per Night", hotel: "4-Star", highlights: ["Downtown/Business Bay", "City view", "Free WiFi", "Airport shuttle"] },
      { title: "Kuala Lumpur City Centre", price: 6500, duration: "Per Night", hotel: "4-Star", highlights: ["KLCC/Bukit Bintang", "Pool access", "Breakfast included"] },
    ],
    faqs: [
      { q: "Can I get hotels near the Haram in Makkah for Umrah?", a: "Yes, we have exclusive allocations at multiple hotels within 200–500 meters of Masjid al-Haram, including Towers, Hilton, Marriott, and Millennium properties." },
      { q: "What is your cancellation policy?", a: "Cancellation policies vary by hotel and booking type. We always highlight free-cancellation options. Most bookings allow free cancellation up to 48–72 hours before check-in." },
      { q: "Do you offer corporate rates?", a: "Yes, we have negotiated corporate rates with major hotel chains for business travelers and companies with frequent travel needs. Contact us for a corporate account." },
      { q: "Can you arrange rooms for large Hajj groups?", a: "Absolutely. We have long-standing relationships with Saudi Arabia hotels and can secure block bookings for groups of 20 to 500+ pilgrims at competitive rates." },
    ],
  },
  {
    id: "transport",
    path: "/transport",
    label: "Transport",
    shortDesc: "Airport transfers, Haram shuttles, and Ziyarah transport across Makkah & Madinah.",
    tagline: "Safe Journeys. Seamless Transfers.",
    description: "SMTravel International arranges reliable ground transport for pilgrims and travelers — from Dhaka airport pickups to Saudi Haram shuttles and guided Ziyarah trips. Our fleet partners prioritize safety, punctuality, and comfort for families and groups.",
    heroImage: "/hero-journey.jpg",
    iconName: "map-pin",
    color: "#7C3AED",
    features: [
      { icon: "plane", title: "Airport Transfers", desc: "Meet & greet at Jeddah, Madinah, and Dhaka airports with luggage assistance." },
      { icon: "map-pin", title: "Haram Shuttles", desc: "Scheduled and on-demand shuttles between hotels and the Two Holy Mosques." },
      { icon: "globe", title: "Ziyarah Tours", desc: "Guided visits to historical Islamic sites with experienced drivers." },
      { icon: "users", title: "Group Coaches", desc: "AC coaches for large Hajj/Umrah groups with itinerary coordination." },
      { icon: "shield", title: "Licensed Partners", desc: "Saudi-licensed transport partners with insured vehicles." },
      { icon: "clock", title: "24/7 Desk", desc: "Round-the-clock transport desk during peak pilgrimage seasons." },
    ],
    process: [
      { step: "01", title: "Share Itinerary", desc: "Tell us arrival times, hotel locations, and group size." },
      { step: "02", title: "Vehicle Match", desc: "We assign sedan, van, or coach based on your needs." },
      { step: "03", title: "Confirm & Pay", desc: "Receive confirmation with driver contact details." },
      { step: "04", title: "Travel Day", desc: "Driver tracks your flight and waits at the designated point." },
      { step: "05", title: "On-Trip Support", desc: "WhatsApp desk available for schedule changes." },
      { step: "06", title: "Return Transfer", desc: "We schedule your departure transfer to the airport." },
    ],
    includes: ["Airport meet & greet", "AC vehicles", "Licensed drivers", "Basic waiting time", "WhatsApp coordination"],
    excludes: ["Personal sightseeing outside plan", "Visa fees", "Hotel rooms", "Meals during transit"],
    packages: [
      { title: "Jeddah Airport → Makkah", price: 8500, duration: "One way", hotel: "Sedan/Van", badge: "Popular", highlights: ["Meet & greet", "Luggage help", "Hotel drop"] },
      { title: "Makkah–Madinah Transfer", price: 22000, duration: "One way", hotel: "Van/Coach", highlights: ["Highway comfort", "Rest stops", "Group options"] },
      { title: "Ziyarah Day Package", price: 12000, duration: "Full day", hotel: "Van", highlights: ["Guide coordination", "Multiple sites", "Water onboard"] },
    ],
    faqs: [
      { q: "Do you provide child seats?", a: "Yes — request child seats when booking; availability depends on vehicle type." },
      { q: "Can transport be included in my Hajj package?", a: "Most of our Hajj and Umrah packages already include intercity and local transport. Standalone bookings are also available." },
      { q: "How early should I book airport pickup?", a: "At least 48 hours before arrival. During peak Hajj season, book 1–2 weeks ahead." },
    ],
  },
];

// ─── PACKAGES ───────────────────────────────────────────────────────────────

export interface Package {
  id: number;
  slug: string;
  title: string;
  type: string;
  price: number;
  originalPrice?: number;
  duration: string;
  departure: string;
  hotel: string;
  flight: string;
  rating: number;
  reviews: number;
  seats: number;
  badge?: string;
  image: string;
  highlights: string[];
  includes: string[];
  excludes: string[];
  itinerary: { day: string; title: string; desc: string }[];
}

export const PACKAGES: Package[] = [
  {
    id: 1, slug: "hajj-premium-2025",
    title: "Hajj Premium 2025", type: "hajj",
    price: 385000, originalPrice: 420000,
    duration: "40 Days", departure: "May 2025",
    hotel: "5-Star Haram-View Makkah", flight: "Biman Bangladesh Airlines",
    rating: 4.9, reviews: 127, seats: 8, badge: "Best Value",
    image: "photo-1770786106021-52580470e31e",
    highlights: ["Haram-view 5-star hotel", "Direct Biman flight", "All meals included", "AC Mina tent", "Guided Ziyarah"],
    includes: ["Return air ticket Dhaka–Jeddah", "Hajj visa", "5-star hotel Makkah (Haram-view)", "5-star hotel Madinah", "Mina AC tent", "Arafat & Muzdalifah", "All meals", "All Ziyarah tours", "Airport transfers", "Ihram set", "Training sessions", "24/7 on-ground support", "Travel insurance"],
    excludes: ["Personal shopping", "Laundry", "Qurbani (optional add-on ৳8,000)", "Phone/SIM card"],
    itinerary: [
      { day: "Day 1–2", title: "Departure from Dhaka", desc: "Group assembly at HSIA. Biman flight to Jeddah. Transfer to Madinah hotel." },
      { day: "Day 3–7", title: "Stay in Madinah", desc: "Prayers in Masjid an-Nabawi. Ziyarah of historical sites. Raudah visit." },
      { day: "Day 8", title: "Travel to Makkah", desc: "Don Ihram at Miqat. Travel to Makkah. Check-in at Haram-view hotel." },
      { day: "Day 9–26", title: "Stay in Makkah", desc: "Perform Umrah. Prayers in Masjid al-Haram. Ziyarah of historical sites." },
      { day: "Day 27–30", title: "Hajj Rituals", desc: "8th: Mina. 9th: Arafat (Wuquf), Muzdalifah. 10th–13th: Jamarat, Qurbani, Tawaf al-Ifadah." },
      { day: "Day 31–38", title: "Post-Hajj Makkah", desc: "Post-Hajj Tawaf. Rest and worship in Makkah. Final Ziyarah." },
      { day: "Day 39–40", title: "Return to Dhaka", desc: "Farewell Tawaf. Transfer to Jeddah airport. Flight to Dhaka. Group reception." },
    ],
  },
  {
    id: 2, slug: "hajj-economy-2025",
    title: "Hajj Economy 2025", type: "hajj",
    price: 295000,
    duration: "35 Days", departure: "May 2025",
    hotel: "4-Star Near Haram", flight: "Saudi Airlines (Connecting)",
    rating: 4.7, reviews: 89, seats: 14, badge: "Popular",
    image: "photo-1720549973451-018d3623b55a",
    highlights: ["Near-Haram 4-star hotel", "Connecting flight", "Breakfast included", "Guided Ziyarah", "Mina tent"],
    includes: ["Return air ticket (connecting)", "Hajj visa", "4-star hotel Makkah", "4-star hotel Madinah", "Mina tent", "Arafat & Muzdalifah", "Breakfast", "Guided Ziyarah", "Airport transfers", "Training sessions"],
    excludes: ["Lunch & dinner", "Personal expenses", "Qurbani", "Laundry", "SIM card"],
    itinerary: [
      { day: "Day 1–2", title: "Departure", desc: "Flight from Dhaka via connecting point to Jeddah. Transfer to Madinah." },
      { day: "Day 3–6", title: "Madinah Stay", desc: "Prayers in Masjid an-Nabawi and historical site Ziyarah." },
      { day: "Day 7", title: "Move to Makkah", desc: "Don Ihram at Miqat. Travel to Makkah hotel check-in." },
      { day: "Day 8–24", title: "Makkah Stay", desc: "Umrah, Haram prayers, Makkah Ziyarah. Pre-Hajj preparation." },
      { day: "Day 25–28", title: "Hajj Days", desc: "Mina, Arafat Wuquf, Muzdalifah, Jamarat, Qurbani, Tawaf al-Ifadah." },
      { day: "Day 29–33", title: "Post-Hajj", desc: "Rest, worship, and final Ziyarah in Makkah." },
      { day: "Day 34–35", title: "Return", desc: "Farewell Tawaf. Jeddah airport. Return flight to Dhaka." },
    ],
  },
  {
    id: 3, slug: "umrah-gold-package",
    title: "Umrah Gold Package", type: "umrah",
    price: 145000, originalPrice: 165000,
    duration: "14 Days", departure: "Any Month",
    hotel: "5-Star Haram-View Makkah", flight: "Emirates / Qatar Airways",
    rating: 4.8, reviews: 214, seats: 20, badge: "Most Popular",
    image: "photo-1693590614566-1d3ea9ef32f7",
    highlights: ["5-star Haram-view hotel", "Premium airline", "Makkah + Madinah", "All Ziyarah", "Visa included"],
    includes: ["Return air ticket", "Umrah e-visa", "5-star Makkah hotel (7 nights)", "5-star Madinah hotel (4 nights)", "Ziyarah tours both cities", "Airport transfers", "Makkah–Madinah transport", "Umrah guide"],
    excludes: ["Meals (breakfast only if selected)", "Personal shopping", "Qurbani", "SIM card"],
    itinerary: [
      { day: "Day 1", title: "Departure Dhaka", desc: "Flight from HSIA. Arrive Madinah. Check-in to 5-star hotel near Masjid an-Nabawi." },
      { day: "Day 2–4", title: "Madinah Stay", desc: "Prayers in Masjid an-Nabawi. Raudah visit. Ziyarah of Uhud, Quba, and other sites." },
      { day: "Day 5", title: "Travel to Makkah", desc: "Don Ihram at Madinah. Travel to Makkah. Tawaf and Sa'i (Umrah performance)." },
      { day: "Day 6–11", title: "Makkah Stay", desc: "Multiple Tawafs. Haram prayers. Makkah Ziyarah (Cave Hira, Jabal Thawr, Arafat, Mina, Muzdalifah)." },
      { day: "Day 12", title: "Madinah Return", desc: "Travel back to Madinah. Additional prayers and supplications." },
      { day: "Day 13–14", title: "Return to Dhaka", desc: "Final farewell. Jeddah/Madinah airport. Flight to Dhaka." },
    ],
  },
  {
    id: 4, slug: "umrah-silver-package",
    title: "Umrah Silver Package", type: "umrah",
    price: 95000,
    duration: "10 Days", departure: "Any Month",
    hotel: "4-Star Near Haram", flight: "Biman / Air Arabia",
    rating: 4.6, reviews: 186, seats: 25,
    image: "photo-1758985776354-4df674930917",
    highlights: ["4-star near-Haram hotel", "Makkah + Madinah", "Visa included", "Guided Ziyarah", "Budget-friendly"],
    includes: ["Return air ticket", "Umrah e-visa", "4-star Makkah hotel (6 nights)", "4-star Madinah hotel (3 nights)", "Ziyarah tours", "Airport transfers"],
    excludes: ["Meals", "Personal expenses", "Laundry"],
    itinerary: [
      { day: "Day 1", title: "Departure", desc: "Flight to Jeddah/Madinah. Transfer and check-in." },
      { day: "Day 2–3", title: "Madinah", desc: "Prayers, Raudah, Ziyarah." },
      { day: "Day 4", title: "Makkah", desc: "Don Ihram. Travel to Makkah. Perform Umrah." },
      { day: "Day 5–9", title: "Makkah Stay", desc: "Prayers, Tawaf, Makkah Ziyarah." },
      { day: "Day 10", title: "Return", desc: "Jeddah airport. Flight to Dhaka." },
    ],
  },
  {
    id: 5, slug: "tour-dubai-5n6d",
    title: "Tour Dubai 5N/6D", type: "tour",
    price: 85000, originalPrice: 99000,
    duration: "6 Days", departure: "Oct–Mar",
    hotel: "4-Star Dubai", flight: "Emirates / flydubai",
    rating: 4.7, reviews: 156, seats: 12, badge: "Best Seller",
    image: "photo-1512453979798-5ea266f8880c",
    highlights: ["Burj Khalifa visit", "Desert Safari", "Dubai Mall", "Marina Dhow Cruise", "City tour"],
    includes: ["Return flights", "UAE tourist visa", "4-star hotel (5 nights)", "Breakfast daily", "All city tours", "Desert safari (dinner)", "Marina dhow cruise", "Airport transfers"],
    excludes: ["Lunch & dinner (except safari & cruise)", "Personal shopping", "Ski Dubai", "Helicopter tour"],
    itinerary: [
      { day: "Day 1", title: "Arrival Dubai", desc: "Fly from Dhaka to Dubai. Check-in to hotel. Evening free to explore Dubai Mall area." },
      { day: "Day 2", title: "Dubai City Tour", desc: "Visit Jumeirah Mosque, Gold Souk, Spice Souk, Al Fahidi Fort, Abra boat ride across Dubai Creek." },
      { day: "Day 3", title: "Burj Khalifa + Downtown", desc: "Visit Burj Khalifa (At the Top - 124th floor). Dubai Fountain show. Dubai Mall." },
      { day: "Day 4", title: "Desert Safari", desc: "Dune bashing, camel riding, sandboarding. Evening Bedouin camp: BBQ dinner, shisha, belly dance." },
      { day: "Day 5", title: "Palm & Marina", desc: "Atlantis Aquaventure, Palm Jumeirah tour, Marina Dhow Cruise (dinner)." },
      { day: "Day 6", title: "Departure", desc: "Morning free for last-minute shopping. Transfer to Dubai International Airport. Flight to Dhaka." },
    ],
  },
  {
    id: 6, slug: "tour-malaysia-7n8d",
    title: "Tour Malaysia 7N/8D", type: "tour",
    price: 105000,
    duration: "8 Days", departure: "Sep–Jan",
    hotel: "4-Star KL + Langkawi", flight: "Biman / AirAsia",
    rating: 4.6, reviews: 98, seats: 18,
    image: "photo-1561501900-3701fa6a0864",
    highlights: ["Kuala Lumpur", "Genting Highlands", "Langkawi Island", "Batu Caves", "PETRONAS Towers"],
    includes: ["Return flights", "Malaysia eVisa", "4-star hotel (7 nights)", "Breakfast daily", "All tours & transfers", "KL–Langkawi flight (internal)"],
    excludes: ["Lunch & dinner", "Theme park tickets", "Personal shopping"],
    itinerary: [
      { day: "Day 1", title: "Arrival KL", desc: "Arrive Kuala Lumpur. Check-in at 4-star hotel. Evening KLCC Twin Towers light show." },
      { day: "Day 2", title: "KL City Tour", desc: "Batu Caves, KL Tower, Petronas Twin Towers, Merdeka Square, Central Market." },
      { day: "Day 3", title: "Genting Highlands", desc: "Cable car ride to Genting Highlands. Theme parks, casino (optional), cool mountain weather." },
      { day: "Day 4–5", title: "Langkawi Island", desc: "Internal flight to Langkawi. Sky Bridge cable car, Underwater World, Eagle Square, beach leisure." },
      { day: "Day 6", title: "Return KL", desc: "Internal flight back to KL. Free afternoon. Bukit Bintang shopping." },
      { day: "Day 7", title: "Putrajaya + Perdana", desc: "Day trip to Putrajaya. Perdana Botanical Gardens. Sunset cruise." },
      { day: "Day 8", title: "Departure", desc: "Last-minute shopping. Transfer to KLIA. Flight to Dhaka." },
    ],
  },
];

// ─── BLOGS ───────────────────────────────────────────────────────────────────

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  category: string;
  date: string;
  author: string;
  readTime: string;
  excerpt: string;
  image: string;
  tags: string[];
}

export const BLOGS: BlogPost[] = [
  { id: 1, slug: "complete-hajj-preparation-guide-2025", title: "Complete Hajj Preparation Guide for Bangladeshi Pilgrims 2025", category: "Hajj", date: "15 Jan 2025", author: "Mohammed Rahman", readTime: "8 min", excerpt: "Everything you need to know before departing for Hajj 2025 — documents, health, packing, and spiritual preparation.", image: "photo-1770786106021-52580470e31e", tags: ["Hajj", "2025", "Preparation", "Guide"] },
  { id: 2, slug: "best-time-perform-umrah", title: "Best Time to Perform Umrah from Bangladesh", category: "Umrah", date: "22 Jan 2025", author: "Fatema Hossain", readTime: "5 min", excerpt: "Discover the best months for a spiritually fulfilling and comfortable Umrah experience — from Ramadan to off-season travel.", image: "photo-1720549973451-018d3623b55a", tags: ["Umrah", "Ramadan", "Travel Tips"] },
  { id: 3, slug: "saudi-visa-new-rules-2025", title: "Saudi Arabia Visa New Rules 2025: What You Need to Know", category: "Visa", date: "01 Feb 2025", author: "Karim Uddin", readTime: "6 min", excerpt: "Saudi Arabia has updated its visa regulations for 2025. Here's a complete breakdown of what changed and how it affects Bangladeshi travelers.", image: "photo-1571909552531-1601eaec8f79", tags: ["Visa", "Saudi Arabia", "2025", "Rules"] },
  { id: 4, slug: "dubai-travel-guide-bangladesh", title: "Dubai Travel Guide for Bangladeshi Tourists — 2025 Edition", category: "Tour", date: "10 Feb 2025", author: "Rashida Begum", readTime: "10 min", excerpt: "Your complete guide to visiting Dubai from Bangladesh — visa, flights, budget, top attractions, halal food, and travel tips.", image: "photo-1512453979798-5ea266f8880c", tags: ["Dubai", "Tour", "Guide", "Travel Tips"] },
  { id: 5, slug: "hajj-2025-registration-process", title: "How to Register for Hajj 2025 Through a Private Agency", category: "Hajj", date: "18 Feb 2025", author: "Mohammed Rahman", readTime: "7 min", excerpt: "Step-by-step breakdown of the Hajj 2025 private agency registration process, deadlines, and required documents for Bangladeshi applicants.", image: "photo-1693590614566-1d3ea9ef32f7", tags: ["Hajj", "2025", "Registration", "ATAB"] },
  { id: 6, slug: "working-abroad-from-bangladesh", title: "Working Abroad: A Complete Guide for Bangladeshi Workers", category: "Manpower", date: "25 Feb 2025", author: "Abul Hasan", readTime: "9 min", excerpt: "Everything Bangladeshi job seekers need to know before going abroad — legal recruitment, salary expectations, BMET process, and worker rights.", image: "photo-1682687219573-3fd75f982217", tags: ["Manpower", "Work Abroad", "BMET", "Gulf"] },
];

// ─── TESTIMONIALS ────────────────────────────────────────────────────────────

export const TESTIMONIALS = [
  { name: "Md. Harunur Rashid", city: "Dhaka", initial: "H", package: "Hajj Premium 2024", stars: 5, text: "Alhamdulillah, the best Hajj experience I could have asked for. SMTravel took care of every detail — from the visa process to the hotel, the guides were exceptional. The Haram-view room was a blessing I'll never forget." },
  { name: "Nasrin Akter Chowdhury", city: "Chittagong", initial: "N", package: "Umrah Gold Package", stars: 5, text: "I was nervous about traveling for Umrah for the first time, but SMTravel made it completely stress-free. The team was available 24/7 and the Ziyarah tours were beautifully organized. Highly recommend to everyone." },
  { name: "Engr. Shafiqul Islam", city: "Sylhet", initial: "S", package: "Tour Dubai 5N/6D", stars: 5, text: "Took my family to Dubai on the 5N/6D package. Absolutely worth every taka. The hotel was perfect, the desert safari was the highlight, and our tour guide was knowledgeable and fun. Will definitely book again for Malaysia." },
  { name: "Begum Razia Sultana", city: "Khulna", initial: "R", package: "Umrah Silver Package", stars: 5, text: "As a senior pilgrim traveling with my daughter, I was concerned about comfort and support. SMTravel exceeded all our expectations. The hotel was close to the Haram, and someone from the team checked on us daily." },
  { name: "Md. Zahirul Haque", city: "Rajshahi", initial: "Z", package: "Hajj Economy 2025", stars: 5, text: "Economy package didn't feel 'economy' at all. Great hotel, professional guides, organized Ziyarah. The team in Makkah was always reachable. Our group of 25 completed Hajj safely. Shukran SMTravel!" },
];

// ─── BRANCHES ────────────────────────────────────────────────────────────────

export const BRANCHES = [
  { name: "Head Office — Dhaka", city: "Dhaka", address: "32 Motijheel Commercial Area, Dhaka-1000", phone: "+880 2 9553421", mobile: "+880 1712-345678", email: "dhaka@smtravel.com.bd", hours: "Sun–Thu 9:00 AM – 6:00 PM", map: "https://maps.google.com/?q=Motijheel+Dhaka+Bangladesh" },
  { name: "Chittagong Branch", city: "Chittagong", address: "15 Agrabad Commercial Area, Chittagong-4100", phone: "+880 31 714532", mobile: "+880 1812-456789", email: "ctg@smtravel.com.bd", hours: "Sun–Thu 9:00 AM – 5:30 PM", map: "https://maps.google.com/?q=Agrabad+Chittagong+Bangladesh" },
  { name: "Sylhet Branch", city: "Sylhet", address: "Zindabazar Main Road, Sylhet-3100", phone: "+880 821 716234", mobile: "+880 1912-567890", email: "sylhet@smtravel.com.bd", hours: "Sun–Thu 9:00 AM – 5:30 PM", map: "https://maps.google.com/?q=Zindabazar+Sylhet+Bangladesh" },
  { name: "Khulna Branch", city: "Khulna", address: "KDA Avenue, Khulna-9100", phone: "+880 41 720145", mobile: "+880 1612-678901", email: "khulna@smtravel.com.bd", hours: "Sun–Thu 9:00 AM – 5:00 PM", map: "https://maps.google.com/?q=KDA+Avenue+Khulna+Bangladesh" },
];

// ─── FAQS ────────────────────────────────────────────────────────────────────

export const FAQS: Record<string, { q: string; a: string }[]> = {
  "Hajj & Umrah": [
    { q: "What documents are required for Hajj registration?", a: "Valid passport (6+ months), NID copy, 4 passport photos, medical certificate (fitness), vaccination card (meningitis ACWY), and bank statement showing sufficient funds. Women under 45 need mahram documentation." },
    { q: "How many Hajj seats does Bangladesh get per year?", a: "Bangladesh receives approximately 127,198 Hajj quota seats annually from the Kingdom of Saudi Arabia, divided between government (Sarkari) and private agency categories." },
    { q: "Can I perform Umrah during the Hajj season?", a: "No, Umrah is not permitted during the Hajj days (8–13 Dhul Hijjah). However, you can perform Umrah before or after the Hajj season. We offer packages year-round." },
    { q: "What is the minimum age for Hajj?", a: "There is no minimum age requirement for Hajj. Children can perform Hajj but must have a mahram accompanying them. However, it is generally recommended for adults who are physically capable." },
  ],
  "Visa Services": [
    { q: "How long does a Saudi tourist/visit visa take?", a: "Saudi Arabia e-visa is typically processed within 24–48 hours. Physical sticker visa via embassy takes 3–5 working days." },
    { q: "What is your visa rejection policy?", a: "If your visa is rejected despite submitting all correct documents, we re-apply at no additional service charge. Government visa fees are non-refundable as per embassy policy." },
    { q: "Do you process work visas for Saudi Arabia?", a: "Yes, we process employment/iqama transfer visas for Saudi Arabia. The process takes 30–60 days and requires a verified job offer from an approved Saudi employer." },
    { q: "Can you process visas for countries other than Saudi Arabia?", a: "Yes. We process visas for UAE, Malaysia, Turkey, Thailand, Singapore, UK, Schengen, USA, Canada, Australia, and 50+ other countries. Consult us for your specific destination." },
  ],
  "Packages & Booking": [
    { q: "How do I book a package with SMTravel International?", a: "You can book via our office, phone, WhatsApp (+880 1712-345678), email, or our online booking request form. A 30% advance deposit confirms your booking." },
    { q: "What is your cancellation policy?", a: "Cancellations 60+ days before departure: 10% cancellation fee. 30–59 days: 25% fee. 15–29 days: 50% fee. Less than 15 days: no refund. Airlines and hotel cancellation policies also apply." },
    { q: "Can I pay in installments?", a: "Yes, we offer a flexible installment plan. Typically 30% deposit at booking, 40% 60 days before departure, and 30% 30 days before departure. Please discuss with our team." },
    { q: "Do you offer travel insurance?", a: "Yes, we offer comprehensive travel insurance covering medical emergencies, trip cancellation, baggage loss, and flight delays. Highly recommended for all international travel." },
  ],
  "Payment & Finance": [
    { q: "What payment methods do you accept?", a: "We accept cash, bank transfer, bKash, Nagad, Rocket, and credit/debit cards (Visa/Mastercard). A payment receipt is issued immediately for all transactions." },
    { q: "Is it safe to pay online?", a: "All online payments are processed through secure, PCI-compliant payment gateways. We never store card details. Bank transfer is always the safest option." },
    { q: "Can I get a refund if I am denied a visa?", a: "If a visa is denied for reasons beyond your control (embassy error, policy change), we offer a partial refund minus non-recoverable costs (visa fee, airline charges). Our team will guide you through the refund process." },
  ],
  "General": [
    { q: "Is SMTravel International licensed and government approved?", a: "Yes. We hold ATAB (Association of Travel Agents of Bangladesh) membership, Civil Aviation Authority license, and Ministry of Religious Affairs Hajj agency certification. All our operations are fully legal and compliant." },
    { q: "How long has SMTravel International been operating?", a: "SMTravel International was established in 1998 and has been serving Bangladeshi pilgrims and travelers for over 25 years, making us one of the most experienced agencies in the country." },
    { q: "Do you have offices outside Dhaka?", a: "Yes, we have branch offices in Chittagong, Sylhet, and Khulna, with representatives in major cities across Bangladesh. Contact us for your nearest branch." },
    { q: "How do I contact SMTravel International in an emergency during travel?", a: "Our 24/7 emergency hotline is +880 1712-999888. You can also reach us via WhatsApp at the same number. Our on-ground teams in Saudi Arabia and other destinations are always reachable." },
  ],
};

// ─── GALLERY IMAGES ──────────────────────────────────────────────────────────

export const GALLERY_IMAGES = [
  { id: 1, title: "Grand Mosque Makkah", category: "Hajj", image: "photo-1770786106021-52580470e31e" },
  { id: 2, title: "Kaaba Aerial View", category: "Hajj", image: "photo-1720549973451-018d3623b55a" },
  { id: 3, title: "Masjid al-Haram", category: "Umrah", image: "photo-1693590614566-1d3ea9ef32f7" },
  { id: 4, title: "Pilgrims Gather", category: "Hajj", image: "photo-1758985776354-4df674930917" },
  { id: 5, title: "Sacred Mosque", category: "Umrah", image: "photo-1571909552531-1601eaec8f79" },
  { id: 6, title: "Saudi Landscape", category: "Tour", image: "photo-1682687219573-3fd75f982217" },
  { id: 7, title: "Desert Adventure", category: "Tour", image: "photo-1551031749-9257c3aee0df" },
  { id: 8, title: "Dubai Skyline", category: "Tour", image: "photo-1512453979798-5ea266f8880c" },
  { id: 9, title: "Luxury Hotel Resort", category: "Hotel", image: "photo-1561501900-3701fa6a0864" },
  { id: 10, title: "Flight Journey", category: "Air Ticket", image: "photo-1606768666853-403c90a981ad" },
  { id: 11, title: "Air Travel View", category: "Air Ticket", image: "photo-1507812984078-917a274065be" },
  { id: 12, title: "Saudi Night", category: "Hajj", image: "photo-1682685797366-715d29e33f9d" },
];
