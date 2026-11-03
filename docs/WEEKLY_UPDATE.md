# Weekly update (every Monday)

1. Open the Manila PIO (or Mayor Isko Moreno) Facebook page and find the **Daily Reporting W.I.L.D. Diseases** post for Monday.
2. Note the **DENGUE → TOTAL CASES (Jan. 1 – date)** number. Take a screenshot as proof and copy the post link.
3. In the project folder, run (replace the three values):

   ```powershell
   npm run live:add-week -- --total 4480 --report 2026-11-02 --url https://www.facebook.com/<the post link>
   ```

   - `--report` must be the Monday date. If Monday was not posted, use the next day's total and add
     `--estimated --note "Tuesday total used; no Monday post"`.
   - The command refuses totals that go down, dates that are not Mondays, and links that are not Facebook posts.
4. Open `localhost:5173`. The chart gains a new bar, and **"How did our last forecast do?"** shows the
   forecast next to the number that was actually reported.
5. Model owner: refresh the Random Forest forecast and alert for the new week:

   ```powershell
   npm run count:evaluate
   npm run count:extras
   ```

   Until then the card shows a quick estimate and says the Random Forest forecast will update.

Never push this to `main` yourself; push your branch and let the model owner merge.
