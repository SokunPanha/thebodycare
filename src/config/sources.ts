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
