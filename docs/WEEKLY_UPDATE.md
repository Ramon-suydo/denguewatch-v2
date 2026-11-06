# Weekly update (every Monday)

1. Open the Manila PIO (or Mayor Isko Moreno) Facebook page and find the **Daily Reporting W.I.L.D. Diseases** post for Monday.
2. Note the **DENGUE → TOTAL CASES (Jan. 1 – date)** number. Take a screenshot as proof and copy the post link.
3. In the project folder, run (replace the three values):

   ```powershell
   npm run live:add-week -- --total 4480 --report 2026-11-02 --url https://www.facebook.com/<the post link>
   ```

   - `--report` is the date of the post. If there was no Monday post, use the first post later that week
     (Tuesday to Sunday); it counts as reported and the note is added automatically, e.g. `--report 2026-11-03`.
   - Only if there was no post at all that week, use the Monday date and add `--estimated --note "why"`.
   - The command refuses totals that go down, posts outside that Monday-to-Sunday week, and links that are not Facebook posts.
4. Open `localhost:5173`. The chart gains a new bar, and **"How did our last forecast do?"** shows the
   forecast next to the number that was actually reported.
5. Model owner: refresh the Random Forest forecast and alert for the new week:

   ```powershell
   npm run count:evaluate
   npm run count:extras
   ```

   Until then the card shows a quick estimate and says the Random Forest forecast will update.

   The model reads the reviewed rows in `data/processed/manila_live_weekly.json`
   and checks their public copy in `public/live-manila/weekly.json`. The original
   2026 CSV is an acquisition archive; do not overwrite reviewed corrections by
   ingesting it again. Historical training and held-out evaluation remain separate.

   If recent historical weather is missing, first refresh the dated archive cache:

   ```powershell
   npm run count:weather -- --end 2026-10-30
   ```

   Replace the date with the latest date actually available from the archive,
   then rerun both model commands. Inspect `public/research/manila-extras.json`
   for `feature_importance.available`, and check forecast origin and weather
   completeness in `public/research/manila-expanded.json` before publishing.

Never push this to `main` yourself; push your branch and let the model owner merge.
