# Tondo map sources and methods

Obtained 2026-10-04. No patient data or barangay dengue counts are supplied.

- Boundaries: NAMRIA/PSA 2023-10-24 snapshot, from bendlikeabamboo/barangay-boundaries-repository, hierarchical_t0p005/barangays.geojson. Repository MIT license copied to data/geo/LICENSE-boundaries.txt. Retain NAMRIA/PSA attribution; repository license does not independently establish every upstream permission. Full downloaded GeoJSON SHA-256: 10606e46cd7b4b34a61f4975f3568bb3c11a48fa355cbe3c4d78c3737e0fcfa9.
- Population: PSA NCR Provincial Statistical Office I, 2020 CPH Manila_0.pdf, https://rssoncr.psa.gov.ph/sites/default/files/Manila_0.pdf, pages 2–3. Public parsed table extracted by barangay number; known values committed in data/geo/psa-2020-tondo.json. Usage terms not stated; attribution retained.

The requested range 1–267 has 258 polygons and 258 extracted population entries.
Absent in both extracts: 21, 22, 23, 24, 27, 40, 113, 114, 115. Their population,
PSGC and geometry stay unavailable; no values or shapes are invented. The known
population sum is 653,007 versus the publication’s Tondo total of 654,220: 1,213
remain unallocated. This is a source/extraction discrepancy, not proof that these
numbers are current administrative units or have zero population. Review original
PSA tables and current PSGC before expanding coverage. The build pins the exact
known-row count and discrepancy and fails if these change; it does not assert a
267-row population reconciliation.

PSGC values come from the boundary repository. Check City of Manila geography,
exact source barangay names, ten-digit prefix and uniqueness; preserve codes rather
than computing them from numbers (codes after 202 do not follow a fixed offset).
Upstream fuzzy match status is preserved in the committed extract. This validates
the repository join, not historical boundary equivalence or independent PSA code
certification. City reference 1380600000, Barangay 1 1380601001.

Run npm run geo:build (or npm run geo:build -- --area tondo). config/areas.json
records requested ranges and districts. Committed output: public/geo/tondo.json
(preprojected paths, centroid, area, population and density) plus .topojson. No
runtime basemap or remote download. Local Lambert azimuthal equal-area projection,
sphere radius 6371.0088 km, measures polygon areas; density is census population /
polygon km². Density is crowding, not disease risk. Source epochs differ.

Areas show exact source polygon values. Heat uses centroid kernels of equal radius,
opacity weighted by value / displayed maximum, SVG Gaussian blur, clipped to the
available polygon union. Overlapping intensity is a visual smoothing, not a count
at a location, spatial disease forecast, or substitute for Areas/Table values.
Missing values are excluded. Zero has zero kernel weight; it is never manufactured.
Dengue cases stays locked through a separate data hook until Phase 4 reviews an
aggregated source, rolling counts, reported flags and unstable small-number gates.
No city-level count is assigned to a barangay. No Phase 4 ingestion is enabled.

Ramp: navy-800 → cobalt-500 → cyan → gold-400. Exact brand cyan creates a luminance
reversal before gold in the protanopia simulation. Only the map’s cyan stop is
dimmed 10% in linear light, with its red component lifted enough to avoid negative
red in the tritanopia transform. This keeps the cyan hue while avoiding a small
brightness dip between the anchors. The legend uses the same linear-light
interpolation as polygon fills. All four stops and 301 interpolated samples increase in normal/protanopia/
deuteranopia/tritanopia simulations (Machado et al. severity-one matrices). This
simulation is a check, not a guarantee for every viewer/display; labels, hatching,
exact values and the accessible table remain essential. Brand tokens are unchanged.

Simulation reference: Machado, Oliveira and Fernandes (2009), DOI 10.1109/TVCG.2009.113, https://pubmed.ncbi.nlm.nih.gov/19834201/.
