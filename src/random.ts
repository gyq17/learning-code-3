import { useState, useEffect, useRef } from "react";

const stories = [
  {
    prompt: "Tell me about a time something was not going well or at risk of missing a deadline.",
    title: "5 Concurrent P1s During Oncall + Stability Deadline",
    bluf: "During a critical stability push with a hard end-of-week deadline, I was oncall and got hit with 5 simultaneous P1 incidents. I triaged ruthlessly, pulled in teammates for parallel workstreams, and we hit the stability milestone on time while closing all P1s.",
    situation: "March 2026. Our SER stability plan had a hard deadline — we'd told leadership the system would be ready for Ops self-serve by end of week. I was oncall that week. On Monday, 5 P1 tickets landed simultaneously: events stuck in manual review, a customer-facing crash labeling regression, and three other escalations.",
    task: "I needed to close all P1s (customer-facing impact) while not letting the stability deadline slip — the team had 4 other engineers depending on stability being done to unblock their own workstreams.",
    action: "I triaged the P1s by customer impact and parallelisability. Two I could close quickly myself (config fixes). For the crash labeling issue affecting Quest/HSM, I identified the root cause within an hour and pushed a fix. For the remaining two, I wrote up clear investigation notes and handed them to Calvin who had capacity. In parallel, I continued my stability work — crash flow cleanup and feature flag deprecation — during gaps between incident work. I posted daily status updates in the team channel so nobody was blocked waiting on me.",
    result: "All 5 P1s closed within the week. The stability milestone was hit — SER stability was confirmed 'ready for Ops and XFNs in 1-2 weeks' at our Friday sync. My manager Alex later cited this as an example of managing competing priorities under pressure.",
    tags: ["Pressure", "Prioritisation", "Delivery risk"],
    seconds: 55,
  },
  {
    prompt: "Tell me about a time you owned something starting from a vague requirement.",
    title: "SER Capacity Analysis → Team Roadmap",
    bluf: "When leadership asked 'can we enable SER for all 1M+ accounts?', there was no analysis, no plan — just a goal. I independently built the capacity model, proved it was 4× over-subscribed, defined a phased strategy with 5 levers, and that analysis became the team's execution roadmap for the next two quarters.",
    situation: "January 2026. Our new team (SDP) was formed with the goal: 'improve inbox precision for $1M+ accounts using SER.' But nobody had quantified whether this was even feasible with current capacity. The ask was vague — 'figure out how to enable more accounts.'",
    task: "I needed to turn this vague goal into a concrete, data-backed plan that the team could execute against — and do it in the first week, since we had an SKO deadline to report progress.",
    action: "I pulled SER review volume data from Databricks, calculated reviewer throughput (75 reviewers × 240 reviews/day = 18k capacity), and mapped the 1M+ opportunity (~68k events/day). This proved a 4× gap. I then built a prioritisation matrix by event type — ranking by false-positive rate and daily volume — and proposed 5 capacity levers: skip low-value events, reduce consensus reviews, hire, remove always-true events, and ML-based filtering. I published this as a Confluence doc and presented it at our team kickoff.",
    result: "The analysis became the team's roadmap. Each of our 5 engineers was assigned a lever: Calvin on review time, Nada on ML load reduction, Shiqi on VLM/Gemini, Daksh on policy infra, me on high-recall and crash promotion. It's still the anchor document 3 months later. Leadership used it to set expectations with GTM.",
    tags: ["Ambiguity", "Strategy", "Self-directed"],
    seconds: 58,
  },
  {
    prompt: "Tell me about a time you had a disagreement with a coworker or had to push back.",
    title: "De-risking Gemini for Automated SER Review",
    bluf: "When the team was excited about using Gemini to auto-review SER events, I pushed back — our paying SER customers have strict precision contracts, and we had no PM to validate the business risk. I proposed we pause automated review and use Gemini only for shadow-mode scoring, which the team adopted.",
    situation: "February–March 2026. The team was exploring Gemini/VLM to auto-dismiss or auto-approve SER events, which would dramatically increase throughput. Shiqi had built a working prototype. There was momentum to ship it for real decisions. But our PM (Baris) was on leave, and our EM (Marc) was on paternity leave.",
    task: "I was concerned that shipping automated AI decisions on paying SER customers — who have precision SLAs — without PM validation was a business risk. But I didn't want to kill the team's momentum or seem like I was blocking innovation.",
    action: "In my 1-1 with Alex (our skip-level), I framed it as a risk/reward tradeoff: 'Paying SER customers have strict precision contracts. Without a PM to validate the business risk, I propose we pause using Gemini for automated 3+ review until we can prove it meets human-level precision.' I suggested a concrete alternative: keep Gemini in shadow mode, collect confidence data, and use it for prioritisation (reordering the queue) rather than replacement (making decisions). I then talked with Shiqi directly to make sure he felt his work was valued and would be used — just in a safer way.",
    result: "Alex agreed with the de-risk. The team pivoted to shadow-mode comparison (ML inference vs Gemini vs human). Shiqi's VLM dashboard became a key tool for measuring where AI confidence could safely reduce human load. We avoided shipping a potential precision regression to paying customers, and the data from shadow mode will be what justifies the real rollout when PM returns.",
    tags: ["Pushback", "Risk management", "Diplomacy"],
    seconds: 60,
  },
  {
    prompt: "Tell me about a time you led a project across multiple teams without formal authority.",
    title: "ML Crash Promotion — XFN Alignment Without a PM",
    bluf: "I drove the ML crash promotion feature from design to production across 4 teams — Safety Eng, Detection, Ops, and PM — without being anyone's manager, during a PM vacancy. I aligned stakeholders on volume caps, stop-loss metrics, and reviewer workflows in Slack and shipped it within 3 weeks.",
    situation: "January 2026. The Detection team (Daniel, Cole) had an ML model that could identify real crashes from harsh-braking events. But routing these through SER required changes to our ingestion, review UI, crash labeling, and alert timing — touching my team (SDP), Detection, Ops (SK), and PM (Baris/Cole).",
    task: "No PM was assigned to drive this. The Detection team wanted to ship ASAP ('customers have misclassified crashes today'), but Ops was worried about SER capacity, and I was worried about reviewer UX and downstream alerting side-effects.",
    action: "I wrote the design doc (ML Crash Promotion <> SER on Confluence), then initiated a cross-functional Slack thread in #dev-crashes. I framed the key tradeoffs: volume impact (~2.5k/week initial), SER capacity buffer, reviewer workflow changes needed. I proposed a stop-loss metric: if SER buffer drops below 10%, pause the rollout. I got Ops confirmation on capacity, PM greenlight on scope, and then implemented the full stack myself — metadata, backend wiring, debug surfaces, and front-end crash question flow. After shipping, I posted a summary in the team channel so everyone had visibility.",
    result: "Shipped within 3 weeks. 64% true-positive rate on initial rollout to US3+US4 customers. The prototype is reusable for other event types. Cole specifically thanked the team for biasing toward action while managing risk responsibly.",
    tags: ["Leadership", "Cross-functional", "No authority"],
    seconds: 58,
  },
  {
    prompt: "Tell me about a time you had to make a difficult technical tradeoff.",
    title: "Policy Framework vs. Speed — Onboarding Express Customers",
    bluf: "We needed to onboard new Express customers fast for revenue-critical trials, but the old flag-based system was causing 'zombie customer' incidents. I chose to build the policy framework in parallel with onboarding, accepting short-term complexity of dual systems to avoid blocking revenue while eliminating the systemic risk.",
    situation: "Late 2025 – early 2026. SER customer enablement was controlled by ~20+ LaunchDarkly flags, manual segments, and per-org toggles. This caused recurring incidents — churned customers like ConGlobal and James Edward kept flowing through SER because flag removal was partial. But sales needed new Express orgs onboarded immediately for trials.",
    task: "I had two competing needs: fix the systemic problem (build policy framework + org tags) or keep onboarding customers fast using the broken system. The clean option would take weeks; sales couldn't wait.",
    action: "I chose a dual-track approach. For immediate onboardings, I documented a 4-step process (express segment + sentinel FC + org_tag table + policy) and onboarded the orgs myself to ensure consistency. In parallel, I co-designed the policy-based framework with Daksh — manual review policy accessor, GraphQL mutations, org-tag integration, and a sentinel policy tier for Express defaults. I also drove JIRA tickets (SDP-154) to codify offboarding semantics so the 'zombie customer' class of incidents couldn't recur. Each week in our sync, I tracked which flags we could deprecate as the new system absorbed their logic.",
    result: "Dozens of Express orgs onboarded without incident during the transition. 5+ legacy flags deprecated into the policy model. The zombie customer incident class was eliminated. The org_tag table became the canonical source of truth. Nada and Daksh could then extend the framework for EU/CA parity and dynamic review without me.",
    tags: ["Tradeoff", "Architecture", "Pragmatism"],
    seconds: 60,
  },
  {
    prompt: "Tell me about a time you helped someone else grow or unblocked a teammate.",
    title: "Mentoring Nada on SER Stability Ownership",
    bluf: "When our stability push needed an owner for the Express enablement flow, I coached Nada through the architecture, helped her build confidence in the codebase, and gradually transferred ownership — she went from needing my review on every change to independently driving the Express-to-org-tag migration.",
    situation: "February–March 2026. Nada had joined the SER/SDP team relatively recently and needed to own the Express enablement and offboarding flow as part of the stability plan. But the system had hidden dependencies — feature flags interacting with policy fields, org tags, and LaunchDarkly segments in non-obvious ways.",
    task: "I needed Nada to own this workstream independently, because I was stretched across crash promotion, Labelbox, and stability work myself. But the codebase was complex enough that jumping in blind would likely cause incidents.",
    action: "I did three things. First, I wrote the SER Overview 2026 doc that mapped the full system — all flows, all flags, all dependencies — so Nada had a reference. Second, I pair-reviewed her first few PRs in detail, explaining not just the 'what' but the 'why' — for example, why the express segment, sentinel FC, and org_tag table all needed to stay in sync during the transition. Third, when she proposed using feature-gated functions to identify SER and Express customers, I gave her specific feedback on edge cases (misclassified orgs, classic vs self-SER) and let her make the final design call.",
    result: "Within 3 weeks, Nada was independently driving the Express-to-org-tag migration, creating PRs to replace access circles with SER decision function accessors, and planning to hand off Express onboarding/offboarding to Ops (SK). She presented at our weekly sync with confidence. The stability plan gap she owned was closed on schedule.",
    tags: ["Mentoring", "Delegation", "Growth"],
    seconds: 58,
  },
  {
    prompt: "Tell me about a time you identified a problem nobody asked you to find.",
    title: "Labelbox Replacement Opportunity",
    bluf: "Nobody asked me to look at Labelbox. I noticed SER reviewers were idle during off-peak hours while ML teams were paying for external annotation. I investigated, wrote a gap analysis showing SER could replace 30-40% of Labelbox workload at zero marginal cost, and designed the first milestone to prove it.",
    situation: "March 2026. Our SER reviewers regularly showed idle screens during weekends and off-peak hours — 'please wait, no more review requests.' Meanwhile, in cross-team conversations, I heard ML/CV teams were hitting Labelbox cost and turnaround constraints for annotation work — the same kind of event-level classifications our SER reviewers already do for customers.",
    task: "Nobody had connected these dots. There was no task, no ticket, no ask. I saw a potential cost savings and platform expansion opportunity and decided to investigate it myself.",
    action: "I spent two days researching how Labelbox was used at Samsara — annotation types, data flows, quality SLAs, per-feature projects. I then wrote a thorough gap analysis doc comparing what SER can do vs. what Labelbox provides. The key insight: SER can handle ~30-40% of the workload (event-level global classifications like 'phone use: yes/no', 'crash: yes/no', image quality flags) but cannot replace geometry-heavy tasks (bounding boxes, polylines, segmentation). I then designed Milestone 1: an optional lowest-priority queue for internal ML labelling during idle time, starting with seatbelt classification. I shared this with the team, ML engineers, and Ops for feedback.",
    result: "The analysis was well-received — both the ML team and Ops saw the value. Epic SDP-321 was created. The M1 design is now on our roadmap for June 2026. If validated, this positions SER as both a customer-facing precision tool and an internal ML data engine — a significant platform expansion that increases the ROI of our entire reviewer investment.",
    tags: ["Initiative", "Opportunity", "Self-directed"],
    seconds: 60,
  },
  {
    prompt: "Tell me about a time you had to communicate a hard truth to stakeholders.",
    title: "Telling Leadership '1M+ Accounts Cannot Be Enabled Today'",
    bluf: "Leadership wanted to enable SER for all 1M+ accounts for SKO. I had to tell them: the answer is no — demand is 4× our capacity. But I didn't just say no; I brought the data, the gap analysis, and a phased plan that gave them a credible path forward.",
    situation: "January 2026. The Safety org's goal for SKO was 'enable SER for $1M+ accounts to improve inbox precision.' The implicit expectation was that we'd flip a switch. Our new team had just formed.",
    task: "I needed to deliver a hard truth — this was not feasible today — without killing momentum or making leadership feel the goal was wrong. The goal was right; the timeline and approach needed adjusting.",
    action: "I built the capacity analysis in the first 48 hours. Key number: ~68k events/day demand vs ~18k/day capacity. I framed this not as 'we can't do it' but as 'here's why we can't do it all at once, and here's the phased plan that gets us there.' I presented the 5 levers and the execution order: optimise first (skip low-value events, reduce consensus), then onboard high-value events, then evaluate and expand. I published the Confluence doc and shared it proactively — not waiting to be asked.",
    result: "Leadership accepted the phased approach. The analysis was shared by Marc to the leadership team. It became the team's planning document. At SKO, instead of overpromising, the team could speak credibly about the plan and the specific improvements already in flight.",
    tags: ["Hard truth", "Stakeholder management", "Data-driven"],
    seconds: 55,
  },
];

function Timer({ running, onDone }) {
  const [t, setT] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (running) {
      setT(0);
      ref.current = setInterval(() => setT(p => p + 1), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running]);
  const over = t > 60;
  const pct = Math.min(t / 60 * 100, 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: over ? "#dc2626" : "#6b7280" }}>
          {over ? `⚠️ ${t}s — over 60s!` : `${t}s / 60s`}
        </span>
        {running && <button onClick={onDone} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 4, border: "1px solid #e5e7eb", background: "white", cursor: "pointer" }}>Stop</button>}
      </div>
      <div style={{ height: 4, background: "#e5e7eb", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: over ? "#dc2626" : t > 50 ? "#f59e0b" : "#6366f1", borderRadius: 2, transition: "width 1s linear" }} />
      </div>
    </div>
  );
}

export default function StoryBank() {
  const [sel, setSel] = useState(null);
  const [mode, setMode] = useState("read");
  const [running, setRunning] = useState(false);
  const [showStar, setShowStar] = useState(false);

  const s = sel !== null ? stories[sel] : null;

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 840, margin: "0 auto", padding: "20px 14px" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: "#111827" }}>60s Story Bank</h1>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>BLUF → STAR format · From your real SER projects · Click a question to see the story</p>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <button onClick={() => { setMode("read"); setRunning(false); }} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: mode === "read" ? "#6366f1" : "white", color: mode === "read" ? "white" : "#374151", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>📖 Read Mode</button>
        <button onClick={() => { setMode("practice"); setRunning(false); setShowStar(false); }} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: mode === "practice" ? "#6366f1" : "white", color: mode === "practice" ? "white" : "#374151", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>🎤 Practice Mode</button>
      </div>

      {mode === "practice" && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
          <b>Practice mode:</b> Select a question → you'll see only the BLUF and the prompt. Hit "Start Timer" and speak your answer aloud. After you stop, reveal the STAR to compare. Target: ≤60 seconds.
        </div>
      )}

      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        {stories.map((st, i) => (
          <div key={i} onClick={() => { setSel(i); setRunning(false); setShowStar(false); }} style={{
            padding: "10px 14px", borderRadius: 8, border: sel === i ? "2px solid #6366f1" : "1px solid #e5e7eb",
            background: sel === i ? "#eef2ff" : "white", cursor: "pointer", transition: "all 0.15s"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827" }}>❓ {st.prompt}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: "#6b7280" }}>{st.title}</p>
              </div>
              <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>~{st.seconds}s</span>
            </div>
          </div>
        ))}
      </div>

      {s && (
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Question</p>
            <p style={{ margin: "4px 0", fontSize: 14, fontWeight: 600, color: "#111827" }}>{s.prompt}</p>
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>{s.tags.map(t => <span key={t} style={{ fontSize: 10, background: "#f3f4f6", color: "#6b7280", padding: "2px 6px", borderRadius: 3 }}>{t}</span>)}</div>
          </div>

          <div style={{ background: "#eef2ff", borderRadius: 6, padding: 12, marginBottom: 14, borderLeft: "3px solid #6366f1" }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#4338ca", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>BLUF — Say This First (10s)</p>
            <p style={{ margin: 0, fontSize: 13, color: "#1e1b4b", lineHeight: 1.6 }}>{s.bluf}</p>
          </div>

          {mode === "practice" && (
            <div style={{ marginBottom: 14 }}>
              <Timer running={running} onDone={() => setRunning(false)} />
              <div style={{ display: "flex", gap: 6 }}>
                {!running && <button onClick={() => { setRunning(true); setShowStar(false); }} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#6366f1", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>▶ Start Timer</button>}
                {!running && <button onClick={() => setShowStar(true)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e5e7eb", background: "white", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>👁 Reveal STAR</button>}
              </div>
            </div>
          )}

          {(mode === "read" || showStar) && (
            <div>
              {[
                { label: "S — Situation", color: "#059669", bg: "#f0fdf4", text: s.situation },
                { label: "T — Task", color: "#b45309", bg: "#fffbeb", text: s.task },
                { label: "A — Action", color: "#4338ca", bg: "#eef2ff", text: s.action },
                { label: "R — Result", color: "#dc2626", bg: "#fef2f2", text: s.result },
              ].map((part, i) => (
                <div key={i} style={{ marginBottom: 10, padding: 10, background: part.bg, borderRadius: 6, borderLeft: `3px solid ${part.color}` }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: part.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{part.label}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#111827", lineHeight: 1.6 }}>{part.text}</p>
                </div>
              ))}

              <div style={{ marginTop: 12, background: "#f9fafb", borderRadius: 6, padding: 10 }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 4, textTransform: "uppercase" }}>Speaking Tips</p>
                <ul style={{ margin: 0, paddingLeft: 14, fontSize: 11, color: "#4b5563", lineHeight: 1.7 }}>
                  <li><b>BLUF first</b> — give the punchline in 10 seconds. The listener should know the outcome before the story.</li>
                  <li><b>Situation</b> — 1-2 sentences of context. Date, team, constraint. No backstory spiral.</li>
                  <li><b>Task</b> — what was YOUR job specifically? Use "I needed to…"</li>
                  <li><b>Action</b> — this is the longest part (~25s). Use "I did three things: first…second…third…"</li>
                  <li><b>Result</b> — end with a number or a quote. "64% TP rate" or "Alex cited this as…"</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 20, background: "#f9fafb", borderRadius: 8, padding: 14 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 13, color: "#374151" }}>🧠 The BLUF+STAR Framework Cheat Sheet</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, color: "#4b5563" }}>
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#111827" }}>Structure (60 seconds)</p>
            <ul style={{ margin: 0, paddingLeft: 14, lineHeight: 1.8 }}>
              <li><b>0-10s:</b> BLUF — punchline answer</li>
              <li><b>10-20s:</b> Situation + Task</li>
              <li><b>20-45s:</b> Action (the meat)</li>
              <li><b>45-60s:</b> Result + metric/quote</li>
            </ul>
          </div>
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#111827" }}>Common Pitfalls to Avoid</p>
            <ul style={{ margin: 0, paddingLeft: 14, lineHeight: 1.8 }}>
              <li>❌ Starting with "So basically…" or backstory</li>
              <li>❌ Saying "we" when you mean "I"</li>
              <li>❌ Spending 30s on Situation</li>
              <li>❌ Ending without a concrete result</li>
              <li>✅ Start with "The short answer is…"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
