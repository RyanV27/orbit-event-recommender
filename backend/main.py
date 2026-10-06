import os, json, re
from pathlib import Path
from typing import Literal
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mem0 import MemoryClient
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()
MODEL = "claude-sonnet-5-5"

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
mem = MemoryClient(api_key=os.environ["MEM0_API_KEY"].strip().replace("​", ""))
llm = Anthropic()

SEED = json.load(open(Path(__file__).parent / "seed.json"))
PEOPLE, EVENTS = SEED["people"], SEED["events"]

# Per-user profile + visited cities. Persisted to disk so a backend restart keeps "Welcome back".
STATE_FILE = Path(__file__).parent / "state.json"
state: dict = json.loads(STATE_FILE.read_text()) if STATE_FILE.exists() else {}


def save_state():
    STATE_FILE.write_text(json.dumps(state, indent=2))


def ask_json(system: str, prompt: str, max_tokens: int = 4000):
    r = llm.messages.create(
        model=MODEL, max_tokens=max_tokens, system=system,
        messages=[{"role": "user", "content": prompt + "\n\nReturn ONLY valid JSON, no markdown fences."}],
    )
    t = next(b.text for b in r.content if b.type == "text").strip()
    t = re.sub(r"^```(?:json)?|```$", "", t, flags=re.M).strip()
    return json.loads(t)


def _results(res):
    return res.get("results", res) if isinstance(res, dict) else res


def recall(uid: str, query: str, limit: int = 15) -> list[str]:
    try:
        res = mem.search(query, filters={"user_id": uid}, top_k=limit)
    except Exception:
        try:
            res = mem.search(query, user_id=uid, limit=limit)
        except Exception as e:
            print("[orbit] mem0 search failed:", e)
            return []
    return [m["memory"] for m in _results(res)]


def remember(uid: str, text: str, kind: str, **meta):
    """Write to mem0 (extracts durable facts). Safe to run in a background task."""
    try:
        mem.add([{"role": "user", "content": text}], user_id=uid, metadata={"type": kind, **meta})
    except Exception as e:
        print("[orbit] mem0 add failed:", e)


class SwipeIn(BaseModel):
    user_id: str
    direction: Literal["liked", "passed"]
    person: dict


class FeedbackIn(BaseModel):
    user_id: str
    text: str


class RecommendIn(BaseModel):
    user_id: str
    destination: str
    brief: str = ""
    goals: list[str] = []
    memory: dict | None = None  # frontend's local signals, used as a fallback if mem0 is empty


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/memory")
def get_memory(user_id: str):
    """Hydrates the frontend: profile, cities visited and remembered facts."""
    u = state.get(user_id, {})
    try:
        facts = _results(mem.get_all(filters={"user_id": user_id}))
    except Exception:
        try:
            facts = _results(mem.get_all(user_id=user_id))
        except Exception as e:
            print("[orbit] mem0 get_all failed:", e)
            facts = []
    kind_map = {"swipe_liked": "liked", "swipe_passed": "passed", "feedback": "feedback"}
    signals = [
        {"kind": kind_map.get((f.get("metadata") or {}).get("type", ""), "context"), "text": f["memory"]}
        for f in facts
    ]
    return {"profile": u.get("profile"), "cities": u.get("cities", []), "sessions": u.get("sessions", 0), "signals": signals}


@app.post("/api/recommend")
def recommend(body: RecommendIn, bg: BackgroundTasks):
    uid = body.user_id
    u = state.setdefault(uid, {"profile": None, "cities": [], "sessions": 0})

    # Store what the founder said this turn (profile text and travel plan).
    if body.brief:
        bg.add_task(remember, uid, body.brief, "profile")
    bg.add_task(
        remember, uid,
        f"User is traveling to {body.destination}." + (f" Goals: {', '.join(body.goals)}." if body.goals else ""),
        "travel",
    )

    memories = recall(uid, "who the user is, what they build, who they like or skip meeting, event preferences")
    liked = recall(uid, "types of people the user liked or connected with", 10)
    skipped = recall(uid, "types of people the user skipped or passed on", 10)
    if not memories and body.memory:
        memories = [s["text"] for s in body.memory.get("signals", [])][-30:]

    city = body.destination.strip().lower()
    seed_people = [p for p in PEOPLE if p["city"].lower() == city or city in p["city"].lower() or p["city"].lower() in city]
    seed_events = [e for e in EVENTS if e["city"].lower() == city or city in e["city"].lower() or e["city"].lower() in city]

    system = """You are ORBIT, a memory-powered networking agent for startup founders.
You recommend specific people a founder should meet in their destination city, based on who they are, what they're building, their stage and goals.
Use REMEMBERED FACTS (from long-term memory) to adapt: prioritize categories they liked, de-prioritize what they passed on, honor explicit feedback.
Never recommend someone they already swiped on. Prefer the KNOWN LOCAL PEOPLE and KNOWN LOCAL EVENTS when given (keep their names, roles and details; invent a plausible company and neighborhood); fill the rest with illustrative personas (not real public figures).
"why" must be specific and reference remembered context, e.g. "Recommended because you're looking for legal AI design partners and previously liked meeting law firm operators."
Events must be realistic for the city and sourced from Luma, Eventbrite or Partiful."""

    prompt = f"""DESTINATION: {body.destination}
STORED PROFILE: {json.dumps(u['profile']) if u['profile'] else 'none (first session)'}
CITIES PREVIOUSLY VISITED: {', '.join(u['cities']) or 'none'}
REMEMBERED FACTS (mem0):
{chr(10).join('- ' + m for m in memories) or '- none'}
LIKED BEFORE:
{chr(10).join('- ' + m for m in liked) or '- none'}
SKIPPED BEFORE:
{chr(10).join('- ' + m for m in skipped) or '- none'}
NEW MESSAGE FROM FOUNDER: {body.brief or '(none)'}
SELECTED GOALS: {', '.join(body.goals) or '(none)'}

KNOWN LOCAL PEOPLE: {json.dumps(seed_people)}
KNOWN LOCAL EVENTS: {json.dumps(seed_events)}

Return this JSON shape:
{{
  "profile": {{"background": str, "startup": str, "stage": str, "goals": [2-5 short phrases], "preferences": [2-5 short phrases]}},
  "people": [exactly 6, best match first, each: {{"name": str, "role": str, "company": str, "neighborhood": str,
     "category": one of customer|investor|founder|operator|mentor|hire, "tags": [exactly 3 short tags],
     "matchScore": int 62-98, "why": str, "signal": short memory-based label like "You liked 2 law firm operators", "openTo": str}}],
  "events": [exactly 3, each: {{"name": str, "source": Luma|Eventbrite|Partiful, "date": str like "Tue, Oct 14 · 6:30 PM",
     "venue": str, "why": str, "attendees": [1-5 exact "name" values from the 6 people above who would likely attend this event]}}]
}}
Merge the stored profile with anything new; keep each profile field under 18 words."""

    out = ask_json(system, prompt, 5000)

    people = []
    for i, p in enumerate(out["people"][:6]):
        people.append({**p, "id": f"{uid}-{body.destination}-{i}-{p['name']}".replace(" ", "_"),
                       "tags": p["tags"][:3], "matchScore": max(50, min(99, int(p["matchScore"])))})
    names = {p["name"] for p in people}
    events = []
    for i, e in enumerate(out["events"][:3]):
        attendees = [n for n in dict.fromkeys(e.get("attendees", [])) if n in names]
        events.append({**{k: v for k, v in e.items() if k != "attendees"},
                       "id": f"ev-{i}-{e['name']}".replace(" ", "_"),
                       "attendees": attendees, "matchesAttending": len(attendees)})

    u["profile"] = out["profile"]
    if body.destination not in u["cities"]:
        u["cities"].append(body.destination)
    u["sessions"] += 1
    save_state()

    return {"people": people, "events": events, "profile": out["profile"]}


@app.post("/api/swipe")
def swipe(body: SwipeIn, bg: BackgroundTasks):
    p = body.person
    verb = "liked (swiped right on)" if body.direction == "liked" else "skipped (swiped left on)"
    text = (f"User {verb} {p.get('name')}, a {p.get('role')} at {p.get('company')} "
            f"(category: {p.get('category')}; tags: {', '.join(p.get('tags', []))}).")
    bg.add_task(remember, body.user_id, text, f"swipe_{body.direction}")
    return {"ok": True}


@app.post("/api/feedback")
def feedback(body: FeedbackIn, bg: BackgroundTasks):
    bg.add_task(remember, body.user_id, body.text, "feedback")
    return {"ok": True}


@app.delete("/api/memory")
def reset(user_id: str):
    """Demo helper: wipe a user's memory."""
    try:
        mem.delete_all(user_id=user_id)
    except Exception as e:
        print("[orbit] mem0 delete failed:", e)
    state.pop(user_id, None)
    save_state()
    return {"ok": True}
