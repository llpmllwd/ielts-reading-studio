(function () {
  "use strict";
  const cfg = window.IELTS_SUBMISSIONS || {};
  const ready = /^https:\/\/[-\w]+\.supabase\.co\/?$/.test(cfg.supabaseUrl || "") &&
    cfg.anonKey && !cfg.anonKey.startsWith("YOUR_");
  const state = new Set();

  function button() {
    const b = document.createElement("button");
    b.type = "button";
    b.id = "teacherSubmit";
    b.textContent = ready ? "Submit to Teacher" : "Submit to Teacher (setup required)";
    b.disabled = !ready;
    b.title = ready ? "Send your answers to your teacher securely" :
      "Teacher has not configured the online submission database yet";
    b.style.cssText = "border:0;border-radius:9px;padding:11px 16px;background:#1463ad;color:#fff;font-weight:700;cursor:pointer;max-width:100%;";
    if (!ready) b.style.opacity = ".6";
    return b;
  }
  function status(el, message) {
    let m = document.getElementById("teacherSubmissionStatus");
    if (!m) {
      m = document.createElement("span");
      m.id = "teacherSubmissionStatus";
      m.setAttribute("role", "status");
      m.style.cssText = "display:block;font-size:13px;padding:6px 0;white-space:normal;";
      el.parentElement.appendChild(m);
    }
    m.textContent = message;
  }
  async function send(payload, b) {
    if (!ready) return;
    if (!payload.student_name || !payload.student_name.trim()) {
      alert("Please enter your name before submitting."); return;
    }
    const attemptKey = payload.exercise_id + ":" + payload.student_name.toLowerCase();
    if (state.has(attemptKey)) return;
    if (!confirm("Send your completed answers to your teacher?")) return;
    b.disabled = true; b.textContent = "Sending…";
    try {
      const resp = await fetch(cfg.supabaseUrl.replace(/\/$/, "") + "/rest/v1/reading_submissions", {
        method: "POST",
        headers: {
          "apikey": cfg.anonKey,
          "Authorization": "Bearer " + cfg.anonKey,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          student_name: payload.student_name.trim().slice(0, 100),
          exercise_id: payload.exercise_id,
          exercise_title: payload.exercise_title.slice(0, 180),
          question_type: payload.question_type,
          answers: payload.answers,
          question_count: payload.question_count,
          self_reported_score: payload.self_reported_score
        })
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error("Server rejected submission (" + resp.status + "): " + text.slice(0, 140));
      }
      state.add(attemptKey);
      localStorage.setItem("sent:" + attemptKey, new Date().toISOString());
      b.textContent = "✓ Sent to Teacher"; status(b, "Submission received by the online database. You may close this page.");
    } catch (e) {
      b.disabled = false; b.textContent = "Retry Submit to Teacher";
      status(b, "Not sent. " + e.message + " You may download your CSV as a backup.");
    }
  }
  function addPractice() {
    const bar = document.querySelector("#study .bar .row:last-child");
    if (!bar || document.getElementById("teacherSubmit")) return;
    const b = button(); bar.appendChild(b);
    b.onclick = () => {
      if (typeof current === "undefined" || current < 0 || typeof sets === "undefined") return;
      const s = sets[current];
      const count = s.questions.length;
      const score = typeof window.score === "function" ? window.score().correct :
        s.questions.reduce((n,q,i)=>n+(String(responses[i] || "").trim().toLowerCase() ===
          String(s.type === "Multiple Choice" ? q[2] : q[1]).trim().toLowerCase() ? 1 : 0),0);
      send({
        student_name: student,
        exercise_id: "practice-" + (current + 1),
        exercise_title: s.title,
        question_type: s.type,
        answers: Object.fromEntries(Array.from({length:count},(_,i)=>[String(i+1),responses[i]||""])),
        question_count: count,
        self_reported_score: score
      },b);
    };
  }
  function addMock() {
    const results = document.getElementById("results");
    if (!results || document.getElementById("teacherSubmit")) return;
    const b = button();
    const wrap = document.createElement("div");
    wrap.style.margin = "16px 0";
    wrap.appendChild(b);
    results.insertBefore(wrap,results.firstChild);
    b.onclick = () => {
      const count = 40;
      const sc = typeof all !== "undefined" && typeof norm === "function"
        ? all.filter(q=>norm(answers[q[0]])===norm(q[4])).length : null;
      send({
        student_name: student,
        exercise_id: "mock-1",
        exercise_title: "IELTS Academic Reading Full Mock Exam 1",
        question_type: "Full Mock Exam",
        answers: Object.fromEntries(Array.from({length:count},(_,i)=>[String(i+1), answers[i+1]||""])),
        question_count: count,
        self_reported_score: sc
      },b);
    };
  }
  if (document.getElementById("study")) {
    addPractice();
  } else {
    // The existing mock test builds its results panel only when submitting.
    const observer = new MutationObserver(() => {
      const panel = document.getElementById("results");
      if (panel && !panel.classList.contains("hidden") && panel.querySelector(".score")) addMock();
    });
    observer.observe(document.body, {childList:true,subtree:true});
  }
})();