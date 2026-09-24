#!/usr/bin/env python3
"""Join UCAS 2025 end-of-cycle offer rates (provider x CAH1 broad subject area)
onto the CareerDNA university_rankings.json.

- Offer rate is the UCAS 'main scheme offer rate' = offers / applications for the
  broad subject area (CAH1). It is NOT course level; every ranking subject that
  rolls up to the same CAH1 area at a provider gets the same rate.
- Providers with no UCAS match (Open University, conservatoires, distance/private
  providers not in the UCAS main scheme) get offerRate = null.
"""
import csv, json, re, sys, os

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)
UCAS = sys.argv[1] if len(sys.argv) > 1 else "/tmp/ux/UCAS end of cycle 2025 - Provider summary subject group (HECoS) - main scheme applications offers acceptances.csv"
RANK = os.path.join(BACKEND, "data/cdna/university_rankings.json")
OUT_LOOKUP = os.path.join(BACKEND, "data/rankings-source/ucas_offer_rates_2025.json")
YEAR = "2025"

def norm(s):
    s = s.lower()
    s = re.sub(r'^[a-z]\d+\s+', '', s)               # strip UCAS code prefix "d86 "
    s = s.replace('&', ' and ')
    s = re.sub(r'[^a-z0-9 ]', ' ', s)
    s = re.sub(r'\b(the|of|university|college)\b', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

# our institution string -> UCAS raw provider name (for the few that don't auto-match)
ALIAS = {
    "Imperial College of Science, Technology and Medicine": "Imperial College London",
    "The London School of Economics and Political Science": "London School of Economics and Political Science, University of London",
    "King's College London": "King's College London, University of London",
    "University of Northumbria at Newcastle": "Northumbria University, Newcastle",
    "Royal Holloway and Bedford New College": "Royal Holloway, University of London",
    "Regent's University London Limited": "Regent's University London",
    "Richmond, the American international University in London, inc": "Richmond American University London",
    "Arden University Limited": "Arden University",
    "University of Kent (Part of London and South East University Group)": "University of Kent",
    "School of Oriental and African Studies": "SOAS University of London",
    "University College London": "UCL (University College London)",
}

# ---- UCAS: norm(provider) -> cah1 -> {rate, apps, offers} ; + cah1 code->name ----
ucas = {}
cah1_name = {}
with open(UCAS, newline='', encoding='utf-8-sig') as fh:
    for row in csv.DictReader(fh):
        if row['Year'] != YEAR:
            continue
        m = re.match(r'\((CAH\d+)\)\s*(.*)', row['Subject group HECoS CAH1'])
        if not m:
            continue
        cah1, name = m.group(1), m.group(2).strip()
        cah1_name[cah1] = name
        apps = (row['Main scheme applications'] or '').strip()
        offs = (row['Main scheme offers'] or '').strip()
        apps = int(apps) if apps.isdigit() else 0
        offs = int(offs) if offs.isdigit() else 0
        rr = (row['Main scheme offer rate'] or '').strip()
        try:
            rate = float(rr)
        except ValueError:
            rate = (offs / apps) if apps >= 30 else None   # suppress tiny bases
        ucas.setdefault(norm(row['Provider name']), {})[cah1] = {
            'rate': round(rate, 3) if rate is not None else None,
            'apps': apps, 'offers': offs,
        }

d = json.load(open(RANK, encoding='utf-8'))

# ukprn -> UCAS bucket
ukprn_to_ucas = {}
seen = {}
for e in d.values():
    for u in e['universities']:
        seen[u['ukprn']] = u['institution']
for ukprn, inst in seen.items():
    key = norm(inst)
    # explicit alias wins over the normalised key, because some official names
    # collapse to a generic token (e.g. "University College London" -> "london")
    # that would otherwise latch onto the federal "University of London" entity.
    if inst in ALIAS:
        bucket = ucas.get(norm(ALIAS[inst]))
    else:
        bucket = ucas.get(key)
    if bucket is None:
        # single fuzzy token-subset candidate
        toks = set(key.split())
        # generic single tokens that must never drive a fuzzy match (they collide
        # with federal / grouping entities). Distinctive single tokens (aston,
        # birkbeck, ...) are still fine.
        GENERIC = {'london'}
        cands = [un for un in ucas if toks and not (toks <= GENERIC)
                 and (toks <= set(un.split()) or set(un.split()) <= toks)]
        if len(cands) == 1:
            bucket = ucas[cands[0]]
    if bucket is not None:
        ukprn_to_ucas[ukprn] = bucket

# ---- bake onto the dataset ----
subj_with_area = 0
cells_total = 0
cells_filled = 0
for e in d.values():
    cah1 = (e.get('cahCode') or '').split('-')[0]      # CAH11-01-01 -> CAH11
    area = cah1_name.get(cah1)
    if area:
        e['offerAreaCah1'] = cah1
        e['offerAreaName'] = area
        e['offerRateYear'] = int(YEAR)
        subj_with_area += 1
    for u in e['universities']:
        cells_total += 1
        rate = None
        b = ukprn_to_ucas.get(u['ukprn'])
        if b and cah1 in b:
            rate = b[cah1]['rate']
        u['offerRate'] = rate
        if rate is not None:
            cells_filled += 1

json.dump(d, open(RANK, 'w', encoding='utf-8'), ensure_ascii=False)
os.makedirs(os.path.dirname(OUT_LOOKUP), exist_ok=True)
json.dump({'year': int(YEAR), 'cah1_names': cah1_name,
           'by_ukprn': ukprn_to_ucas}, open(OUT_LOOKUP, 'w', encoding='utf-8'), ensure_ascii=False)

print(f"providers matched to UCAS: {len(ukprn_to_ucas)}/{len(seen)}")
print(f"subject entries given a broad area: {subj_with_area}/{len(d)}")
print(f"university cells with an offer rate: {cells_filled}/{cells_total} ({100*cells_filled//cells_total}%)")
