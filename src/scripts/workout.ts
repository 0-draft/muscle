// Client side of the workout screen. One session = the sets of one day (A/B) on the date it was
// started; it survives reloads and midnight, and is logged under its start date.
import { t } from '../lib/i18n';
import { issueUrl, weekFor } from '../lib/plan';
import { platesFor, warmups } from '../../scripts/lib/lifting.mjs';

type Lang = 'en' | 'ja';
type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight';
type PhaseInfo = { id: string; weeks: number[]; label: string; note: string; rir: Record<string, string> };
type Set = { kg: number | null; reps: number; rir: number | null; done: boolean; pr?: boolean };
type Saved = { sets: Record<string, Set[]>; logged: boolean; startedAt?: number; finishedAt?: number };
type Memory = Record<string, { last?: { date: string; sets: { kg: number; reps: number; rir: number | null; bw: boolean }[] }; bestE1rm?: number }>;
type ExInfo = { id: string; name: string; equipment: Equipment; type: 'compound' | 'isolation'; reps: string; rest: number; sets: Record<string, number> };

const store = {
  get<T>(k: string, fallback: T): T {
    try {
      const v = localStorage.getItem(`muscle:v2:${k}`);
      return v === null ? fallback : (JSON.parse(v) as T);
    } catch {
      return fallback;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem(`muscle:v2:${k}`, JSON.stringify(v));
    } catch {}
  },
};
const isoToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const clock = (sec: number) => `${Math.floor(Math.max(0, sec) / 60)}:${String(Math.max(0, sec) % 60).padStart(2, '0')}`;
const e1rm = (kg: number, reps: number, rir: number | null) => kg * (1 + (reps + (rir ?? 0)) / 30);
const fmtKg = (kg: number | null) => (kg === null ? '—' : Number.isInteger(kg) ? String(kg) : kg.toFixed(kg * 4 === Math.round(kg * 4) ? 2 : 1).replace(/0$/, ''));
const STEP: Record<Equipment, number> = { barbell: 2.5, dumbbell: 1, cable: 2.5, machine: 2.5, bodyweight: 2.5 };
const PLATE_CLASS: Record<string, string> = { '25': 'p25', '20': 'p20', '15': 'p15', '10': 'p10', '5': 'p5', '2.5': 'p2', '1.25': 'p1' };

/** Haptic tap: Vibration API where it exists (Android); iOS 17.4+ gives a tick when a switch input toggles. */
function haptic(pattern: number | number[] = 12) {
  if (navigator.vibrate) return void navigator.vibrate(pattern);
  const label = document.getElementById('wk-haptic') as HTMLLabelElement | null;
  label?.click();
}

export function mountWorkout(root: HTMLElement) {
  const lang = root.dataset.lang as Lang;
  const s = t[lang].workout;
  const phases = JSON.parse(root.dataset.phases!) as PhaseInfo[];
  const weeks = Number(root.dataset.weeks);
  const memory = JSON.parse(root.dataset.memory!) as Memory;
  const exInfo = JSON.parse(root.dataset.exercises!) as Record<'A' | 'B', ExInfo[]>;

  // ---------- session state ----------
  const keyOf = (d: string, dy: string) => `session:${d}:${dy}`;
  const hasData = (x: Saved) => Object.values(x.sets ?? {}).some((a) => a.some((st) => st.done));
  const nextDay = () => (store.get<string>('lastDay', 'B') === 'A' ? 'B' : 'A');

  let date = isoToday();
  let day: 'A' | 'B' = 'A';
  let saved: Saved = { sets: {}, logged: false };
  let active: { ex: string; i: number } | null = null;

  const open = (d: string, dy: 'A' | 'B') => {
    date = d;
    day = dy;
    saved = store.get<Saved>(keyOf(d, dy), { sets: {}, logged: false });
    store.set('current', { date, day });
  };
  const save = () => store.set(keyOf(date, day), saved);
  {
    const cur = store.get<{ date: string; day: 'A' | 'B' } | null>('current', null);
    const prev = cur && store.get<Saved | null>(keyOf(cur.date, cur.day), null);
    if (cur && prev && hasData(prev) && !prev.logged) open(cur.date, cur.day);
    else open(isoToday(), nextDay() as 'A' | 'B');
  }
  const touch = () => {
    if (!hasData(saved) && date !== isoToday()) open(isoToday(), day);
  };

  const autoWeek = () => Math.min(weeks, Math.max(1, weekFor(new Date(`${date}T00:00:00`))));
  let week = store.get('weekSetOn', '') === isoToday() ? store.get('week', autoWeek()) : autoWeek();
  const phase = () => phases.find((p) => p.weeks.includes(week)) ?? phases[phases.length - 1];
  const list = () => exInfo[day];
  const info = (id: string) => list().find((e) => e.id === id)!;

  // Most recent sets for an exercise: this phone's last logged session if newer than the build's log.
  const lastOf = (id: string) => {
    const local = store.get<Record<string, { date: string; sets: { kg: number; reps: number; rir: number | null }[] }>>('lastSets', {})[id];
    const built = memory[id]?.last;
    if (local && (!built || local.date >= built.date)) return local;
    return built;
  };
  const bestOf = (id: string) => Math.max(memory[id]?.bestE1rm ?? 0, store.get<Record<string, number>>('bests', {})[id] ?? 0);

  /** Sets for an exercise in the current phase, prefilled from last time. */
  function setsFor(ex: ExInfo): Set[] {
    const n = ex.sets[phase().id];
    const cur = saved.sets[ex.id] ?? [];
    const last = lastOf(ex.id);
    const lowReps = Number(ex.reps.split(/[–-]/)[0]);
    const out: Set[] = [];
    for (let i = 0; i < n; i++) {
      if (cur[i]) out.push(cur[i]);
      else {
        const p = last?.sets[i] ?? last?.sets.at(-1);
        const before = out[i - 1];
        // Same set last time first, then the set before it today, then nothing.
        const p2 = last?.sets[i];
        out.push({ kg: p2?.kg ?? before?.kg ?? p?.kg ?? (ex.equipment === 'bodyweight' ? 0 : null), reps: p2?.reps ?? before?.reps ?? p?.reps ?? lowReps, rir: null, done: false });
      }
    }
    saved.sets[ex.id] = out;
    return out;
  }
  const allSets = () => list().flatMap((ex) => setsFor(ex).map((st, i) => ({ ex, st, i })));
  const firstOpen = () => allSets().find((x) => !x.st.done) ?? null;

  // ---------- elements ----------
  const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T & HTMLElement>(sel)!;
  const listEl = $('[data-list]');
  const board = $('[data-board]');
  const summary = $('[data-summary]');
  const prEl = $('[data-pr]');

  // ---------- rendering ----------
  function renderControls() {
    root.querySelectorAll<HTMLButtonElement>('.wk-week').forEach((b) => {
      b.setAttribute('aria-pressed', String(Number(b.dataset.week) === week));
      b.classList.toggle('is-now', Number(b.dataset.week) === autoWeek());
    });
    $('[data-phase-label]').textContent = phase().label;
    $('[data-phase-note]').textContent = phase().note;
    root.querySelectorAll<HTMLButtonElement>('.wk-day').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.day === day)));
  }

  function prevText(id: string, i: number) {
    const p = lastOf(id)?.sets[i];
    return p ? `${fmtKg(p.kg)}×${p.reps}${p.rir != null ? `@${p.rir}` : ''}` : '—';
  }

  function renderList() {
    const rows = list()
      .map((ex, n) => {
        const sets = setsFor(ex);
        const allDone = sets.every((x) => x.done);
        return `<li class="wk-card${allDone ? ' is-done' : ''}" data-ex="${ex.id}">
          <div class="wk-card-head">
            <span class="wk-num">${String(n + 1).padStart(2, '0')}</span>
            <h3 class="wk-name">${ex.name}</h3>
          </div>
          <p class="wk-spec">${sets.length} ${s.sets} × ${ex.reps} <span aria-hidden="true">/</span> RIR ${phase().rir[ex.type]} <span aria-hidden="true">/</span> ${s.rest} ${clock(ex.rest)}</p>
          <table class="wk-sets">
            <thead><tr><th scope="col">${s.set}</th><th scope="col">${s.previous}</th><th scope="col">kg</th><th scope="col">${s.reps}</th><th scope="col">RIR</th><th scope="col"><span class="sr">${s.status}</span></th></tr></thead>
            <tbody>${sets
              .map(
                (st, i) => `<tr class="${st.done ? 'is-done' : ''}${active?.ex === ex.id && active.i === i ? ' is-active' : ''}" data-row="${i}">
                  <td><button type="button" class="wk-row-btn" data-select="${ex.id}:${i}" aria-label="${s.edit} ${ex.name} ${s.set} ${i + 1}">${i + 1}</button></td>
                  <td class="wk-prev">${prevText(ex.id, i)}</td>
                  <td class="wk-val">${ex.equipment === 'bodyweight' ? (st.kg ? `BW+${fmtKg(st.kg)}` : 'BW') : fmtKg(st.kg)}</td>
                  <td class="wk-val">${st.reps}</td>
                  <td class="wk-val">${st.rir ?? '—'}</td>
                  <td class="wk-mark">${st.pr ? `<span class="wk-medal" title="${s.pr}">PR</span>` : st.done ? '<span class="wk-check" aria-label="done">✓</span>' : ''}</td>
                </tr>`,
              )
              .join('')}</tbody>
          </table>
        </li>`;
      })
      .join('');
    listEl.innerHTML = rows;
    renderBar();
  }

  function renderBar() {
    const all = allSets();
    const done = all.filter((x) => x.st.done);
    const left = $('[data-plates-left]');
    const right = $('[data-plates-right]');
    const step = Math.min(8, 86 / Math.max(all.length, 1));
    const cls = ['p25', 'p20', 'p15', 'p10'];
    const mk = (x: number, i: number, compound: boolean, c: string) =>
      `<rect class="wk-plate ${c}" style="--i:${i}" x="${x}" y="${32 - (compound ? 27 : 20)}" width="${step * 0.82}" height="${compound ? 54 : 40}" rx="1.5"/>`;
    const plates = done.map((x, i) => ({ i, compound: x.ex.type === 'compound', c: cls[list().indexOf(x.ex) % cls.length] }));
    left.innerHTML = plates.map((p) => mk(92 - (p.i + 1) * step, p.i, p.compound, p.c)).join('');
    right.innerHTML = plates.map((p) => mk(228 + p.i * step + step * 0.18, p.i, p.compound, p.c)).join('');
    $('[data-count]').textContent = s.done(done.length, all.length);
  }

  function renderBoard() {
    const target = active ? { ex: info(active.ex), i: active.i } : (() => {
      const f = firstOpen();
      return f ? { ex: f.ex, i: f.i } : null;
    })();
    board.hidden = !target || !timer.hidden;
    if (!target) return;
    active = { ex: target.ex.id, i: target.i };
    const ex = target.ex;
    const sets = setsFor(ex);
    const st = sets[target.i];
    $('[data-b-name]').textContent = ex.name;
    $('[data-b-set]').textContent = s.setOf(target.i + 1, sets.length);
    $('[data-b-prev]').textContent = `${s.previous} ${prevText(ex.id, target.i)}`;
    $('[data-b-kg]').textContent = ex.equipment === 'bodyweight' ? (st.kg ? `+${fmtKg(st.kg)}` : 'BW') : fmtKg(st.kg);
    $('[data-b-reps]').textContent = String(st.reps);
    root.querySelectorAll<HTMLButtonElement>('[data-rir]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.rir) === st.rir)));
    $('[data-b-target]').textContent = `${ex.reps} ${s.reps} / RIR ${phase().rir[ex.type]}`;
    // Plate math for barbell lifts; warm-up ramp before the first working set of a compound.
    const plates = $('[data-b-plates]');
    if (ex.equipment === 'barbell' && st.kg) {
      const { perSide, loaded } = platesFor(st.kg);
      plates.hidden = false;
      plates.innerHTML =
        `<span class="wk-plates-bar" aria-hidden="true">${perSide.map((p) => `<i class="pl ${PLATE_CLASS[String(p)]}"></i>`).join('')}<b></b></span>` +
        `<span>${s.perSide} ${perSide.length ? perSide.map(fmtKg).join(' + ') : s.emptyBar}${loaded !== st.kg ? ` (${fmtKg(loaded)} kg)` : ''}</span>`;
    } else plates.hidden = true;
    const warm = $('[data-b-warm]');
    const ws = target.i === 0 && ex.type === 'compound' && st.kg && ex.equipment !== 'bodyweight' ? warmups(st.kg, { barbell: ex.equipment === 'barbell', step: STEP[ex.equipment] }) : [];
    warm.hidden = !ws.length || st.done;
    warm.textContent = ws.length ? `${s.warmup}: ${ws.map((w) => `${fmtKg(w.kg)}×${w.reps}`).join(' → ')}` : '';
    const doneBtn = $<HTMLButtonElement>('[data-b-done]');
    doneBtn.textContent = st.done ? s.update : s.doneBtn;
    doneBtn.disabled = st.kg === null;
  }

  function render() {
    renderControls();
    renderList();
    renderBoard();
  }

  // ---------- rest timer ----------
  const timer = $('[data-timer]');
  const timeEl = $('[data-timer-time]');
  const nextEl = $('[data-timer-next]');
  let endsAt = 0;
  let tick = 0;
  let audio: AudioContext | null = null;
  const wakeAudio = () => {
    try {
      audio ??= new AudioContext();
      if (audio.state !== 'running') void audio.resume();
    } catch {}
  };
  const tone = async (freq: number, at: number, len = 0.18) => {
    if (!audio) return;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.22, audio.currentTime + at);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + at + len);
    o.connect(g).connect(audio.destination);
    o.start(audio.currentTime + at);
    o.stop(audio.currentTime + at + len);
  };
  const beep = async () => {
    haptic([200, 100, 200]);
    try {
      wakeAudio();
      if (audio && audio.state !== 'running') await audio.resume();
      if (audio?.state === 'running') [0, 0.22, 0.44].forEach((at, i) => tone(i === 2 ? 1320 : 880, at));
    } catch {}
  };
  const stopTimer = () => {
    clearInterval(tick);
    timer.hidden = true;
    store.set('timerEndsAt', 0);
    renderBoard();
  };
  const update = () => {
    const left = Math.round((endsAt - Date.now()) / 1000);
    timeEl.textContent = clock(left);
    timer.classList.toggle('is-final', left <= 10);
    if (left <= 0) {
      void beep();
      stopTimer();
    }
  };
  const startTimer = (sec: number) => {
    endsAt = Date.now() + sec * 1000;
    store.set('timerEndsAt', endsAt);
    board.hidden = true;
    timer.hidden = false;
    const f = firstOpen();
    nextEl.textContent = f ? `${s.next}: ${f.ex.name} ${s.setOf(f.i + 1, setsFor(f.ex).length)} · ${f.ex.equipment === 'bodyweight' ? 'BW' : `${fmtKg(f.st.kg)} kg`} × ${f.st.reps}` : '';
    clearInterval(tick);
    update();
    tick = window.setInterval(update, 250);
    wakeAudio();
  };
  $('[data-timer-minus]').addEventListener('click', () => {
    endsAt -= 15000;
    store.set('timerEndsAt', endsAt);
    update();
  });
  $('[data-timer-plus]').addEventListener('click', () => {
    endsAt += 15000;
    store.set('timerEndsAt', endsAt);
    update();
  });
  $('[data-timer-skip]').addEventListener('click', stopTimer);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (!timer.hidden) {
      wakeAudio();
      update();
    }
    if (wake.checked) void requestLock();
  });

  // ---------- wake lock ----------
  let lock: WakeLockSentinel | null = null;
  const wake = $<HTMLInputElement>('[data-wake]');
  if (!('wakeLock' in navigator)) wake.closest('label')!.hidden = true;
  const requestLock = async () => {
    try {
      lock = await navigator.wakeLock.request('screen');
    } catch {
      wake.checked = false;
    }
  };
  wake.addEventListener('change', async () => {
    if (wake.checked) await requestLock();
    else await lock?.release();
  });

  // ---------- PR verdict ----------
  function showPr(ex: ExInfo, value: number, previous: number) {
    prEl.querySelector('[data-pr-name]')!.textContent = ex.name;
    prEl.querySelector('[data-pr-value]')!.textContent = `${fmtKg(Math.round(value * 10) / 10)} kg`;
    prEl.querySelector('[data-pr-old]')!.textContent = previous ? `${fmtKg(Math.round(previous * 10) / 10)} kg` : '';
    prEl.hidden = false;
    prEl.classList.remove('is-lit');
    void prEl.offsetWidth; // restart the reveal
    prEl.classList.add('is-lit');
    haptic([30, 60, 30, 60, 120]);
    wakeAudio();
    if (audio?.state === 'running') [0.42, 0.42, 0.42].forEach((at, i) => tone(660 + i * 220, at, 0.3));
  }
  prEl.addEventListener('click', () => (prEl.hidden = true));

  // ---------- summary ----------
  function showSummary() {
    const sets = allSets().filter((x) => x.st.done);
    const tonnage = sets.reduce((tn, x) => tn + (x.st.kg ?? 0) * x.st.reps, 0);
    const minutes = saved.startedAt && saved.finishedAt ? Math.max(1, Math.round((saved.finishedAt - saved.startedAt) / 60000)) : null;
    const prs = sets.filter((x) => x.st.pr);
    summary.querySelector('[data-sum-sets]')!.textContent = String(sets.length);
    summary.querySelector('[data-sum-tonnage]')!.textContent = Math.round(tonnage).toLocaleString();
    summary.querySelector('[data-sum-time]')!.textContent = minutes ? String(minutes) : '—';
    summary.querySelector('[data-sum-prs]')!.innerHTML = prs.length
      ? prs.map((x) => `<li><span class="wk-medal">PR</span> ${x.ex.name} ${x.ex.equipment === 'bodyweight' ? 'BW+' : ''}${fmtKg(x.st.kg)}×${x.st.reps}</li>`).join('')
      : `<li class="wk-muted">${s.noPr}</li>`;
    summary.hidden = false;
    summary.querySelector<HTMLElement>('[data-sum-log]')!.focus();
  }
  summary.querySelector('[data-sum-close]')!.addEventListener('click', () => (summary.hidden = true));

  // ---------- logging ----------
  const logLines = () =>
    list()
      .map((ex) => {
        const done = setsFor(ex).filter((x) => x.done && x.kg !== null);
        if (!done.length) return '';
        const tok = (x: Set) =>
          `${ex.equipment === 'bodyweight' ? (x.kg ? `bw+${fmtKg(x.kg)}` : 'bw') : fmtKg(x.kg)}x${x.reps}${x.rir != null ? `@${x.rir}` : ''}`;
        return `${ex.id} ${done.map(tok).join(' ')}`;
      })
      .filter(Boolean);
  const finish = () => {
    const lastSets = store.get<Record<string, { date: string; sets: { kg: number; reps: number; rir: number | null }[] }>>('lastSets', {});
    const bests = store.get<Record<string, number>>('bests', {});
    for (const ex of list()) {
      const done = setsFor(ex).filter((x) => x.done && x.kg !== null) as (Set & { kg: number })[];
      if (!done.length) continue;
      lastSets[ex.id] = { date, sets: done.map(({ kg, reps, rir }) => ({ kg, reps, rir })) };
      bests[ex.id] = Math.max(bests[ex.id] ?? 0, ...done.map((x) => e1rm(x.kg, x.reps, x.rir)));
    }
    store.set('lastSets', lastSets);
    store.set('bests', bests);
    store.set('lastDay', day);
    saved.logged = true;
    save();
  };
  const hint = $('[data-log-hint]');
  const logIt = () => {
    const lines = logLines();
    if (!lines.length) {
      hint.textContent = s.nothing;
      return;
    }
    window.open(issueUrl(`[log] ${date} ${day}`, lines.join('\n')), '_blank', 'noopener');
    finish();
    hint.textContent = s.logHint;
  };
  root.querySelectorAll('[data-log-it]').forEach((b) => b.addEventListener('click', logIt));
  const copyBtn = $<HTMLButtonElement>('[data-copy]');
  copyBtn.addEventListener('click', async () => {
    const text = [`${date} ${day}`, ...logLines()].join('\n') + '\n';
    finish();
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = s.copied;
      setTimeout(() => (copyBtn.textContent = s.copy), 1600);
    } catch {
      window.prompt(s.copy, text);
    }
  });

  // ---------- events ----------
  const current = () => (active ? { ex: info(active.ex), st: setsFor(info(active.ex))[active.i] } : null);
  const adjust = (field: 'kg' | 'reps', dir: 1 | -1) => {
    const c = current();
    if (!c) return;
    touch();
    if (field === 'kg') {
      const step = STEP[c.ex.equipment];
      const base = c.st.kg ?? (c.ex.equipment === 'bodyweight' ? 0 : c.ex.equipment === 'barbell' ? 20 : step * 4);
      c.st.kg = Math.max(0, Math.round((base + (c.st.kg === null ? 0 : dir * step)) * 100) / 100);
    } else c.st.reps = Math.max(1, c.st.reps + dir);
    haptic(8);
    save();
    renderBoard();
    renderList();
  };
  $('[data-kg-minus]').addEventListener('click', () => adjust('kg', -1));
  $('[data-kg-plus]').addEventListener('click', () => adjust('kg', 1));
  $('[data-reps-minus]').addEventListener('click', () => adjust('reps', -1));
  $('[data-reps-plus]').addEventListener('click', () => adjust('reps', 1));
  $('[data-b-kg]').addEventListener('click', () => {
    const c = current();
    if (!c) return;
    const v = window.prompt(s.enterKg, c.st.kg === null ? '' : String(c.st.kg));
    if (v === null) return;
    const n = Number(v.normalize('NFKC').replace(',', '.'));
    if (Number.isFinite(n) && n >= 0 && n < 1000) {
      touch();
      c.st.kg = Math.round(n * 100) / 100;
      save();
      render();
    }
  });
  root.querySelectorAll<HTMLButtonElement>('[data-rir]').forEach((b) =>
    b.addEventListener('click', () => {
      const c = current();
      if (!c) return;
      const v = Number(b.dataset.rir);
      c.st.rir = c.st.rir === v ? null : v;
      save();
      renderBoard();
      renderList();
    }),
  );
  $('[data-b-done]').addEventListener('click', () => {
    const c = current();
    if (!c || c.st.kg === null) return;
    touch();
    const wasDone = c.st.done;
    // Live PR: beat the best e1RM from the log, this phone, and earlier sets today (needs a baseline).
    const others = allSets().filter((x) => x.ex.id === c.ex.id && x.st !== c.st && x.st.done && x.st.kg !== null);
    const base = Math.max(bestOf(c.ex.id), ...others.map((x) => e1rm(x.st.kg!, x.st.reps, x.st.rir)));
    const value = e1rm(c.st.kg, c.st.reps, c.st.rir);
    c.st.done = true;
    // Bodyweight lifts are left out: the screen only knows the added load, not today's body weight.
    c.st.pr = !wasDone && base > 0 && c.ex.equipment !== 'bodyweight' && value > base * 1.005;
    saved.startedAt ??= Date.now();
    saved.finishedAt = Date.now();
    save();
    haptic(20);
    active = null;
    renderList();
    if (c.st.pr) showPr(c.ex, value, base);
    if (!firstOpen()) {
      board.hidden = true;
      showSummary();
      return;
    }
    if (!wasDone) startTimer(c.ex.rest);
    else renderBoard();
  });
  listEl.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-select]');
    if (!b) return;
    const [ex, i] = b.dataset.select!.split(':');
    active = { ex, i: Number(i) };
    if (!timer.hidden) stopTimer();
    render();
    board.querySelector<HTMLElement>('[data-b-done]')?.focus();
  });
  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const wk = target.closest<HTMLButtonElement>('.wk-week');
    if (wk) {
      week = Number(wk.dataset.week);
      store.set('week', week);
      store.set('weekSetOn', isoToday());
      active = null;
      return render();
    }
    const dy = target.closest<HTMLButtonElement>('.wk-day');
    if (dy) {
      open(hasData(saved) && !saved.logged ? date : isoToday(), dy.dataset.day as 'A' | 'B');
      active = null;
      return render();
    }
  });
  $('[data-reset]').addEventListener('click', () => {
    if (hasData(saved) && !window.confirm(s.resetConfirm)) return;
    saved = { sets: {}, logged: false };
    active = null;
    save();
    stopTimer();
    render();
  });

  // Resume a running rest after a reload.
  const pending = store.get<number>('timerEndsAt', 0);
  render();
  if (pending > Date.now()) {
    endsAt = pending;
    board.hidden = true;
    timer.hidden = false;
    tick = window.setInterval(update, 250);
    update();
  }
}
