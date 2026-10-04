# Tondo map sources and methods

Obtained 2026-10-04. No patient data or barangay dengue counts are supplied.

- Boundaries: **unsimplified** HDX COD-AB Philippines v03, NAMRIA via OCHA Philippines; valid-on 2025-02-13. https://data.humdata.org/dataset/cod-ab-phl. CC BY 3.0 IGO; credit NAMRIA and OCHA/HDX. Source archive SHA-256: 032db5d91fcb8a13aef378d6b4453da7225ef7f0fb9c0a1c3bf3c2205d0010d6. Committed full-resolution Tondo extract and City of Manila reference are local; no runtime download.
- PSGC crosswalk only: bendlikeabamboo/barangay-boundaries-repository (MIT, license retained in data/geo/LICENSE-boundaries.txt). Join original NAMRIA ADM4 PCODE plus exact barangay name; no numeric-code guessing. Its 0.005-degree geometry is retired: 256/258 polygons were triangles and exceeded 5% area error.
- Population: PSA NCR Provincial Statistical Office I, 2020 CPH Manila_0.pdf, https://rssoncr.psa.gov.ph/sites/default/files/Manila_0.pdf, pages 2–3. Public parsed table extracted by barangay number; known values committed in data/geo/psa-2020-tondo.json. Usage terms not stated; attribution retained.

The requested range 1–267 has 258 polygons and 258 extracted population entries.
Absent in both extracts: 21, 22, 23, 24, 27, 40, 113, 114, 115. Their population,
PSGC and geometry stay unavailable; no values or shapes are invented. The known
population sum is 653,007 versus the publication’s Tondo total of 654,220: 1,213
are recorded in PSA’s separate Barangay 202-A entry, which reconciles the total.
That entry’s repository PSGC duplicates Barangay 202 and stays quarantined; it is
not merged into 202 or assigned to a missing number. The nine absent numbers are
not proof of current administrative units or zero population. Review original
PSA tables and current PSGC before expanding coverage. The build pins the exact
known-row count and discrepancy and fails if these change; it does not assert a
267-row population reconciliation.

PSGC values come from the boundary repository crosswalk; geometry comes from unsimplified HDX/NAMRIA. Check City of Manila geography,
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

## Geometry repair and build gates

Select City of Manila and configured Tondo numbers from full-resolution boundaries
before building topology (the selected polygons themselves define the Tondo clip).
Exterior rings are clockwise for d3 spherical rendering; holes counterclockwise.
One shared-arc Visvalingam threshold is relative to the smallest original ring,
with 1e6 topology quantization. Halve the threshold until every simplified polygon
has four distinct vertices, positive area, no self-intersections or invalid holes,
and no more than 5% area change against its original equal-area measurement.
Check all coordinates against the City of Manila boundary-derived bounding box.
Invalid input is quarantined, retains any known population, and has no drawn path;
coverage lists its reason. Invalid simplification fails before writing output.

Full-resolution vertices: 9,996; simplified: 5,738 (old input: 1,036).
Worst simplified area change: 3.612%; no geometry quarantined in this source.
Per-polygon vertex/area comparisons are in metadata.geometryQa.polygons.
Barangays 20, 105 and 128 exceed ten times median polygon area and remain explicitly
listed for review in the coverage drawer. This flags size, not incorrectness or risk.
Projected polygon fill and browser bounding-box shares must stay below 35% of the
900×680 map canvas at reset zoom. Browser QA also checks 258 drawn paths and saves
.artifacts/tondo-geometry-{320,390,768,1280}.png.

PSA table independently confirms Barangay 20 has Tondo's largest recorded
population, 45,772 (Manila_0.pdf pages 1–2). The population legend stays 56–45,772.
Geometry areas include the source's coastline/administrative extent; they are not
surveyed residential land area. Crowding is therefore contextual, not disease risk.

Phase 2 remains paused until the owner approves the repaired map visually.
