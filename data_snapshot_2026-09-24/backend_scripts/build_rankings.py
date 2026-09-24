#!/usr/bin/env python3
"""
CareerDNA Rankings generator.

Reads the Discover Uni (Office for Students / HESA) dataset + NSS + TARIFF + TEF,
and the CareerDNA subject -> CAH mapping, and produces a per-subject ranked list
of universities using the CareerDNA score:

    score = 0.50*outcomes + 0.25*satisfaction + 0.15*entry + 0.10*continuation
    outcomes = 0.45*salary(norm) + 0.30*employment + 0.25*meaningful-work

Rankings are computed at institution x subject level (courses aggregated to the
institution). All source figures are official public data, so the resulting
ranking is CareerDNA's own and free to publish.

Usage: python build_rankings.py <discoveruni_dir> <extras_dir> <mapping.json> <out.json>
"""
import csv, sys, json, statistics, collections, re

def rows(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            yield r

def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None

def tariff_to_grades(pts):
    # UCAS *total* tariff sums every qualification (A-levels + EPQ + AS + more),
    # so totals run ~30-40 points above a pure 3-A-level score. These thresholds
    # are calibrated so a typical AAA cohort (~168-184 total) reads as "AAA".
    if pts is None:
        return None
    t = [(208,"A*A*A*"),(192,"A*A*A"),(184,"A*AA"),(168,"AAA"),(152,"AAB"),
         (136,"ABB"),(120,"BBB"),(104,"BBC"),(88,"BCC"),(0,"CCC or below")]
    for lo,g in t:
        if pts >= lo:
            return g
    return "CCC or below"

MIN_COHORT = 10      # matches Discover Uni's own publication threshold (10); a
                     # stricter floor silently dropped small, selective programmes
                     # (e.g. LSE/Durham/Warwick finance, cohort 10) and biased the
                     # tables toward large-intake mid-tier providers
MIN_BREADTH = 10     # a provider must offer >=10 subjects to count as a ranked "university"
                     # (real universities offer dozens; noise providers offer 1-2)

def main():
    DU, EX, MAP, OUT = sys.argv[1:5]

    # institution names + TEF
    # Prefer the LEGAL_NAME for display. The FIRST_TRADING_NAME field is
    # sometimes a partnership/consortium alias rather than the institution's own
    # name (e.g. Goldsmiths' College is published with trading name "South East
    # London Teaching Partnership"), which is misleading in a ranking. Fall back
    # to trading name only when legal is blank. Strip trailing punctuation.
    inst = {}
    for r in rows(f"{DU}/INSTITUTION.csv"):
        name = (r.get("LEGAL_NAME") or r.get("FIRST_TRADING_NAME") or "").strip()
        name = name.rstrip(". ").strip()
        inst[r["PUBUKPRN"]] = name
    tef = {}
    for r in rows(f"{EX}/TEFOutcome (1).csv"):
        tef[r["PUBUKPRN"]] = r.get("OVERALL_RATING") or None

    # --- Join every metric by COURSE (PUBUKPRN + KISCOURSEID), not by each
    # file's own subject-code column. Discover Uni tags each metric row with the
    # subject grouping used to publish THAT metric, and those tags differ across
    # files for the same course (and are often blank for single-subject courses:
    # ~28% of employment rows carry no subject code at all). Joining each file
    # independently on its subject tag therefore silently drops real figures
    # (e.g. LSE finance: 95% employed, but blank EMPSBJ -> dropped -> shown as
    # "-"). Instead we key course-level metrics by course id and attach them via
    # the salary rows, which define each course's subject(s). ---
    def by_course(path, sbj_field, val_field, transform=None):
        d = collections.defaultdict(list)
        for r in rows(path):
            v = num(r.get(val_field))
            if v is None:
                continue
            d[(r["PUBUKPRN"], r["KISCOURSEID"])].append(transform(v) if transform else v)
        return d

    emp_c  = by_course(f"{DU}/EMPLOYMENT.csv", "EMPSBJ", "WORKSTUDY")
    mean_c = by_course(f"{DU}/GOVOICEWORK.csv", "GOWORKSBJ", "GOWORKONTRACK")
    cont_c = by_course(f"{DU}/CONTINUATION.csv", "CONTSBJ", "UCONT")

    # NSS satisfaction: mean of the (up to 7) theme scores per course row
    sat_c = collections.defaultdict(list)
    for r in rows(f"{EX}/NSS (1).csv"):
        themes = [num(r.get(f"T{i}")) for i in range(1, 8)]
        themes = [t for t in themes if t is not None]
        if themes:
            sat_c[(r["PUBUKPRN"], r["KISCOURSEID"])].append(statistics.mean(themes))

    # Entry: weighted-midpoint average UCAS tariff from the band distribution
    tarpts = {"T001":16,"T048":48,"T064":64,"T080":80,"T096":96,"T112":112,"T128":128,
              "T144":144,"T160":160,"T176":176,"T192":192,"T208":208,"T224":224,"T240":248}
    tar_c = collections.defaultdict(list)
    for r in rows(f"{EX}/TARIFF (1).csv"):
        tot = sum(num(r.get(b)) or 0 for b in tarpts)
        if tot > 0:
            avg = sum((num(r.get(b)) or 0) * p for b, p in tarpts.items()) / tot
            tar_c[(r["PUBUKPRN"], r["KISCOURSEID"])].append(avg)

    def course_val(store, key):
        vals = store.get(key)
        return statistics.mean(vals) if vals else None

    # A course counts toward a subject if ANY official metric tags it with that
    # subject code (union across all files), NOT only its salary row. Graduate
    # salary is suppressed for many regulated professions (dentistry, nursing,
    # medicine, teaching...) even though their employment, entry, satisfaction and
    # continuation are fully published. Gating subject membership on salary alone
    # made those subjects rank far too few universities (e.g. dentistry: 2 of 11).
    # Public league tables (Guardian, CUG) don't require salary either.
    course_subjects = collections.defaultdict(set)
    def add_subjects(path, sbj_field):
        for r in rows(path):
            s = r.get(sbj_field)
            if s:
                course_subjects[(r["PUBUKPRN"], r["KISCOURSEID"])].add(s)
    add_subjects(f"{DU}/GOSALARY.csv", "GOSALSBJ")
    add_subjects(f"{DU}/EMPLOYMENT.csv", "EMPSBJ")
    add_subjects(f"{DU}/GOVOICEWORK.csv", "GOWORKSBJ")
    add_subjects(f"{DU}/CONTINUATION.csv", "CONTSBJ")
    add_subjects(f"{EX}/NSS (1).csv", "NSSSBJ")
    add_subjects(f"{EX}/TARIFF (1).csv", "TARSBJ")

    # Salary per COURSE (median across the course's GOSALARY rows regardless of
    # which CAH level each row is tagged at), plus the max survey population. This
    # is treated course-level like every other metric. CRITICAL: universities
    # publish a course's salary at whatever CAH granularity the OfS chose — often
    # the broad parent (e.g. CAH11-01) rather than the exact subject code
    # (CAH11-01-01). Keying salary to the exact code silently dropped it (e.g.
    # Edinburgh's computing salary is tagged CAH11-01, so it vanished from the
    # Computer Science / CAH11-01-01 ranking). Course-level keying keeps it.
    sal_c = collections.defaultdict(list)
    salpop_c = collections.defaultdict(float)
    for r in rows(f"{DU}/GOSALARY.csv"):
        v = num(r.get("GOINSTMED"))
        if v is None:
            continue
        key = (r["PUBUKPRN"], r["KISCOURSEID"])
        sal_c[key].append(v)
        salpop_c[key] = max(salpop_c[key], num(r.get("GOSALPOP")) or 0)

    # only rank recognised UK degree-awarding universities (curated allowlist);
    # this deterministically excludes FE colleges, private providers and data
    # artefacts (e.g. a provider whose UKPRN carries franchised business data).
    import os
    allow_path = os.path.join(os.path.dirname(OUT), "uk_universities_allowlist.json")
    allow = set(json.load(open(allow_path))["pubukprns"])

    # Precompute each COURSE's metrics once (course-level), with its subject tags.
    course_metrics = {}
    for (pub, cid), subjects in course_subjects.items():
        course = (pub, cid)
        course_metrics[course] = {
            "pub": pub,
            "subjects": subjects,
            "sal": statistics.median(sal_c[course]) if sal_c.get(course) else None,
            "pop": salpop_c.get(course, 0),
            "emp": course_val(emp_c, course),
            "mean": course_val(mean_c, course),
            "cont": course_val(cont_c, course),
            "sat": course_val(sat_c, course),
            "tar": course_val(tar_c, course),
        }

    def records_for_code(code):
        # Pool every member course of each institution EXACTLY ONCE (a course is a
        # member if any of its official subject tags falls under `code`). This is
        # the institution's true aggregate for the area: no per-sub-code splitting
        # or "best salary" de-dup, so salary and every other metric are internally
        # consistent and reproduce an independent re-derivation from the raw files.
        is_cah2 = code.count("-") == 1
        byinst = collections.defaultdict(lambda: {"sal": [], "pop": 0, "emp": [], "mean": [], "cont": [], "sat": [], "tar": []})
        for cm in course_metrics.values():
            pub = cm["pub"]
            if pub not in allow:
                continue
            member = any(s.startswith(code) for s in cm["subjects"]) if is_cah2 else (code in cm["subjects"])
            if not member:
                continue
            a = byinst[pub]
            if cm["sal"] is not None:
                a["sal"].append(cm["sal"]); a["pop"] = max(a["pop"], cm["pop"])
            for k in ("emp", "mean", "cont", "sat", "tar"):
                if cm[k] is not None:
                    a[k].append(cm[k])
        recs = []
        for pub, a in byinst.items():
            # Salary only counts if its survey cohort clears the floor; otherwise it
            # is dropped (too noisy) but the institution is still ranked on its other
            # official metrics. Include if it has a salary, employment or entry signal.
            salary = statistics.median(a["sal"]) if (a["sal"] and a["pop"] >= MIN_COHORT) else None
            if salary is None and not a["emp"] and not a["tar"]:
                continue
            recs.append({
                "ukprn": pub,
                "institution": inst.get(pub, pub),
                "salary": salary,
                "employment": statistics.mean(a["emp"]) if a["emp"] else None,
                "meaningful": statistics.mean(a["mean"]) if a["mean"] else None,
                "continuation": statistics.mean(a["cont"]) if a["cont"] else None,
                "satisfaction": statistics.mean(a["sat"]) if a["sat"] else None,
                "tariff": statistics.mean(a["tar"]) if a["tar"] else None,
                "tef": tef.get(pub),
            })
        return recs

    def norm(v, lo, hi):
        if v is None or hi == lo:
            return 0
        return max(0, min(100, (v - lo) / (hi - lo) * 100))

    def rank(records):
        # An institution is rankable if it has a graduate-outcome signal
        # (salary or employment). Satisfaction/entry alone are not enough.
        recs = [r for r in records if r["salary"] is not None or r["employment"] is not None]
        if len(recs) < 3:
            return []
        sals = [r["salary"] for r in recs if r["salary"] is not None]
        tars = [r["tariff"] for r in recs if r["tariff"] is not None]
        slo, shi = (min(sals), max(sals)) if sals else (0, 1)
        tlo, thi = (min(tars), max(tars)) if tars else (0, 1)

        # Flattened component weights (sum 1.0) == the approved 50/25/15/10 split:
        # graduate outcomes 50% (salary .225, employment .15, meaningful .125),
        # satisfaction .25, entry .15, continuation .10. Every value is on a 0-100
        # scale. A component with NO data anywhere in the subject (e.g. salary for
        # dentistry) is dropped and its weight renormalised across the rest, so the
        # ranking degrades gracefully instead of vanishing. A component missing for
        # ONE institution is filled with the subject's field mean (neutral).
        comps = [
            ("salary",       0.225, lambda r: norm(r["salary"], slo, shi) if r["salary"] is not None else None),
            ("employment",   0.150, lambda r: r["employment"]),
            ("meaningful",   0.125, lambda r: r["meaningful"]),
            ("satisfaction", 0.250, lambda r: r["satisfaction"]),
            ("entry",        0.150, lambda r: norm(r["tariff"], tlo, thi) if r["tariff"] is not None else None),
            ("continuation", 0.100, lambda r: r["continuation"]),
        ]
        fmean = {}
        active = []
        for name, w, fn in comps:
            present = [fn(r) for r in recs if fn(r) is not None]
            if present:
                fmean[name] = statistics.mean(present)
                active.append((name, w, fn))
        wsum = sum(w for _, w, _ in active) or 1.0

        out = []
        for r in recs:
            s = 0.0
            for name, w, fn in active:
                v = fn(r)
                if v is None:
                    v = fmean[name]
                s += w * v
            out.append({
                "institution": r["institution"],
                "ukprn": r["ukprn"],
                "score": round(s / wsum, 1),
                # displayed figures stay honest: show the real value, or '–' when
                # genuinely unpublished. Only the SCORE uses the field-mean fill.
                "medianSalary": round(r["salary"]) if r["salary"] is not None else None,
                "employment": round(r["employment"]) if r["employment"] is not None else None,
                "meaningfulWork": round(r["meaningful"]) if r["meaningful"] is not None else None,
                "satisfaction": round(r["satisfaction"]) if r["satisfaction"] is not None else None,
                "continuation": round(r["continuation"]) if r["continuation"] is not None else None,
                "tariffPoints": round(r["tariff"]) if r["tariff"] is not None else None,
                "typicalGrades": tariff_to_grades(r["tariff"]),
                "tef": r["tef"],
            })
        out.sort(key=lambda z: -z["score"])
        for i, o in enumerate(out, 1):
            o["rank"] = i
        return out

    # Title filters + course catalogue. For niche CareerDNA categories that borrow
    # a broader subject area (e.g. Fintech -> Finance, Cyber Security -> Computer
    # Science), we score on the broad area (reliable data) but only SHOW the
    # universities that actually offer a degree whose title matches the category's
    # keywords. We also attach the matching course titles + links to each uni.
    course_dir = os.path.dirname(OUT)
    try:
        COURSES = json.load(open(os.path.join(course_dir, "courses_by_uni.json")))
    except (OSError, ValueError):
        COURSES = {}
    try:
        FILTERS = json.load(open(os.path.join(course_dir, "title_filters.json")))
    except (OSError, ValueError):
        FILTERS = {}

    def matching_courses(ukprn, kws):
        out = []
        for t, u in COURSES.get(ukprn, []):
            tl = t.lower()
            if any(k in tl for k in kws):
                out.append({"title": t, "url": u})
        return out

    def subject_name_keywords(m):
        # For UNFILTERED subjects, derive keywords from the subject/area name so
        # each university's matching-named degrees still populate the fold-down
        # course menu (without restricting the list).
        phrases = set()
        t = re.sub(r"\(.*?\)", "", m.get("title", "")).strip().lower()
        if len(t) >= 3:
            phrases.add(t)
        for p in re.split(r",| and | with ", t):
            p = p.strip()
            if len(p) >= 4:
                phrases.add(p)
        cn = re.sub(r"\(.*?\)", "", m.get("cahName", "")).strip().lower()
        for p in re.split(r",| and ", cn):
            p = p.strip()
            if len(p) >= 4:
                phrases.add(p)
        return list(phrases)

    # for each CareerDNA subject, gather courses at its CAH code (exact for CAH3,
    # prefix for CAH2) and rank institutions
    mapping = json.load(open(MAP))
    dataset = {}
    covered = 0
    for m in mapping:
        code = m["cahCode"]
        ranked = rank(records_for_code(code))

        # title filter: keep only universities that offer a matching-titled degree,
        # attach those degrees, and renumber ranks 1..k (scores are absolute, so
        # they are unchanged — only the position integer is recomputed).
        kws = FILTERS.get(m["id"])
        filtered = False
        if kws:
            kept = []
            for u in ranked:
                mc = matching_courses(u["ukprn"], kws)
                if mc:
                    u["courses"] = mc[:12]
                    kept.append(u)
            for i, u in enumerate(kept, 1):
                u["rank"] = i
            ranked = kept
            filtered = True
        else:
            # Unfiltered subject: keep the whole area list, but still attach each
            # university's matching-named degrees so the course fold-down works
            # everywhere (some universities may have none — that's fine).
            name_kws = subject_name_keywords(m)
            for u in ranked:
                mc = matching_courses(u["ukprn"], name_kws)
                if mc:
                    u["courses"] = mc[:12]

        # Skip subjects with no rankable universities (e.g. Forestry, Heritage):
        # the frontend hides the rankings panel for any subject not in this file,
        # so omitting them keeps a rebuild consistent with what the UI shows.
        if not ranked:
            continue
        dataset[m["id"]] = {
            "subject": m["title"],
            "cahCode": code,
            "cahName": m["cahName"],
            "rankedBy": m["cahName"],  # for the honest "ranked using X outcomes" label
            "titleFiltered": filtered,  # True = list restricted to unis offering this named degree
            "count": len(ranked),
            "universities": ranked[:200],  # effectively the full ranking; count matches
        }
        covered += 1

    json.dump(dataset, open(OUT, "w"), indent=2)
    total_unis = sum(d["count"] for d in dataset.values())
    print(f"Subjects with a ranking: {covered}/{len(mapping)}")
    print(f"Total ranked institution-entries: {total_unis}")
    print(f"Written -> {OUT}")

if __name__ == "__main__":
    main()
