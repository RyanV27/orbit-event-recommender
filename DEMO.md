# Orbit demo: two sessions, same founder

The point of the demo: swipes in San Francisco change what Orbit recommends in New York, and the founder never repeats themselves. mem0 does that.

I ran this flow against the API before writing it. The NYC deck came back with David Kim (law-firm partner) and Elena Petrova (legal ops) near the top, and with the Legal AI Roundtable and the Founders & Funders Dinner. Names and order can vary slightly because Claude generates the deck.

## 0. Start everything

Terminal 1, backend:
```
cd backend
.venv\Scripts\activate
uvicorn main:app --port 8000
```
Terminal 2, frontend:
```
cd frontend
npm run dev
```
Check the backend: http://127.0.0.1:8000/api/health returns `{"ok":true}`. The app is at http://localhost:3000.

## 1. Reset to a clean slate

Each browser gets a user ID in `localStorage` under `orbit-user-id`. To restart the demo as a brand-new founder:

1. In the browser console on localhost:3000, run `localStorage.removeItem('orbit-user-id')` and reload.
2. To wipe an old ID's memory, run `curl -X DELETE "http://127.0.0.1:8000/api/memory?user_id=<id>"`. Read the id first with `localStorage.getItem('orbit-user-id')`.

Opening the page in an incognito window also gives a fresh founder.

## 2. Session 1: San Francisco

1. On the intake screen, click **Load demo founder**. It fills San Francisco, the law-firm brief and the goals Design partners + Customers.
2. Click **Launch orbit** and wait about 20-30 seconds for the scanning animation and recommendations.
3. **Check:** 6 cards appear, events show on the right, and the Memory panel on the left shows the profile (law-firm AI, pre-seed).
4. Swipe **right** (Connect, or the → key) on the law-firm partners, legal operators and anyone who looks like a customer or design partner.
5. Swipe **left** (Pass, or the ← key) on the generic ones: investors you don't want yet, designers, mentors, unrelated SaaS.
6. After one or two swipes, use the feedback strip under the deck to leave a note. Example: "Prefer small dinners over big mixers".
7. **Check:** the Memory panel's signal count goes up with each swipe. If you want to confirm the writes landed, wait ~10 seconds and open http://127.0.0.1:8000/api/memory?user_id=YOUR_ID. You should see facts like "User liked Marcus Reid, a Managing Partner...".
8. Finish the deck, or click **Refine with memory** to get a sharper SF set. The refined set should skip people you already swiped on and lean toward what you liked.

## 3. Session 2: New York, same founder

1. Click **New session** (or the home link in the header).
2. **Check (the "welcome back" moment):** the intake shows "Welcome back · session 02" and an "Orbit remembers" box with the startup and stage, so you aren't asked who you are again.
3. Pick **New York**. Leave the brief empty, or add something new such as "We just signed two pilots, now looking for seed investors".
4. Click **Launch orbit**.
5. **Check:** the NYC deck leans legal-AI. Look at the "signal" labels and "why" text on each card for references to your past swipes (law-firm partners, legal operators, small events). The events should favor small, legal-focused ones such as the Legal AI Roundtable and the Founders & Funders Dinner over the large SaaS happy hour.

## 4. Prove the memory is real

1. **Reload the page.** The "Welcome back" box and the Memory panel should come back, because they load from the backend, not from the page state.
2. Open http://127.0.0.1:8000/api/memory?user_id=YOUR_ID and show the stored profile, cities visited (San Francisco, New York) and the remembered facts.
3. Optional: open http://127.0.0.1:8000/docs for the live API.

## 5. Optional extras

- **Different city:** try London, Berlin or Austin. There's no seed data for these, so Orbit invents people. It still uses your memory.
- **Contrast run:** open an incognito window, load the demo founder, pick New York, and compare the deck with the one from session 2. The incognito deck has no swipe history, so the personalization is visible.
- **Explicit feedback:** after a swipe, send feedback like "Customers before fundraising" and refine. The deck should drop investors.

## If something goes wrong

| Symptom | Fix |
|---|---|
| Intake shows an error after launch | Backend isn't running or crashed. Check Terminal 1 and http://127.0.0.1:8000/api/health. |
| Launch takes over 60 seconds | The Claude call is slow. Wait, or click launch again. The proxy timeout is 120 seconds. |
| "Welcome back" never appears | The user ID changed (cleared `localStorage` or a different browser), or the backend was never reached during session 1. |
| Memory panel is empty at `/api/memory` right after swiping | mem0 extracts facts in the background. Wait 10-15 seconds and reload. |
| Backend fails on startup with a `UnicodeEncodeError` | Hidden characters in an API key in `backend/.env`. Re-paste the key. |
| Port 8000 already in use | Stop the old uvicorn process, then start it again. |
