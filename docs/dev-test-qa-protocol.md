# 🏆 CQG Dev-Test QA Protocol  
*End-to-End Checklist for Tournament Flow Stability*

---

## 1. Core Tournament Flow
- [ ] Run **Reset & Reseed** → confirm 3 tournaments appear (Upcoming, Live, Completed).  
- [ ] Confirm Live tournament auto-progresses rounds.  
- [ ] Completed tournament shows champion crowned correctly.  
- [ ] Logs show all major actions (seed, round advance, champion).  

---

## 2. Batch 1 Tools  

### Bracket Visualizer Debug
- [ ] Force complete a Round 1 match → Firestore + log update.  
- [ ] Complete entire bracket manually → champion crowned.  
- [ ] Logs show every forced action.  

### Player Randomizer
- [ ] Shuffle seeds → bracket reseeds without duplicates.  
- [ ] Logs confirm shuffle.  

### Force State Switcher
- [ ] Switch Draft → Live → Completed.  
- [ ] UI + Firestore update instantly.  
- [ ] Logs + toast confirm changes.  

---

## 3. Batch 2 Tools  

### Event Trigger Simulator
- [ ] Fire Pregame Countdown → toast + log.  
- [ ] Trigger WatchZone Hook → log only.  
- [ ] Fire Stream Overlay Event → placeholder overlay + log.  

### Error Injector
- [ ] Inject Error → red banner shows.  
- [ ] Log entry confirms.  
- [ ] Reset still works after injection.  

### Latency Simulator
- [ ] Toggle on → confirm 2–3s lag in Firestore writes.  
- [ ] Logs show latency enabled.  
- [ ] Toggle off → instant again, logs confirm.  

---

## 4. Batch 3 Tools  

### Quick Submission Panel
- [ ] Pick match + winner → submit → Firestore + log update.  
- [ ] Toast confirms winner.  
- [ ] Multiple submissions → no duplicates.  

### Real-Time Firestore Inspector
- [ ] Expand inspector → raw JSON loads.  
- [ ] Submit match → JSON updates live.  
- [ ] Expand/collapse nested objects works.  
- [ ] Logs append each change.  

### Test Data Snapshots
- [ ] Save Snapshot → log confirms.  
- [ ] Reset → tournaments cleared.  
- [ ] Load Snapshot → state restores correctly.  
- [ ] Clear Snapshot → removes localStorage, log confirms.  
- [ ] Load after clearing → error/log shows no snapshot.  

---

## 5. Log Controls
- [ ] Pause Logs → no auto-scroll, new logs queue.  
- [ ] Resume Logs → jumps to newest entry.  
- [ ] Clear Logs → panel resets.  
- [ ] Export Logs → `.txt` downloads with correct content.  

---

✅ Running through this full checklist ensures the **entire tournament cockpit** is stable, reproducible, and ready for real players.  
📌 Keep this doc updated whenever new dev-test tools are added or modified.




