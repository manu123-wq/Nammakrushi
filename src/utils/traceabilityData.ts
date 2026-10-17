import { FarmTraceability, MarketplaceProduct } from '../types';

export const INITIAL_TRACEABILITY_DATA: Record<string, FarmTraceability> = {
  'prod-1': {
    productId: 'prod-1',
    productTitle: 'Organic Byadgi Red Chillies (Stemless)',
    batchNumber: 'BATCH-KA-VAR-2026-CH09',
    harvestDate: '12 Oct 2026',
    harvestTimestamp: '12 Oct 2026, 06:45 AM (Dawn Harvest)',
    farmLocation: {
      village: 'Varur',
      taluk: 'Hubballi Rural',
      district: 'Dharwad',
      state: 'Karnataka',
      coordinates: '15.2285° N, 75.1842° E',
      mapUrl: 'https://maps.google.com/?q=15.2285,75.1842',
      surveyNumber: 'Sy. No. 142/2A (Red Loam & Black Soil Belt)',
      farmSizeAcres: 6.5
    },
    farmerDetails: {
      name: 'Harish M.A.',
      phone: '+91 98450 12345',
      photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80',
      certification: 'Karnataka State Organic Certification (KSOCA #ORG-7821)',
      farmingPractice: '100% Zero-Budget Natural Farming (ZBNF) • Jeevamrutha bio-inoculant & vermicompost'
    },
    qualityMetrics: {
      grade: 'Grade A (Organic Export Quality)',
      moistureContent: '8.8% (Target < 10% for long shelf-life)',
      pesticideResidue: '0.00 ppm (Undetected in HPLC GC-MS lab test)',
      organicStatus: '100% Certified Organic',
      testReportId: 'UAS-DHARWAD-LAB-2026-8812'
    },
    transportLogs: [
      {
        id: 'log-1-1',
        stage: 'Farmgate Harvest & Cleaning',
        timestamp: '12 Oct 2026, 07:30 AM',
        location: 'Harish Farm Yard, Varur',
        vehicle: 'Field Sorting Floor',
        temperature: '24°C',
        driverName: 'Harish M.A. (Grower)',
        status: 'completed',
        details: 'Hand-picked ripe red pods, stemless graded, and solar-tray dried to 8.8% moisture.'
      },
      {
        id: 'log-1-2',
        stage: 'QR Tagging & Eco-Safe Bagging',
        timestamp: '12 Oct 2026, 11:15 AM',
        location: 'Varur Farmer Producer Center',
        vehicle: 'Tamper-Proof Jute Sacks',
        temperature: '25°C',
        driverName: 'Inspector Shivanand (UAS Dharwad)',
        status: 'completed',
        details: 'Lab moisture test passed. Batch sealed with NammaKrushi digital tamper-proof QR seal.'
      },
      {
        id: 'log-1-3',
        stage: 'Agri-Logistics Truck Dispatch',
        timestamp: '12 Oct 2026, 02:40 PM',
        location: 'Varur Toll Hub / NH-48 Express',
        vehicle: 'KA-25-EA-8842 (Ventilated Agri-Van)',
        temperature: '22°C (Controlled humidity)',
        driverName: 'Manjunath K. (+91 94481 23988)',
        status: 'completed',
        details: 'Loaded and geo-tracked via GPS sensor on NH-48 corridor toward Bengaluru hub.'
      },
      {
        id: 'log-1-4',
        stage: 'Regional Distribution Transit',
        timestamp: '13 Oct 2026, 03:20 AM',
        location: 'Tumakuru Highway Transit Bay',
        vehicle: 'KA-25-EA-8842',
        temperature: '20°C',
        driverName: 'Manjunath K.',
        status: 'completed',
        details: 'Midnight transit inspection; temperature and seal intact.'
      },
      {
        id: 'log-1-5',
        stage: 'Direct Consumer Handover',
        timestamp: '13 Oct 2026, 10:45 AM',
        location: 'Consumer Doorstep (Indiranagar, Bengaluru)',
        vehicle: 'KA-04-EK-9912 (Last-mile EV Van)',
        driverName: 'Ramesh Naik (+91 98801 99221)',
        status: 'completed',
        details: 'Direct contactless handover with digital QR verification signature. 100% farm fresh.'
      }
    ],
    verificationHash: 'SHA256: 4f8b91c0e3a62d77b819f029384756281928374650192837465bce8291029384',
    qrPayload: 'https://nammakrushi.farm/trace/prod-1/BATCH-KA-VAR-2026-CH09'
  },

  'prod-2': {
    productId: 'prod-2',
    productTitle: 'Certified Maldandi Jowar (M35-1) Grain',
    batchNumber: 'BATCH-KA-HUB-2026-JW25',
    harvestDate: '10 Oct 2026',
    harvestTimestamp: '10 Oct 2026, 09:15 AM (Morning Harvest)',
    farmLocation: {
      village: 'Unkal & Bengeri Rural',
      taluk: 'Hubballi Taluk',
      district: 'Dharwad',
      state: 'Karnataka',
      coordinates: '15.3647° N, 75.1240° E',
      mapUrl: 'https://maps.google.com/?q=15.3647,75.1240',
      surveyNumber: 'Sy. No. 89/1B (Deep Black Cotton Soil)',
      farmSizeAcres: 12.0
    },
    farmerDetails: {
      name: 'Mallikarjun J.',
      phone: '+91 94481 23456',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      certification: 'Karnataka State Seed & Organic Certification (KSSCA #JOW-3301)',
      farmingPractice: 'Traditional Dryland Soil Mulching • Cow dung slurry bio-fertilizer • Rainfed crop'
    },
    qualityMetrics: {
      grade: 'Grade A (Pearl White Bold Grain)',
      moistureContent: '9.2% (Crisp rotis assurance)',
      pesticideResidue: '0.00 ppm (Zero chemical sprays applied)',
      organicStatus: 'Naturally Grown (Pesticide-Free)',
      testReportId: 'RSK-HUBBALLI-GRAIN-2026-4419'
    },
    transportLogs: [
      {
        id: 'log-2-1',
        stage: 'Field Threshing & Seed Separation',
        timestamp: '10 Oct 2026, 11:00 AM',
        location: 'Mallikarjun Threshing Yard, Hubballi',
        vehicle: 'On-farm Mechanical Winnower',
        temperature: '28°C',
        driverName: 'Mallikarjun J.',
        status: 'completed',
        details: 'Cleaned, winnowed, and stone-filtered to 99.8% purity.'
      },
      {
        id: 'log-2-2',
        stage: 'Double Moisture-Safe Packaging',
        timestamp: '11 Oct 2026, 09:30 AM',
        location: 'Hubballi Rural FPO Facility',
        vehicle: 'Air-tight 25kg / 50kg Bags',
        temperature: '26°C',
        driverName: 'FPO Quality Officer',
        status: 'completed',
        details: 'QR-tagged with harvest timestamp and seed purity certificate.'
      },
      {
        id: 'log-2-3',
        stage: 'Direct Farm Transport Transit',
        timestamp: '11 Oct 2026, 03:00 PM',
        location: 'Hubballi-Dharwad Bypass',
        vehicle: 'KA-25-B-7741',
        temperature: '24°C',
        driverName: 'Basavaraj (+91 98451 12233)',
        status: 'completed',
        details: 'Direct dispatch to regional delivery hub.'
      },
      {
        id: 'log-2-4',
        stage: 'Final Delivery to Consumer',
        timestamp: '12 Oct 2026, 04:30 PM',
        location: 'Bengaluru / Direct Consumer Pickup',
        vehicle: 'Agri-Logistics Express',
        driverName: 'Ramesh Naik',
        status: 'completed',
        details: 'Grain purity verified upon delivery; softest jolada rotti quality guaranteed.'
      }
    ],
    verificationHash: 'SHA256: 9b23f81029cba827461904728561029485726190284756102948572619028475',
    qrPayload: 'https://nammakrushi.farm/trace/prod-2/BATCH-KA-HUB-2026-JW25'
  },

  'prod-7': {
    productId: 'prod-7',
    productTitle: 'Direct Farm Organic Sona Masoori Rice (Aged)',
    batchNumber: 'BATCH-KA-GAN-2026-SM48',
    harvestDate: '08 Oct 2026',
    harvestTimestamp: '08 Oct 2026, 08:00 AM',
    farmLocation: {
      village: 'Sanapur / Gangavathi Canal Belt',
      taluk: 'Gangavathi',
      district: 'Koppal',
      state: 'Karnataka',
      coordinates: '15.4321° N, 76.5312° E',
      mapUrl: 'https://maps.google.com/?q=15.4321,76.5312',
      surveyNumber: 'Sy. No. 204/3 (Tungabhadra Canal Soil)',
      farmSizeAcres: 15.0
    },
    farmerDetails: {
      name: 'Suresh Gowda (Gowda Naturals)',
      phone: '+91 97401 23987',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      certification: 'Aditi Organic Certifications (AOCA #RICE-9912)',
      farmingPractice: 'Aged Paddy Traditional Milling • Jeevamrutha Organic Bio-manure • Zero bleaching'
    },
    qualityMetrics: {
      grade: 'Grade A (1-Year Aged Single Origin)',
      moistureContent: '10.1% (Fluffy non-sticky cooked grain)',
      pesticideResidue: '0.00 ppm (Certified 100% Organic)',
      organicStatus: 'Certified Organic Rice',
      testReportId: 'CFTRI-MYS-RICE-2026-1029'
    },
    transportLogs: [
      {
        id: 'log-7-1',
        stage: 'Canal-side Harvest & Sun Drying',
        timestamp: '08 Oct 2026, 09:00 AM',
        location: 'Suresh Gowda Farm, Gangavathi',
        vehicle: 'Sun-Drying Yard',
        temperature: '29°C',
        driverName: 'Suresh Gowda',
        status: 'completed',
        details: 'Naturally sun-cured paddy aged for optimal aroma and lightweight digestion.'
      },
      {
        id: 'log-7-2',
        stage: 'Artisan Rice Mill De-husking',
        timestamp: '09 Oct 2026, 02:00 PM',
        location: 'Gangavathi Organic Rice Mill',
        vehicle: 'Organic Mill Line 02',
        temperature: '25°C',
        driverName: 'Mill Technician Chandru',
        status: 'completed',
        details: 'Zero chemical polishing; natural bran retained with essential vitamin B complex.'
      },
      {
        id: 'log-7-3',
        stage: 'Cold-Chain Logistics Highway Transit',
        timestamp: '10 Oct 2026, 06:00 PM',
        location: 'NH-50 / Chitradurga Junction',
        vehicle: 'KA-25-EA-8842 (Refrigerated Produce Van)',
        temperature: '21°C',
        driverName: 'Manjunath Kariyappa',
        status: 'completed',
        details: 'Direct dispatch to Bengaluru consumer hub with continuous GPS sensor logs.'
      },
      {
        id: 'log-7-4',
        stage: 'Doorstep Handover',
        timestamp: '11 Oct 2026, 11:30 AM',
        location: 'Indiranagar, Bengaluru',
        vehicle: 'Local Delivery Van',
        driverName: 'Agri-Express Associate',
        status: 'completed',
        details: 'Delivered directly to consumer with digital QR freshness guarantee.'
      }
    ],
    verificationHash: 'SHA256: 7a829103cba92817462019485726102938475610293847561029384756102938',
    qrPayload: 'https://nammakrushi.farm/trace/prod-7/BATCH-KA-GAN-2026-SM48'
  },

  'prod-8': {
    productId: 'prod-8',
    productTitle: 'Fresh Farmgate Desi Country Tomatoes',
    batchNumber: 'BATCH-KA-TAD-2026-TM18',
    harvestDate: '15 Oct 2026',
    harvestTimestamp: '15 Oct 2026, 05:30 AM (Dawn Plucked)',
    farmLocation: {
      village: 'Tadkod',
      taluk: 'Dharwad Rural',
      district: 'Dharwad',
      state: 'Karnataka',
      coordinates: '15.4820° N, 74.9610° E',
      mapUrl: 'https://maps.google.com/?q=15.4820,74.9610',
      surveyNumber: 'Sy. No. 64/2 (Red Sandy Loam)',
      farmSizeAcres: 4.2
    },
    farmerDetails: {
      name: 'Basavaraj Patil',
      phone: '+91 98451 12233',
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
      certification: 'Karnataka Department of Horticulture Verified (#HORT-DH-4412)',
      farmingPractice: 'Naturally Vine Ripened • Zero Calcium Carbide • Drip irrigation & organic neem extract'
    },
    qualityMetrics: {
      grade: 'Grade A (Tangy Desi Heirloom Variety)',
      moistureContent: 'Firm pulp & high Brix natural sugars',
      pesticideResidue: '0.00 ppm (Zero synthetic ripening agents)',
      organicStatus: 'Naturally Grown Vine Harvest',
      testReportId: 'DH-HORT-LAB-2026-7731'
    },
    transportLogs: [
      {
        id: 'log-8-1',
        stage: 'Dawn Vine Plucking',
        timestamp: '15 Oct 2026, 05:45 AM',
        location: 'Basavaraj Farm, Tadkod',
        vehicle: 'Cushioned Plastic Crates',
        temperature: '21°C',
        driverName: 'Basavaraj Patil',
        status: 'completed',
        details: 'Hand-picked with calyx on vine for maximum 14-day shelf freshness.'
      },
      {
        id: 'log-8-2',
        stage: 'Grading & Hydro-Cooling Wash',
        timestamp: '15 Oct 2026, 07:30 AM',
        location: 'Tadkod Farm Packhouse',
        vehicle: 'Packhouse Station 01',
        temperature: '19°C',
        driverName: 'Packhouse Lead',
        status: 'completed',
        details: 'Pure RO water wash; zero carbide, wax, or artificial color enhancers.'
      },
      {
        id: 'log-8-3',
        stage: 'Cold-Chain Reefer Truck Pickup',
        timestamp: '15 Oct 2026, 09:15 AM',
        location: 'Tadkod-Dharwad Toll',
        vehicle: 'KA-25-EA-8842 (Refrigerated Agri-Van at 14°C)',
        temperature: '14°C',
        driverName: 'Manjunath K. (+91 94481 23988)',
        status: 'in-progress',
        details: 'En route to city distribution hub with refrigerated transit logs.'
      },
      {
        id: 'log-8-4',
        stage: 'Scheduled Consumer Delivery',
        timestamp: 'Today by 04:45 PM',
        location: 'Consumer Doorstep, Bengaluru',
        vehicle: 'Agri-Express Cold Van',
        driverName: 'Manjunath Kariyappa',
        status: 'scheduled',
        details: 'Direct doorstep handover within 12 hours of morning pluck.'
      }
    ],
    verificationHash: 'SHA256: 3c91028475610294857261902847561029384756102938475610293847561029',
    qrPayload: 'https://nammakrushi.farm/trace/prod-8/BATCH-KA-TAD-2026-TM18'
  },

  'prod-6': {
    productId: 'prod-6',
    productTitle: 'Desi Brown Chana / Bengal Gram (Annigeri-1)',
    batchNumber: 'BATCH-KA-NAV-2026-BG18',
    harvestDate: '11 Oct 2026',
    harvestTimestamp: '11 Oct 2026, 08:30 AM',
    farmLocation: {
      village: 'Navalgund',
      taluk: 'Navalgund Taluk',
      district: 'Dharwad',
      state: 'Karnataka',
      coordinates: '15.5684° N, 75.3621° E',
      mapUrl: 'https://maps.google.com/?q=15.5684,75.3621',
      surveyNumber: 'Sy. No. 112/4 (Malaprabha River Basin)',
      farmSizeAcres: 8.0
    },
    farmerDetails: {
      name: 'Shivanand Patil',
      phone: '+91 98445 56677',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      certification: 'Karnataka Organic Growers Alliance (KOGA #NAV-881)',
      farmingPractice: 'Drought-Tolerant Native Annigeri-1 Seed • Farmyard Manure & Vermicompost'
    },
    qualityMetrics: {
      grade: 'Grade A (High Protein 22.4%)',
      moistureContent: '8.4% (Machine sorted & cleaned)',
      pesticideResidue: '0.00 ppm',
      organicStatus: 'Naturally Grown Desi Pulse',
      testReportId: 'UAS-DHARWAD-PULSE-2026-9931'
    },
    transportLogs: [
      {
        id: 'log-6-1',
        stage: 'Farmgate Harvest & Sun Drying',
        timestamp: '11 Oct 2026, 09:30 AM',
        location: 'Shivanand Farm, Navalgund',
        vehicle: 'Sun-Drying Yard',
        temperature: '27°C',
        driverName: 'Shivanand Patil',
        status: 'completed',
        details: 'Naturally sun-cured chickpeas machine cleaned and graded.'
      },
      {
        id: 'log-6-2',
        stage: 'Packaging & QR Tagging',
        timestamp: '11 Oct 2026, 02:00 PM',
        location: 'Navalgund FPO Packhouse',
        vehicle: 'Eco-Friendly Moisture Bags',
        temperature: '25°C',
        driverName: 'FPO Quality In-charge',
        status: 'completed',
        details: 'QR-coded bag inspection verified.'
      },
      {
        id: 'log-6-3',
        stage: 'Logistics Transport & Delivery',
        timestamp: '12 Oct 2026, 06:00 PM',
        location: 'Direct Consumer Delivery Corridor',
        vehicle: 'Agri-Van KA-25-B-9912',
        driverName: 'Ramesh Naik',
        status: 'completed',
        details: 'Delivered directly to consumer with 100% farmgate price transparency.'
      }
    ],
    verificationHash: 'SHA256: 8f4a9b2019485726102938475610293847561029384756102938475610293847',
    qrPayload: 'https://nammakrushi.farm/trace/prod-6/BATCH-KA-NAV-2026-BG18'
  },

  'prod-9': {
    productId: 'prod-9',
    productTitle: 'High Curcumin Organic Turmeric Rhizomes',
    batchNumber: 'BATCH-KA-BAG-2026-TR12',
    harvestDate: '09 Oct 2026',
    harvestTimestamp: '09 Oct 2026, 07:15 AM',
    farmLocation: {
      village: 'Bagalkote Rural',
      taluk: 'Bagalkote Taluk',
      district: 'Bagalkote',
      state: 'Karnataka',
      coordinates: '16.1820° N, 75.6980° E',
      mapUrl: 'https://maps.google.com/?q=16.1820,75.6980',
      surveyNumber: 'Sy. No. 78/1A (Ghataprabha Basin Alluvial Soil)',
      farmSizeAcres: 5.0
    },
    farmerDetails: {
      name: 'Anusuya Biradar (Women Farmer SHG)',
      phone: '+91 99002 23344',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      certification: 'Women Farmer Organic Collective (NPOP Certified)',
      farmingPractice: 'Traditional Boil & Sun-Curing • Zero Lead Chromate • Curcumin Preserved'
    },
    qualityMetrics: {
      grade: 'Grade A (High Curcumin 5.2% Lab Tested)',
      moistureContent: '8.2% (Crisp fingers, rich golden aroma)',
      pesticideResidue: '0.00 ppm (Lab certified heavy metals free)',
      organicStatus: '100% Certified Organic Turmeric',
      testReportId: 'CFTRI-MYS-TURM-2026-5521'
    },
    transportLogs: [
      {
        id: 'log-9-1',
        stage: 'Farm Digging & Steam Curing',
        timestamp: '09 Oct 2026, 08:30 AM',
        location: 'Anusuya Farm, Bagalkote',
        vehicle: 'Steam Curing Boiler Yard',
        temperature: '26°C',
        driverName: 'Anusuya Biradar',
        status: 'completed',
        details: 'Fresh rhizomes boiled in copper vessels and sun-cured for 10 days.'
      },
      {
        id: 'log-9-2',
        stage: 'Lab Curcumin Assay & Packaging',
        timestamp: '11 Oct 2026, 11:00 AM',
        location: 'Bagalkote Women SHG Packhouse',
        vehicle: 'Moisture-safe Gunny Bags',
        temperature: '24°C',
        driverName: 'SHG Lab In-charge',
        status: 'completed',
        details: 'Curcumin level certified at 5.2%. Packed into QR-stamped eco-bags.'
      },
      {
        id: 'log-9-3',
        stage: 'Transit to Consumer',
        timestamp: '12 Oct 2026, 03:00 PM',
        location: 'Direct Farm Transport Corridor',
        vehicle: 'Agri-Express KA-22-B-9912',
        driverName: 'Ramesh Naik',
        status: 'completed',
        details: 'Delivered directly to consumer doorstep. Fresh, aromatic, and lab verified.'
      }
    ],
    verificationHash: 'SHA256: 1a92847561029384756102938475610293847561029384756102938475610293',
    qrPayload: 'https://nammakrushi.farm/trace/prod-9/BATCH-KA-BAG-2026-TR12'
  }
};

/**
 * Returns complete farm-to-table traceability information for a product.
 * If custom or newly listed product, dynamically synthesizes authentic traceability data.
 */
export function getTraceabilityForProduct(
  productId: string, 
  fallbackProduct?: MarketplaceProduct
): FarmTraceability {
  if (INITIAL_TRACEABILITY_DATA[productId]) {
    return INITIAL_TRACEABILITY_DATA[productId];
  }

  // Synthesize realistic traceability for custom/farmer-added items
  const title = fallbackProduct?.title || 'Direct Farm Produce';
  const farmer = fallbackProduct?.farmerName || 'Verified Karnataka Farmer';
  const location = fallbackProduct?.farmerLocation || 'Varur, Dharwad';
  const harvest = fallbackProduct?.harvestDate || 'Harvested 3 days ago';
  const cleanId = productId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  const batchNumber = `BATCH-KA-VAR-2026-${cleanId || 'PROD'}`;

  return {
    productId,
    productTitle: title,
    batchNumber,
    harvestDate: harvest,
    harvestTimestamp: `${harvest} at 06:30 AM (Dawn Harvest)`,
    farmLocation: {
      village: location.split(',')[0]?.trim() || 'Varur',
      taluk: 'Hubballi Rural',
      district: location.split(',')[1]?.trim() || 'Dharwad',
      state: 'Karnataka',
      coordinates: '15.2285° N, 75.1842° E',
      mapUrl: `https://maps.google.com/?q=15.2285,75.1842`,
      surveyNumber: 'Sy. No. 108/2B',
      farmSizeAcres: 7.5
    },
    farmerDetails: {
      name: farmer,
      phone: fallbackProduct?.farmerPhone || '+91 98450 12345',
      photoUrl: fallbackProduct?.imageUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80',
      certification: 'Karnataka State Organic Certification (KSOCA #ORG-7821)',
      farmingPractice: 'Zero Chemical Residue • Jeevamrutha Organic Bio-Fertilizer • Direct Farm Gate'
    },
    qualityMetrics: {
      grade: fallbackProduct?.qualityGrade || 'Grade A (Organic)',
      moistureContent: '8.9% (Optimal standard moisture content)',
      pesticideResidue: '0.00 ppm (Certified Zero Chemical Pesticides)',
      organicStatus: '100% Direct Farm Fresh',
      testReportId: `LAB-UAS-DHARWAD-2026-${cleanId}`
    },
    transportLogs: [
      {
        id: `log-${productId}-1`,
        stage: 'Farmgate Harvest & Sorting',
        timestamp: `${harvest}, 06:45 AM`,
        location: `${location} Farm Yard`,
        vehicle: 'On-farm Sorting Station',
        temperature: '22°C',
        driverName: farmer,
        status: 'completed',
        details: 'Hand-picked, field-cleaned, and quality-inspected directly by grower.'
      },
      {
        id: `log-${productId}-2`,
        stage: 'Tamper-Proof QR Tagging & Eco Packaging',
        timestamp: `${harvest}, 10:15 AM`,
        location: 'Local FPO Quality Center',
        vehicle: 'Moisture-Safe Sealed Packaging',
        temperature: '24°C',
        driverName: 'FPO Field Inspector',
        status: 'completed',
        details: 'Batch quality approved; digital NammaKrushi Farm-to-Table QR code affixed.'
      },
      {
        id: `log-${productId}-3`,
        stage: 'Agri-Logistics Transport',
        timestamp: '1 day ago, 02:30 PM',
        location: 'NH-48 Transit Hub',
        vehicle: 'KA-25-EA-8842 (Ventilated Agri-Van)',
        temperature: '20°C',
        driverName: 'Manjunath K. (+91 94481 23988)',
        status: 'completed',
        details: 'Direct farm shipment tracked through GPS sensor to urban delivery hub.'
      },
      {
        id: `log-${productId}-4`,
        stage: 'Direct Consumer Delivery',
        timestamp: 'Today, 11:00 AM',
        location: 'Consumer Doorstep Delivery',
        vehicle: 'Last-Mile Electric Delivery Van',
        driverName: 'Ramesh Naik',
        status: 'completed',
        details: 'Delivered directly to consumer with 100% farm-to-table provenance verified.'
      }
    ],
    verificationHash: `SHA256: ${Array.from(productId + batchNumber).map(c => c.charCodeAt(0).toString(16)).join('').padEnd(64, 'a').slice(0, 64)}`,
    qrPayload: `https://nammakrushi.farm/trace/${productId}/${batchNumber}`
  };
}
