# 🎮 CQG Tournament – QA Checklist (Lite)

This is the simplified checklist for anyone helping test CQG tournament flow.  
No dev knowledge needed — just follow steps and confirm what you see.  

---

## 1. Reset & Setup
- [ ] Click **Reset & Reseed**.  
- [ ] Confirm 3 tournaments appear:
  - Upcoming
  - Live
  - Completed

---

## 2. Playing Through
- [ ] Open **Live Tournament** → confirm matches are visible.  
- [ ] Matches should **auto-progress** to the next round.  
- [ ] A **Champion** should be crowned at the end.  

---

## 3. Quick Actions
- [ ] Use **Quick Submission Panel**:
  - Pick a match.
  - Select a winner.
  - Submit → winner should appear immediately.

- [ ] Try **Shuffle Players** → bracket reseeds with different players.

- [ ] Use **Force State Switcher** → switch a tournament between Draft / Live / Completed.

---

## 4. Logs & Inspector
- [ ] Check **Live Logs** → every action (reset, shuffle, winner) should appear.  
- [ ] Try **Pause Logs** → scroll freely, then **Resume Logs**.  
- [ ] Try **Export Logs** → confirm a text file downloads.  
- [ ] Clear Logs → panel resets.

---

## 5. Fun Simulations
- [ ] Trigger **Pregame Countdown** → message should appear.  
- [ ] Trigger **WatchZone Hook** → log entry appears.  
- [ ] Trigger **Overlay Event** → placeholder animation/log appears.  
- [ ] Inject Error → red banner shows briefly.  
- [ ] Toggle Latency → actions feel slower, toggle again to disable.

---

## 6. Snapshots
- [ ] Save Snapshot → log confirms.  
- [ ] Reset → tournaments disappear.  
- [ ] Load Snapshot → previous state returns.  
- [ ] Clear Snapshot → removes saved data.

---

✅ That’s it! If something **doesn’t look right**, make a note and export your logs to share.  
This checklist ensures testing feels like playing, not debugging.


