import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { useAresData } from "./useAresData";

var C = {
  bg: "#F5F5F7", white: "#FFFFFF", border: "#E8E8ED",
  red: "#C8001E", redDk: "#8A0012", redLight: "#C8001E08", redMid: "#C8001E22",
  dark: "#0A0A0A", darkCard: "#161616", darkBorder: "#2A2A2A",
  text: "#1A1A1A", gray: "#6B6B6B", grayLight: "#9E9E9E", faint: "#F0F0F2",
  green: "#34C759", greenBg: "#34C75912",
  amber: "#FF9500", amberBg: "#FF950012",
  blue: "#007AFF", blueBg: "#007AFF12",
};

var sh = { sm: "0 1px 3px rgba(0,0,0,.06)", md: "0 4px 12px rgba(0,0,0,.08)", red: "0 0 0 1px #C8001E22,0 4px 20px #C8001E14" };

var CSS = [
  "@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700;800;900&display=swap');",
  "*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;font-family:'Inter',system-ui,sans-serif}",
  "::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#C8001E33;border-radius:99px}",
  "input::placeholder,textarea::placeholder{color:#9E9E9E}",
  "select option{background:#fff;color:#1A1A1A}",
  "@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}",
  "@keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}",
  "@keyframes popIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}",
  "@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}",
  "@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}",
  "@keyframes xpGlow{0%,100%{box-shadow:0 0 4px #C8001E33}50%{box-shadow:0 0 10px #C8001E55}}",
  ".au{animation:fadeUp .25s ease}.pop{animation:popIn .2s ease}.fab-pulse{animation:pulse 2.5s ease infinite}.xp-glow{animation:xpGlow 2s ease infinite}",
].join("\n");

var LEVELS = [
  { id: "iniciante", label: "Iniciante", next: "amador", xpNeeded: 0, color: "#8E8E93", rank: "E" },
  { id: "amador", label: "Amador", next: "semi", xpNeeded: 500, color: C.green, rank: "D" },
  { id: "semi", label: "Semi-Pro", next: "profissional", xpNeeded: 1500, color: C.blue, rank: "C" },
  { id: "profissional", label: "Profissional", next: "elite", xpNeeded: 3000, color: C.red, rank: "B" },
  { id: "elite", label: "Elite", next: null, xpNeeded: 5000, color: C.red, rank: "A" },
];
function getLevel(xp) { return LEVELS.reduce(function(a, l) { return xp >= l.xpNeeded ? l : a; }, LEVELS[0]); }
function getNextLevel(cur) { return LEVELS.find(function(l) { return l.id === (cur ? cur.next : null); }) || null; }
var XP_SESSION = 50, XP_WEEK = 200;
var ADMIN_KEYS = ["lucas", "admin", "teste", "ares"];
function getEffectivePlan(u) { if (!u) return "free"; var n = (u.name || "").toLowerCase(), e = (u.email || "").toLowerCase(); return ADMIN_KEYS.some(function(k) { return n.includes(k) || e.includes(k); }) ? "admin" : u.plan || "free"; }

var SPORTS = [
  { id: "flag", name: "Flag Football", icon: "🏈", cat: "Americano", positions: ["Wide Receiver", "Running Back", "Quarterback", "Safety", "Corner", "Linebacker"] },
  { id: "futebol", name: "Futebol", icon: "⚽", cat: "Coletivo", positions: ["Atacante", "Meia", "Volante", "Lateral", "Zagueiro", "Goleiro"] },
  { id: "basket", name: "Basquete", icon: "🏀", cat: "Coletivo", positions: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"] },
  { id: "volei", name: "Volei", icon: "🏐", cat: "Coletivo", positions: ["Levantador", "Oposto", "Ponteiro", "Central", "Libero"] },
  { id: "mma", name: "MMA", icon: "🥊", cat: "Combate", positions: ["Peso Leve", "Meio-Medio", "Medio", "Pesado"] },
  { id: "jiu", name: "Jiu-Jitsu", icon: "🤼", cat: "Combate", positions: ["Leve", "Medio", "Pesado"] },
  { id: "corrida", name: "Corrida", icon: "👟", cat: "Individual", positions: ["5km", "10km", "Meia-maratona", "Maratona"] },
  { id: "natacao", name: "Natacao", icon: "🏊", cat: "Individual", positions: ["Crawl", "Costas", "Peito", "Borboleta"] },
  { id: "cross", name: "CrossFit", icon: "⚡", cat: "Funcional", positions: ["Scaled", "RX", "Elite"] },
  { id: "muscu", name: "Musculacao", icon: "💪", cat: "Musculacao", positions: ["Hipertrofia", "Forca", "Definicao", "Iniciante"] },
  { id: "cali", name: "Calistenia", icon: "🤸", cat: "Musculacao", positions: ["Iniciante", "Skills", "Street Workout"] },
  { id: "power", name: "Powerlifting", icon: "🏋️", cat: "Funcional", positions: ["74kg", "83kg", "93kg", "105kg"] },
];
var CATS = ["Todos", "Americano", "Coletivo", "Combate", "Individual", "Funcional", "Musculacao"];
var GOALS = ["Velocidade e explosao", "Forca maxima", "Resistencia", "Performance completa", "Hipertrofia", "Composicao corporal", "Prevencao de lesoes"];

var SPORT_METRICS = {
  flag: { metrics: [{ id: "forty", label: "40 Jardas", unit: "s", icon: "⏱️", lower: true }, { id: "shuttle", label: "5-10-5", unit: "s", icon: "🔄", lower: true }, { id: "catches", label: "Catches", unit: "", icon: "🤲" }], fields: [{ id: "forty_time", label: "Tempo 40yd (s)", type: "number" }, { id: "shuttle_time", label: "Shuttle (s)", type: "number" }, { id: "catches_count", label: "Catches", type: "number" }] },
  muscu: { metrics: [{ id: "bench", label: "PR Supino", unit: "kg", icon: "🏋️" }, { id: "squat", label: "PR Agachamento", unit: "kg", icon: "🦵" }, { id: "deadlift", label: "PR Terra", unit: "kg", icon: "💪" }], fields: [{ id: "bench_max", label: "Supino max (kg)", type: "number" }, { id: "squat_max", label: "Agach. max (kg)", type: "number" }, { id: "deadlift_max", label: "Terra max (kg)", type: "number" }] },
  futebol: { metrics: [{ id: "sprint30", label: "Sprint 30m", unit: "s", icon: "⏱️", lower: true }, { id: "yoyo", label: "Yo-Yo IR1", unit: "m", icon: "🏃" }, { id: "distance", label: "Dist./Jogo", unit: "km", icon: "📏" }], fields: [{ id: "sprint_time", label: "Sprint 30m (s)", type: "number" }, { id: "distance_km", label: "Distancia (km)", type: "number" }] },
  mma: { metrics: [{ id: "rounds", label: "Rounds", unit: "", icon: "🥊" }, { id: "grip", label: "Grip", unit: "kg", icon: "✊" }, { id: "vo2", label: "VO2 Max", unit: "ml/kg", icon: "❤️" }], fields: [{ id: "rounds_done", label: "Rounds completos", type: "number" }, { id: "sparring_min", label: "Sparring (min)", type: "number" }, { id: "weight_today", label: "Peso hoje (kg)", type: "number" }] },
  corrida: { metrics: [{ id: "pace5k", label: "Pace 5K", unit: "min/km", icon: "🏃", lower: true }, { id: "weekly_km", label: "KM Semanal", unit: "km", icon: "📏" }, { id: "longest", label: "Long Run", unit: "km", icon: "🛤️" }], fields: [{ id: "distance_km", label: "Distancia (km)", type: "number" }, { id: "avg_pace", label: "Pace medio", type: "number" }, { id: "avg_hr", label: "FC media (bpm)", type: "number" }] },
  cross: { metrics: [{ id: "fran", label: "Fran", unit: "min", icon: "⏱️", lower: true }, { id: "clean", label: "PR Clean", unit: "kg", icon: "🏋️" }, { id: "snatch", label: "PR Snatch", unit: "kg", icon: "🏋️" }], fields: [{ id: "wod_name", label: "Nome do WOD", type: "text" }, { id: "wod_score", label: "Score/Tempo", type: "text" }] },
  natacao: { metrics: [{ id: "pace100", label: "Pace 100m", unit: "s", icon: "🏊", lower: true }, { id: "weekly_m", label: "Metragem Sem.", unit: "m", icon: "📏" }], fields: [{ id: "distance_m", label: "Distancia (m)", type: "number" }, { id: "best_100", label: "Melhor 100m (s)", type: "number" }] },
};
function getSportMetrics(id) { return SPORT_METRICS[id] || { metrics: [], fields: [] }; }

function mkEx(n, s, r, rest, notes, alt) { return { n, s, r, rest, notes, alt }; }
function mkMob(n, d, notes) { return { n, d, notes }; }

function buildSessions() {
  return {
    1: [
      { name: "Forca Base", type: "Forca", icon: "🔵", xp: 50, warmup: [mkMob("Aquecimento","8 min",""),mkMob("Ativacao","5 min","")], main: [mkEx("Squat","4x6","6 reps","120s","Tecnica","Goblet"),mkEx("Deadlift","3x6","6 reps","120s","","RDL"),mkEx("Bench Press","3x8","8 reps","90s","","Push-up"),mkEx("Pull-up","3x8","8 reps","90s","","Lat pulldown"),mkEx("Plank","3x45s","45s","60s","","Dead bug")], cardio: [mkMob("Z2","15 min","FC 120-140")], cooldown: [mkMob("Stretch","10 min","")] },
      { name: "Velocidade", type: "Campo", icon: "🔴", xp: 55, warmup: [mkMob("Sprint prog.","4x30m",""),mkMob("Dynamic","8 min","")], main: [mkEx("Sprint 20m","6 reps","Cron.","2 min","",""),mkEx("5-10-5","6 reps","Cron.","2 min","","T-drill"),mkEx("Agilidade","15 min","","","","")], cardio: [mkMob("Intervalado","20 min","30s/30s")], cooldown: [mkMob("Stretch","10 min","")] },
      { name: "Condicionamento", type: "Condicionamento", icon: "🟠", xp: 45, warmup: [mkMob("Trote","5 min","")], main: [mkEx("Aerobico Z2","1x30min","30 min","","FC 120-140",""),mkEx("Core","3x12","12 reps","60s","","")], cardio: [], cooldown: [mkMob("Yoga","10 min","")] },
      { name: "Recuperacao", type: "Recuperacao", icon: "💚", xp: 30, warmup: [mkMob("Mobilidade","10 min","")], main: [mkEx("Tecnica","30 min","","","",""),mkEx("Mobilidade","20 min","","","","")], cardio: [mkMob("Caminhada","20 min","")], cooldown: [mkMob("Foam roller","10 min","")] },
    ],
    2: [
      { name: "Potencia", type: "Forca", icon: "🔴", xp: 60, warmup: [mkMob("Ativacao","10 min","")], main: [mkEx("Jump Squat","4x4","4 reps","3 min","","Box jump"),mkEx("Power Clean","4x3","3 reps","3 min","","Hang clean"),mkEx("Agach. 85%","3x4","4 reps","120s","","Leg press"),mkEx("Bounding","4x30m","4 reps","2 min","","")], cardio: [], cooldown: [mkMob("Recovery","10 min","")] },
      { name: "Especificidade", type: "Campo", icon: "🔴", xp: 65, warmup: [mkMob("Drills","10 min","")], main: [mkEx("Drills 1","15 min","","","",""),mkEx("Drills 2","15 min","","","",""),mkEx("Cond.","20 min","","","","")], cardio: [], cooldown: [mkMob("Stretch","10 min","")] },
      { name: "Forca Max.", type: "Forca", icon: "🔵", xp: 60, warmup: [mkMob("Progressao","15 min","")], main: [mkEx("Squat 85%","4x4","4 reps","2 min","",""),mkEx("DL 85%","3x4","4 reps","2 min","",""),mkEx("Bench 85%","4x4","4 reps","2 min","","")], cardio: [], cooldown: [mkMob("Recovery","10 min","")] },
      { name: "Cond. Avancado", type: "Condicionamento", icon: "🟠", xp: 55, warmup: [mkMob("Aquec.","8 min","")], main: [mkEx("HIIT","3x8","20s/10s","","",""),mkEx("Sprints","8x100m","Cron.","2 min","","")], cardio: [], cooldown: [mkMob("Stretch","15 min","")] },
    ],
    3: [
      { name: "Pico Forca", type: "Forca", icon: "🔴", xp: 70, warmup: [mkMob("Aquec.","20 min","50-90%")], main: [mkEx("Squat 90%","3x3","3 reps","3 min","",""),mkEx("DL 90%","3x2","2 reps","3 min","",""),mkEx("Bench 90%","3x3","3 reps","2 min","","")], cardio: [], cooldown: [mkMob("Recovery","15 min","")] },
      { name: "Vel. Maxima", type: "Campo", icon: "🔴", xp: 70, warmup: [mkMob("Ramp-up","6x60m","")], main: [mkEx("Sprints max","6x40m","Cron.","4 min","",""),mkEx("Simulacao","30 min","","","","")], cardio: [], cooldown: [mkMob("Recovery","15 min","")] },
      { name: "Simulacao", type: "Jogo", icon: "🏆", xp: 75, warmup: [mkMob("Game day","15 min","")], main: [mkEx("Simulado","45 min","","","",""),mkEx("Analise","15 min","","","","")], cardio: [], cooldown: [mkMob("Recovery","20 min","")] },
      { name: "Taper", type: "Recuperacao", icon: "💚", xp: 40, warmup: [mkMob("Mobilidade","15 min","")], main: [mkEx("Vol -60%","1 serie","","2 min","","")], cardio: [mkMob("Z1","15 min","")], cooldown: [mkMob("Descanso","10 min","")] },
    ],
  };
}

function generatePlan(config) {
  var sp = SPORTS.find(function(s) { return s.id === config.sport; }) || SPORTS[0];
  var sessions = buildSessions();
  var phases = [{ name: "Base", color: C.blue }, { name: "Desenvolvimento", color: C.amber }, { name: "Pico", color: C.red }];
  var d = Math.min(Math.max(parseInt(config.daysPerWeek) || 4, 3), 6);
  var mins = parseInt(config.minutesPerSession) || 60;
  var intensities = ["","Leve","Moderada","Moderada","Alta","Alta","Maxima","Maxima","Maxima","Pico","Pico","Pico"];
  var weeks = [];
  for (var wi = 0; wi < 12; wi++) {
    var phIdx = Math.floor(wi / 4), phase = phases[phIdx], pool = sessions[phIdx + 1] || sessions[1], isDeload = (wi + 1) % 4 === 0;
    var recov = pool.find(function(s) { return s.type === "Recuperacao"; });
    var wS = isDeload && recov ? [recov] : pool.slice(0, d);
    weeks.push({ week: wi + 1, phase: phase.name, phaseColor: phase.color, isDeload, intensity: isDeload ? "Deload" : (intensities[wi + 1] || "Alta"), sessions: wS.map(function(s, si) { return Object.assign({}, s, { id: "w" + (wi + 1) + "s" + si, weekNum: wi + 1, completed: false, duration: mins }); }) });
  }
  return { id: Date.now(), sport: sp.id, sportName: sp.name, sportIcon: sp.icon, position: config.position, level: config.level || "amador", daysPerWeek: d, minutesPerSession: mins, totalWeeks: 12, phases, weeks, currentWeek: 1, xp: 0 };
}

/* UI Components */
function Card(p) { var [h, sH] = useState(false); return <div onClick={p.onClick} onMouseEnter={function() { if (p.hover || p.onClick) sH(true); }} onMouseLeave={function() { sH(false); }} style={Object.assign({ background: C.white, borderRadius: 14, border: "1px solid " + (p.red ? C.redMid : C.border), boxShadow: p.red ? sh.red : (h ? sh.md : sh.sm), position: "relative", overflow: "hidden", cursor: p.onClick ? "pointer" : "default", transition: "all .15s", transform: h && (p.hover || p.onClick) ? "translateY(-1px)" : "none" }, p.style || {})}>{p.children}</div>; }

function Btn(p) { var [h, sH] = useState(false); var v = p.v || "primary"; var vars = { primary: { background: h ? "#A8001A" : C.red, color: "#fff" }, secondary: { background: "transparent", color: C.red, border: "1.5px solid " + C.red }, ghost: { background: h ? C.faint : "transparent", color: C.gray } }; return <button onClick={p.onClick} disabled={p.disabled} onMouseEnter={function() { sH(true); }} onMouseLeave={function() { sH(false); }} style={Object.assign({ borderRadius: 10, fontWeight: 700, letterSpacing: .5, cursor: p.disabled ? "not-allowed" : "pointer", transition: "all .15s", opacity: p.disabled ? 0.4 : 1, display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center", border: "none", padding: p.sm ? "8px 16px" : "12px 24px", fontSize: p.sm ? 12 : 13, width: p.full ? "100%" : "auto", minHeight: p.sm ? 36 : 44, textTransform: "uppercase" }, vars[v] || vars.primary, p.style || {})}>{p.icon && <span style={{ fontSize: 14 }}>{p.icon}</span>}{p.children}</button>; }

function Inp(p) { var [f, sF] = useState(false); var base = { background: f ? C.white : C.faint, border: "1px solid " + (f ? C.red + "55" : C.border), borderRadius: 10, color: C.text, padding: "11px 14px", fontSize: 14, width: "100%", outline: "none", transition: "all .15s", minHeight: 44 }; return <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{p.label && <div style={{ color: C.gray, fontSize: 11, fontWeight: 600 }}>{p.label}</div>}{p.options ? <select value={p.value} onChange={function(e) { p.onChange(e.target.value); }} onFocus={function() { sF(true); }} onBlur={function() { sF(false); }} style={base}>{p.options.map(function(o) { return <option key={o.v || o} value={o.v || o}>{o.l || o}</option>; })}</select> : p.rows ? <textarea value={p.value} onChange={function(e) { p.onChange(e.target.value); }} placeholder={p.placeholder} rows={p.rows} onFocus={function() { sF(true); }} onBlur={function() { sF(false); }} style={Object.assign({}, base, { resize: "vertical" })} /> : <input type={p.type || "text"} value={p.value} onChange={function(e) { p.onChange(e.target.value); }} placeholder={p.placeholder} onFocus={function() { sF(true); }} onBlur={function() { sF(false); }} style={base} />}{p.hint && <div style={{ color: C.grayLight, fontSize: 10 }}>{p.hint}</div>}</div>; }

function Tag(p) { var c = p.color || C.red; return <span style={{ background: c + "12", color: c, padding: "3px 8px", borderRadius: 5, fontSize: p.size || 10, fontWeight: 700, whiteSpace: "nowrap" }}>{p.children}</span>; }
function SL(p) { return <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: p.mb !== undefined ? p.mb : 12 }}><div style={{ width: 3, height: 12, background: C.red, borderRadius: 99 }} /><span style={{ color: C.gray, fontSize: 11, fontWeight: 700, letterSpacing: .5, textTransform: "uppercase" }}>{p.children}</span></div>; }
function AresLogo(p) { var s = p.size || 36; return <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: s * 0.7, color: p.mono ? "#fff" : C.red, letterSpacing: 3, lineHeight: 1 }}>ARES</div>{p.showText !== false && <div style={{ fontSize: s * 0.22, color: p.mono ? "#ffffff66" : C.grayLight, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>PERFORMANCE</div>}</div>; }

var SPORT_COVERS = { flag: { gradient: "linear-gradient(135deg,#1a1a2e,#16213e)", accent: "#e94560", icon: "🏈" }, futebol: { gradient: "linear-gradient(135deg,#0d3b0d,#1a472a)", accent: "#4caf50", icon: "⚽" }, basket: { gradient: "linear-gradient(135deg,#2d1b00,#4a2800)", accent: "#ff9800", icon: "🏀" }, volei: { gradient: "linear-gradient(135deg,#1a237e,#283593)", accent: "#5c6bc0", icon: "🏐" }, mma: { gradient: "linear-gradient(135deg,#1a0000,#330000)", accent: "#f44336", icon: "🥊" }, jiu: { gradient: "linear-gradient(135deg,#1a1a1a,#2d2d2d)", accent: "#9e9e9e", icon: "🤼" }, corrida: { gradient: "linear-gradient(135deg,#004d40,#00695c)", accent: "#26a69a", icon: "👟" }, natacao: { gradient: "linear-gradient(135deg,#01579b,#0277bd)", accent: "#29b6f6", icon: "🏊" }, cross: { gradient: "linear-gradient(135deg,#1a1a1a,#2d1f00)", accent: "#ffc107", icon: "⚡" }, muscu: { gradient: "linear-gradient(135deg,#1a0a0a,#2d0a0a)", accent: C.red, icon: "💪" }, cali: { gradient: "linear-gradient(135deg,#1a0033,#2d004d)", accent: "#ab47bc", icon: "🤸" }, power: { gradient: "linear-gradient(135deg,#1a1a1a,#333333)", accent: "#78909c", icon: "🏋️" } };
function SportCover(p) { var cover = SPORT_COVERS[p.sport] || SPORT_COVERS.muscu; var h = p.size === "sm" ? 80 : p.size === "md" ? 120 : 160; return <div style={{ width: "100%", height: h, background: cover.gradient, borderRadius: p.radius || 14, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", right: -20, bottom: -20, fontSize: h * 0.8, opacity: 0.06 }}>{cover.icon}</div><div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: cover.accent }} />{p.children}</div>; }

function AresAvatar(p) { var level = p.level || 1, size = p.size || 80; var cover = SPORT_COVERS[p.sport] || SPORT_COVERS.muscu; var bodyColor = level >= 5 ? "#FFD700" : level >= 4 ? C.red : level >= 3 ? C.blue : level >= 2 ? C.green : "#8E8E93"; var hasGlow = level >= 4, hasBand = level >= 3, hasShield = level >= 4; return <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}><svg width={size} height={size} viewBox="0 0 100 100">{level >= 5 && <circle cx="50" cy="50" r="48" fill="none" stroke="#FFD70033" strokeWidth="3"><animate attributeName="r" values="46;48;46" dur="2s" repeatCount="indefinite" /></circle>}<circle cx="50" cy="50" r="44" fill={bodyColor + "22"} stroke={bodyColor + "44"} strokeWidth="2" /><circle cx="50" cy="35" r="12" fill={bodyColor} /><path d="M30 75 Q30 55 50 50 Q70 55 70 75" fill={bodyColor} opacity="0.8" />{hasBand && <rect x="38" y="29" width="24" height="3" rx="1.5" fill="#fff" opacity="0.6" />}{hasShield && <g transform="translate(40,58)"><path d="M10 0 L20 5 L20 14 Q20 20 10 22 Q0 20 0 14 L0 5 Z" fill={bodyColor} opacity="0.9" /><text x="10" y="15" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="900">{level >= 5 ? "★" : "A"}</text></g>}{hasGlow && <circle cx="50" cy="50" r="44" fill="none" stroke={bodyColor} strokeWidth="1" opacity="0.4"><animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" /></circle>}<text x="80" y="90" fontSize="14" textAnchor="middle">{cover.icon}</text><circle cx="82" cy="18" r="12" fill={bodyColor} /><text x="82" y="22" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900">{level}</text></svg></div>; }

function XPBar(p) { var xp = p.xp, cur = getLevel(xp), nxt = getNextLevel(cur), base = cur.xpNeeded, next = nxt ? nxt.xpNeeded : base + 2000, pct = nxt ? Math.round(((xp - base) / (next - base)) * 100) : 100; return <div style={{ padding: "14px 16px", background: C.dark, borderRadius: 12 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div className="xp-glow" style={{ width: 28, height: 28, borderRadius: 7, background: cur.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff" }}>{cur.rank}</div><div><div style={{ color: "#ffffffcc", fontWeight: 700, fontSize: 13 }}>{cur.label.toUpperCase()}</div>{nxt && <div style={{ color: "#ffffff44", fontSize: 9 }}>{"proximo: " + nxt.label}</div>}</div></div><div style={{ color: C.red, fontSize: 13, fontWeight: 700 }}>{xp + " XP"}</div></div><div style={{ background: "#ffffff14", borderRadius: 99, height: 5, overflow: "hidden" }}><div style={{ height: "100%", background: "linear-gradient(90deg," + C.redDk + "," + C.red + ")", borderRadius: 99, width: pct + "%", transition: "width .8s" }} /></div><div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}><span style={{ color: "#ffffff33", fontSize: 9 }}>{(xp - base) + "/" + (nxt ? next - base : "MAX")}</span><span style={{ color: "#ffffff55", fontSize: 9 }}>{pct + "%"}</span></div></div>; }

var EX_INSTRUCTIONS = { "squat": "Pes na largura dos ombros. Desca controlando o quadril. Joelhos alinhados. Suba explosivo.", "deadlift": "Pes na largura do quadril. Barra sobre meio do pe. Lombar neutra. Suba rente ao corpo.", "bench": "Escapulas retraidas. Desca a barra ao peito. Cotovelos a 45 graus.", "pull": "Pegada pronada. Puxe liderando com o peito. Escapulas retraidas no topo.", "plank": "Antebracos no chao. Corpo reto. Gluteo e abdomen ativados.", "jump": "Agachamento + salto explosivo. Aterrisse suave.", "clean": "Primeira puxada ate o joelho. Segunda puxada explosiva.", "sprint": "Primeiros passos curtos. Corpo inclinado. Aumente comprimento.", "5-10-5": "Sprint 5yd, toque. Mude direcao 10yd. Mude, sprint 5yd.", "supino": "Escapulas retraidas. Barra desce ao peito. Empurre explosivo.", "remada": "Tronco 45 graus. Puxe ate o umbigo. Cotovelos junto ao corpo.", };
function getExInstruction(name) { if (!name) return null; var low = name.toLowerCase(); var key = Object.keys(EX_INSTRUCTIONS).find(function(k) { return low.includes(k); }); return key ? EX_INSTRUCTIONS[key] : null; }

function tc(t) { return { Forca: C.blue, Hipertrofia: C.red, Campo: C.red, Condicionamento: C.amber, Recuperacao: C.green, Adaptacao: C.blue, Jogo: C.amber }[t] || C.gray; }

/* WORKOUT MODAL */
function WorkoutModal(p) {
  var session = p.session, week = p.week;
  var [tab, sTab] = useState("warmup");
  var [loads, setLoads] = useState({});
  var tabs = [{ id: "warmup", label: "Aquecimento", icon: "🔥" }, { id: "main", label: "Principal", icon: "💪" }, { id: "cardio", label: "Cardio", icon: "🏃" }, { id: "cooldown", label: "Cooldown", icon: "❄️" }];
  var items = session ? (session[tab] || []) : [], isMain = tab === "main";
  function setLoad(i, field, val) { setLoads(function(prev) { var n = Object.assign({}, prev); if (!n[i]) n[i] = {}; n[i][field] = val; return n; }); }
  return <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
    <div onClick={p.onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)" }} />
    <div className="pop" style={{ background: C.bg, borderRadius: "20px 20px 0 0", position: "relative", zIndex: 1, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 20px 12px", background: C.white, borderBottom: "1px solid " + C.border, borderRadius: "20px 20px 0 0" }}>
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 99, margin: "0 auto 12px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.grayLight, fontSize: 10, marginBottom: 3 }}>{"Semana " + (week ? week.week : "")}</div>
            <div style={{ color: C.text, fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 1 }}>{session ? session.name : ""}</div>
            <div style={{ display: "flex", gap: 5, marginTop: 6 }}><Tag color={tc(session ? session.type : "")}>{session ? session.type : ""}</Tag><Tag color={C.red}>{"+" + (session ? session.xp || 50 : 50) + " XP"}</Tag></div>
          </div>
          {session && !session.completed ? <Btn onClick={function() { if (p.onComplete) p.onComplete(loads); p.onClose(); }} sm>Concluir</Btn> : <Tag color={C.green}>FEITO</Tag>}
        </div>
      </div>
      <div style={{ background: C.white, borderBottom: "1px solid " + C.border, display: "flex", padding: "0 8px", overflowX: "auto" }}>
        {tabs.map(function(t) { return <button key={t.id} onClick={function() { sTab(t.id); }} style={{ padding: "10px 12px", border: "none", cursor: "pointer", background: "transparent", color: tab === t.id ? C.red : C.grayLight, borderBottom: "2px solid " + (tab === t.id ? C.red : "transparent"), fontWeight: 700, fontSize: 12, textTransform: "uppercase", whiteSpace: "nowrap", minHeight: 42 }}>{t.icon + " " + t.label}</button>; })}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 40px" }}>
        {items.length === 0 && <div style={{ textAlign: "center", padding: "32px 16px", color: C.grayLight }}>Nenhum item</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }} className="au">
          {isMain ? items.map(function(ex, i) {
            var inst = getExInstruction(ex.n), exLoad = loads[i] || {};
            return <Card key={i} style={{ padding: 0 }}>
              <div style={{ display: "flex" }}>
                <div style={{ width: 3, background: tc(session ? session.type : ""), flexShrink: 0 }} />
                <div style={{ flex: 1, padding: "12px 14px" }}>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{(i + 1) + ". " + ex.n}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                    <span style={{ background: C.redLight, padding: "2px 8px", borderRadius: 4, fontSize: 11, color: C.red, fontWeight: 600 }}>{ex.s}</span>
                    <span style={{ background: C.blueBg, padding: "2px 8px", borderRadius: 4, fontSize: 11, color: C.blue, fontWeight: 600 }}>{ex.r}</span>
                    {ex.rest && <span style={{ color: C.grayLight, fontSize: 11 }}>{ex.rest}</span>}
                  </div>
                  {!session.completed && <div style={{ marginTop: 10, padding: "10px 12px", background: C.faint, borderRadius: 8, border: "1px solid " + C.border }}>
                    <div style={{ color: C.gray, fontSize: 9, fontWeight: 700, marginBottom: 6 }}>REGISTRAR CARGA</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                      {[["kg","Kg","80"],["reps","Reps","8"],["rpe","RPE","7"]].map(function(arr) { return <div key={arr[0]}><div style={{ color: C.grayLight, fontSize: 9, marginBottom: 2 }}>{arr[1]}</div><input type="number" value={exLoad[arr[0]] || ""} placeholder={arr[2]} onChange={function(e) { setLoad(i, arr[0], e.target.value); }} style={{ width: "100%", background: C.white, border: "1px solid " + C.border, borderRadius: 6, padding: "7px 8px", fontSize: 13, outline: "none", minHeight: 34 }} /></div>; })}
                    </div>
                    {exLoad.kg && exLoad.reps && <div style={{ marginTop: 6, color: C.green, fontSize: 10, fontWeight: 600 }}>{"Volume: " + (parseInt(exLoad.kg) * parseInt(exLoad.reps)) + " kg"}</div>}
                  </div>}
                  {inst && <div style={{ marginTop: 8, padding: "8px 10px", background: C.blueBg, borderRadius: 6 }}><div style={{ color: C.blue, fontSize: 9, fontWeight: 700, marginBottom: 3 }}>COMO EXECUTAR</div><div style={{ color: C.text, fontSize: 11, lineHeight: 1.5 }}>{inst}</div></div>}
                  {ex.notes && <div style={{ marginTop: 6, background: C.amberBg, borderRadius: 6, padding: "8px 10px", color: C.amber, fontSize: 12 }}>{ex.notes}</div>}
                  {ex.alt && <div style={{ marginTop: 4, color: C.grayLight, fontSize: 11 }}>{"Alt: " + ex.alt}</div>}
                </div>
              </div>
            </Card>;
          }) : items.map(function(w, i) { return <Card key={i} style={{ padding: "12px 14px" }}><div style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{w.n}</div><div style={{ color: tab === "warmup" ? C.amber : tab === "cardio" ? C.green : C.blue, fontSize: 12, marginTop: 2 }}>{w.d}</div>{w.notes && <div style={{ color: C.grayLight, fontSize: 11, marginTop: 4 }}>{w.notes}</div>}</Card>; })}
        </div>
      </div>
    </div>
  </div>;
}

/* LOGIN */
function LoginScreen(p) {
  var [mode, sMode] = useState("welcome");
  var [email, sEmail] = useState(""), [pass, sPass] = useState(""), [name, sName] = useState("");
  var [ld, sLd] = useState(false), [err, sErr] = useState("");

  async function signInGoogle() { sLd(true); sErr(""); var { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } }); if (error) { sErr(error.message); sLd(false); } }
  async function signInApple() { sLd(true); sErr(""); var { error } = await supabase.auth.signInWithOAuth({ provider: "apple", options: { redirectTo: window.location.origin } }); if (error) { sErr(error.message); sLd(false); } }
  async function signUp() { if (!email || !pass) { sErr("Preencha todos os campos."); return; } sLd(true); var { error } = await supabase.auth.signUp({ email, password: pass, options: { data: { name: name || email.split("@")[0] } } }); if (error) { sErr(error.message); } else { sErr("Verifique seu e-mail para confirmar!"); } sLd(false); }
  async function signIn() { if (!email || !pass) { sErr("Preencha todos os campos."); return; } sLd(true); var { error } = await supabase.auth.signInWithPassword({ email, password: pass }); if (error) { sErr("E-mail ou senha incorretos."); sLd(false); } }

  if (mode === "welcome") return <div style={{ minHeight: "100vh", background: C.dark, display: "flex", flexDirection: "column" }}>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px 40px", animation: "fadeUp .5s ease" }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 64, color: "#fff", letterSpacing: 6, lineHeight: 1 }}>ARES</div>
      <div style={{ color: C.red, fontSize: 12, fontWeight: 700, letterSpacing: 4, marginTop: 4 }}>PERFORMANCE</div>
      <div style={{ color: "#ffffff55", fontSize: 14, textAlign: "center", maxWidth: 280, lineHeight: 1.7, marginTop: 24 }}>Inteligencia atletica para qualquer esporte</div>
    </div>
    <div style={{ background: C.white, borderRadius: "24px 24px 0 0", padding: "32px 24px 40px", animation: "slideUp .4s ease" }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.text, letterSpacing: 1, marginBottom: 4 }}>COMECE AGORA</div>
      <div style={{ color: C.gray, fontSize: 13, marginBottom: 24 }}>Crie seu programa em minutos.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={signInGoogle} disabled={ld} style={{ width: "100%", padding: 14, background: C.white, border: "1px solid " + C.border, borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600, color: C.text, minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>🔵 Continuar com Google</button>
        <button onClick={signInApple} disabled={ld} style={{ width: "100%", padding: 14, background: C.dark, border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#fff", minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>🍎 Continuar com Apple</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ flex: 1, height: 1, background: C.border }} /><span style={{ color: C.grayLight, fontSize: 12 }}>ou</span><div style={{ flex: 1, height: 1, background: C.border }} /></div>
        <Btn onClick={function() { sMode("signup"); }} v="secondary" full>Criar conta com e-mail</Btn>
        <div style={{ textAlign: "center" }}><span style={{ color: C.gray, fontSize: 13 }}>Ja tem conta? </span><span onClick={function() { sMode("login"); }} style={{ color: C.red, fontWeight: 600, cursor: "pointer" }}>Entrar</span></div>
        {err && <div style={{ color: C.red, fontSize: 12, textAlign: "center" }}>{err}</div>}
        {ld && <div style={{ color: C.gray, fontSize: 12, textAlign: "center" }}>Aguarde...</div>}
      </div>
    </div>
  </div>;

  return <div style={{ minHeight: "100vh", background: C.dark, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: "#fff", letterSpacing: 4, marginBottom: 28 }}>ARES</div>
    <Card style={{ width: "100%", maxWidth: 400, padding: 28 }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: C.text, letterSpacing: 1, marginBottom: 20 }}>{mode === "signup" ? "CRIAR CONTA" : "ENTRAR"}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {mode === "signup" && <Inp label="Nome" value={name} onChange={sName} placeholder="Seu nome" />}
        <Inp label="E-mail" value={email} onChange={sEmail} placeholder="atleta@email.com" type="email" />
        <Inp label="Senha" value={pass} onChange={sPass} placeholder="Min. 6 caracteres" type="password" />
      </div>
      {err && <div style={{ color: err.includes("Verifique") ? C.green : C.red, fontSize: 12, marginTop: 8 }}>{err}</div>}
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <Btn onClick={mode === "login" ? signIn : signUp} disabled={ld} full>{ld ? "..." : mode === "login" ? "Entrar" : "Criar conta"}</Btn>
        <Btn onClick={function() { sMode("welcome"); }} v="ghost" full sm>Voltar</Btn>
      </div>
    </Card>
  </div>;
}

/* ONBOARDING */
function OnboardScreen(p) {
  var [step, sStep] = useState(0), [age, sAge] = useState(""), [sex, sSex] = useState("Masculino"), [wt, sWt] = useState(""), [ht, sHt] = useState(""), [lv, sLv] = useState("Amador");
  var [cat, sCat] = useState("Todos"), [sport, setSport] = useState(null), [pos, sPos] = useState(""), [goal, sGoal] = useState(GOALS[0]), [days, sDays] = useState("4"), [mins, sMins] = useState("60");
  function pickSport(id) { setSport(id); var s = SPORTS.find(function(s) { return s.id === id; }); if (s) sPos(s.positions[0]); }
  var filtered = cat === "Todos" ? SPORTS : SPORTS.filter(function(s) { return s.cat === cat; });
  var sp = SPORTS.find(function(s) { return s.id === sport; });
  var hdr = <div style={{ background: C.white, borderBottom: "1px solid " + C.border, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><AresLogo size={28} /><div style={{ display: "flex", gap: 4 }}>{[0,1,2].map(function(i) { return <div key={i} style={{ width: i === step ? 24 : 8, height: 3, borderRadius: 99, background: i < step ? C.green : i === step ? C.red : C.border, transition: "all .3s" }} />; })}</div></div>;
  if (step === 0) return <div style={{ minHeight: "100vh", background: C.bg }}>{hdr}<div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 16px" }} className="au"><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.text, letterSpacing: 1, marginBottom: 24 }}>SEU PERFIL</div><Card style={{ padding: 22 }}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}><Inp label="Idade" value={age} onChange={sAge} type="number" placeholder="24" hint="Obrigatorio" /><Inp label="Sexo" value={sex} onChange={sSex} options={["Masculino","Feminino","Outro"].map(function(s) { return { v: s, l: s }; })} /><Inp label="Peso (kg)" value={wt} onChange={sWt} type="number" placeholder="78" /><Inp label="Altura (cm)" value={ht} onChange={sHt} type="number" placeholder="177" /><div style={{ gridColumn: "1/-1" }}><Inp label="Nivel" value={lv} onChange={sLv} options={["Iniciante","Amador","Semi-profissional","Profissional"].map(function(l) { return { v: l, l: l }; })} /></div></div></Card><div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}><Btn onClick={function() { sStep(1); }} disabled={!age}>Proximo</Btn></div></div></div>;
  if (step === 1) return <div style={{ minHeight: "100vh", background: C.bg }}>{hdr}<div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 16px" }} className="au"><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.text, letterSpacing: 1, marginBottom: 24 }}>SEU ESPORTE</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>{CATS.map(function(c) { return <button key={c} onClick={function() { sCat(c); }} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid " + (cat === c ? C.red : C.border), background: cat === c ? C.redLight : C.white, color: cat === c ? C.red : C.gray, cursor: "pointer", fontSize: 11, fontWeight: 600, minHeight: 32 }}>{c}</button>; })}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 8, maxHeight: 320, overflowY: "auto" }}>{filtered.map(function(s) { return <Card key={s.id} hover onClick={function() { pickSport(s.id); }} red={sport === s.id} style={{ padding: "14px 12px", cursor: "pointer" }}><div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div><div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{s.name}</div><div style={{ color: C.grayLight, fontSize: 10, marginTop: 2 }}>{s.cat}</div>{sport === s.id && <div style={{ position: "absolute", top: 6, right: 6 }}><Tag>OK</Tag></div>}</Card>; })}</div>{sp && <Card style={{ padding: 16, marginTop: 12 }}><div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}><span style={{ fontSize: 22 }}>{sp.icon}</span><div style={{ fontWeight: 700, fontSize: 14 }}>{sp.name}</div></div><Inp label="Posicao" value={pos} onChange={sPos} options={sp.positions.map(function(p2) { return { v: p2, l: p2 }; })} /></Card>}<div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}><Btn onClick={function() { sStep(0); }} v="ghost">Voltar</Btn><Btn onClick={function() { sStep(2); }} disabled={!sport || !pos}>Proximo</Btn></div></div></div>;
  return <div style={{ minHeight: "100vh", background: C.bg }}>{hdr}<div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 16px" }} className="au"><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.text, letterSpacing: 1, marginBottom: 24 }}>OBJETIVOS</div><Card style={{ padding: 22 }}><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{GOALS.map(function(g) { return <div key={g} onClick={function() { sGoal(g); }} style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid " + (goal === g ? C.red : C.border), background: goal === g ? C.redLight : C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, minHeight: 44 }}><div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid " + (goal === g ? C.red : C.border), background: goal === g ? C.red : "transparent", flexShrink: 0 }} /><span style={{ fontSize: 13, color: goal === g ? C.red : C.text, fontWeight: goal === g ? 600 : 400 }}>{g}</span></div>; })}</div></Card><Card style={{ padding: 22, marginTop: 12 }}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}><div><div style={{ color: C.gray, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>{"Dias/semana: "}<span style={{ color: C.red, fontSize: 20, fontFamily: "'Bebas Neue',sans-serif" }}>{days + "x"}</span></div><input type="range" min={3} max={6} value={days} onChange={function(e) { sDays(e.target.value); }} style={{ width: "100%", accentColor: C.red }} /></div><div><div style={{ color: C.gray, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>{"Tempo/sessao: "}<span style={{ color: C.red, fontSize: 20, fontFamily: "'Bebas Neue',sans-serif" }}>{mins + "min"}</span></div><input type="range" min={30} max={120} step={15} value={mins} onChange={function(e) { sMins(e.target.value); }} style={{ width: "100%", accentColor: C.red }} /></div></div></Card><div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}><Btn onClick={function() { sStep(1); }} v="ghost">Voltar</Btn><Btn onClick={function() { p.onComplete({ sport, position: pos, level: lv, age, sex, weight: wt, height: ht, goal, daysPerWeek: days, minutesPerSession: mins }); }}>Gerar programa</Btn></div></div></div>;
}

/* DASHBOARD */
function DashboardTab(p) {
  var activity = p.activity, user = p.user, plan = activity ? activity.plan : null;
  var sessions = activity ? (activity.sessions || []) : [];
  var sp = activity ? SPORTS.find(function(s) { return s.id === activity.sport; }) : null;
  var cw = plan ? plan.weeks[plan.currentWeek - 1] : null;
  var ws = cw ? cw.sessions : [], wd = ws.filter(function(s) { return s.completed; }).length, wt2 = ws.length;
  var weekPct = wt2 > 0 ? Math.round((wd / wt2) * 100) : 0;
  var cyclePct = plan ? Math.round(((plan.currentWeek - 1) / 12) * 100) : 0;
  var weekDays = ["S","T","Q","Q","S","S","D"], today = new Date().getDay(), todayIdx = today === 0 ? 6 : today - 1;
  var totalSessions = sessions.length;
  var sm = getSportMetrics(activity ? activity.sport : "");
  var [metricValues, setMetricValues] = useState({});
  var [showMetricEditor, setShowMetricEditor] = useState(false);
  var [dashView, setDashView] = useState("esporte");
  var DASH_VIEWS = [{ id: "esporte", label: "Esporte", icon: "🎯" }, { id: "treino", label: "Treino", icon: "🏋️" }, { id: "semana", label: "Semana", icon: "📅" }, { id: "progresso", label: "Progresso", icon: "📈" }, { id: "corpo", label: "Corpo", icon: "⚖️" }];
  var streak = 0; if (plan) { for (var wi = plan.currentWeek - 1; wi >= 0; wi--) { var w = plan.weeks[wi]; if (w && w.sessions.filter(function(s) { return s.completed; }).length > 0) streak++; else break; } }
  if (!activity) return <div style={{ padding: 40, textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.text }}>NENHUMA ATIVIDADE</div></div>;
  var next = cw ? cw.sessions.find(function(s) { return !s.completed; }) : null;
  return <div className="au" style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 0 20px" }}>
    <SportCover sport={activity.sport} size="md" radius={14}><div style={{ position: "relative", zIndex: 1, padding: "16px 20px", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}><div><div style={{ color: "#ffffff55", fontSize: 10 }}>{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</div><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: "#fff", letterSpacing: 2, marginTop: 2 }}>{sp ? sp.name.toUpperCase() : "ESPORTE"}</div><div style={{ color: "#ffffff77", fontSize: 11, marginTop: 1 }}>{activity.position}</div></div><div style={{ textAlign: "right" }}><div style={{ color: cw ? cw.phaseColor : "#fff", fontWeight: 700, fontSize: 13 }}>{cw ? cw.phase : ""}</div><div style={{ color: "#ffffff44", fontSize: 10 }}>{"Sem " + (plan ? plan.currentWeek : 1) + "/12"}</div></div></div></SportCover>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}><AresAvatar level={Math.min(5, Math.floor((activity.xp || 0) / 1000) + 1)} size={48} sport={activity.sport} /><div><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.text, letterSpacing: 1 }}>{"OLA, " + (user ? user.name.split(" ")[0].toUpperCase() : "ATLETA")}</div><div style={{ color: C.grayLight, fontSize: 11 }}>{"Nivel " + getLevel(activity.xp || 0).label}</div></div></div>
    <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2 }}>{DASH_VIEWS.map(function(v) { var active = dashView === v.id; return <button key={v.id} onClick={function() { setDashView(v.id); }} style={{ padding: "7px 14px", borderRadius: 20, border: "1px solid " + (active ? C.red : C.border), background: active ? C.red : "transparent", color: active ? "#fff" : C.gray, cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4, minHeight: 32 }}><span style={{ fontSize: 12 }}>{v.icon}</span>{v.label}</button>; })}</div>
    {dashView === "esporte" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sm.metrics.length > 0 && <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span style={{ color: C.gray, fontSize: 10, fontWeight: 600 }}>{"METRICAS " + (sp ? sp.name.toUpperCase() : "")}</span><Btn sm v="ghost" onClick={function() { setShowMetricEditor(!showMetricEditor); }}>{showMetricEditor ? "Fechar" : "Editar"}</Btn></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(" + Math.min(sm.metrics.length, 3) + ",1fr)", gap: 8 }}>{sm.metrics.slice(0, 3).map(function(m) { var val = metricValues[m.id], hasVal = val !== undefined && val !== ""; return <Card key={m.id} style={{ padding: "12px 10px", textAlign: "center" }}><div style={{ fontSize: 16, marginBottom: 4 }}>{m.icon}</div><div style={{ color: C.grayLight, fontSize: 9, fontWeight: 600, marginBottom: 4 }}>{m.label.toUpperCase()}</div><div style={{ color: hasVal ? C.text : C.grayLight, fontSize: 20, fontWeight: 800, fontFamily: "'Bebas Neue',sans-serif", lineHeight: 1 }}>{hasVal ? val : "--"}</div><div style={{ color: hasVal ? C.green : C.grayLight, fontSize: 9, marginTop: 2 }}>{hasVal ? m.unit : "toque editar"}</div></Card>; })}</div>
        {showMetricEditor && <Card style={{ padding: 16, marginTop: 8 }}><div style={{ color: C.gray, fontSize: 11, fontWeight: 600, marginBottom: 10 }}>Inserir metricas</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{sm.metrics.map(function(m) { return <div key={m.id}><div style={{ color: C.grayLight, fontSize: 10, fontWeight: 600 }}>{m.icon + " " + m.label}</div><input type="number" step="0.01" value={metricValues[m.id] || ""} placeholder={"Ex: " + (m.lower ? "4.5" : "100")} onChange={function(e) { setMetricValues(function(prev) { var n = Object.assign({}, prev); n[m.id] = e.target.value; return n; }); }} style={{ background: C.faint, border: "1px solid " + C.border, borderRadius: 8, color: C.text, padding: "9px 10px", fontSize: 13, outline: "none", minHeight: 40, width: "100%", marginTop: 4 }} /></div>; })}</div><Btn onClick={function() { setShowMetricEditor(false); }} sm full style={{ marginTop: 10 }}>Salvar</Btn></Card>}
      </div>}
      {next && <Card hover onClick={p.onGoToPlan} style={{ padding: 0, cursor: "pointer" }}><div style={{ display: "flex", alignItems: "stretch" }}><div style={{ width: 4, background: tc(next.type), flexShrink: 0 }} /><div style={{ flex: 1, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 40, height: 40, borderRadius: 10, background: tc(next.type) + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{next.icon || "⚡"}</div><div style={{ flex: 1, minWidth: 0 }}><div style={{ color: C.grayLight, fontSize: 9, fontWeight: 600 }}>PROXIMO TREINO</div><div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{next.name}</div></div><span style={{ color: C.red, fontSize: 16 }}>{">"}</span></div></div></Card>}
      {cw && <div><div style={{ color: C.gray, fontSize: 10, fontWeight: 600, marginBottom: 6 }}>{"SESSOES SEMANA " + cw.week}</div><div style={{ display: "flex", flexDirection: "column", gap: 5 }}>{cw.sessions.map(function(s, i) { return <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: s.completed ? C.greenBg : C.white, borderRadius: 10, border: "1px solid " + (s.completed ? C.green + "22" : C.border), minHeight: 48 }}><div style={{ width: 24, height: 24, borderRadius: "50%", background: s.completed ? C.green : C.faint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0, color: s.completed ? "#fff" : C.grayLight, fontWeight: 700 }}>{s.completed ? "✓" : i + 1}</div><div style={{ flex: 1, minWidth: 0 }}><div style={{ color: s.completed ? C.green : C.text, fontWeight: 600, fontSize: 13 }}>{s.name}</div><div style={{ color: C.grayLight, fontSize: 10, marginTop: 1 }}>{s.type + " - " + s.duration + "min"}</div></div><div style={{ width: 5, height: 5, borderRadius: "50%", background: tc(s.type) }} /></div>; })}</div></div>}
    </div>}
    {dashView === "semana" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Card style={{ padding: "24px 18px" }}><div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", justifyContent: "center" }}><div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}><svg width={120} height={120} style={{ position: "absolute", transform: "rotate(-90deg)" }}><circle cx={60} cy={60} r={50} fill="none" stroke={C.faint} strokeWidth={10} /><circle cx={60} cy={60} r={50} fill="none" stroke={C.red} strokeWidth={10} strokeDasharray={(2*Math.PI*50*Math.min(weekPct,100)/100)+" "+(2*Math.PI*50*(1-Math.min(weekPct,100)/100))} strokeLinecap="round" /></svg><div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: C.text, lineHeight: 1 }}>{wd + "/" + wt2}</div><div style={{ fontSize: 9, color: C.grayLight, marginTop: 1 }}>SESSOES</div></div></div><div style={{ flex: 1, minWidth: 140 }}><div style={{ display: "flex", gap: 5, marginBottom: 12 }}>{weekDays.map(function(day, i) { var isDone = i < wd, isToday = i === todayIdx; return <div key={i} style={{ flex: 1, textAlign: "center" }}><div style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto 3px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, background: isDone ? C.red : isToday ? C.redLight : C.faint, color: isDone ? "#fff" : isToday ? C.red : C.grayLight, border: isToday && !isDone ? "1.5px solid " + C.red : "1.5px solid transparent" }}>{isDone ? "✓" : i+1}</div><div style={{ fontSize: 8, color: isToday ? C.red : C.grayLight }}>{day}</div></div>; })}</div><div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: cw ? (cw.phaseColor+"0A") : C.faint, borderRadius: 6, border: "1px solid "+(cw ? (cw.phaseColor+"22") : C.border) }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: cw ? cw.phaseColor : C.gray }} /><span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{cw ? cw.phase : ""}</span><span style={{ color: C.grayLight, fontSize: 10, marginLeft: "auto" }}>{cw ? cw.intensity : ""}</span></div></div></div></Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <Card style={{ padding: "12px 10px", textAlign: "center" }}><div style={{ color: C.grayLight, fontSize: 9, fontWeight: 600, marginBottom: 4 }}>ADERENCIA</div><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.text }}>{weekPct + "%"}</div></Card>
        <Card style={{ padding: "12px 10px", textAlign: "center" }}><div style={{ color: C.grayLight, fontSize: 9, fontWeight: 600, marginBottom: 4 }}>STREAK</div><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.text }}>{streak > 0 ? streak : "--"}</div></Card>
        <Card style={{ padding: "12px 10px", textAlign: "center" }}><div style={{ color: C.grayLight, fontSize: 9, fontWeight: 600, marginBottom: 4 }}>TOTAL</div><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.text }}>{totalSessions}</div></Card>
      </div>
    </div>}
    {dashView === "treino" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}><Card style={{ padding: "12px 10px", textAlign: "center" }}><div style={{ color: C.grayLight, fontSize: 9, fontWeight: 600, marginBottom: 4 }}>VOLUME SEM.</div><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.text }}>--</div></Card><Card style={{ padding: "12px 10px", textAlign: "center" }}><div style={{ color: C.grayLight, fontSize: 9, fontWeight: 600, marginBottom: 4 }}>RPE MEDIO</div><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.text }}>--</div></Card><Card style={{ padding: "12px 10px", textAlign: "center" }}><div style={{ color: C.grayLight, fontSize: 9, fontWeight: 600, marginBottom: 4 }}>SESSOES</div><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.text }}>{totalSessions}</div></Card></div>
      <Card style={{ padding: "18px 16px" }}><SL mb={10}>Ultimas sessoes</SL>{sessions.length > 0 ? sessions.slice(0, 5).map(function(s, i) { return <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 4 ? "1px solid " + C.faint : "none" }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: tc(s.type) }} /><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 12 }}>{s.type}</div><div style={{ color: C.grayLight, fontSize: 10 }}>{(s.duration || 0) + "min"}</div></div><div style={{ color: C.grayLight, fontSize: 10 }}>{s.date || ""}</div></div>; }) : <div style={{ padding: "16px 0", textAlign: "center", color: C.grayLight, fontSize: 12 }}>Nenhuma sessao</div>}</Card>
    </div>}
    {dashView === "progresso" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Card style={{ padding: "18px 16px" }}><SL mb={10}>Ciclo 12 semanas</SL><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: C.grayLight, fontSize: 9, fontWeight: 600 }}>PROGRESSO</span><span style={{ fontWeight: 700, fontSize: 12, color: C.text }}>{cyclePct + "%"}</span></div><div style={{ display: "flex", gap: 2 }}>{(plan ? plan.weeks : []).map(function(w) { var done = w.sessions.filter(function(s) { return s.completed; }).length, tot = w.sessions.length, allD = done === tot && tot > 0, cur = w.week === (plan ? plan.currentWeek : 1); return <div key={w.week} style={{ flex: 1, height: 8, borderRadius: 99, background: allD ? C.green : cur ? w.phaseColor : C.faint }} />; })}</div></Card>
      <Card style={{ padding: "18px 16px" }}><SL mb={10}>Experiencia</SL><XPBar xp={activity ? activity.xp || 0 : 0} /></Card>
    </div>}
    {dashView === "corpo" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Card style={{ padding: "18px 16px" }}><SL mb={10}>Medidas corporais</SL><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{[{ id: "peso", label: "Peso (kg)", icon: "⚖️" }, { id: "gordura", label: "Gordura (%)", icon: "📐" }, { id: "cintura", label: "Cintura (cm)", icon: "📏" }, { id: "braco", label: "Braco (cm)", icon: "💪" }].map(function(m) { return <div key={m.id}><div style={{ color: C.grayLight, fontSize: 10, fontWeight: 600, marginBottom: 3 }}>{m.icon + " " + m.label}</div><input type="number" step="0.1" placeholder="--" style={{ width: "100%", background: C.faint, border: "1px solid " + C.border, borderRadius: 8, padding: "9px 10px", fontSize: 13, outline: "none", minHeight: 40, color: C.text }} /></div>; })}</div><Btn sm full style={{ marginTop: 12 }}>Salvar medidas</Btn></Card>
    </div>}
  </div>;
}

/* PLAN */
function PlanTab(p) {
  var activity = p.activity, plan = activity ? activity.plan : null;
  var [selW, sSelW] = useState(plan ? plan.currentWeek : 1);
  var [modal, sModal] = useState(null);
  if (!plan) return <div style={{ padding: 40, textAlign: "center", color: C.gray }}>Complete o onboarding.</div>;
  function isUL(wn) { if (wn <= 1) return true; var prev = plan.weeks[wn - 2]; return prev ? prev.sessions.filter(function(s) { return s.completed; }).length === prev.sessions.length && prev.sessions.length > 0 : true; }
  function hC(wn, sid) { p.onMarkComplete(wn, sid); var s = plan.weeks[wn-1] && plan.weeks[wn-1].sessions.find(function(s) { return s.id === sid; }); if (s) p.onXPGain(s.xp || XP_SESSION); var w = plan.weeks[wn-1]; if (w && w.sessions.filter(function(s) { return s.completed || s.id === sid; }).length === w.sessions.length) p.onXPGain(XP_WEEK); }
  var week = plan.weeks[selW - 1], ul = isUL(selW);
  return <div className="au" style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 0 20px" }}>
    {modal && <WorkoutModal session={modal.s} week={modal.w} onClose={function() { sModal(null); }} onComplete={function() { hC(modal.w.week, modal.s.id); sModal(null); }} />}
    <Card style={{ padding: 18 }}><SL>Progressao</SL><div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 3 }}>{plan.weeks.map(function(w) { var done = w.sessions.filter(function(s) { return s.completed; }).length, tot = w.sessions.length, sel = selW === w.week, unlk = isUL(w.week), allD = done === tot && tot > 0; return <button key={w.week} onClick={function() { sSelW(w.week); }} style={{ padding: "6px 2px", border: "1px solid "+(sel ? w.phaseColor : allD ? C.green : !unlk ? "#E8E8ED" : C.border), borderRadius: 5, cursor: unlk ? "pointer" : "not-allowed", background: sel ? w.phaseColor : allD ? C.greenBg : C.faint, color: sel ? "#fff" : allD ? C.green : !unlk ? C.grayLight : C.gray, fontSize: 10, fontWeight: 700, minHeight: 28, position: "relative" }}>{!unlk && !allD ? "🔒" : w.week}{allD && !sel && <div style={{ position: "absolute", top: 1, right: 1, width: 4, height: 4, borderRadius: "50%", background: C.green }} />}</button>; })}</div></Card>
    {week && <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 6 }}><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: C.text, letterSpacing: 1 }}>{"SEMANA " + week.week + " - " + week.phase}</div><div style={{ display: "flex", gap: 4 }}><Tag color={week.phaseColor}>{week.intensity}</Tag>{!ul && <Tag color={C.amber}>BLOQUEADA</Tag>}</div></div>
      {!ul && <div style={{ padding: "12px 14px", background: C.amberBg, borderRadius: 8, marginBottom: 12, fontSize: 12, color: C.amber, fontWeight: 600 }}>{"Conclua semana " + (week.week - 1) + " para desbloquear."}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{week.sessions.map(function(s, i) { return <div key={s.id} onClick={function() { if (ul) sModal({ s, w: week }); }} style={{ display: "flex", alignItems: "stretch", borderRadius: 12, overflow: "hidden", border: "1px solid "+(s.completed ? C.green+"33" : !ul ? "#E8E8ED" : C.border), cursor: ul ? "pointer" : "not-allowed", background: s.completed ? C.greenBg : C.white, minHeight: 64 }}><div style={{ width: 3, background: s.completed ? C.green : tc(s.type), flexShrink: 0 }} /><div style={{ flex: 1, padding: "14px 16px" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{"Dia " + (i+1) + " - " + s.name}</div><div style={{ color: C.grayLight, fontSize: 11, marginTop: 2 }}>{s.type + " - " + s.duration + "min"}</div></div><div style={{ display: "flex", gap: 4, flexShrink: 0 }}><Tag color={C.red}>{"+" + (s.xp || 50)}</Tag>{s.completed && <Tag color={C.green}>OK</Tag>}</div></div><div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 8 }}>{(s.main || []).slice(0, 3).map(function(ex, ei) { return <span key={ei} style={{ background: C.faint, padding: "2px 7px", borderRadius: 4, fontSize: 10, color: C.text }}>{ex.n}</span>; })}</div>{ul && !s.completed && <div style={{ marginTop: 6, color: C.red, fontSize: 11, fontWeight: 600 }}>Ver treino</div>}</div></div>; })}</div>
    </Card>}
  </div>;
}

/* REGISTER */
function RegisterTab(p) {
  var sp = p.activity ? SPORTS.find(function(s) { return s.id === p.activity.sport; }) : null;
  var sm = getSportMetrics(p.activity ? p.activity.sport : "");
  var [type, sType] = useState("Forca"), [dur, sDur] = useState(""), [rpe, sRpe] = useState(7), [notes, sNotes] = useState(""), [saved, sSaved] = useState(false);
  var [sportFields, setSportFields] = useState({});
  var [exs, sExs] = useState([{ name: "", sets: "", reps: "", kg: "", rpe_ex: "" }]);
  function save() { sSaved(true); p.onSave({ id: Date.now(), date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), type, duration: +dur || 60, rpe, notes, exercises: exs, sportData: sportFields }); if (p.onXPGain) p.onXPGain(XP_SESSION); setTimeout(function() { sSaved(false); sDur(""); sNotes(""); sRpe(7); sExs([{ name: "", sets: "", reps: "", kg: "", rpe_ex: "" }]); setSportFields({}); }, 2000); }
  if (saved) return <div className="au" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 16, padding: 24 }}><div style={{ width: 64, height: 64, background: C.greenBg, border: "2px solid "+C.green, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✅</div><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: C.text }}>SESSAO REGISTRADA</div><div style={{ color: C.red, fontWeight: 700 }}>{"+ " + XP_SESSION + " XP"}</div><Btn onClick={function() { sSaved(false); }} v="secondary" sm>Nova sessao</Btn></div>;
  return <div className="au" style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 0 20px" }}>
    <div><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.text, letterSpacing: 1 }}>REGISTRAR</div><div style={{ color: C.grayLight, fontSize: 12, marginTop: 2 }}>{sp ? (sp.icon + " " + sp.name) : ""}</div></div>
    <Card style={{ padding: 20 }}><SL>Dados da sessao</SL><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}><Inp label="Tipo" value={type} onChange={sType} options={["Forca","Hipertrofia","Campo","Condicionamento","Jogo","HIIT"].map(function(t) { return { v: t, l: t }; })} /><Inp label="Duracao (min)" value={dur} onChange={sDur} type="number" placeholder="60" /></div><div><div style={{ color: C.gray, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>{"RPE: "}<span style={{ color: rpe >= 8 ? C.red : rpe >= 5 ? C.amber : C.green, fontSize: 22, fontFamily: "'Bebas Neue',sans-serif" }}>{rpe}</span>{"/10"}</div><input type="range" min={1} max={10} value={rpe} onChange={function(e) { sRpe(+e.target.value); }} style={{ width: "100%", accentColor: rpe >= 8 ? C.red : rpe >= 5 ? C.amber : C.green }} /></div></Card>
    {sm.fields.length > 0 && <Card style={{ padding: 20 }}><SL>{"Metricas " + (sp ? sp.name : "")}</SL><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{sm.fields.map(function(f) { return <Inp key={f.id} label={f.label} value={sportFields[f.id] || ""} onChange={function(v) { setSportFields(function(prev) { var n = Object.assign({}, prev); n[f.id] = v; return n; }); }} type={f.type || "text"} />; })}</div></Card>}
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><SL mb={0}>Exercicios</SL><Btn sm v="ghost" onClick={function() { sExs(function(e) { return e.concat([{ name: "", sets: "", reps: "", kg: "", rpe_ex: "" }]); }); }}>+ Adicionar</Btn></div>
      {exs.map(function(ex, i) { return <Card key={i} style={{ padding: 14, marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><div style={{ fontWeight: 700, fontSize: 13 }}>{"Exercicio " + (i+1)}</div>{exs.length > 1 && <button onClick={function() { sExs(function(e) { return e.filter(function(_, idx) { return idx !== i; }); }); }} style={{ background: "none", border: "none", color: C.grayLight, cursor: "pointer", fontSize: 16 }}>x</button>}</div><input value={ex.name} placeholder="Nome (ex: Supino Reto)" onChange={function(e) { var n = exs.slice(); n[i] = Object.assign({}, n[i], { name: e.target.value }); sExs(n); }} style={{ background: C.faint, border: "1px solid "+C.border, borderRadius: 8, color: C.text, padding: "10px 12px", fontSize: 13, outline: "none", minHeight: 40, width: "100%", marginBottom: 8 }} /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>{[["sets","Series","4"],["reps","Reps","8"],["kg","Kg","80"],["rpe_ex","RPE","7"]].map(function(arr) { return <div key={arr[0]}><div style={{ color: C.grayLight, fontSize: 9, fontWeight: 600, marginBottom: 3 }}>{arr[1]}</div><input type="number" value={ex[arr[0]] || ""} placeholder={arr[2]} onChange={function(e) { var n = exs.slice(); n[i] = Object.assign({}, n[i]); n[i][arr[0]] = e.target.value; sExs(n); }} style={{ background: C.faint, border: "1px solid "+C.border, borderRadius: 8, color: C.text, padding: "8px 10px", fontSize: 13, outline: "none", minHeight: 36, width: "100%" }} /></div>; })}</div>{ex.sets && ex.reps && ex.kg && <div style={{ marginTop: 6, padding: "6px 10px", background: C.redLight, borderRadius: 6 }}><span style={{ color: C.red, fontSize: 11, fontWeight: 600 }}>{"Volume: " + (parseInt(ex.sets)*parseInt(ex.reps)*parseInt(ex.kg)) + " kg"}</span></div>}</Card>; })}
      {exs.some(function(e) { return e.sets && e.reps && e.kg; }) && <div style={{ padding: "10px 14px", background: C.faint, borderRadius: 8, display: "flex", justifyContent: "space-between" }}><span style={{ color: C.gray, fontSize: 11, fontWeight: 600 }}>Volume total</span><span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: C.text }}>{exs.reduce(function(a, e) { return a + ((parseInt(e.sets)||0)*(parseInt(e.reps)||0)*(parseInt(e.kg)||0)); }, 0) + " kg"}</span></div>}
    </Card>
    <Card style={{ padding: 20 }}><SL>Notas</SL><Inp value={notes} onChange={sNotes} rows={2} placeholder="Como foi?" /></Card>
    <Btn onClick={save} full>{"Salvar (+ " + XP_SESSION + " XP)"}</Btn>
  </div>;
}

/* AI */
function AITab(p) {
  var user = p.user, isPro = ["pro","coach","club","admin"].includes(user ? user.plan : "");
  var [credits, sCredits] = useState(isPro ? 999 : 2);
  var [reports, sReports] = useState([]);
  var [ld, sLd] = useState(false);
  var ref = useRef(null);
  var SAMPLE = "PROTOCOLO ARES\n---\nACWR: 1.22 - ZONA AMARELA\nReduzir volume 15%\n\nProgressao consistente.\nContinue +2-5%/semana.\n\nSono 7-9h | Proteina 1.8-2.2g/kg\n\nScore: 76/100 - APTO\n---\nARES INTELLIGENCE";
  function gen() { if (credits <= 0) return; sLd(true); var e = { id: Date.now(), date: new Date().toLocaleDateString("pt-BR"), typed: "", full: SAMPLE, done: false }; sReports(function(r) { return [e].concat(r); }); sCredits(function(c) { return c - 1; }); var i = 0; var iv = setInterval(function() { i += 6; sReports(function(r) { return r.map(function(rep) { return rep.id === e.id ? Object.assign({}, rep, { typed: SAMPLE.slice(0, i) }) : rep; }); }); if (i >= SAMPLE.length) { sLd(false); sReports(function(r) { return r.map(function(rep) { return rep.id === e.id ? Object.assign({}, rep, { typed: rep.full, done: true }) : rep; }); }); clearInterval(iv); } }, 18); }
  return <div className="au" style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 0 20px" }}>
    <div><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.text, letterSpacing: 1 }}>INTELIGENCIA</div><div style={{ color: C.grayLight, fontSize: 12, marginTop: 2 }}>Analise com IA</div></div>
    <Card style={{ padding: 20 }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 48, height: 48, background: C.redLight, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🧠</div><div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>ARES INTELLIGENCE</div><div style={{ color: C.grayLight, fontSize: 11, marginTop: 1 }}>{credits > 0 ? credits + " creditos" : "Sem creditos"}</div></div><Btn onClick={gen} disabled={ld || credits <= 0} sm>{ld ? "..." : "Gerar"}</Btn></div></Card>
    {reports.map(function(r) { return <Card key={r.id} red style={{ padding: 20 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: C.gray, fontSize: 11, fontWeight: 600 }}>{r.date}</span>{r.done && <Tag color={C.green}>OK</Tag>}</div><pre ref={ref} style={{ color: C.text, fontSize: 12, lineHeight: 1.8, fontFamily: "monospace", whiteSpace: "pre-wrap", margin: 0, maxHeight: 300, overflowY: "auto" }}>{r.typed}{!r.done && <span style={{ color: C.red, animation: "blink .6s infinite" }}>|</span>}</pre></Card>; })}
  </div>;
}

/* PROFILE */
function ProfileTab(p) {
  var user = p.user, activity = p.activity, sp = activity ? SPORTS.find(function(s) { return s.id === activity.sport; }) : null;
  var xp = activity ? activity.xp || 0 : 0, level = getLevel(xp);
  var [section, setSection] = useState("main");
  var [d, sD] = useState({ name: user ? user.name : "", age: activity ? activity.age : "", weight: activity ? activity.weight : "", height: activity ? activity.height : "" });
  var [saved, sSaved] = useState(false);
  var [billing, sBilling] = useState("mensal");
  function set(k, v) { sD(function(prev) { var n = Object.assign({}, prev); n[k] = v; return n; }); }
  var plans = [{ id: "free", name: "FREE", price: { mensal: "R$ 0", anual: "R$ 0" }, color: C.gray, features: ["1 atividade","2 relatorios IA","Dashboard basico"] }, { id: "pro", name: "ATLETA PRO", price: { mensal: "R$ 39", anual: "R$ 31" }, color: C.red, features: ["3 atividades","IA ilimitada","Metricas avancadas","PRs e historico"] }, { id: "coach", name: "TREINADOR", price: { mensal: "R$ 119", anual: "R$ 95" }, color: C.blue, features: ["10 atletas","Dashboard time","Export dados"] }, { id: "club", name: "CLUBE", price: { mensal: "R$ 299", anual: "R$ 239" }, color: C.amber, features: ["Ilimitado","Multi-coach","API","Suporte dedicado"] }];

  if (section === "plans") return <div className="au" style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 0 20px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}><button onClick={function() { setSection("main"); }} style={{ width: 32, height: 32, borderRadius: 8, background: C.faint, border: "1px solid "+C.border, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{"<"}</button><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: C.text }}>PLANOS</div></div>
    <div style={{ display: "flex", justifyContent: "center" }}><div style={{ display: "inline-flex", background: C.faint, borderRadius: 10, padding: 2, gap: 2 }}>{["mensal","anual"].map(function(b) { return <button key={b} onClick={function() { sBilling(b); }} style={{ padding: "8px 18px", border: "none", cursor: "pointer", background: billing === b ? C.white : "transparent", color: billing === b ? C.red : C.gray, fontWeight: 700, fontSize: 11, textTransform: "uppercase", borderRadius: 8, minHeight: 36, display: "flex", alignItems: "center", gap: 4 }}>{b}{b === "anual" && <span style={{ background: C.greenBg, color: C.green, fontSize: 8, padding: "1px 5px", borderRadius: 99 }}>-20%</span>}</button>; })}</div></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>{plans.map(function(pl) { var isCur = (user ? user.plan : "free") === pl.id; return <Card key={pl.id} red={isCur} style={{ padding: 20, display: "flex", flexDirection: "column" }}><div style={{ color: pl.color, fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>{pl.name}</div><div style={{ display: "flex", alignItems: "flex-end", gap: 3, marginBottom: 14 }}><span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: C.text, lineHeight: 1 }}>{pl.price[billing]}</span><span style={{ color: C.grayLight, fontSize: 10, marginBottom: 2 }}>/mes</span></div><div style={{ height: 1, background: C.border, marginBottom: 12 }} /><div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>{pl.features.map(function(f) { return <div key={f} style={{ display: "flex", gap: 6 }}><span style={{ color: C.green, fontSize: 11 }}>✓</span><span style={{ fontSize: 12, color: C.text }}>{f}</span></div>; })}</div><div style={{ marginTop: 14 }}><Btn v={isCur ? "ghost" : "primary"} full sm>{isCur ? "Atual" : "Upgrade"}</Btn></div></Card>; })}</div>
  </div>;

  return <div className="au" style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 0 20px" }}>
    <SportCover sport={activity ? activity.sport : ""} size="sm" radius={14}><div style={{ position: "relative", zIndex: 1, padding: "14px 18px", width: "100%", display: "flex", alignItems: "center", gap: 14 }}><AresAvatar level={Math.min(5, Math.floor(xp/1000)+1)} size={64} sport={activity ? activity.sport : ""} /><div style={{ flex: 1 }}><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#fff", letterSpacing: 1 }}>{(d.name || "ATLETA").toUpperCase()}</div><div style={{ color: "#ffffff88", fontSize: 11, marginTop: 2 }}>{sp ? (sp.icon+" "+sp.name) : ""}</div><div style={{ color: "#ffffff66", fontSize: 11, marginTop: 1 }}>{user ? user.email : ""}</div><div style={{ display: "flex", gap: 4, marginTop: 6 }}><Tag color="#ffffff">{(user ? user.plan : "free").toUpperCase()}</Tag><Tag color={level.color}>{"LV."+(Math.floor(xp/100)+1)}</Tag></div></div></div></SportCover>
    <Card style={{ padding: 18 }}><SL mb={10}>Nivel</SL><XPBar xp={xp} /></Card>
    <Card hover onClick={function() { setSection("plans"); }} style={{ padding: "14px 16px", cursor: "pointer" }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 36, height: 36, borderRadius: 8, background: C.faint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⭐</div><div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13 }}>Planos ARES</div><div style={{ color: C.grayLight, fontSize: 11, marginTop: 1 }}>Upgrade e assinatura</div></div><span style={{ color: C.grayLight }}>{">"}</span></div></Card>
    <Card style={{ padding: 22 }}><SL>Dados pessoais</SL><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><Inp label="Nome" value={d.name} onChange={function(v) { set("name", v); }} placeholder="Seu nome" /><Inp label="Idade" value={d.age} onChange={function(v) { set("age", v); }} type="number" placeholder="24" /><Inp label="Peso (kg)" value={d.weight} onChange={function(v) { set("weight", v); }} type="number" placeholder="78" /><Inp label="Altura (cm)" value={d.height} onChange={function(v) { set("height", v); }} type="number" placeholder="177" /></div></Card>
    {saved ? <div style={{ background: C.greenBg, borderRadius: 10, padding: 14, display: "flex", gap: 8, alignItems: "center" }}><span>✅</span><span style={{ color: C.green, fontWeight: 700 }}>Salvo!</span></div> : <Btn onClick={async function() { if (p.onSaveProfile) await p.onSaveProfile(d); sSaved(true); setTimeout(function() { sSaved(false); }, 2000); }} full>Salvar</Btn>}
    <Btn onClick={async function() { await supabase.auth.signOut(); if (p.onLogout) p.onLogout(); }} v="secondary" full>Sair da conta</Btn>
  </div>;
}

/* MAIN APP */
function MainApp(p) {
  var user = p.user;
  var [tab, sTab] = useState("home");
  var [activities, setActivities] = useState(p.initialActivity ? [p.initialActivity] : []);
  var activeIdx = 0;
  var [showOb, sShowOb] = useState(false);
  var [showLU, sShowLU] = useState(null);
  var userPlan = getEffectivePlan(user), ca = activities[activeIdx] || null, sp = ca ? SPORTS.find(function(s) { return s.id === ca.sport; }) : null;

  useEffect(function() {
    if (activities.length > 0 && !activities[0].plan) {
      var a = activities[0];
      setActivities(function(prev) { return prev.map(function(act, i) { return i === 0 ? Object.assign({}, act, { plan: generatePlan(a) }) : act; }); });
    }
  }, []);

  var addSession = useCallback(function(s) {
    setActivities(function(prev) {
      var updated = prev.map(function(a, i) { return i === activeIdx ? Object.assign({}, a, { sessions: [s].concat(a.sessions || []) }) : a; });
      if (p.onSaveSession) p.onSaveSession(s, updated[activeIdx]);
      return updated;
    });
  }, [activeIdx]);

  var markComplete = useCallback(function(wn, sid) {
    setActivities(function(prev) {
      var updated = prev.map(function(a, i) {
        if (i !== activeIdx || !a.plan) return a;
        var weeks = a.plan.weeks.map(function(w) { return w.week !== wn ? w : Object.assign({}, w, { sessions: w.sessions.map(function(s) { return s.id === sid ? Object.assign({}, s, { completed: true }) : s; }) }); });
        return Object.assign({}, a, { plan: Object.assign({}, a.plan, { weeks, currentWeek: Math.min(wn + 1, 12) }) });
      });
      if (p.onSavePlanProgress) p.onSavePlanProgress(updated[activeIdx]);
      return updated;
    });
  }, [activeIdx]);

  var gainXP = useCallback(function(amt) {
    setActivities(function(prev) {
      var updated = prev.map(function(a, i) {
        if (i !== activeIdx) return a;
        var nxp = (a.xp || 0) + amt;
        var oL = getLevel(a.xp || 0), nL = getLevel(nxp);
        if (nL.id !== oL.id) setTimeout(function() { sShowLU(nL); }, 400);
        return Object.assign({}, a, { xp: nxp });
      });
      if (p.onSavePlanProgress) p.onSavePlanProgress(updated[activeIdx]);
      return updated;
    });
  }, [activeIdx]);

  function addActivity(data) {
    var full = Object.assign({ id: Date.now() }, data, { sessions: [], xp: 0, plan: generatePlan(data) });
    setActivities(function(prev) { return prev.concat([full]); });
    if (p.onSaveActivity) p.onSaveActivity(full);
    sShowOb(false);
  }

  var TABS = [{ id: "home", label: "Inicio", d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" }, { id: "plan", label: "Treino", d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" }, { id: "reg", fab: true }, { id: "ai", label: "IA", d: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" }, { id: "me", label: "Perfil", d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }];
  function TI(ip) { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={ip.active ? C.red : C.grayLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ip.d} /></svg>; }

  if (showOb) return <div><div style={{ background: C.white, borderBottom: "1px solid "+C.border, padding: "0 16px", height: 50, display: "flex", alignItems: "center" }}><button onClick={function() { sShowOb(false); }} style={{ padding: "6px 14px", background: C.faint, border: "1px solid "+C.border, borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, color: C.gray }}>Voltar</button></div><OnboardScreen user={user} onComplete={addActivity} /></div>;

  return <div style={{ background: C.bg, minHeight: "100vh" }}>
    {showLU && <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.7)" }} onClick={function() { sShowLU(null); }}><div className="pop" onClick={function(e) { e.stopPropagation(); }} style={{ background: C.dark, border: "2px solid "+C.red, borderRadius: 20, padding: "40px 32px", maxWidth: 340, width: "90%", textAlign: "center" }}><div style={{ width: 56, height: 56, borderRadius: 14, background: showLU.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 auto 14px" }}>{showLU.rank}</div><div style={{ color: C.red, fontSize: 11, fontWeight: 700, letterSpacing: 3, marginBottom: 6 }}>NIVEL DESBLOQUEADO</div><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: "#fff", letterSpacing: 2, marginBottom: 20 }}>{showLU.label.toUpperCase()}</div><Btn onClick={function() { sShowLU(null); }} full>CONTINUAR</Btn></div></div>}
    <div style={{ background: C.white, borderBottom: "1px solid "+C.border, padding: "0 16px", height: 52, display: "flex", alignItems: "center", gap: 8, position: "sticky", top: 0, zIndex: 100, boxShadow: sh.sm }}><div style={{ flex: 1 }}><AresLogo size={28} /></div>{sp && <div style={{ padding: "5px 12px", background: C.faint, borderRadius: 20, fontSize: 12, fontWeight: 600, color: C.text }}>{sp.icon+" "+sp.name}</div>}<div onClick={function() { sTab("me"); }} style={{ width: 32, height: 32, background: C.red, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>{(user ? user.name : "A").charAt(0).toUpperCase()}</div></div>
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100 }}><div style={{ background: C.white, borderTop: "1px solid "+C.border, display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: 60, paddingBottom: "env(safe-area-inset-bottom,0)" }}>{TABS.map(function(t) { if (t.fab) return <div key="fab" style={{ marginTop: -20 }}><button onClick={function() { sTab("reg"); }} className={tab !== "reg" ? "fab-pulse" : ""} style={{ width: 52, height: 52, borderRadius: 14, background: C.red, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px "+C.red+"44" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></button></div>; return <button key={t.id} onClick={function() { sTab(t.id); }} style={{ flex: 1, padding: "6px 4px", border: "none", cursor: "pointer", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, maxWidth: 72 }}><TI d={t.d} active={tab === t.id} /><div style={{ fontSize: 9, fontWeight: 700, color: tab === t.id ? C.red : C.grayLight }}>{t.label}</div></button>; })}</div></div>
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px 14px 90px" }}><div key={tab} className="au">
      {tab === "home" && <DashboardTab activity={ca} onGoToPlan={function() { sTab("plan"); }} user={user} />}
      {tab === "plan" && <PlanTab activity={ca} onMarkComplete={markComplete} onXPGain={gainXP} />}
      {tab === "reg" && <RegisterTab onSave={addSession} activity={ca} onXPGain={gainXP} />}
      {tab === "ai" && <AITab activity={ca} user={Object.assign({}, user, { plan: userPlan })} />}
      {tab === "me" && <ProfileTab user={Object.assign({}, user, { plan: userPlan })} activity={ca} onLogout={p.onLogout} onSaveProfile={p.onSaveProfile} />}
    </div>{activities.length === 0 && tab !== "me" && <Card style={{ padding: 28, textAlign: "center", marginTop: 16 }}><div style={{ fontSize: 36, marginBottom: 10 }}>🏅</div><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: C.text, marginBottom: 8 }}>COMECE AGORA</div><div style={{ color: C.gray, fontSize: 13, marginBottom: 16 }}>Adicione seu esporte.</div><Btn onClick={function() { sShowOb(true); }}>Adicionar esporte</Btn></Card>}</div>
  </div>;
}

/* APP ROOT */
function AppRoot() {
  var [screen, sScreen] = useState("loading");
  var [user, sUser] = useState(null);
  var aresData = useAresData(user);

  useEffect(function() {
    supabase.auth.getSession().then(function(res) {
      var session = res.data.session;
      if (session) {
        var u = session.user;
        sUser({ name: u.user_metadata.name || u.user_metadata.full_name || u.email.split("@")[0], email: u.email, plan: "free", id: u.id });
      }
      sScreen("ready");
    });
    var { data: listener } = supabase.auth.onAuthStateChange(function(event, session) {
      if (session) {
        var u = session.user;
        sUser({ name: u.user_metadata.name || u.user_metadata.full_name || u.email.split("@")[0], email: u.email, plan: "free", id: u.id });
      } else {
        sUser(null);
      }
    });
    return function() { listener.subscription.unsubscribe(); };
  }, []);

  var show;
  if (screen === "loading" || (user && aresData.loading)) show = "loading";
  else if (!user) show = "login";
  else if (!aresData.data || !aresData.data.activity) show = "onboard";
  else show = "app";

  if (show === "loading") return <div style={{ minHeight: "100vh", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}><style>{CSS}</style><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: "#fff", letterSpacing: 6 }}>ARES</div><div style={{ color: C.red, fontSize: 12, fontWeight: 700, letterSpacing: 4 }}>PERFORMANCE</div></div>;
  if (show === "login") return <div><style>{CSS}</style><LoginScreen /></div>;
  if (show === "onboard") return <div><style>{CSS}</style><OnboardScreen user={user} onComplete={async function(d) { var full = Object.assign({ id: Date.now() }, d, { sessions: [], xp: 0, plan: generatePlan(d) }); await aresData.saveActivity(full); }} /></div>;
  return <div><style>{CSS}</style><MainApp user={user} initialActivity={aresData.data.activity} onSaveSession={aresData.saveSession} onSavePlanProgress={aresData.savePlanProgress} onSaveActivity={aresData.saveActivity} onSaveProfile={aresData.saveProfile} onLogout={async function() { await supabase.auth.signOut(); sUser(null); }} /></div>;
}

export default AppRoot;