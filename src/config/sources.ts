// Which sources an article may cite. Grounding returns whatever Google Search found — in the spike
// that included facebook.com, youtube.com, a pharmacy and supplement-adjacent sites — so sources
// are filtered to this allowlist before a draft can pass. (docs/spike/results/2026-09-27)
// Data, not code: extend it as good sources turn up in review.

/** Exact hosts (and their subdomains) with a display name. */
export const trustedPublishers: Record<string, string> = {
  "nhs.uk": "NHS",
  "nhsinform.scot": "NHS Inform",
  "gov.uk": "GOV.UK",
  "nice.org.uk": "NICE",
  "cdc.gov": "CDC",
  "nih.gov": "NIH",
  "medlineplus.gov": "MedlinePlus",
  "who.int": "World Health Organization",
  "mayoclinic.org": "Mayo Clinic",
  "clevelandclinic.org": "Cleveland Clinic",
  "hopkinsmedicine.org": "Johns Hopkins Medicine",
  "health.harvard.edu": "Harvard Health",
  "sleepfoundation.org": "Sleep Foundation",
  "aasm.org": "American Academy of Sleep Medicine",
  "heart.org": "American Heart Association",
  "bhf.org.uk": "British Heart Foundation",
  "diabetes.org.uk": "Diabetes UK",
  "patient.info": "Patient.info",
  "healthdirect.gov.au": "Healthdirect Australia",
  "betterhealth.vic.gov.au": "Better Health Channel",
  "bmj.com": "The BMJ",
  "thelancet.com": "The Lancet",
  "nejm.org": "NEJM",
  "jamanetwork.com": "JAMA Network",
  "cochranelibrary.com": "Cochrane Library",
  "nature.com": "Nature",
  "springer.com": "Springer",
  "sciencedirect.com": "ScienceDirect",

  // Professional bodies and major health charities — what the drafting prompt asks for. Added
  // 2026-09-27 after the first real runs rejected aad.org and cancerresearchuk.org as untrusted.
  // Skin
  "aad.org": "American Academy of Dermatology",
  "bad.org.uk": "British Association of Dermatologists",
  "cancerresearchuk.org": "Cancer Research UK",
  "cancer.org": "American Cancer Society",
  "skincancer.org": "Skin Cancer Foundation",
  "macmillan.org.uk": "Macmillan Cancer Support",
  // Mind
  "mind.org.uk": "Mind",
  "mentalhealth.org.uk": "Mental Health Foundation",
  "rethink.org": "Rethink Mental Illness",
  "nami.org": "NAMI",
  "apa.org": "American Psychological Association",
  "psychiatry.org": "American Psychiatric Association",
  // Food and digestion
  "eatright.org": "Academy of Nutrition and Dietetics",
  "bda.uk.com": "British Dietetic Association",
  "nutrition.org.uk": "British Nutrition Foundation",
  "gutscharity.org.uk": "Guts UK",
  "theibsnetwork.org": "The IBS Network",
  "gastro.org": "American Gastroenterological Association",
  "iffgd.org": "IFFGD",
  // Heart, lungs, metabolic
  "acc.org": "American College of Cardiology",
  "diabetes.org": "American Diabetes Association",
  "stroke.org.uk": "Stroke Association",
  "stroke.org": "American Stroke Association",
  "asthmaandlung.org.uk": "Asthma + Lung UK",
  "lung.org": "American Lung Association",
  "kidney.org": "National Kidney Foundation",
  "kidneycareuk.org": "Kidney Care UK",
  // Movement
  "versusarthritis.org": "Versus Arthritis",
  "arthritis.org": "Arthritis Foundation",
  "csp.org.uk": "Chartered Society of Physiotherapy",
  "choosept.com": "American Physical Therapy Association",
  "acsm.org": "American College of Sports Medicine",
  "theros.org.uk": "Royal Osteoporosis Society",
  "bonehealthandosteoporosis.org": "Bone Health & Osteoporosis Foundation",
  // Eyes, ears, teeth
  "aao.org": "American Academy of Ophthalmology",
  "rnib.org.uk": "RNIB",
  "rnid.org.uk": "RNID",
  "entnet.org": "American Academy of Otolaryngology",
  "asha.org": "ASHA",
  "ada.org": "American Dental Association",
  "mouthhealthy.org": "American Dental Association",
  "dentalhealth.org": "Oral Health Foundation",
  // Ageing and prevention
  "alzheimers.org.uk": "Alzheimer's Society",
  "alz.org": "Alzheimer's Association",
  "ageuk.org.uk": "Age UK",
  "menopausematters.co.uk": "Menopause Matters",
  "womens-health-concern.org": "Women's Health Concern",
  "menopause.org": "The Menopause Society",
  "uspreventiveservicestaskforce.org": "US Preventive Services Task Force",
  "screening.nhs.uk": "NHS Screening",
  // First aid (Symptoms & First Aid category, EDITORIAL.md §2)
  "redcross.org": "American Red Cross",
  "redcross.org.uk": "British Red Cross",
  "redcross.org.au": "Australian Red Cross",
  "redcross.ca": "Canadian Red Cross",
  "ifrc.org": "IFRC",
  "sja.org.uk": "St John Ambulance",
  "stjohn.org.au": "St John Ambulance Australia",
  "stjohn.org.nz": "St John New Zealand",
  "resus.org.uk": "Resuscitation Council UK",
  "poison.org": "National Capital Poison Center",
  "healthychildren.org": "American Academy of Pediatrics",
  "aap.org": "American Academy of Pediatrics",
  "acep.org": "American College of Emergency Physicians",
};

/** Suffixes that are trustworthy as a class (government, academic, NHS trusts). */
export const trustedSuffixes: Record<string, string> = {
  ".gov": "",
  ".gov.uk": "",
  ".nhs.uk": "NHS",
  ".edu": "",
  ".ac.uk": "",
  ".gov.au": "",
};

/** The display publisher for a host, or null if it isn't trusted. */
export function trustedPublisher(host: string): string | null {
  const h = host.toLowerCase().replace(/^www\./, "");
  for (const [domain, name] of Object.entries(trustedPublishers)) {
    if (h === domain || h.endsWith(`.${domain}`)) return name;
  }
  for (const [suffix, name] of Object.entries(trustedSuffixes)) {
    if (h.endsWith(suffix)) return name || h;
  }
  return null;
}
