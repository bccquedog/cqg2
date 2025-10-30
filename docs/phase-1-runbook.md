# 🏁 Phase 1 Wrap-Up Runbook  
*Simulating a Full Tournament Flow with Profiles, Payments, and Overlay*  

---

## 1. Prep
- [ ] Start **Firebase emulator** (`firebase emulators:start`).  
- [ ] Confirm `/dev-test` cockpit loads.  
- [ ] Reset & Reseed tournaments.  

---

## 2. Player Profiles
- [ ] Login with test account.  
- [ ] Go to `/profile` → create profile (username + avatar).  
- [ ] Confirm profile appears in Firestore + logs.  
- [ ] Seed bracket → ensure usernames + avatars show.  

---

## 3. Payments (Stripe Test Mode)
- [ ] Go to `/payments`.  
- [ ] Click “Pay Tournament Buy-In ($5)”.  
- [ ] Use test card `4242 4242 4242 4242`.  
- [ ] Confirm success → Firestore records `payments/{id}`.  
- [ ] Repeat with “Subscribe (Test Plan $10/mo)” → confirm subscription entry.  

---

## 4. Tournament Flow
- [ ] Open **Live Tournament**.  
- [ ] Matches auto-progress → logs confirm round advance.  
- [ ] Use **Quick Submission Panel** for manual winners.  
- [ ] Shuffle players once mid-test to confirm reseed works.  
- [ ] Force state change to Completed → champion crowned.  

---

## 5. Overlay
- [ ] In `/dev-test`, toggle **Show Overlay**.  
- [ ] Set match status to `live`.  
- [ ] Overlay appears → Player A vs Player B + round info.  
- [ ] Glow effect triggers for 3s, then fades.  
- [ ] Toggle overlay off → confirm it disappears.  

---

## 6. QA Wrap
- [ ] Export logs from `/dev-test`.  
- [ ] Save logs file with timestamp (`cqg-test-logs-YYYYMMDD.txt`).  
- [ ] Run through **QA Protocol** (deep) or **Lite Checklist** (quick).  
- [ ] Confirm snapshots save + restore correctly.  

---

✅ Completing this run ensures all **Phase 1 systems** are stable and integrated:
- Profiles  
- Payments  
- Tournaments  
- Overlay  
- Cockpit + Logs  




