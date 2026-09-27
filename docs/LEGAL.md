# Legal & Compliance Checklist

> **Not legal advice.** This is a checklist of what applies and what to prepare, written by an
> engineer. The health-content and entity items in §7 are worth a lawyer's hour before you monetize.

Most of this is cheap if done at the start and painful if retrofitted — particularly §4, which
decides how much consent machinery you have to build.

---

## 1. Required pages

| Page | Required by | Status |
|---|---|---|
| **Privacy Policy** | GDPR · AdSense · Resend | scoped, not written |
| **Medical Disclaimer** | Practical necessity for health content | scoped, not written |
| **Terms of Service** | Comments & accounts | named only |
| **Cookie Policy** | ePrivacy, if you set non-essential cookies | see §4 |
| **Affiliate Disclosure** | FTC | scoped, not written |
| **About** | Google E-E-A-T (not law, but load-bearing) | see `MVP.md` |
| **Contact** | AdSense; GDPR data requests | missing entirely |

Contact is currently missing from every doc. AdSense wants it, and GDPR requires a route for data
requests.

---

## 2. Who the site is

Unresolved, and it blocks monetization rather than development.

- **Entity** — personal or a registered company? AdSense and affiliate programs need a payee, a tax
  identity, and an address that appears publicly. You're in Cambodia; confirm local requirements and
  how US-source affiliate/ad income is treated before the first payout, not after.
- **Named publisher** — the privacy policy must name a data controller. "The Body Cue" isn't a legal
  person.
- **Reviewer identity** — the open question from `EDITORIAL.md` §7. It's also a legal-ish one: naming
  a reviewer who didn't review is a misrepresentation, not just weak E-E-A-T.

---

## 3. GDPR

Applies if EU/UK visitors can reach the site, which they can.

| Obligation | What it means here |
|---|---|
| Lawful basis | Consent for the newsletter; legitimate interest for aggregate analytics |
| Consent for non-essential cookies | See §4 — avoidable |
| Data subject rights | Access, deletion, portability. Needs a real contact route and a process. |
| Processor agreements | Supabase, Vercel, Google, Resend all process personal data. Each publishes a DPA — accept and keep a copy. |
| Breach notification | 72 hours. Know beforehand who you'd notify. |
| Data minimisation | Don't store what you don't use — see §6 |

---

## 4. The one decision that removes most of the work ⭐

**Use cookieless analytics.** Plausible, Fathom, or Umami set no cookies and collect no personal
data, which means **no consent banner for analytics** — no CMP, no cookie policy for it, no
consent-state plumbing, nothing.

Choose GA4 instead and you inherit a consent banner, a CMP, a cookie policy, consent-mode wiring,
and a worse reader experience — for data you won't use, because Search Console tells you more about
a content site than GA4 ever will.

**The catch, stated plainly:** this only holds until you turn on AdSense. Google requires a
**certified CMP for EEA/UK traffic**, and ad cookies need consent regardless of your analytics
choice. So:

| Phase | Consent needed |
|---|---|
| Launch → pre-ads | **None**, with cookieless analytics + no ad scripts |
| AdSense live | Certified CMP, EEA/UK targeting (Google's own free CMP is fine) |

That's a real argument for delaying ads until traffic justifies them — which §8 of `GROWTH.md`
already recommends for unrelated reasons.

---

## 5. AdSense prerequisites

Don't apply until every one of these is true, or you'll be rejected and have to wait to reapply:

- [ ] Privacy policy live, naming Google as an advertising partner and covering cookies
- [ ] Contact page live
- [ ] About page that establishes who runs the site
- [ ] 25+ substantial published articles (30+ is safer)
- [ ] Consistent real traffic for several weeks
- [ ] Clean navigation, no broken links, no placeholder pages
- [ ] Certified CMP configured for EEA/UK
- [ ] Domain owned and live for a reasonable period

Health content also draws stricter review than most categories. `EDITORIAL.md`'s no-medication rule
helps here — sites recommending treatments attract far more scrutiny.

---

## 6. Data map

What's collected, why, and how long — needed for the privacy policy and worth keeping honest.

| Data | Source | Basis | Retention |
|---|---|---|---|
| Email | Newsletter signup | Consent (double opt-in) | Until unsubscribe + 30d |
| Email, auth ID | Admin login | Contract | Life of account |
| Email, name, comment | Comments | Consent | Until deletion request |
| IP (transient) | Vercel/Supabase logs | Legitimate interest | Per provider default |
| Aggregate pageviews | Plausible | Legitimate interest — no personal data | Indefinite |

**Do not collect anything not on this list.** Every extra field is a liability with no upside for a
content site.

**Newsletter specifically:** double opt-in (already in `PLAN.md`), one-click unsubscribe in every
email, a physical address in the footer (CAN-SPAM), and never email anyone who hasn't confirmed.

---

## 7. Health-content exposure

The disclaimer is necessary and **not sufficient** — it reduces exposure, it doesn't eliminate it.

What actually lowers risk, in order:

1. **Never recommending treatment.** This is `EDITORIAL.md`'s entire purpose and the single biggest
   protection. A site that says "here's when to see someone" is in a categorically different position
   from one that says "take this."
2. **Always directing toward care**, never away.
3. **Citing real sources**, so claims are traceable rather than asserted.
4. **Human review before publish**, and only claiming review that happened.
5. **A correction process that works fast** — `OPERATIONS.md` §4.

Worth an actual lawyer's review before monetizing: the disclaimer wording, the ToS liability
limitation, and whether your jurisdiction imposes anything specific on health publishing.

---

## 8. AI disclosure

Currently (2026-09-27): no per-article AI label — the owner removed it. The disclosure is site-wide,
on the Medical Disclaimer page ("AI-assisted content"). Revisit before the EU AI Act's Article 50
transparency duties apply (August 2026 onward for new systems); keeping human review real and named
is what keeps the site on the right side of them.

Regulation here is moving — the EU AI Act's transparency provisions phase in over the next few years,
and platform policies change faster than law does. The safe position is the one already chosen: say
plainly that AI drafted it and a human reviewed it, and never overstate the review. Nothing you'd
need to walk back.

---

## 9. Order of work

**Before launch:** privacy policy · medical disclaimer · terms · contact · cookieless analytics ·
double opt-in newsletter · DPAs filed

**Before monetizing:** affiliate disclosure · CMP · entity + tax · updated privacy policy naming
Google · lawyer review

**Ongoing:** privacy policy updated whenever a new processor is added · annual review
