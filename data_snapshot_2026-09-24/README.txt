CareerDNA data snapshot, 24 September 2026

These are copies of the data and content files the live app reads, taken from
the careerdna (frontend) and careerdna-backend repositories. The register of
what each file holds and where it is used is the "Data Sources" sheet in
CareerDNA_v4.xlsx (same folder).

backend_data/      JSON datasets read by the backend (model, routes, rankings, jobs)
backend_lib/       Content and logic modules: descriptions, definitions, prompts, scoring
backend_scripts/   build_rankings.py and enrich_offer_rates.py rebuild university_rankings.json
frontend_utils/    Survey questions, weight matrix and definitions used by the React app
rankings_source/   Raw Office for Students Discover Uni CSVs, HECoS/CAH lookup, UCAS files

The repositories remain the source of truth. This folder is a dated record.
