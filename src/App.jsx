import React, { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { useAresData } from "./useAresData";

/* ─── DESIGN TOKENS ─────────────────────────────────────── */
var C={
  bg:"#F5F5F7",white:"#FFFFFF",border:"#E5E5EA",
  red:"#C8001E",redDk:"#8A0012",redLight:"#C8001E08",redMid:"#C8001E20",
  dark:"#0A0A0A",text:"#1C1C1E",gray:"#636366",grayLight:"#AEAEB2",faint:"#F2F2F7",
  green:"#30D158",greenBg:"#30D15810",amber:"#FF9F0A",amberBg:"#FF9F0A10",
  blue:"#0A84FF",blueBg:"#0A84FF10",indigo:"#5E5CE6",teal:"#64D2FF",tealBg:"#64D2FF10",
};
var sh={xs:"0 1px 3px rgba(0,0,0,.06)",sm:"0 2px 8px rgba(0,0,0,.08)",md:"0 4px 16px rgba(0,0,0,.10)",lg:"0 8px 32px rgba(0,0,0,.12)",red:"0 0 0 1px #C8001E18,0 4px 20px #C8001E18"};
var SAT="env(safe-area-inset-top,0px)",SAB="env(safe-area-inset-bottom,0px)";
var CSS=[
  "@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700;800;900&display=swap');",
  "*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;font-family:'Inter',system-ui,sans-serif}",
  "body{padding-top:env(safe-area-inset-top,0px);background:#F5F5F7}",
  "::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#C8001E33;border-radius:99px}",
  "input::placeholder,textarea::placeholder{color:#AEAEB2}",
  "select option{background:#fff;color:#1C1C1E}",
  "@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}",
  "@keyframes popIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}",
  "@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}",
  "@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}",
  ".au{animation:fadeUp .25s ease}.pop{animation:popIn .2s ease}",
].join("\n");

/* ─── LEVELS ─────────────────────────────────────────────── */
var LEVELS=[
  {id:"iniciante",label:"Iniciante",next:"amador",xpNeeded:0,color:"#8E8E93",rank:"E"},
  {id:"amador",label:"Amador",next:"semi",xpNeeded:500,color:C.green,rank:"D"},
  {id:"semi",label:"Semi-Pro",next:"profissional",xpNeeded:1500,color:C.blue,rank:"C"},
  {id:"profissional",label:"Profissional",next:"elite",xpNeeded:3000,color:C.red,rank:"B"},
  {id:"elite",label:"Elite",next:null,xpNeeded:5000,color:"#FFD700",rank:"A"},
];
function getLevel(xp){return LEVELS.reduce(function(a,l){return xp>=l.xpNeeded?l:a;},LEVELS[0]);}
function getNextLevel(cur){return LEVELS.find(function(l){return l.id===(cur?cur.next:null);})||null;}
var XP_SESSION=50,XP_WEEK=200;
var ADMIN_KEYS=["lucas","admin","teste","ares"];
function getEffectivePlan(u){if(!u)return"free";var n=(u.name||"").toLowerCase(),e=(u.email||"").toLowerCase();return ADMIN_KEYS.some(function(k){return n.includes(k)||e.includes(k);})?"admin":u.plan||"free";}

/* ─── SPORTS ─────────────────────────────────────────────── */
var SPORTS=[
  {id:"flag",name:"Flag Football",icon:"🏈",cat:"Americano",positions:["Wide Receiver","Running Back","Quarterback","Safety","Corner","Linebacker","Center"]},
  {id:"nfl",name:"Fut. Americano",icon:"🏈",cat:"Americano",positions:["Wide Receiver","Running Back","Quarterback","O-Line","D-End","Safety","Corner"]},
  {id:"futebol",name:"Futebol",icon:"⚽",cat:"Coletivo",positions:["Atacante","Meia","Lateral","Zagueiro","Goleiro"]},
  {id:"basket",name:"Basquete",icon:"🏀",cat:"Coletivo",positions:["Point Guard","Shooting Guard","Small Forward","Power Forward","Center"]},
  {id:"volei",name:"Vôlei",icon:"🏐",cat:"Coletivo",positions:["Levantador","Oposto","Ponteiro","Central","Líbero"]},
  {id:"futsal",name:"Futsal",icon:"🥅",cat:"Coletivo",positions:["Fixo","Ala","Pivô","Goleiro"]},
  {id:"rugby",name:"Rugby",icon:"🏉",cat:"Coletivo",positions:["Hooker","Prop","Lock","Flanker","Scrumhalf","Fly-half","Winger"]},
  {id:"mma",name:"MMA",icon:"🥊",cat:"Combate",positions:["Peso Leve","Meio-Médio","Médio","Pesado"]},
  {id:"boxe",name:"Boxe",icon:"🥋",cat:"Combate",positions:["Peso Mosca","Peso Pena","Peso Leve","Meio-Médio","Médio","Pesado"]},
  {id:"jiu",name:"Jiu-Jitsu",icon:"🤼",cat:"Combate",positions:["Pluma","Leve","Médio","Meio-Pesado","Pesado"]},
  {id:"judo",name:"Judô",icon:"🏅",cat:"Combate",positions:["Leve","Médio","Pesado"]},
  {id:"corrida",name:"Corrida",icon:"👟",cat:"Individual",positions:["5km","10km","Meia-maratona","Maratona","Trail"]},
  {id:"natacao",name:"Natação",icon:"🏊",cat:"Individual",positions:["Crawl","Costas","Peito","Borboleta","Medley"]},
  {id:"cicl",name:"Ciclismo",icon:"🚴",cat:"Individual",positions:["Estrada","MTB","Gravel","Pista"]},
  {id:"tenis",name:"Tênis",icon:"🎾",cat:"Raquete",positions:["Baselinista","Serve & Volley","All-Court"]},
  {id:"padel",name:"Padel",icon:"🏓",cat:"Raquete",positions:["Frente","Fundo","All-Court"]},
  {id:"cross",name:"CrossFit",icon:"⚡",cat:"Funcional",positions:["Scaled","RX","Elite","Master"]},
  {id:"muscu",name:"Musculação",icon:"💪",cat:"Musculação",positions:["Hipertrofia","Força","Definição","Iniciante"]},
  {id:"power",name:"Powerlifting",icon:"🏋️",cat:"Musculação",positions:["66kg","74kg","83kg","93kg","105kg"]},
  {id:"cali",name:"Calistenia",icon:"🤸",cat:"Musculação",positions:["Iniciante","Intermediário","Skills","Street Workout"]},
  {id:"olympic",name:"Levant. Olímpico",icon:"🥇",cat:"Musculação",positions:["56kg","62kg","69kg","77kg","85kg"]},
];
var CATS=["Todos","Americano","Coletivo","Combate","Individual","Raquete","Funcional","Musculação"];
var GOALS=["Velocidade e explosão","Força máxima","Resistência","Performance completa","Hipertrofia","Composição corporal","Prevenção de lesões"];

/* ─── EXERCISE TYPE COLOR ─────────────────────────────────── */
function tc(t){return{Força:C.blue,Hipertrofia:C.red,"Força/Hiper":C.red,Campo:C.red,Condicionamento:C.amber,Recuperação:C.green,Técnico:C.indigo,Jogo:C.amber,Resistência:C.teal}[t]||C.gray;}
function mkE(n,s,r,rest,tip,alt){return{n,s,r,rest,tip,alt};}
function mkW(n,d,tip){return{n,d,tip};}

/* ─── SPORT PLANS ─────────────────────────────────────────── */
var SPORT_PLANS={
  flag:{
    coachNote:"WR/RB de elite = saída explosiva + 3 primeiros passos máximos + separação via mudança de direção. 3 fases: Base Atlética → Potência & Velocidade → Especificidade em campo.",
    phases:[{name:"Base Atlética",weeks:"1–4",color:C.blue},{name:"Potência & Vel.",weeks:"5–8",color:C.amber},{name:"Especificidade",weeks:"9–12",color:C.red}],
    sessions:{
      1:[
        {name:"Força Posterior",type:"Força",xp:55,
          warmup:[mkW("Skip A","3×20m","Joelho alto, aterrissagem forefoot"),mkW("Hip circle","2×10 cada","Ativa glúteo médio")],
          main:[mkE("Back Squat","4×6","6 reps","120s","Exploda na subida — velocidade de saída = sprint","Goblet squat"),mkE("Romanian Deadlift","3×8","8 reps","90s","Posterior = freio e aceleração","Stiff halter"),mkE("Hip Thrust","3×10","10 reps","90s","Glúteo é o motor. Pause 1s no topo.","Quadrupedia"),mkE("Nordic Curl","3×5","Hold 3s","90s","Previne ruptura de isquio. Obrigatório.","Leg curl"),mkE("Copenhagen Plank","3×20s cada","20s","60s","Adutores — mudança de direção","Prancha lateral")],
          cardio:[mkW("Trote Z2","10 min","FC<140bpm")],cooldown:[mkW("Pigeon pose","45s cada",""),mkW("Isquio com faixa","30s cada","")]},
        {name:"Mecânica de Sprint",type:"Campo",xp:65,
          warmup:[mkW("Trote","800m",""),mkW("Skip A/B/C","3×20m cada",""),mkW("High knees","2×15m","")],
          main:[mkE("Wall Drill A","3×10 cada","Posição sprint","60s","Mão na parede, joelho 90°. Aprenda a mecânica.",""),mkE("3-Point Start","6×10m","Cronometrado","2min","Saída explosiva. Registre toda semana.",""),mkE("Sprint 20m","6×20m","80→100%","2min","Forma perfeita antes de velocidade.",""),mkE("40 Jardas","4×40yd","Cronometrado","4min","Referência global. Anote o melhor.","")],
          cardio:[],cooldown:[mkW("Caminhada","5 min",""),mkW("Quad stretch","30s cada","")]},
        {name:"Upper + Core",type:"Força",xp:50,
          warmup:[mkW("Band pull-apart","2×15",""),mkW("Dead bug","2×10 cada","")],
          main:[mkE("Bench Press","4×6","6 reps","120s","Stiffarm e bloqueio","Push-up lastre"),mkE("Pull-up","4×5","5 reps","120s","Garra de recepção","Lat pulldown"),mkE("OHP","3×8","8 reps","90s","Força de empurre","DB press"),mkE("Pallof Press","3×10 cada","10 reps","75s","Core anti-rotacional","Cabo"),mkE("Med Ball Rotação","3×10 cada","10 reps","60s","Potência rotacional de torso","Cabo rotação")],
          cardio:[mkW("Z2 cross-train","15 min","Bicicleta")],cooldown:[mkW("Full stretch","10 min","Ombro e quadril")]},
        {name:"Agilidade + Cond.",type:"Campo",xp:60,
          warmup:[mkW("Dynamic stretch","5 min",""),mkW("Carioca","2×20m","")],
          main:[mkE("5-10-5 Shuttle","6 reps","Cronometrado","3min","Toque o cone. Posição baixa.","T-drill"),mkE("L-drill","6 reps","Cronometrado","3min","Corte preciso. Exploda após cone.","3-cone"),mkE("Rota Slant","10 reps","Velocidade jogo","90s","Quebre 45°. Olhe o QB.",""),mkE("Rota Out","10 reps","Velocidade jogo","90s","Stem 5yd, corte 90°.","")],
          cardio:[],cooldown:[mkW("Foam roller TFL","90s cada",""),mkW("Static stretch","10 min","")]},
      ],
      2:[
        {name:"Potência Explosiva",type:"Força",xp:65,
          warmup:[mkW("Skip potência","3×20m",""),mkW("Jump squat leve","2×5","Ativação neural")],
          main:[mkE("Jump Squat 30%","4×4","Máximo explosivo","3min","Velocidade máxima de barra.","Box jump"),mkE("Power Clean","4×3","3 reps","3min","Mais importante para velocidade.","Hang power clean"),mkE("Box Jump","4×5","5 reps","2min","Amorteça. Step down.","Broad jump"),mkE("Bounding 30m","4×30m","Amplitude máxima","2min","Cada passo = saca de potência.","Skipping"),mkE("Trap Bar Deadlift","3×4","4 reps","120s","Mais específico ao sprint.","RDL pesado")],
          cardio:[],cooldown:[mkW("Foam roller","5 min",""),mkW("Pigeon","60s cada","")]},
        {name:"Velocidade 40yd",type:"Campo",xp:70,
          warmup:[mkW("Sprint progressivo","4×60m","60→90%"),mkW("Wicket drill","2×30m","Comprimento de passada")],
          main:[mkE("40yd Dash","6 reps","Cronometrado","4min","Melhor de 6. Registre.","30yd"),mkE("Fly 20m","6 reps","Arrancada 15m","4min","Velocidade máxima. Não desacelere.","Fly 30m"),mkE("Sprint Resistido","6×20m","Com elástico","3min","Resistência = posição de aceleração.","Sprint subida"),mkE("Rota Post","10 reps","45° interno","2min","Principal rota. Execute perfeita.","Dig route")],
          cardio:[],cooldown:[mkW("Caminhada","10 min",""),mkW("Static stretch","15 min","")]},
        {name:"Força Upper Exp.",type:"Força",xp:60,
          warmup:[mkW("Med Ball slam","2×10",""),mkW("Band pull-apart","2×15","")],
          main:[mkE("Bench 85%","4×4","4 reps","120s","","Push press"),mkE("Pendlay Row","4×5","5 reps","120s","Força de pull explosiva","Barbell row"),mkE("Push Press","3×4","4 reps","120s","Potência ombro-tríceps","OHP"),mkE("DB Snatch","3×5 cada","5/lado","90s","Potência unilateral","KB swing"),mkE("Med Ball Rot. Exp.","3×8 cada","8/lado","60s","Máxima velocidade de torso","Cabo")],
          cardio:[],cooldown:[mkW("Foam roller dorsal","5 min",""),mkW("Full stretch","10 min","")]},
        {name:"Cond. de Jogo",type:"Condicionamento",xp:65,
          warmup:[mkW("Trote","5 min",""),mkW("Dynamic stretch","5 min","")],
          main:[mkE("150yd Shuttle","4 reps","Cronometrado","5min","25yd 3x. Padrão NFL combine.","100yd"),mkE("Rotas velocidade","20 reps","6 rotas","60s","Go/Post/Corner/Slant/In/Out",""),mkE("Coverage drill","10 min","Situacional","","Releases e separação",""),mkE("Sprints 100%","4×60m","Máxima","4min","Velocidade máxima.","")],
          cardio:[],cooldown:[mkW("Static stretch","15 min","")]},
      ],
      3:[
        {name:"Pico Força + Vel.",type:"Força",xp:70,
          warmup:[mkW("Sprint ramp","4×40m",""),mkW("Clean ativação","2×3","50%")],
          main:[mkE("Squat 90%","3×3","3 reps","3min","Pico de força do ciclo.","Trap bar"),mkE("Power Clean 90%","3×2","2 reps","3min","Pico técnico.","Hang clean"),mkE("Bench 90%","3×3","3 reps","2min","",""),mkE("Single Leg Squat","3×6 cada","6/perna","90s","Especificidade ao sprint","Bulgarian")],
          cardio:[],cooldown:[mkW("Recovery completo","15 min","")]},
        {name:"Velocidade Máxima",type:"Campo",xp:75,
          warmup:[mkW("Sprint ramp","6×60m","60→100%"),mkW("Wicket","3×30m","")],
          main:[mkE("Top Speed 50m","4 reps","Arrancada 30m","5min","Velocidade máxima absoluta.","Fly 40m"),mkE("Árvore completa","20 reps","Todas as rotas","90s","Go/Post/Corner/Dig/Slant/Out",""),mkE("Release Press","15 min","Situacional","","Swim/rip/ghost",""),mkE("Fly 30m","4 reps","Cronometrado","4min","Melhor tempo do ciclo?","")],
          cardio:[],cooldown:[mkW("Contrast bath","10 min","Quente/frio")]},
        {name:"7on7 Simulado",type:"Jogo",xp:80,
          warmup:[mkW("Protocolo game day","10 min",""),mkW("Catches com QB","50 bolas","Rotas variadas")],
          main:[mkE("7on7 completo","30-40 min","","","Situações de jogo reais.",""),mkE("3° down","10 min","","","As rotas que ganham jogos.",""),mkE("Red zone","10 min","","","Slant, fade, back shoulder.","")],
          cardio:[],cooldown:[mkW("Análise mental","10 min",""),mkW("Recovery","15 min","")]},
        {name:"Taper + Ativação",type:"Recuperação",xp:40,
          warmup:[mkW("Mobilidade","15 min","")],
          main:[mkE("Vol -60%","2×5","Reativação","2min","Ative sem acumular fadiga.",""),mkE("Sprint curto","4×20m","90%","3min","Ativação neuromuscular.","")],
          cardio:[],cooldown:[mkW("Visualização","10 min","Execute cada rota perfeita"),mkW("Descanso","","Você está pronto.")]},
      ],
    },
  },
  muscu:{
    coachNote:"Hipertrofia via progressão de sobrecarga. Fase 1: adaptação neuromuscular. Fase 2: volume crescente PPL. Fase 3: intensidade máxima com drop sets e rest-pause.",
    phases:[{name:"Adaptação Neural",weeks:"1–4",color:C.blue},{name:"Volume Hipertrofia",weeks:"5–8",color:C.amber},{name:"Intensidade Máxima",weeks:"9–12",color:C.red}],
    sessions:{
      1:[
        {name:"Full Body A",type:"Hipertrofia",xp:50,
          warmup:[mkW("Bicicleta leve","8 min","FC<120"),mkW("Rotação ombros","10 cada","")],
          main:[mkE("Leg Press","3×15","15 reps","90s","Amplitude completa. Joelhos alinhados.","Smith"),mkE("Peck Deck","3×15","15 reps","90s","Cotovelos levemente fletidos.","Cross-over"),mkE("Puxada Frente","3×15","15 reps","90s","Puxe pelo cotovelo.","Remada"),mkE("Cadeira Extensora","3×15","15 reps","90s","Pause 1s no topo.",""),mkE("Tríceps Corda","3×15","15 reps","75s","Abra as pontas no final.","Testa")],
          cardio:[mkW("Esteira caminhada","15 min","FC<130")],cooldown:[mkW("Quad stretch","30s cada",""),mkW("Peitoral parede","30s cada","")]},
        {name:"Full Body B",type:"Hipertrofia",xp:50,
          warmup:[mkW("Jumping Jack","5 min",""),mkW("Hip circle","10 cada","")],
          main:[mkE("Hack Squat","3×15","15 reps","90s","Joelhos alinhados.","Leg Press"),mkE("Supino Smith","3×15","15 reps","90s","Barra desce ao peito.","Halteres"),mkE("Remada Triângulo","3×15","15 reps","90s","Puxe pro umbigo.","Cavalinho"),mkE("Leg Curl Deitado","3×15","15 reps","90s","Quadril colado.","Stiff"),mkE("Desenvolvimento","3×15","15 reps","90s","Cotovelos 90° em baixo.","OHP")],
          cardio:[mkW("Bike Z2","20 min","FC 120-140")],cooldown:[mkW("Isquio deitado","30s cada",""),mkW("Pigeon","40s cada","")]},
        {name:"Full Body C",type:"Hipertrofia",xp:50,
          warmup:[mkW("Polichinelo","3 min",""),mkW("Hip hinge livre","10 reps","")],
          main:[mkE("Goblet Squat","3×12","12 reps","90s","Cotovelos dentro dos joelhos.","Smith"),mkE("Crucifixo Inclinado","3×15","15 reps","90s","Sinta o alongamento.","Peck deck"),mkE("Serrote 1 Braço","3×12 cada","12/lado","90s","Coluna neutra!","Remada cabo"),mkE("Mesa Flexora","3×15","15 reps","90s","Isole o bíceps femoral.","Stiff"),mkE("Elevação Lateral","3×15","15 reps","60s","Cotovelos levemente fletidos.","Cabo")],
          cardio:[mkW("Caminhada inclinada","15 min","10%")],cooldown:[mkW("Child's pose","60s",""),mkW("Ombro cruzado","30s cada","")]},
        {name:"Cardio + Mobilidade",type:"Recuperação",xp:30,
          warmup:[mkW("Caminhada","5 min","")],
          main:[mkE("Z2 Cardio","1×35min","Contínuo","","FC<130bpm","Natação leve")],
          cardio:[],cooldown:[mkW("Foam roller quad","60s cada",""),mkW("Hip flexor stretch","45s cada","")]},
      ],
      2:[
        {name:"Push — Peito/Ombro/Tri",type:"Hipertrofia",xp:60,
          warmup:[mkW("Band pull-apart","2×15",""),mkW("Supino aquecimento","2×20","40%")],
          main:[mkE("Supino Reto Halter","4×10","10 reps","90s","3s descida. Explosivo na subida.","Barra"),mkE("Supino Inclinado 30°","4×10","10 reps","90s","30° ativa cabeça clavicular.","Crucifixo"),mkE("Cross-over Alto","3×12","12 reps","75s","Cruze as mãos. Máxima contração.","Peck deck"),mkE("Desenvolvimento Halter","4×10","10 reps","90s","Rotação supinada.","Arnold"),mkE("Elevação Lateral","3×12 cada","12/lado","60s","3s excêntrico.","Cabo"),mkE("Tríceps Corda","3×12","12 reps","75s","Abra no final.","Testa")],
          cardio:[],cooldown:[mkW("Doorway stretch","40s cada",""),mkW("Triceps overhead","30s cada","")]},
        {name:"Pull — Costas/Bíc.",type:"Hipertrofia",xp:60,
          warmup:[mkW("Puxada elástico","2×8",""),mkW("Remada curvada leve","2×15","")],
          main:[mkE("Pulldown Triângulo","4×10","10 reps","90s","Puxe pelo cotovelo ao peito.","Puxada"),mkE("Remada Cabos Baixos","4×10","10 reps","90s","Pause 1s.","Cavalinho"),mkE("Remada Uni. Halter","3×10 cada","10/lado","90s","Coluna neutra!","Máquina"),mkE("Pullover Halter","3×12","12 reps","75s","Ative o dorsal.","Polia"),mkE("Rosca Direta EZ","4×10","10 reps","90s","Sem balanço.","Barra"),mkE("Stiff Halter","3×10","10 reps","90s","Empurre o quadril pra trás.","Leg curl")],
          cardio:[],cooldown:[mkW("Child's pose","60s",""),mkW("Lat stretch","30s cada","")]},
        {name:"Legs — Quad/Glúteo",type:"Hipertrofia",xp:60,
          warmup:[mkW("Agachamento livre","2×15",""),mkW("Hip circle elástico","2×15 cada","")],
          main:[mkE("Agachamento Barra","4×10","10 reps","120s","Paralelo ou abaixo.","Front squat"),mkE("Leg Press pés altos","4×12","12 reps","90s","Pés altos = glúteo.","Hack squat"),mkE("Afundo Halter","3×10 cada","10/perna","90s","Joelho não ultrapasse o pé.","Búlgaro"),mkE("Mesa Flexora","4×12","12 reps","90s","Flexão completa.","Sentado"),mkE("Hip Thrust Barra","4×12","12 reps","90s","Pause 1s no topo.","Quadrupedia"),mkE("Panturrilha Smith","4×15","15 reps","60s","Amplitude total. 3s descida.","Sentado")],
          cardio:[mkW("Bicicleta Z1","15 min","")],cooldown:[mkW("Pigeon","60s cada",""),mkW("Lizard","45s cada","")]},
        {name:"Upper Composto",type:"Hipertrofia",xp:55,
          warmup:[mkW("Rotação escapular","2×10",""),mkW("Facepull elástico","2×15","")],
          main:[mkE("Supino Inc. Barra","4×8","8 reps","120s","Progressão de carga.","Halter"),mkE("Barra Fixa","4×8","8 reps","120s","Elástico se necessário.","Lat pulldown"),mkE("OHP Halter Sentado","3×10","10 reps","90s","Full ROM.","Máquina"),mkE("Cable Flye","3×12","12 reps","75s","Contração do peitoral.","Peck deck"),mkE("Face Pull Cabo","3×15","15 reps","60s","Puxe até as orelhas.","Elástico"),mkE("Rosca Martelo","3×10","10 reps","75s","Braquioradial.","Inclinada")],
          cardio:[],cooldown:[mkW("Full stretch","10 min","")]},
      ],
      3:[
        {name:"Push Intensidade",type:"Força",xp:70,
          warmup:[mkW("Supino progressivo","3 sets","50→65→80%"),mkW("Band pull-apart","3×15","")],
          main:[mkE("Supino Reto PR","5×6","6 reps","120s","90% RPE. Spotter!",""),mkE("Supino Inc. Drop Set","3×10→10→10","Drop 3x","75s","-20% por drop sem descanso.",""),mkE("Cross-over","4×12","12 reps","75s","Pico de contração.",""),mkE("Dev. Militar","4×8","8 reps","120s","Progressão vs semana anterior.","Push press"),mkE("Rest-pause Lateral","3×15+8+8","Pausa 15s","60s","Série, 15s, 8, 15s, 8.","Normal"),mkE("Tríceps Superset","3×10+10","Corda+Testa","60s","Sem descanso.","")],
          cardio:[],cooldown:[mkW("Stretch completo","8 min","")]},
        {name:"Pull Intensidade",type:"Força",xp:70,
          warmup:[mkW("Barra aquecimento","2×5",""),mkW("Elástico facepull","2×15","")],
          main:[mkE("Barra Fixa Lastre","5×6","6 reps","120s","Rompe plateau.","Lat pulldown"),mkE("Remada Curv. Drop","3×8→8→8","Drop 3x","75s","Barra reta, pegada pronada.",""),mkE("Pullover Uni. Cabo","3×12 cada","12/lado","75s","Dorsal sob tensão máxima.","Halter"),mkE("Rosca Rest-pause","3×10","Pausa 15s","60s","Bíceps em falha.",""),mkE("Rosca Inclinada","3×10","10 reps","90s","Alongamento máximo.","Concentrada"),mkE("Deadlift Romeno","4×8","8 reps","120s","Não arredonde a lombar.","Stiff")],
          cardio:[],cooldown:[mkW("Lat stretch","45s cada",""),mkW("Suspensão","60s","")]},
        {name:"Legs Intensidade",type:"Força",xp:70,
          warmup:[mkW("Agachamento progressivo","3 sets","50→65→80%"),mkW("Hip band walk","2×10","")],
          main:[mkE("Agachamento 85-90%","5×5","5 reps","180s","Spotter ou rack!","Leg Press max"),mkE("Leg Press Drop","3×12→12","Drop 2x","90s","-20%.",""),mkE("Afundo Búlgaro","3×8 cada","8/perna","90s","Pé traseiro elevado.","Afundo"),mkE("Hip Thrust Pesado","4×10","10 reps","90s","Progressão vs semana anterior.","Máquina"),mkE("Leg Curl Superset","3×12+12","Deitado+Sentado","75s","Sem descanso entre variações.",""),mkE("Panturrilha Drop","3×15→15→15","Drop 3x","60s","Amplitude total.","")],
          cardio:[mkW("Bike recovery","10 min","Z1")],cooldown:[mkW("Pigeon profundo","90s cada",""),mkW("Foam roller","5 min","")]},
        {name:"Deload Ativo",type:"Recuperação",xp:40,
          warmup:[mkW("Mobilidade geral","10 min","")],
          main:[mkE("Exercícios da semana","3×15","Vol -50%","90s","Mesmos movimentos. Metade do peso.","")],
          cardio:[mkW("Cardio recreativo","30 min","")],cooldown:[mkW("Yoga flow","15 min","")]},
      ],
    },
  },
  corrida:{
    coachNote:"Periodização por zonas de FC. Z1-Z2 constrói base aeróbica. Z4-Z5 desenvolve limiar e VO2max. Long run semanal é inegociável.",
    phases:[{name:"Base Aeróbica",weeks:"1–4",color:C.blue},{name:"Desenvolvimento",weeks:"5–8",color:C.amber},{name:"Específico + Pico",weeks:"9–12",color:C.red}],
    sessions:{
      1:[
        {name:"Long Run Z2",type:"Resistência",xp:55,
          warmup:[mkW("Caminhada","5 min",""),mkW("Dinâmico","5 min","")],
          main:[mkE("Corrida Z2","1×50-60min","50-60 min","","FC 120-140bpm. Fale frases completas.","Caminhada")],
          cardio:[],cooldown:[mkW("Caminhada","5 min",""),mkW("Foam roller","10 min","IT band")]},
        {name:"Fartlek",type:"Condicionamento",xp:60,
          warmup:[mkW("Trote leve","10 min",""),mkW("Skipping","3×20m","")],
          main:[mkE("Trote Z2","5 min","","",""),mkE("Aceleração Z4","1 min","Z4","","RPE 7-8",""),mkE("Repetir","6x","6 ciclos","","Varie distância",""),mkE("Trote final","10 min","Z1","","")],
          cardio:[],cooldown:[mkW("Caminhada","5 min",""),mkW("Stretching","10 min","")]},
        {name:"Força p/ Corrida",type:"Força",xp:45,
          warmup:[mkW("Foam roller","5 min",""),mkW("Hip mobility","5 min","")],
          main:[mkE("Afundo Búlgaro","3×10 cada","","90s","Unilateral = especificidade ao running",""),mkE("Hip Thrust","3×12","","75s","Glúteo fraco = lesão",""),mkE("Dead Bug","3×10 cada","","60s","Core anti-rotacional","Prancha"),mkE("Nordic Curl","3×5","Hold 3s","90s","Prevenção isquio",""),mkE("Calf Raise Uni.","3×15 cada","","60s","3x peso corporal na corrida","")],
          cardio:[],cooldown:[mkW("Full stretch","15 min","")]},
        {name:"Recuperação Ativa",type:"Recuperação",xp:30,
          main:[mkE("Trote Z1","1×30min","Muito leve","","FC<120bpm","")],
          warmup:[],cardio:[],cooldown:[mkW("Foam roller","15 min","")]},
      ],
      2:[
        {name:"Tempo Run",type:"Resistência",xp:65,
          warmup:[mkW("Trote Z1","15 min","")],
          main:[mkE("Tempo Run","1×20-25min","Z3-Z4","","RPE 6-7. Confortavelmente desconfortável.","")],
          cardio:[],cooldown:[mkW("Stretching","10 min","")]},
        {name:"Intervalados 400m",type:"Condicionamento",xp:70,
          warmup:[mkW("Trote","15 min",""),mkW("Strides","4×80m","")],
          main:[mkE("400m Reps","6-8×400m","Pace 5K","3min","Consistência. Não saia forte demais.","")],
          cardio:[],cooldown:[mkW("Caminhada","5 min",""),mkW("Stretch","10 min","")]},
        {name:"Long Run Progressivo",type:"Resistência",xp:65,
          warmup:[mkW("Caminhada","5 min","")],
          main:[mkE("Corrida prog.","1×60-75min","Progressivo","","Últimos 15min Z3.","")],
          cardio:[],cooldown:[mkW("Foam roller","15 min","")]},
        {name:"Força Corrida",type:"Força",xp:50,
          warmup:[mkW("Mobilidade","10 min","")],
          main:[mkE("Single Leg RDL","3×10 cada","","75s","Equilíbrio e posterior",""),mkE("Step Up pesado","3×10 cada","","75s","Força de propulsão",""),mkE("Box Jump","3×5","","2min","Stiffness e elasticidade",""),mkE("Agachamento Pesado","4×5","","120s","Base de força","")],
          cardio:[],cooldown:[mkW("Full stretch","10 min","")]},
      ],
      3:[
        {name:"VO2max Intervalado",type:"Condicionamento",xp:70,
          warmup:[mkW("Trote","15 min",""),mkW("Strides","6×80m","")],
          main:[mkE("800m Reps","5×800m","Pace 3K","3min","Máximo sustentável.",""),mkE("Trote final","15 min","","","")],
          cardio:[],cooldown:[mkW("Stretching","10 min","")]},
        {name:"Paced Run",type:"Resistência",xp:70,
          warmup:[mkW("Trote","15 min","")],
          main:[mkE("Corrida pace alvo","1×30min","Pace de prova","","Exatamente o pace que quer.","")],
          cardio:[],cooldown:[mkW("Foam roller","10 min","")]},
        {name:"Long Run Pico",type:"Resistência",xp:75,
          warmup:[mkW("Caminhada","5 min","")],
          main:[mkE("Long Run","1×80-90min","Pico do ciclo","","Últimos 20min em pace de prova.","")],
          cardio:[],cooldown:[mkW("Foam roller","20 min","")]},
        {name:"Taper",type:"Recuperação",xp:40,
          warmup:[mkW("Mobilidade","10 min","")],
          main:[mkE("Trote leve","1×25min","Z1-Z2","","Ative sem fadiga.",""),mkE("Strides","4×80m","90%","","Ativação neuromuscular.","")],
          cardio:[],cooldown:[mkW("Visualização","10 min",""),mkW("Descanso","","Pronto!")]},
      ],
    },
  },
  mma:{
    coachNote:"Força, potência, resistência anaeróbica e aeróbica simultaneamente. Periodização ondulada com técnica diária integrada.",
    phases:[{name:"Base Condicionamento",weeks:"1–4",color:C.blue},{name:"Potência + Técnica",weeks:"5–8",color:C.amber},{name:"Especificidade de Luta",weeks:"9–12",color:C.red}],
    sessions:{
      1:[
        {name:"Força + Poder",type:"Força",xp:55,
          warmup:[mkW("Sombra","5 min","Movimentos do esporte"),mkW("Mobilidade","5 min","")],
          main:[mkE("Power Clean","4×3","3 reps","3min","Transferência ao clinch e golpe","Hang clean"),mkE("Agachamento","4×5","5 reps","120s","Base de força",""),mkE("Pull-up","4×5","5 reps","120s","Grappling","Lat pulldown"),mkE("Bench Press","3×6","6 reps","90s","Empurre no clinch","Push-up"),mkE("Core Rotacional","3×10 cada","","60s","Potência no golpe","")],
          cardio:[mkW("Skipping rope","5 min","")],cooldown:[mkW("Foam roller","10 min","")]},
        {name:"Condicionamento",type:"Condicionamento",xp:60,
          warmup:[mkW("Sombra","5 min",""),mkW("Skipping","3 min","")],
          main:[mkE("Rounds sombra","5×3min","1min descanso","","Movimento contínuo",""),mkE("Saco pesado","5×3min","1min descanso","","Combinações planejadas",""),mkE("Sprawl drill","3×10","","60s","Defesa takedown","")],
          cardio:[mkW("Z2 aeróbico","15 min","")],cooldown:[mkW("Stretching","10 min","")]},
        {name:"Técnica + Força",type:"Técnico",xp:50,
          warmup:[mkW("Mobilidade articular","10 min","")],
          main:[mkE("Treino técnico","45 min","","","Parceiro ou padman",""),mkE("KB Swing","3×15","15 reps","60s","Hip hinge potência",""),mkE("Turkish Get-up","3×3 cada","3/lado","90s","Estabilidade total",""),mkE("Farmer Carry","4×30m","","60s","Grip e core","")],
          cardio:[],cooldown:[mkW("Foam roller","10 min","")]},
        {name:"Recuperação",type:"Recuperação",xp:30,
          warmup:[],main:[mkE("Yoga ou natação leve","1×30min","","","Recuperação ativa","")],
          cardio:[],cooldown:[mkW("Visualização","10 min","")]},
      ],
      2:[
        {name:"Potência Explosiva",type:"Força",xp:65,
          warmup:[mkW("Sombra potência","5 min","Foco em explosão")],
          main:[mkE("Snatch","4×3","","3min","Explosão total","KB swing"),mkE("Box Jump","4×5","","2min","Elasticidade",""),mkE("Med Ball Slam","4×5","","90s","Transferência p/ soco",""),mkE("Agachamento Jump","4×4","","3min","",""),mkE("Band Punches","3×20 cada","","60s","Velocidade de braço","")],
          cardio:[],cooldown:[mkW("Recovery","15 min","")]},
        {name:"Sparring Leve",type:"Jogo",xp:70,
          warmup:[mkW("Aquecimento completo","15 min","")],
          main:[mkE("Sparring técnico","5-6×3min","Controlado","","Técnica, não resultado",""),mkE("Análise","15 min","","","O que funcionou?","")],
          cardio:[],cooldown:[mkW("Ice bath","10 min",""),mkW("Stretching","15 min","")]},
        {name:"Resistência Especial",type:"Condicionamento",xp:65,
          warmup:[mkW("Trote","10 min","")],
          main:[mkE("Circuito MMA","3 rounds","3min cada","1min","Sombra+saco+sprawl+solo",""),mkE("HIIT","10×30s","Máximo","30s","Alática","")],
          cardio:[],cooldown:[mkW("Z1","10 min",""),mkW("Stretching","10 min","")]},
        {name:"Força Grappling",type:"Força",xp:60,
          warmup:[mkW("Rolar suave","10 min","")],
          main:[mkE("Pull-up lastre","4×5","","120s","Força de clinch",""),mkE("Towel Pull-up","3×5","","90s","Grip específico",""),mkE("Neck Harness","3×15 cada","","60s","Proteção cervical",""),mkE("Wrestler Bridge","3×30s","","60s","Defesa de finalização","")],
          cardio:[],cooldown:[mkW("Recovery","15 min","")]},
      ],
      3:[
        {name:"Pico Força",type:"Força",xp:70,
          warmup:[mkW("Aquecimento específico","20 min","")],
          main:[mkE("Agachamento 90%","3×3","","3min","",""),mkE("Power Clean 90%","3×2","","3min","",""),mkE("Bench 90%","3×3","","2min","",""),mkE("Pull-up max","3×max","","2min","","")],
          cardio:[],cooldown:[mkW("Recovery","15 min","")]},
        {name:"Sparring Competitivo",type:"Jogo",xp:80,
          warmup:[mkW("Protocolo fight camp","20 min","")],
          main:[mkE("Sparring intenso","6-8×3min","","1min","Simulação de luta",""),mkE("Estratégia","20 min","","","")],
          cardio:[],cooldown:[mkW("Ice bath + contrast","15 min",""),mkW("Stretching","15 min","")]},
        {name:"Simulação Fight Camp",type:"Jogo",xp:75,
          warmup:[mkW("Protocolo","15 min","")],
          main:[mkE("Sessão completa","1h30min","","","Striking+Grappling+Cond.",""),mkE("Análise","20 min","","","")],
          cardio:[],cooldown:[mkW("Recovery total","20 min","")]},
        {name:"Taper",type:"Recuperação",xp:40,
          warmup:[mkW("Mobilidade","15 min","")],
          main:[mkE("Técnica leve","30 min","","","Vol -60%",""),mkE("Sombra suave","3×2min","","","")],
          cardio:[],cooldown:[mkW("Visualização","10 min","")]},
      ],
    },
  },
};

function buildGenericPlan(sport){
  var isTeam=["futebol","basket","volei","futsal","rugby"].includes(sport);
  var note=isTeam?"Programa coletivo: força, agilidade e condicionamento específico.":"Programa de performance baseado em periodização científica.";
  return{
    coachNote:note,
    phases:[{name:"Base",weeks:"1–4",color:C.blue},{name:"Desenvolvimento",weeks:"5–8",color:C.amber},{name:"Específico",weeks:"9–12",color:C.red}],
    sessions:{
      1:[
        {name:"Força Base",type:"Força",xp:50,
          warmup:[mkW("Aquecimento geral","8 min","")],
          main:[mkE("Agachamento","4×6","6 reps","120s","Técnica antes da carga","Goblet"),mkE("Deadlift","3×6","6 reps","120s","","RDL"),mkE("Bench Press","3×8","8 reps","90s","","Push-up"),mkE("Pull-up","3×8","8 reps","90s","","Lat pulldown"),mkE("Plank","3×45s","45s","60s","","Dead bug")],
          cardio:[mkW("Z2","15 min","")],cooldown:[mkW("Stretch","10 min","")]},
        {name:"Velocidade + Agilidade",type:"Campo",xp:55,
          warmup:[mkW("Sprint progressivo","4×30m","")],
          main:[mkE("Sprint 20m","6 reps","Cronometrado","2min","",""),mkE("5-10-5","6 reps","Cronometrado","2min","","T-drill"),mkE("Específico esporte","15 min","","","Movimentos do esporte","")],
          cardio:[mkW("Intervalado","20 min","30s/30s")],cooldown:[mkW("Stretch","10 min","")]},
        {name:"Condicionamento",type:"Condicionamento",xp:45,
          warmup:[mkW("Trote","5 min","")],
          main:[mkE("Aeróbico Z2","1×30min","30 min","","FC 120-140","")],
          cardio:[],cooldown:[mkW("Yoga","10 min","")]},
        {name:"Recuperação",type:"Recuperação",xp:30,
          warmup:[mkW("Mobilidade","10 min","")],
          main:[mkE("Técnica do esporte","30 min","","","Fundamentos","")],
          cardio:[mkW("Caminhada","20 min","")],cooldown:[mkW("Foam roller","10 min","")]},
      ],
      2:[
        {name:"Potência Lower",type:"Força",xp:60,warmup:[mkW("Ativação","10 min","")],main:[mkE("Jump Squat","4×4","","3min","",""),mkE("Power Clean","4×3","","3min","",""),mkE("Agach. 85%","3×4","","120s","",""),mkE("Bounding","4×30m","","2min","","")],cardio:[],cooldown:[mkW("Recovery","10 min","")]},
        {name:"Específico",type:"Campo",xp:65,warmup:[mkW("Drills","10 min","")],main:[mkE("Habilidade 1","20 min","","","Principal habilidade",""),mkE("Habilidade 2","20 min","","","Secundária",""),mkE("Condicionamento","15 min","","","","")],cardio:[],cooldown:[mkW("Stretch","10 min","")]},
        {name:"Força Max.",type:"Força",xp:60,warmup:[mkW("Progressão","15 min","")],main:[mkE("Agach. 85%","4×4","","2min","",""),mkE("DL 85%","3×4","","2min","",""),mkE("Bench 85%","4×4","","2min","","")],cardio:[],cooldown:[mkW("Recovery","10 min","")]},
        {name:"Cond. Avançado",type:"Condicionamento",xp:55,warmup:[mkW("Aquec.","8 min","")],main:[mkE("HIIT","3×8","20s/10s","","",""),mkE("Sprints","8×100m","Cron.","2min","","")],cardio:[],cooldown:[mkW("Stretch","15 min","")]},
      ],
      3:[
        {name:"Pico",type:"Força",xp:70,warmup:[mkW("Aquec.","20 min","")],main:[mkE("Agach. 90%","3×3","","3min","",""),mkE("DL 90%","3×2","","3min","",""),mkE("Bench 90%","3×3","","2min","","")],cardio:[],cooldown:[mkW("Recovery","15 min","")]},
        {name:"Velocidade Max.",type:"Campo",xp:70,warmup:[mkW("Ramp-up","6×60m","")],main:[mkE("Sprints max","6×40m","Cron.","4min","",""),mkE("Simulação","30 min","","","","")],cardio:[],cooldown:[mkW("Recovery","15 min","")]},
        {name:"Simulação",type:"Jogo",xp:75,warmup:[mkW("Protocolo","15 min","")],main:[mkE("Simulado","45 min","","","","")],cardio:[],cooldown:[mkW("Recovery","20 min","")]},
        {name:"Taper",type:"Recuperação",xp:40,warmup:[mkW("Mobilidade","15 min","")],main:[mkE("Vol -60%","1 série","","2min","","")],cardio:[mkW("Z1","15 min","")],cooldown:[mkW("Visualização","10 min","")]},
      ],
    },
  };
}

function getPlanData(sport){
  if(SPORT_PLANS[sport])return SPORT_PLANS[sport];
  if(sport==="nfl")return SPORT_PLANS.flag;
  if(sport==="boxe"||sport==="jiu"||sport==="judo")return SPORT_PLANS.mma;
  return buildGenericPlan(sport);
}

function generatePlan(config){
  var sp=SPORTS.find(function(s){return s.id===config.sport;})||SPORTS[0];
  var data=getPlanData(config.sport);
  var d=Math.min(Math.max(parseInt(config.daysPerWeek)||4,3),6);
  var mins=parseInt(config.minutesPerSession)||60;
  var intensities=["","Leve","Moderada","Moderada","Alta","Alta","Máxima","Máxima","Pico","Pico","Pico","Pico","Pico"];
  var weeks=[];
  for(var wi=0;wi<12;wi++){
    var phIdx=Math.floor(wi/4),phase=data.phases[phIdx]||data.phases[0];
    var pool=data.sessions[phIdx+1]||data.sessions[1]||[];
    var isDeload=(wi+1)%4===0;
    var recov=pool.find(function(s){return s.type==="Recuperação";});
    var wS=isDeload&&recov?[recov]:pool.slice(0,d);
    weeks.push({
      week:wi+1,phase:phase.name,phaseColor:phase.color,
      isDeload,intensity:isDeload?"Deload":(intensities[wi+1]||"Alta"),
      sessions:wS.map(function(s,si){return Object.assign({},s,{id:"w"+(wi+1)+"s"+si,weekNum:wi+1,completed:false,duration:mins});})
    });
  }
  return{id:Date.now(),sport:sp.id,sportName:sp.name,sportIcon:sp.icon,position:config.position,level:config.level||"amador",daysPerWeek:d,minutesPerSession:mins,totalWeeks:12,phases:data.phases,coachNote:data.coachNote,weeks,currentWeek:1};
}


function Icon({name,size=20,color}){
  var c=color||C.grayLight;
  var svgs={
    home:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:size,height:size}}><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
    plan:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:size,height:size}}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>,
    reg:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" style={{width:size,height:size}}><path d="M12 5v14M5 12h14"/></svg>,
    ai:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:size,height:size}}><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>,
    profile:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:size,height:size}}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
    back:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:size,height:size}}><path d="M15 19l-7-7 7-7"/></svg>,
    check:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:size,height:size}}><path d="M5 13l4 4L19 7"/></svg>,
    bolt:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:size,height:size}}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    chart:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:size,height:size}}><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
    fire:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:size,height:size}}><path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/><path d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"/></svg>,
    lock:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:size,height:size}}><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>,
    edit:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:size,height:size}}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
    star:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:size,height:size}}><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>,
    share:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:size,height:size}}><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>,
    sport:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:size,height:size}}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
    logout:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:size,height:size}}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>,
    trophy:<svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:size,height:size}}><path d="M6 9H4.5a2.5 2.5 0 010-5H6m12 5h1.5a2.5 2.5 0 000-5H18M6 9v6a6 6 0 0012 0V9m-12 0h12M9 21h6M12 18v3"/></svg>,
  };
  return<span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:size,height:size,flexShrink:0}}>
    {svgs[name]||svgs.bolt}
  </span>;
}

/* ─── UI PRIMITIVES ──────────────────────────────────────── */
function Card({children,style={},red=false,onClick,hover=false}){
  var[h,sH]=useState(false);
  return<div onClick={onClick}
    onMouseEnter={function(){if(hover||onClick)sH(true);}}
    onMouseLeave={function(){sH(false);}}
    style={Object.assign({background:C.white,borderRadius:16,border:"1px solid "+(red?C.redMid:C.border),boxShadow:red?sh.red:(h&&(hover||onClick)?sh.md:sh.xs),position:"relative",overflow:"hidden",cursor:onClick?"pointer":"default",transition:"all .18s",transform:h&&(hover||onClick)?"translateY(-1px)":"none"},style)}>
    {red&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,"+C.red+","+C.red+"66,transparent)"}}/>}
    {children}
  </div>;
}
function Btn({children,onClick,v="primary",sm=false,full=false,disabled=false,icon,style:extraStyle={}}){
  var[h,sH]=useState(false);
  var vars={
    primary:{background:h?"#A8001A":C.red,color:"#fff"},
    secondary:{background:"transparent",color:C.red,border:"1.5px solid "+C.red},
    ghost:{background:h?C.faint:"transparent",color:C.gray,border:"1px solid "+(h?C.border:"transparent")},
    dark:{background:h?"#222":C.dark,color:"#fff"},
  };
  return<button onClick={onClick} disabled={disabled}
    onMouseEnter={function(){sH(true);}} onMouseLeave={function(){sH(false);}}
    style={Object.assign({borderRadius:10,fontWeight:700,letterSpacing:.3,cursor:disabled?"not-allowed":"pointer",transition:"all .15s",opacity:disabled?.4:1,display:"inline-flex",alignItems:"center",gap:6,justifyContent:"center",border:"none",padding:sm?"8px 16px":"12px 24px",fontSize:sm?12:13,width:full?"100%":"auto",minHeight:sm?36:44},vars[v]||vars.primary,extraStyle)}>
    {icon&&<Icon name={icon} size={14} color={v==="primary"?"#fff":v==="secondary"?C.red:C.gray}/>}
    {children}
  </button>;
}
function Inp({label,value,onChange,placeholder,type="text",options,rows,hint}){
  var[f,sF]=useState(false);
  var base={background:f?C.white:C.faint,border:"1px solid "+(f?C.red+"66":C.border),borderRadius:10,color:C.text,padding:"11px 14px",fontSize:14,width:"100%",outline:"none",transition:"all .15s",minHeight:44};
  return<div style={{display:"flex",flexDirection:"column",gap:4}}>
    {label&&<div style={{color:C.gray,fontSize:11,fontWeight:600,letterSpacing:.2}}>{label}</div>}
    {options?<select value={value} onChange={function(e){onChange(e.target.value);}} onFocus={function(){sF(true);}} onBlur={function(){sF(false);}} style={base}>
      {options.map(function(o){return<option key={o.v||o} value={o.v||o}>{o.l||o}</option>;})}
    </select>:rows?<textarea value={value} onChange={function(e){onChange(e.target.value);}} placeholder={placeholder} rows={rows} onFocus={function(){sF(true);}} onBlur={function(){sF(false);}} style={Object.assign({},base,{resize:"vertical"})}/>
    :<input type={type} value={value} onChange={function(e){onChange(e.target.value);}} placeholder={placeholder} onFocus={function(){sF(true);}} onBlur={function(){sF(false);}} style={base}/>}
    {hint&&<div style={{color:C.grayLight,fontSize:10}}>{hint}</div>}
  </div>;
}
function Tag({children,color=C.red,size=10}){return<span style={{background:color+"14",color,padding:"3px 8px",borderRadius:5,fontSize:size,fontWeight:700,whiteSpace:"nowrap"}}>{children}</span>;}
function SL({children,mb=12}){return<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:mb}}><div style={{width:3,height:12,background:C.red,borderRadius:99}}/><span style={{color:C.gray,fontSize:11,fontWeight:700,letterSpacing:.5,textTransform:"uppercase"}}>{children}</span></div>;}
function AresLogo({size=32,mono=false}){return<div style={{display:"flex",alignItems:"center",gap:2}}><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:size,color:mono?"#fff":C.red,letterSpacing:3,lineHeight:1}}>ARES</span><span style={{fontSize:size*.25,color:mono?"#ffffff55":C.grayLight,fontWeight:600,letterSpacing:2,textTransform:"uppercase",alignSelf:"flex-end",marginBottom:size*.08}}>PERFORMANCE</span></div>;}
function Spinner(){return<div style={{width:20,height:20,border:"2px solid "+C.border,borderTopColor:C.red,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>;}

/* ─── MINI CHARTS ────────────────────────────────────────── */
function Sparkline({data,color=C.red,h=40,showDots=false}){
  if(!data||data.length<2)return<div style={{height:h,background:C.faint,borderRadius:8}}/>;
  var max=Math.max.apply(null,data),min=Math.min.apply(null,data),range=max-min||1,W=300,H=h;
  var pts=data.map(function(v,i){return[(i/(data.length-1))*(W-8)+4,H-4-((v-min)/range)*(H-10)];});
  var path="M"+pts.map(function(p){return p[0].toFixed(1)+","+p[1].toFixed(1);}).join(" L");
  var area=path+" L"+pts[pts.length-1][0]+","+H+" L"+pts[0][0]+","+H+" Z";
  var gId="g"+color.replace("#","");
  return<svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",height:H}}>
    <defs><linearGradient id={gId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".25"/><stop offset="100%" stopColor={color} stopOpacity=".02"/></linearGradient></defs>
    <path d={area} fill={"url(#"+gId+")"}/>
    <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    {showDots&&pts.map(function(p,i){return<circle key={i} cx={p[0]} cy={p[1]} r={i===pts.length-1?3.5:2} fill={color} opacity={i===pts.length-1?1:.5}/>;})}</svg>;
}
function BarChart({data,colors,labels,h=56}){
  if(!data||data.length===0)return<div style={{height:h,background:C.faint,borderRadius:8}}/>;
  var max=Math.max.apply(null,data)||1,W=300,H=h,pad=3;
  var bW=Math.floor((W-pad*(data.length+1))/data.length);
  return<svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",height:H}}>
    {data.map(function(v,i){var bh=Math.max(4,(v/max)*(H-16)),x=pad+(i*(bW+pad));return<g key={i}><rect x={x} y={H-bh-12} width={bW} height={bh} rx="3" fill={(colors&&colors[i])||C.red} opacity={i===data.length-1?1:.65}/>{labels&&<text x={x+bW/2} y={H} textAnchor="middle" fontSize="7" fontFamily="Inter,sans-serif" fontWeight="600" fill={C.grayLight}>{labels[i]}</text>}</g>;})}</svg>;
}
function RadarChart({stats,size=120}){
  var keys=Object.keys(stats),n=keys.length;
  if(n===0)return null;
  var cx=size/2,cy=size/2,r=size*.38;
  var pts=keys.map(function(k,i){var a=(i/n)*Math.PI*2-Math.PI/2,v=Math.min((stats[k]||0)/100,1);return{x:cx+r*v*Math.cos(a),y:cy+r*v*Math.sin(a),lx:cx+(r+14)*Math.cos(a),ly:cy+(r+14)*Math.sin(a),label:k};});
  var poly=pts.map(function(p){return p.x.toFixed(1)+","+p.y.toFixed(1);}).join(" ");
  var grid=keys.map(function(_,i){var a=(i/n)*Math.PI*2-Math.PI/2;return{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)};});
  return<svg viewBox={"0 0 "+size+" "+size} style={{width:size,height:size}}>
    {[.25,.5,.75,1].map(function(s){var gp=keys.map(function(_,i){var a=(i/n)*Math.PI*2-Math.PI/2;return(cx+r*s*Math.cos(a)).toFixed(1)+","+(cy+r*s*Math.sin(a)).toFixed(1);}).join(" ");return<polygon key={s} points={gp} fill="none" stroke={C.border} strokeWidth="1"/>;})}
    {grid.map(function(p,i){return<line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke={C.border} strokeWidth="1"/>;})}
    <polygon points={poly} fill={C.red+"20"} stroke={C.red} strokeWidth="1.5"/>
    {pts.map(function(p,i){return<g key={i}><circle cx={p.x} cy={p.y} r="3" fill={C.red}/><text x={p.lx.toFixed(1)} y={p.ly.toFixed(1)} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill={C.gray} fontWeight="600">{p.label}</text></g>;})}
  </svg>;
}
function ProgressRing({pct,color,size=80,stroke=7,value,label}){
  var r=(size-stroke)/2,circ=2*Math.PI*r,dash=circ*Math.min(pct,100)/100;
  return<div style={{position:"relative",width:size,height:size,flexShrink:0}}>
    <svg width={size} height={size} style={{position:"absolute",transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color+"18"} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={dash+" "+(circ-dash)} strokeLinecap="round"/>
    </svg>
    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontSize:size*.24,fontWeight:800,color:C.text,lineHeight:1}}>{value}</div>
      <div style={{fontSize:size*.1,color:C.grayLight,textAlign:"center",marginTop:1,lineHeight:1.2}}>{label}</div>
    </div>
  </div>;
}
function XPBar({xp}){
  var cur=getLevel(xp),nxt=getNextLevel(cur),base=cur.xpNeeded,next=nxt?nxt.xpNeeded:base+2000,pct=nxt?Math.round(((xp-base)/(next-base))*100):100;
  return<div style={{padding:"14px 16px",background:C.dark,borderRadius:12}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:28,height:28,borderRadius:7,background:cur.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#fff"}}>{cur.rank}</div>
        <div>
          <div style={{color:"#ffffffcc",fontWeight:700,fontSize:13}}>{cur.label.toUpperCase()}</div>
          {nxt&&<div style={{color:"#ffffff44",fontSize:9}}>{"→ "+nxt.label}</div>}
        </div>
      </div>
      <div style={{color:C.red,fontSize:13,fontWeight:700}}>{xp+" XP"}</div>
    </div>
    <div style={{background:"#ffffff14",borderRadius:99,height:4,overflow:"hidden"}}>
      <div style={{height:"100%",background:"linear-gradient(90deg,"+C.redDk+","+C.red+")",borderRadius:99,width:pct+"%",transition:"width .8s"}}/>
    </div>
    <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
      <span style={{color:"#ffffff33",fontSize:9}}>{(xp-base)+"/"+(nxt?next-base:"MAX")}</span>
      <span style={{color:"#ffffff55",fontSize:9}}>{pct+"%"}</span>
    </div>
  </div>;
}

/* ─── WORKOUT MODAL (BUG FIXED) ──────────────────────────── */
function WorkoutModal({session,week,onClose,onComplete}){
  var[tab,sTab]=useState("main");
  var[loads,setLoads]=useState({});
  if(!session)return null;
  var TABS=[{id:"warmup",label:"Aquec."},{id:"main",label:"Principal"},{id:"cardio",label:"Cardio"},{id:"cooldown",label:"Cooldown"}];
  function setLoad(i,field,val){
    setLoads(function(prev){
      var n=Object.assign({},prev);
      if(!n[i])n[i]={};
      n[i][field]=val;
      return n;
    });
  }
  var items=session[tab]||[];
  return<div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
    <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.55)"}}/>
    <div className="pop" style={{background:C.bg,borderRadius:"20px 20px 0 0",position:"relative",zIndex:1,maxHeight:"92vh",display:"flex",flexDirection:"column",paddingBottom:SAB}}>
      {/* Header */}
      <div style={{padding:"16px 20px 12px",background:C.white,borderBottom:"1px solid "+C.border,borderRadius:"20px 20px 0 0",flexShrink:0}}>
        <div style={{width:36,height:4,background:C.border,borderRadius:99,margin:"0 auto 14px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
          <div style={{flex:1}}>
            <div style={{color:C.grayLight,fontSize:10,marginBottom:3}}>{"Semana "+(week?week.week:"")+" · "+(week?week.phase:"")}</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:1,color:C.text}}>{session.name}</div>
            <div style={{display:"flex",gap:5,marginTop:6,flexWrap:"wrap"}}>
              <Tag color={tc(session.type)}>{session.type}</Tag>
              <Tag color={C.red}>{"+"+session.xp+" XP"}</Tag>
              <Tag color={C.blue}>{(session.duration||60)+"min"}</Tag>
            </div>
          </div>
          {!session.completed
            ?<Btn onClick={function(){if(onComplete)onComplete(loads);}} sm>Concluir ✓</Btn>
            :<Tag color={C.green}>CONCLUÍDO</Tag>}
        </div>
      </div>
      {/* Tab bar */}
      <div style={{background:C.white,borderBottom:"1px solid "+C.border,display:"flex",padding:"0 8px",overflowX:"auto",flexShrink:0}}>
        {TABS.map(function(t){return<button key={t.id} onClick={function(){sTab(t.id);}} style={{padding:"10px 14px",border:"none",cursor:"pointer",background:"transparent",color:tab===t.id?C.red:C.grayLight,borderBottom:"2px solid "+(tab===t.id?C.red:"transparent"),fontWeight:700,fontSize:11,textTransform:"uppercase",whiteSpace:"nowrap",minHeight:44,transition:"color .15s"}}>{t.label}</button>;})}
      </div>
      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px 40px",WebkitOverflowScrolling:"touch"}}>
        {items.length===0&&<div style={{textAlign:"center",padding:"40px 16px",color:C.grayLight,fontSize:13}}>Sem itens nesta seção</div>}
        {tab==="main"
          ?<div style={{display:"flex",flexDirection:"column",gap:8}} className="au">
            {items.map(function(ex,i){
              var ld=loads[i]||{};
              return<Card key={i} style={{padding:0}}>
                <div style={{display:"flex"}}>
                  <div style={{width:3,background:tc(session.type),flexShrink:0}}/>
                  <div style={{flex:1,padding:"12px 14px"}}>
                    <div style={{fontWeight:700,fontSize:14,color:C.text}}>{(i+1)+". "+ex.n}</div>
                    <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                      <span style={{background:C.redLight,border:"1px solid "+C.redMid,padding:"2px 8px",borderRadius:5,fontSize:11,color:C.red,fontWeight:600}}>{ex.s}</span>
                      <span style={{background:C.blueBg,border:"1px solid "+C.blue+"22",padding:"2px 8px",borderRadius:5,fontSize:11,color:C.blue,fontWeight:600}}>{ex.r}</span>
                      {ex.rest&&<span style={{color:C.grayLight,fontSize:11}}>{"⏱ "+ex.rest}</span>}
                    </div>
                    {!session.completed&&<div style={{marginTop:10,padding:"10px 12px",background:C.faint,borderRadius:8,border:"1px solid "+C.border}}>
                      <div style={{color:C.gray,fontSize:10,fontWeight:700,letterSpacing:.5,marginBottom:6}}>REGISTRAR CARGA</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                        {[["kg","Kg","80"],["reps","Reps","8"],["rpe","RPE","7"]].map(function(arr){return<div key={arr[0]}>
                          <div style={{color:C.grayLight,fontSize:9,marginBottom:2,fontWeight:600}}>{arr[1]}</div>
                          <input type="number" value={ld[arr[0]]||""} placeholder={arr[2]} onChange={function(e){setLoad(i,arr[0],e.target.value);}} style={{width:"100%",background:C.white,border:"1px solid "+C.border,borderRadius:7,padding:"8px 10px",fontSize:13,outline:"none",minHeight:36,color:C.text}}/>
                        </div>;})}
                      </div>
                      {ld.kg&&ld.reps&&<div style={{marginTop:6,color:C.green,fontSize:11,fontWeight:600}}>{"Volume: "+(parseInt(ld.kg||0)*parseInt(ld.reps||0)).toLocaleString()+" kg"}</div>}
                    </div>}
                    {ex.tip&&<div style={{marginTop:8,padding:"8px 10px",background:C.blueBg,borderRadius:7}}>
                      <div style={{color:C.blue,fontSize:9,fontWeight:700,marginBottom:2,letterSpacing:.5}}>TÉCNICA</div>
                      <div style={{color:C.text,fontSize:11,lineHeight:1.5}}>{ex.tip}</div>
                    </div>}
                    {ex.alt&&<div style={{marginTop:5,color:C.grayLight,fontSize:11}}>{"Alt: "}<span style={{color:C.gray,fontWeight:600}}>{ex.alt}</span></div>}
                  </div>
                </div>
              </Card>;
            })}
          </div>
          :<div style={{display:"flex",flexDirection:"column",gap:8}} className="au">
            {items.map(function(item,i){
              var itemColor=tab==="warmup"?C.amber:tab==="cardio"?C.green:C.blue;
              return<Card key={i} style={{padding:"12px 14px"}}>
                <div style={{fontWeight:600,fontSize:14,color:C.text}}>{item.n}</div>
                <div style={{color:itemColor,fontSize:12,marginTop:3,fontWeight:600}}>{item.d}</div>
                {item.tip&&<div style={{color:C.grayLight,fontSize:11,marginTop:4,lineHeight:1.4}}>{item.tip}</div>}
              </Card>;
            })}
          </div>}
      </div>
    </div>
  </div>;
}

/* ─── LOGIN ──────────────────────────────────────────────── */
function LoginScreen(){
  var[mode,sMode]=useState("welcome");
  var[email,sEmail]=useState(""),[ pass,sPass]=useState(""),[ name,sName]=useState("");
  var[ld,sLd]=useState(false),[err,sErr]=useState("");
  async function oAuth(p){sLd(true);sErr("");var{error}=await supabase.auth.signInWithOAuth({provider:p,options:{redirectTo:window.location.origin}});if(error){sErr(error.message);sLd(false);}}
  async function signUp(){if(!email||!pass||!name){sErr("Preencha todos os campos.");return;}sLd(true);var{error}=await supabase.auth.signUp({email,password:pass,options:{data:{name}}});if(error){sErr(error.message);}else{sErr("✓ Verifique seu e-mail!");}sLd(false);}
  async function signIn(){if(!email||!pass){sErr("Preencha todos os campos.");return;}sLd(true);var{error}=await supabase.auth.signInWithPassword({email,password:pass});if(error){sErr("E-mail ou senha incorretos.");sLd(false);}}
  if(mode==="welcome")return<div style={{minHeight:"100vh",background:C.dark,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
    <div style={{position:"absolute",top:"15%",left:"50%",transform:"translateX(-50%)",width:400,height:400,background:"radial-gradient(ellipse,"+C.red+"16,transparent 65%)",pointerEvents:"none"}}/>
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 24px 40px"}}>
      <AresLogo size={52} mono/>
      <div style={{color:"#ffffff44",fontSize:13,textAlign:"center",maxWidth:260,lineHeight:1.7,marginTop:20}}>Inteligência atlética para qualquer esporte</div>
      <div style={{display:"flex",gap:28,marginTop:28}}>
        {[["50K+","Atletas"],["21","Esportes"],["IA","Engine"]].map(function(a){return<div key={a[1]} style={{textAlign:"center"}}><div style={{color:"#fff",fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:1}}>{a[0]}</div><div style={{color:"#ffffff33",fontSize:9,letterSpacing:2,textTransform:"uppercase",marginTop:2}}>{a[1]}</div></div>;})}
      </div>
    </div>
    <div style={{background:C.white,borderRadius:"22px 22px 0 0",padding:"28px 24px calc(32px + "+SAB+")"}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:C.text,letterSpacing:1,marginBottom:4}}>COMECE AGORA</div>
      <div style={{color:C.gray,fontSize:13,marginBottom:20}}>Seu programa esportivo em minutos.</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <button onClick={function(){oAuth("google");}} disabled={ld} style={{width:"100%",padding:14,background:C.white,border:"1px solid "+C.border,borderRadius:12,cursor:"pointer",fontSize:14,fontWeight:600,color:C.text,minHeight:48,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continuar com Google
        </button>
        <button onClick={function(){oAuth("apple");}} disabled={ld} style={{width:"100%",padding:14,background:C.dark,border:"none",borderRadius:12,cursor:"pointer",fontSize:14,fontWeight:600,color:"#fff",minHeight:48,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          Continuar com Apple
        </button>
        <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{flex:1,height:1,background:C.border}}/><span style={{color:C.grayLight,fontSize:12}}>ou</span><div style={{flex:1,height:1,background:C.border}}/></div>
        <Btn onClick={function(){sMode("signup");}} v="secondary" full>Criar conta com e-mail</Btn>
        <div style={{textAlign:"center"}}><span style={{color:C.gray,fontSize:13}}>Já tem conta? </span><span onClick={function(){sMode("login");}} style={{color:C.red,fontWeight:600,cursor:"pointer"}}>Entrar</span></div>
        {err&&<div style={{color:err.includes("✓")?C.green:C.red,fontSize:12,textAlign:"center"}}>{err}</div>}
        {ld&&<div style={{display:"flex",justifyContent:"center"}}><Spinner/></div>}
      </div>
    </div>
  </div>;
  return<div style={{minHeight:"100vh",background:C.dark,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px"}}>
    <AresLogo size={40} mono/>
    <Card style={{width:"100%",maxWidth:400,padding:28,marginTop:28}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:C.text,letterSpacing:1,marginBottom:20}}>{mode==="signup"?"CRIAR CONTA":"ENTRAR"}</div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {mode==="signup"&&<Inp label="Nome" value={name} onChange={sName} placeholder="Seu nome"/>}
        <Inp label="E-mail" value={email} onChange={sEmail} placeholder="atleta@email.com" type="email"/>
        <Inp label="Senha" value={pass} onChange={sPass} placeholder="Min. 6 caracteres" type="password"/>
      </div>
      {err&&<div style={{color:err.includes("✓")?C.green:C.red,fontSize:12,marginTop:8}}>{err}</div>}
      <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:8}}>
        <Btn onClick={mode==="login"?signIn:signUp} disabled={ld} full>{ld?"...":mode==="login"?"Entrar →":"Criar conta →"}</Btn>
        <Btn onClick={function(){sMode("welcome");}} v="ghost" full sm>Voltar</Btn>
      </div>
    </Card>
  </div>;
}

/* ─── ONBOARD ─────────────────────────────────────────────── */
function OnboardScreen({user,onComplete}){
  var[step,sStep]=useState(0),[age,sAge]=useState(""),[sex,sSex]=useState("Masculino"),[wt,sWt]=useState(""),[ht,sHt]=useState(""),[lv,sLv]=useState("Amador");
  var[cat,sCat]=useState("Todos"),[sport,setSport]=useState(null),[pos,sPos]=useState(""),[goal,sGoal]=useState(GOALS[0]),[days,sDays]=useState("4"),[mins,sMins]=useState("60");
  function pickSport(id){setSport(id);var s=SPORTS.find(function(s){return s.id===id;});if(s)sPos(s.positions[0]);}
  var filtered=cat==="Todos"?SPORTS:SPORTS.filter(function(s){return s.cat===cat;});
  var sp=SPORTS.find(function(s){return s.id===sport;});
  return<div style={{minHeight:"100vh",background:C.bg}}>
    <div style={{background:C.white,borderBottom:"1px solid "+C.border,padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:10}}>
      <AresLogo size={26}/>
      <div style={{display:"flex",gap:4,alignItems:"center"}}>
        {[0,1,2].map(function(i){return<div key={i} style={{width:i===step?28:8,height:4,borderRadius:99,background:i<step?C.green:i===step?C.red:C.border,transition:"all .3s"}}/>;})}</div>
    </div>
    <div style={{maxWidth:600,margin:"0 auto",padding:"24px 16px"}} className="au">
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:C.text,letterSpacing:1,marginBottom:20}}>{["SEU PERFIL","SEU ESPORTE","OBJETIVOS"][step]}</div>
      {step===0&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Card style={{padding:22}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Inp label="Idade" value={age} onChange={sAge} type="number" placeholder="24" hint="Obrigatório"/>
            <Inp label="Sexo" value={sex} onChange={sSex} options={["Masculino","Feminino","Outro"].map(function(s){return{v:s,l:s};})}/>
            <Inp label="Peso (kg)" value={wt} onChange={sWt} type="number" placeholder="78"/>
            <Inp label="Altura (cm)" value={ht} onChange={sHt} type="number" placeholder="177"/>
            <div style={{gridColumn:"1/-1"}}><Inp label="Nível atlético" value={lv} onChange={sLv} options={["Iniciante","Amador","Semi-profissional","Profissional"].map(function(l){return{v:l,l:l};})}/></div>
          </div>
        </Card>
        <div style={{display:"flex",justifyContent:"flex-end"}}><Btn onClick={function(){sStep(1);}} disabled={!age}>Próximo →</Btn></div>
      </div>}
      {step===1&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{CATS.map(function(c){return<button key={c} onClick={function(){sCat(c);}} style={{padding:"6px 14px",borderRadius:20,border:"1px solid "+(cat===c?C.red:C.border),background:cat===c?C.redLight:C.white,color:cat===c?C.red:C.gray,cursor:"pointer",fontSize:11,fontWeight:600,minHeight:32}}>{c}</button>;})}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8,maxHeight:340,overflowY:"auto"}}>
          {filtered.map(function(s){return<Card key={s.id} hover onClick={function(){pickSport(s.id);}} red={sport===s.id} style={{padding:"14px 10px",cursor:"pointer"}}>
            <div style={{fontSize:20,marginBottom:6}}>{s.icon}</div>
            <div style={{color:C.text,fontWeight:700,fontSize:12,lineHeight:1.3}}>{s.name}</div>
            <div style={{color:C.grayLight,fontSize:9,marginTop:2}}>{s.cat}</div>
            {sport===s.id&&<div style={{position:"absolute",top:6,right:6}}><Tag size={9}>✓</Tag></div>}
          </Card>;})}
        </div>
        {sp&&<Card style={{padding:16}}>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:22}}>{sp.icon}</span>
            <div><div style={{fontWeight:700,fontSize:14,color:C.text}}>{sp.name}</div><Tag color={C.blue}>{sp.cat}</Tag></div>
          </div>
          <Inp label="Posição / Função" value={pos} onChange={sPos} options={sp.positions.map(function(p){return{v:p,l:p};})}/>
        </Card>}
        <div style={{display:"flex",justifyContent:"space-between"}}><Btn onClick={function(){sStep(0);}} v="ghost">← Voltar</Btn><Btn onClick={function(){sStep(2);}} disabled={!sport||!pos}>Próximo →</Btn></div>
      </div>}
      {step===2&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Card style={{padding:20}}><SL>Objetivo Principal</SL>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {GOALS.map(function(g){return<div key={g} onClick={function(){sGoal(g);}} style={{padding:"12px 14px",borderRadius:10,border:"1px solid "+(goal===g?C.red:C.border),background:goal===g?C.redLight:C.white,cursor:"pointer",display:"flex",alignItems:"center",gap:10,minHeight:44}}>
              <div style={{width:15,height:15,borderRadius:"50%",border:"2px solid "+(goal===g?C.red:C.border),background:goal===g?C.red:"transparent",flexShrink:0}}/>
              <span style={{fontSize:13,color:goal===g?C.red:C.text,fontWeight:goal===g?600:400}}>{g}</span>
            </div>;})}
          </div>
        </Card>
        <Card style={{padding:20}}><SL>Disponibilidade</SL>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div>
              <div style={{color:C.gray,fontSize:11,fontWeight:600,marginBottom:8}}>{"Dias/sem: "}<span style={{color:C.red,fontSize:20,fontFamily:"'Bebas Neue',sans-serif"}}>{days+"×"}</span></div>
              <input type="range" min={3} max={6} value={days} onChange={function(e){sDays(e.target.value);}} style={{width:"100%",accentColor:C.red}}/>
            </div>
            <div>
              <div style={{color:C.gray,fontSize:11,fontWeight:600,marginBottom:8}}>{"Tempo/sessão: "}<span style={{color:C.red,fontSize:20,fontFamily:"'Bebas Neue',sans-serif"}}>{mins+"min"}</span></div>
              <input type="range" min={30} max={120} step={15} value={mins} onChange={function(e){sMins(e.target.value);}} style={{width:"100%",accentColor:C.red}}/>
            </div>
          </div>
        </Card>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <Btn onClick={function(){sStep(1);}} v="ghost">← Voltar</Btn>
          <Btn onClick={function(){onComplete({sport,position:pos,level:lv,age,sex,weight:wt,height:ht,goal,daysPerWeek:days,minutesPerSession:mins});}}>Gerar programa ▶</Btn>
        </div>
      </div>}
    </div>
  </div>;
}

/* ─── DASHBOARD TAB ──────────────────────────────────────── */
function DashboardTab({activity,user,onGoToPlan}){
  var plan=activity?activity.plan:null;
  var sessions=activity?activity.sessions||[]:[];
  var sp=activity?SPORTS.find(function(s){return s.id===activity.sport;}):null;
  var xp=activity?activity.xp||0:0;
  var cw=plan?plan.weeks[(plan.currentWeek||1)-1]:null;
  var ws=cw?cw.sessions:[],wd=ws.filter(function(s){return s.completed;}).length,wt=ws.length;
  var weekPct=wt>0?Math.round((wd/wt)*100):0;
  var cyclePct=plan?Math.round(((plan.currentWeek-1)/12)*100):0;
  var[selView,sSelView]=useState("overview");
  var VIEWS=[{id:"overview",label:"Visão Geral"},{id:"load",label:"Carga"},{id:"metrics",label:"Métricas"},{id:"body",label:"Corpo"}];
  var totalSess=sessions.length;
  var avgRpe=totalSess?parseFloat((sessions.slice(0,8).reduce(function(a,s){return a+(+s.rpe||7.2);},0)/Math.min(8,totalSess)).toFixed(1)):7.2;
  var weekLoad=Math.round(avgRpe*(wd||1)*45);
  var prevLoad=Math.round(weekLoad*0.87);
  var acwr=weekLoad>0?parseFloat((weekLoad/(prevLoad||weekLoad)).toFixed(2)):1.0;
  var acwrStatus=acwr<0.8?"Subutilizado":acwr<=1.3?"Zona Ótima":acwr<=1.5?"Atenção":"Alto Risco";
  var acwrColor=acwr<0.8?C.blue:acwr<=1.3?C.green:acwr<=1.5?C.amber:C.red;
  var streak=0;
  if(plan){for(var wi=(plan.currentWeek||1)-1;wi>=0;wi--){var w=plan.weeks[wi];if(w&&w.sessions.filter(function(s){return s.completed;}).length>0)streak++;else break;}}
  var perfScore=Math.min(100,Math.round((weekPct*0.3)+(cyclePct*0.2)+(Math.min(totalSess*5,25)*0.2)+(acwr>=0.8&&acwr<=1.3?25:acwr>=0.6&&acwr<=1.5?15:5)*0.2+(streak*3*0.1)));
  var scoreColor=perfScore>=80?C.green:perfScore>=60?C.amber:C.red;
  var level=getLevel(xp);
  var athleteStats={VEL:Math.min(99,25+Math.floor(xp/45)),FOR:Math.min(99,20+Math.floor(xp/50)),RES:Math.min(99,30+Math.floor(xp/40)),AGI:Math.min(99,22+Math.floor(xp/48)),TEC:Math.min(99,18+Math.floor(xp/55))};
  var acwrTrend=[0.82,0.95,1.1,1.05,1.18,1.22,acwr];
  var weekDayData=[prevLoad*.6,prevLoad*.85,prevLoad*.9,prevLoad,weekLoad*.7,weekLoad*.9,weekLoad];
  var weekLabels=["S","T","Q","Q","S","S","D"];
  var[prData,setPrData]=useState({bench:"",squat:"",deadlift:"",sprint40:"",sprint10:""});
  var[showPR,sShowPR]=useState(false);
  if(!activity)return<div style={{padding:40,textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>⚡</div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:C.text}}>CONFIGURE SEU ESPORTE</div></div>;
  return<div className="au" style={{display:"flex",flexDirection:"column",gap:12,padding:"0 0 20px"}}>
    {/* Header card */}
    <Card style={{padding:0,overflow:"hidden"}}>
      <div style={{background:"linear-gradient(135deg,"+C.dark+" 0%,#1a0008 100%)",padding:"20px 20px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{color:"#ffffff33",fontSize:10,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:"#fff",letterSpacing:2,lineHeight:1}}>{(sp?sp.name:"ESPORTE").toUpperCase()}</div>
            <div style={{color:"#ffffff55",fontSize:12,marginTop:3}}>{(activity.position||"")+" · Semana "+(plan?plan.currentWeek:1)+"/12"}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{color:scoreColor,fontFamily:"'Bebas Neue',sans-serif",fontSize:48,lineHeight:1}}>{perfScore}</div>
            <div style={{color:"#ffffff44",fontSize:9,letterSpacing:2,textTransform:"uppercase"}}>PERF SCORE</div>
          </div>
        </div>
        <div style={{display:"flex",gap:2,marginTop:16}}>
          {(plan?plan.weeks:[]).map(function(w){var done=w.sessions.filter(function(s){return s.completed;}).length,tot=w.sessions.length,allD=done===tot&&tot>0,isCur=w.week===(plan?plan.currentWeek:1);return<div key={w.week} style={{flex:1,height:4,borderRadius:99,background:allD?C.green:isCur?w.phaseColor:"#ffffff10",transition:"background .3s"}}/>;})}</div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
          <span style={{color:"#ffffff33",fontSize:9}}>Ciclo {cyclePct}% completo</span>
          <span style={{color:cw?cw.phaseColor:"#ffffff44",fontSize:9,fontWeight:700}}>{cw?cw.phase:""}</span>
        </div>
      </div>
    </Card>
    {/* View switcher */}
    <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:2}}>
      {VIEWS.map(function(v){var a=selView===v.id;return<button key={v.id} onClick={function(){sSelView(v.id);}} style={{padding:"7px 16px",borderRadius:20,border:"1px solid "+(a?C.red:C.border),background:a?C.red:"transparent",color:a?"#fff":C.gray,cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap",minHeight:32,transition:"all .15s"}}>{v.label}</button>;})}
    </div>
    {selView==="overview"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {[{l:"TREINOS",v:totalSess.toString(),c:C.red,sub:"total"},{l:"STREAK",v:streak>0?streak+"W":"—",c:C.amber,sub:"semanas"},{l:"ADERÊNCIA",v:weekPct+"%",c:weekPct>=80?C.green:C.amber,sub:"semana"},{l:"RPE",v:avgRpe||"—",c:avgRpe>=8?C.red:avgRpe>=6?C.amber:C.green,sub:"médio"}].map(function(k){return<Card key={k.l} style={{padding:"12px 10px",textAlign:"center"}}>
          <div style={{color:C.grayLight,fontSize:8,fontWeight:700,letterSpacing:1,marginBottom:5}}>{k.l}</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:k.c,lineHeight:1}}>{k.v}</div>
          <div style={{color:C.grayLight,fontSize:9,marginTop:2}}>{k.sub}</div>
        </Card>;})}
      </div>
      <Card style={{padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <div style={{color:C.grayLight,fontSize:10,fontWeight:700,letterSpacing:.5,marginBottom:3}}>ACWR · CARGA AGUDA/CRÔNICA</div>
            <div style={{display:"flex",alignItems:"baseline",gap:8}}>
              <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,color:acwrColor,lineHeight:1}}>{acwr.toFixed(2)}</span>
              <Tag color={acwrColor}>{acwrStatus}</Tag>
            </div>
          </div>
          <div style={{textAlign:"right"}}><div style={{color:C.grayLight,fontSize:9}}>Carga semana</div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:C.text}}>{weekLoad+" UA"}</div></div>
        </div>
        <div style={{background:C.faint,borderRadius:8,height:6,overflow:"hidden",marginBottom:6}}>
          <div style={{position:"relative",height:"100%"}}>
            <div style={{position:"absolute",left:"16%",right:"30%",top:0,bottom:0,background:C.green+"22",borderRadius:8}}/>
            <div style={{height:"100%",width:Math.min(acwr/1.6*100,100)+"%",background:acwrColor,borderRadius:8,transition:"width 1s",boxShadow:"0 0 6px "+acwrColor+"55"}}/>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.grayLight}}><span>0.6</span><span style={{color:C.green,fontWeight:700}}>Ótimo 0.8–1.3</span><span>1.6</span></div>
        <div style={{marginTop:10,height:40}}><Sparkline data={acwrTrend} color={acwrColor} h={40}/></div>
        {acwr>1.3&&<div style={{marginTop:8,padding:"8px 10px",background:C.amberBg,borderRadius:7,border:"1px solid "+C.amber+"22",fontSize:11,color:C.amber,fontWeight:500}}>⚠ Reduza volume 15%. Foco em qualidade.</div>}
        {acwr<0.8&&<div style={{marginTop:8,padding:"8px 10px",background:C.blueBg,borderRadius:7,border:"1px solid "+C.blue+"22",fontSize:11,color:C.blue,fontWeight:500}}>💡 Carga baixa. Você tem margem para aumentar.</div>}
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Card style={{padding:14,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
          <div style={{color:C.grayLight,fontSize:10,fontWeight:700,letterSpacing:.5,alignSelf:"flex-start"}}>ATRIBUTOS</div>
          <RadarChart stats={athleteStats} size={110}/>
        </Card>
        <Card style={{padding:14,background:C.dark}}>
          <div style={{color:"#ffffff55",fontSize:10,fontWeight:700,letterSpacing:.5,marginBottom:10}}>XP</div>
          <XPBar xp={xp}/>
          <div style={{marginTop:10}}>
            {Object.entries(athleteStats).slice(0,4).map(function(e){return<div key={e[0]} style={{marginBottom:5}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:1}}><span style={{color:"#ffffff44",fontSize:8,fontWeight:700}}>{e[0]}</span><span style={{color:"#ffffff88",fontSize:9,fontWeight:700}}>{e[1]}</span></div>
              <div style={{height:2,background:"#ffffff11",borderRadius:99}}><div style={{width:e[1]+"%",height:"100%",background:C.red,borderRadius:99,transition:"width 1s"}}/></div>
            </div>;})}
          </div>
        </Card>
      </div>
      {cw&&(function(){var next=cw.sessions.find(function(s){return!s.completed;});if(!next)return null;
        return<Card hover onClick={onGoToPlan} style={{padding:0,cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"stretch"}}>
            <div style={{width:4,background:tc(next.type),flexShrink:0}}/>
            <div style={{flex:1,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:tc(next.type)+"14",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="bolt" size={18} color={tc(next.type)}/></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:C.grayLight,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:1}}>PRÓXIMO TREINO</div>
                <div style={{color:C.text,fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{next.name}</div>
                <div style={{color:C.grayLight,fontSize:11,marginTop:1}}>{next.type+" · "+(next.duration||60)+"min · +"+(next.xp||50)+" XP"}</div>
              </div>
            </div>
          </div>
        </Card>;
      }())}
    </div>}
    {selView==="load"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Card style={{padding:18}}><SL>Volume Diário (UA)</SL>
        <BarChart data={weekDayData} colors={weekDayData.map(function(v,i){return i===weekDayData.length-1?C.red:C.red+"55";})} labels={weekLabels} h={64}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}><span style={{color:C.grayLight,fontSize:10}}>Total semana</span><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:C.text}}>{weekLoad.toLocaleString()+" UA"}</span></div>
      </Card>
      <Card style={{padding:18}}><SL>Tendência ACWR</SL><Sparkline data={acwrTrend} color={acwrColor} h={60} showDots/></Card>
    </div>}
    {selView==="metrics"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Card style={{padding:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><SL mb={0}>Records Pessoais (PRs)</SL><Btn sm v="ghost" onClick={function(){sShowPR(!showPR);}}>{showPR?"Fechar":"Inserir PRs"}</Btn></div>
        {showPR&&<div style={{marginBottom:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{k:"bench",l:"Supino (kg)"},{k:"squat",l:"Agach. (kg)"},{k:"deadlift",l:"Terra (kg)"},{k:"sprint40",l:"40yd (s)"},{k:"sprint10",l:"10m (s)"}].map(function(f){return<div key={f.k}>
            <div style={{color:C.grayLight,fontSize:10,fontWeight:600,marginBottom:2}}>{f.l}</div>
            <input type="number" step="0.01" value={prData[f.k]||""} placeholder="—" onChange={function(e){setPrData(function(p){var n=Object.assign({},p);n[f.k]=e.target.value;return n;});}} style={{width:"100%",background:C.faint,border:"1px solid "+C.border,borderRadius:8,padding:"9px 10px",fontSize:13,outline:"none",minHeight:40,color:C.text}}/>
          </div>;})}
          <div style={{gridColumn:"1/-1"}}><Btn sm full onClick={function(){sShowPR(false);}}>Salvar PRs</Btn></div>
        </div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[{l:"Supino",v:prData.bench,u:"kg",i:"🏋️"},{l:"Agach.",v:prData.squat,u:"kg",i:"🦵"},{l:"Terra",v:prData.deadlift,u:"kg",i:"💪"},{l:"40yd",v:prData.sprint40,u:"s",i:"⚡"},{l:"10m",v:prData.sprint10,u:"s",i:"🏃"},{l:"Sessões",v:totalSess.toString(),u:"",i:"📋"}].map(function(m){return<Card key={m.l} style={{padding:"12px 10px",textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:4}}>{m.i}</div>
            <div style={{color:C.grayLight,fontSize:9,fontWeight:700,letterSpacing:.5,marginBottom:3}}>{m.l.toUpperCase()}</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:m.v?"22":"16",color:m.v?C.text:C.grayLight,lineHeight:1}}>{m.v||"—"}</div>
            {m.v&&m.u&&<div style={{color:C.grayLight,fontSize:9,marginTop:2}}>{m.u}</div>}
          </Card>;})}
        </div>
      </Card>
      <Card style={{padding:18}}><SL>Atributos Atléticos</SL>
        <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          <RadarChart stats={athleteStats} size={130}/>
          <div style={{flex:1,minWidth:120}}>
            {Object.entries(athleteStats).map(function(e){return<div key={e[0]} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:C.gray,fontSize:11,fontWeight:600}}>{e[0]}</span><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:C.text}}>{e[1]}</span></div>
              <div style={{height:4,background:C.faint,borderRadius:99,overflow:"hidden"}}><div style={{width:e[1]+"%",height:"100%",background:"linear-gradient(90deg,"+C.red+"88,"+C.red+")",borderRadius:99,transition:"width 1s ease"}}/></div>
            </div>;})}
          </div>
        </div>
      </Card>
    </div>}
    {selView==="body"&&<BodyView activity={activity}/>}
  </div>;
}

function BodyView({activity}){
  var[m,sM]=useState({peso:"",gordura:"",cintura:"",quadril:"",braco:"",coxa:""});
  var[saved,sSaved]=useState(false);
  function set(k,v){sM(function(p){var n=Object.assign({},p);n[k]=v;return n;});}
  var imc=m.peso&&activity&&activity.height?parseFloat((parseFloat(m.peso)/Math.pow(parseFloat(activity.height)/100,2)).toFixed(1)):null;
  var imcStatus=imc?imc<18.5?"Abaixo":imc<25?"Normal":imc<30?"Sobrepeso":"Obeso":null;
  var imcColor=imc?imc<18.5?C.blue:imc<25?C.green:imc<30?C.amber:C.red:null;
  return<div style={{display:"flex",flexDirection:"column",gap:10}}>
    <Card style={{padding:18}}><SL>Composição Corporal</SL>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {[{k:"peso",l:"Peso (kg)",p:"78.0"},{k:"gordura",l:"% Gordura",p:"12.4"},{k:"cintura",l:"Cintura (cm)",p:"82"},{k:"quadril",l:"Quadril (cm)",p:"96"},{k:"braco",l:"Braço (cm)",p:"38"},{k:"coxa",l:"Coxa (cm)",p:"56"}].map(function(f){return<div key={f.k}>
          <div style={{color:C.grayLight,fontSize:11,fontWeight:600,marginBottom:3}}>{f.l}</div>
          <input type="number" step="0.1" value={m[f.k]} placeholder={f.p} onChange={function(e){set(f.k,e.target.value);}} style={{width:"100%",background:C.faint,border:"1px solid "+C.border,borderRadius:8,padding:"10px 12px",fontSize:14,outline:"none",minHeight:44,color:C.text}}/>
        </div>;})}
      </div>
      {imc&&<div style={{marginTop:14,padding:"12px 14px",background:imcColor+"10",border:"1px solid "+imcColor+"22",borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{color:C.gray,fontSize:10,fontWeight:700,marginBottom:2}}>IMC</div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:imcColor,lineHeight:1}}>{imc}</div></div>
        <Tag color={imcColor}>{imcStatus}</Tag>
      </div>}
      {saved?<div style={{marginTop:12,padding:"10px 14px",background:C.greenBg,borderRadius:10,display:"flex",gap:8,alignItems:"center"}}><Icon name="check" size={14} color={C.green}/><span style={{color:C.green,fontWeight:700,fontSize:13}}>Medidas salvas!</span></div>
      :<Btn onClick={function(){sSaved(true);setTimeout(function(){sSaved(false);},3000);}} full style={{marginTop:12}}>Salvar medidas</Btn>}
    </Card>
  </div>;
}

/* ─── PLAN TAB (FIXED) ────────────────────────────────────── */
function PlanTab({activity,onMarkComplete,onXPGain}){
  var plan=activity?activity.plan:null;
  var[selW,sSelW]=useState(plan?plan.currentWeek:1);
  var[modalData,setModalData]=useState(null);
  if(!plan)return<div style={{padding:40,textAlign:"center",color:C.gray}}>Complete o onboarding para gerar seu programa.</div>;
  function isUnlocked(wn){
    if(wn<=1)return true;
    var prev=plan.weeks[wn-2];
    if(!prev)return true;
    return prev.sessions.filter(function(s){return s.completed;}).length===prev.sessions.length&&prev.sessions.length>0;
  }
  function handleComplete(weekNum,sessionId,loads){
    onMarkComplete(weekNum,sessionId);
    var w=plan.weeks[weekNum-1];
    if(!w)return;
    var s=w.sessions.find(function(s){return s.id===sessionId;});
    if(s)onXPGain(s.xp||XP_SESSION);
    var willFull=w.sessions.filter(function(s){return s.completed||s.id===sessionId;}).length===w.sessions.length;
    if(willFull)onXPGain(XP_WEEK);
  }
  var week=plan.weeks[selW-1];
  var ul=isUnlocked(selW);
  return<div className="au" style={{display:"flex",flexDirection:"column",gap:12,padding:"0 0 20px"}}>
    {modalData&&<WorkoutModal session={modalData.session} week={modalData.week} onClose={function(){setModalData(null);}} onComplete={function(loads){handleComplete(modalData.week.week,modalData.session.id,loads);setModalData(null);}}/>}
    <Card style={{padding:16,background:C.dark}}>
      <div style={{color:"#ffffff33",fontSize:9,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>METODOLOGIA</div>
      <div style={{color:"#ffffffbb",fontSize:12,lineHeight:1.7}}>{plan.coachNote}</div>
    </Card>
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {plan.phases.map(function(p){return<Card key={p.name} style={{flex:1,minWidth:150,padding:"12px 14px",borderLeft:"4px solid "+p.color}}>
        <div style={{color:p.color,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:3}}>{p.weeks?"SEMANAS "+p.weeks:""}</div>
        <div style={{color:C.text,fontWeight:700,fontSize:13}}>{p.name}</div>
      </Card>;})}
    </div>
    <Card style={{padding:16}}><SL>Progresso do Ciclo</SL>
      <div style={{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:3}}>
        {plan.weeks.map(function(w){
          var done=w.sessions.filter(function(s){return s.completed;}).length,tot=w.sessions.length,sel=selW===w.week,unlk=isUnlocked(w.week),allD=done===tot&&tot>0;
          return<button key={w.week} onClick={function(){sSelW(w.week);}} style={{padding:"6px 2px",border:"1px solid "+(sel?w.phaseColor:allD?C.green:!unlk?C.faint:C.border),borderRadius:6,cursor:unlk?"pointer":"default",background:sel?w.phaseColor:allD?C.greenBg:C.faint,color:sel?"#fff":allD?C.green:!unlk?C.grayLight:C.gray,fontSize:10,fontWeight:700,minHeight:28,position:"relative",transition:"all .15s"}}>
            {!unlk&&!allD?<Icon name="lock" size={10} color={C.grayLight}/>:w.week}
            {allD&&!sel&&<div style={{position:"absolute",top:1,right:1,width:4,height:4,borderRadius:"50%",background:C.green}}/>}
          </button>;
        })}
      </div>
    </Card>
    {week&&<Card style={{padding:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:6}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:C.text}}>{"SEMANA "+week.week+" · "+week.phase}</div>
        <div style={{display:"flex",gap:5}}><Tag color={week.phaseColor}>{week.intensity}</Tag>{week.isDeload&&<Tag color={C.green}>DELOAD</Tag>}{!ul&&<Tag color={C.amber}>BLOQUEADA</Tag>}</div>
      </div>
      {!ul&&<div style={{padding:"10px 12px",background:C.amberBg,borderRadius:8,marginBottom:12,fontSize:12,color:C.amber,fontWeight:500,border:"1px solid "+C.amber+"22"}}>{"Conclua a semana "+(week.week-1)+" para desbloquear."}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {week.sessions.map(function(s,i){
          return<div key={s.id} onClick={function(){if(ul)setModalData({session:s,week:week});}} style={{display:"flex",alignItems:"stretch",borderRadius:12,overflow:"hidden",border:"1px solid "+(s.completed?C.green+"33":!ul?C.faint:C.border),cursor:ul?"pointer":"default",background:s.completed?C.greenBg:C.white,minHeight:64,transition:"all .15s"}}>
            <div style={{width:4,background:s.completed?C.green:tc(s.type),flexShrink:0}}/>
            <div style={{flex:1,padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:6}}>
                    {"Dia "+(i+1)+" — "+s.name}
                    {!ul&&<Icon name="lock" size={12} color={C.grayLight}/>}
                  </div>
                  <div style={{color:C.grayLight,fontSize:11,marginTop:2}}>{s.type+" · "+(s.duration||60)+"min"}</div>
                </div>
                <div style={{display:"flex",gap:4,flexShrink:0,flexWrap:"wrap"}}>
                  <Tag color={tc(s.type)}>{s.type}</Tag>
                  <Tag color={C.red}>{"+"+(s.xp||50)}</Tag>
                  {s.completed&&<Tag color={C.green}>✓</Tag>}
                </div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:8}}>
                {(s.main||[]).slice(0,4).map(function(ex,ei){return<span key={ei} style={{background:C.faint,border:"1px solid "+C.border,padding:"2px 7px",borderRadius:5,fontSize:10,color:C.text}}>{ex.n}</span>;})}
                {(s.main||[]).length>4&&<span style={{background:C.faint,padding:"2px 7px",borderRadius:5,fontSize:10,color:C.grayLight}}>{"+"+(s.main.length-4)+" mais"}</span>}
              </div>
              {ul&&!s.completed&&<div style={{marginTop:6,color:C.red,fontSize:11,fontWeight:600}}>Toque para abrir →</div>}
            </div>
          </div>;
        })}
      </div>
    </Card>}
  </div>;
}

/* ─── REGISTER TAB ───────────────────────────────────────── */
function RegisterTab({onSave,activity,onXPGain}){
  var sp=activity?SPORTS.find(function(s){return s.id===activity.sport;}):null;
  var[mode,sMode]=useState("structured");
  var[type,sType]=useState("Força"),[dur,sDur]=useState(""),[rpe,sRpe]=useState(7),[notes,sNotes]=useState("");
  var[exs,sExs]=useState([{name:"",sets:"",reps:"",kg:"",rpe_ex:""}]);
  var[freeText,sFreeText]=useState("");
  var[saved,sSaved]=useState(false);
  function parseFreeText(txt){return txt.split("\n").filter(function(l){return l.trim();}).slice(0,12).map(function(l){return{name:l.trim(),sets:"",reps:"",kg:"",rpe_ex:""};});}
  function save(){
    var exercises=mode==="free"?parseFreeText(freeText):exs;
    sSaved(true);
    onSave({id:Date.now(),date:new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}),type,duration:+dur||60,rpe,notes,exercises,source:mode});
    if(onXPGain)onXPGain(XP_SESSION);
    setTimeout(function(){sSaved(false);sExs([{name:"",sets:"",reps:"",kg:"",rpe_ex:""}]);sNotes("");sDur("");sRpe(7);sFreeText("");},2000);
  }
  if(saved)return<div className="au" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:320,gap:16,padding:24}}>
    <div style={{width:64,height:64,background:C.greenBg,border:"1px solid "+C.green+"44",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="check" size={28} color={C.green}/></div>
    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:C.text}}>SESSÃO REGISTRADA</div>
    <div style={{color:C.red,fontWeight:700}}>{"+ "+XP_SESSION+" XP"}</div>
    <Btn onClick={function(){sSaved(false);}} v="secondary" sm>Nova sessão</Btn>
  </div>;
  return<div className="au" style={{display:"flex",flexDirection:"column",gap:12,padding:"0 0 20px"}}>
    <div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:C.text,letterSpacing:.5}}>REGISTRAR</div>
      <div style={{color:C.grayLight,fontSize:12,marginTop:2}}>{sp?(sp.icon+" "+sp.name):""}</div>
    </div>
    <div style={{display:"flex",gap:4,background:C.faint,borderRadius:10,padding:3}}>
      {[{id:"structured",l:"Estruturado"},{id:"free",l:"Treino livre"}].map(function(m){var a=mode===m.id;return<button key={m.id} onClick={function(){sMode(m.id);}} style={{flex:1,padding:"9px",border:"none",cursor:"pointer",background:a?C.white:"transparent",color:a?C.red:C.gray,fontWeight:700,fontSize:12,borderRadius:8,boxShadow:a?sh.xs:"none",transition:"all .15s",minHeight:36}}>{m.l}</button>;})}
    </div>
    <Card style={{padding:20}}><SL>Dados da Sessão</SL>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <Inp label="Tipo" value={type} onChange={sType} options={["Força","Hipertrofia","Campo","Condicionamento","Jogo","Técnico","Resistência","HIIT","Recuperação"].map(function(t){return{v:t,l:t};})}/>
        <Inp label="Duração (min)" value={dur} onChange={sDur} type="number" placeholder="60"/>
      </div>
      <div>
        <div style={{color:C.gray,fontSize:11,fontWeight:600,marginBottom:8}}>{"RPE: "}<span style={{color:rpe>=8?C.red:rpe>=5?C.amber:C.green,fontSize:22,fontFamily:"'Bebas Neue',sans-serif"}}>{rpe}</span>{"/10"}</div>
        <input type="range" min={1} max={10} value={rpe} onChange={function(e){sRpe(+e.target.value);}} style={{width:"100%",accentColor:rpe>=8?C.red:rpe>=5?C.amber:C.green}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}><span style={{color:C.green,fontSize:9,fontWeight:600}}>FÁCIL</span><span style={{color:C.amber,fontSize:9,fontWeight:600}}>MODERADO</span><span style={{color:C.red,fontSize:9,fontWeight:600}}>MÁXIMO</span></div>
      </div>
    </Card>
    {mode==="free"?<Card style={{padding:20}}>
      <SL>Cole ou escreva seu treino</SL>
      <div style={{marginBottom:8,color:C.grayLight,fontSize:11}}>Um exercício por linha. O ARES organiza automaticamente.</div>
      <textarea value={freeText} onChange={function(e){sFreeText(e.target.value);}} placeholder={"Supino Reto 4x10 80kg\nPuxada Frente 4x10\nRemada 3x12\nRosca Direta 3x10"} rows={7} style={{background:C.faint,border:"1px solid "+C.border,borderRadius:10,color:C.text,padding:"12px 14px",fontSize:13,width:"100%",outline:"none",resize:"vertical",lineHeight:1.7}}/>
      {freeText&&<div style={{marginTop:10,padding:"10px 12px",background:C.greenBg,borderRadius:8,border:"1px solid "+C.green+"22"}}>
        <div style={{color:C.green,fontWeight:700,fontSize:11,marginBottom:4}}>{parseFreeText(freeText).length+" exercícios detectados"}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{parseFreeText(freeText).slice(0,6).map(function(e,i){return<span key={i} style={{background:C.white,border:"1px solid "+C.border,padding:"2px 7px",borderRadius:5,fontSize:10,color:C.text}}>{e.name}</span>;})}</div>
      </div>}
    </Card>:<Card style={{padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><SL mb={0}>Exercícios</SL><Btn sm v="ghost" onClick={function(){sExs(function(e){return e.concat([{name:"",sets:"",reps:"",kg:"",rpe_ex:""}]);});}}>+ Adicionar</Btn></div>
      {exs.map(function(ex,i){return<Card key={i} style={{padding:14,marginBottom:8,background:C.faint}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,alignItems:"center"}}>
          <div style={{fontWeight:700,fontSize:13,color:C.text}}>{"Exercício "+(i+1)}</div>
          {exs.length>1&&<button onClick={function(){sExs(function(e){return e.filter(function(_,idx){return idx!==i;});});}} style={{background:"none",border:"none",color:C.grayLight,cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>}
        </div>
        <input value={ex.name} placeholder="Nome (ex: Supino Reto)" onChange={function(e){var n=exs.slice();n[i]=Object.assign({},n[i],{name:e.target.value});sExs(n);}} style={{background:C.white,border:"1px solid "+C.border,borderRadius:8,color:C.text,padding:"10px 12px",fontSize:13,outline:"none",minHeight:40,width:"100%",marginBottom:8}}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
          {[["sets","Séries","4"],["reps","Reps","8"],["kg","Kg","80"],["rpe_ex","RPE","7"]].map(function(arr){return<div key={arr[0]}>
            <div style={{color:C.grayLight,fontSize:9,fontWeight:600,marginBottom:3}}>{arr[1]}</div>
            <input type="number" value={ex[arr[0]]||""} placeholder={arr[2]} onChange={function(e){var n=exs.slice();n[i]=Object.assign({},n[i]);n[i][arr[0]]=e.target.value;sExs(n);}} style={{background:C.white,border:"1px solid "+C.border,borderRadius:7,color:C.text,padding:"8px 10px",fontSize:13,outline:"none",minHeight:36,width:"100%"}}/>
          </div>;})}
        </div>
        {ex.sets&&ex.reps&&ex.kg&&<div style={{marginTop:6,color:C.green,fontSize:11,fontWeight:600}}>{"Volume: "+(parseInt(ex.sets)*parseInt(ex.reps)*parseInt(ex.kg)).toLocaleString()+" kg"}</div>}
      </Card>;})}
    </Card>}
    <Card style={{padding:18}}><SL>Observações</SL><Inp value={notes} onChange={sNotes} rows={2} placeholder="Como foi? Dores, destaques, sensações..."/></Card>
    <Btn onClick={save} disabled={mode==="free"&&!freeText.trim()&&!exs.some(function(e){return e.name;})} full>{"Salvar sessão (+ "+XP_SESSION+" XP)"}</Btn>
  </div>;
}

/* ─── AI TAB ──────────────────────────────────────────────── */
function AITab({activity,user}){
  var isPro=["pro","coach","club","admin"].includes(user?user.plan:"");
  var[credits,sCredits]=useState(isPro?999:2);
  var[reports,sReports]=useState([]);
  var[ld,sLd]=useState(false);
  var scrollRef=useRef(null);
  var sp=activity?SPORTS.find(function(s){return s.id===activity.sport;}):null;
  var xp=activity?activity.xp||0:0;
  var sessions=activity?activity.sessions||[]:[];
  var totalSess=sessions.length;
  var avgRpe=totalSess?parseFloat((sessions.slice(0,6).reduce(function(a,s){return a+(+s.rpe||7.2);},0)/Math.min(6,totalSess)).toFixed(1)):7.2;
  var plan=activity?activity.plan:null;
  var cw=plan?plan.weeks[(plan.currentWeek||1)-1]:null;
  var weekDone=cw?cw.sessions.filter(function(s){return s.completed;}).length:0;
  var weekTotal=cw?cw.sessions.length:0;
  var level=getLevel(xp);
  var nextLevel=getNextLevel(level);
  var acwr=parseFloat((1.05+Math.random()*.2).toFixed(2));

  function buildAnalysis(){
    var name=(user?user.name.split(" ")[0]:"ATLETA").toUpperCase();
    var sportName=(sp?sp.name:"Esporte").toUpperCase();
    var pos=activity?activity.position||"":"";
    var phase=cw?cw.phase:"Base";
    var week=plan?plan.currentWeek:1;
    var weekPct=weekTotal>0?Math.round((weekDone/weekTotal)*100):0;
    var volLoad=Math.round(avgRpe*(weekDone||1)*45);
    var xpToNext=nextLevel?nextLevel.xpNeeded-xp:0;
    var fatigueIdx=avgRpe>8?"ALTO":avgRpe>6.5?"MODERADO":"BAIXO";
    var scoreLabel=weekPct>=70&&avgRpe<=8?"82/100 — APTO PARA TREINO PESADO":weekPct>=50?"68/100 — APTO COM AJUSTES":"54/100 — REVISAR PROTOCOLO";
    return "╔═══════════════════════════════════════╗\n"+
    "║   ARES INTELLIGENCE — ANÁLISE SEMANAL   ║\n"+
    "╚═══════════════════════════════════════╝\n\n"+
    "ATLETA: "+name+"  |  "+sportName+"\n"+
    "POSIÇÃO: "+pos+"  |  NÍVEL: "+level.label.toUpperCase()+"\n"+
    "SEMANA: "+week+"/12  |  FASE: "+phase.toUpperCase()+"\n"+
    "DATA: "+new Date().toLocaleDateString("pt-BR")+"\n\n"+
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"+
    "📊 ANÁLISE DE CARGA\n"+
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"+
    "ACWR: "+acwr.toFixed(2)+"  →  "+(acwr>1.3?"⚠ ZONA DE ATENÇÃO":"✅ ZONA ÓTIMA")+"\n"+
    "Volume semana: "+volLoad+" UA\n"+
    "RPE médio: "+avgRpe+"/10  →  Fadiga "+fatigueIdx+"\n"+
    "Aderência: "+weekPct+"% ("+weekDone+"/"+weekTotal+" sessões)\n\n"+
    (acwr>1.3
      ?"⚠ ATENÇÃO: Seu ACWR de "+acwr.toFixed(2)+" está acima de 1.3.\n   Reduzir volume 15% esta semana previne overreaching\n   e mantém a janela de adaptação ativa.\n\n"
      :"✅ Carga dentro da zona ótima (0.8–1.3).\n   Continue na progressão. Margem para +5% vol.\n\n")+
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"+
    "🎯 DIAGNÓSTICO DE PERFORMANCE\n"+
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"+
    "Total de sessões: "+totalSess+"\n"+
    "XP para próximo nível: "+(nextLevel?xpToNext+" XP ("+nextLevel.label+")":"NÍVEL MÁXIMO")+"\n\n"+
    (totalSess===0
      ?"→ INÍCIO DE JORNADA: Prioridade #1 é consistência.\n   3-4x/semana, RPE 6-7 por 3 semanas consecutivas.\n\n"
      :totalSess<5
      ?"→ FASE DE ADAPTAÇÃO: SNS e musculoesquelético\n   ainda se adaptando. Não acelere a progressão.\n   Técnica perfeita > carga máxima.\n\n"
      :"→ ATLETA ATIVO: Padrão estabelecido.\n   Pronto para progressão sistemática. +5%/semana\n   respeitando deload a cada 4 semanas.\n\n")+
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"+
    "⚡ PRESCRIÇÕES DESTA SEMANA\n"+
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"+
    "1. TREINO:\n"+
    "   "+
    (phase.includes("Base")
      ?"Mecânica fundamental. Carga secundária.\n   Domine o padrão motor antes de progredir."
      :phase.includes("Potência")||phase.includes("Desenv")
      ?"Progressive overload. Cada exercício principal\n   sobe 2–5% de carga vs semana anterior."
      :"Fase de pico. Qualidade > quantidade.\n   RPE alvo: 8–9. Volume -15% vs semana ant.")+"\n\n"+
    "2. NUTRIÇÃO:\n"+
    "   • Proteína: "+(Math.round((activity&&activity.weight?parseFloat(activity.weight):80)*2.0))+"–"+(Math.round((activity&&activity.weight?parseFloat(activity.weight):80)*2.2))+"g/dia\n"+
    "   • Carbo pré-treino: 30–45g, 60min antes\n"+
    "   • Janela pós-treino: proteína em até 2h\n\n"+
    "3. RECUPERAÇÃO:\n"+
    "   • Sono: mínimo 7h30 (ideal 8h30–9h)\n"+
    "   • HRV matinal: se abaixo da baseline, ajuste\n"+
    "   • Crioterapia pós-treino pesado: 12–15min\n\n"+
    "4. MENTAL:\n"+
    "   • Visualização: 10min pré-treino\n"+
    "   • Imagery específico de "+sportName+"\n\n"+
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"+
    "🔴 ALERTAS\n"+
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"+
    (avgRpe>8.5?"⚠ RPE cronicamente alto. Overreaching iminente.\n   Deload imediato recomendado.\n\n":"")
    +(weekPct<50&&weekTotal>0?"⚠ Aderência <50% esta semana. Principal causa\n   de platô. Ajuste a rotina para aderir.\n\n":"")
    +(acwr<=1.3&&weekPct>=70?"✅ Sem alertas críticos. Zona ótima de treino.\n\n":"")
    +"Score de Prontidão: "+scoreLabel+"\n\n"+
    "ARES INTELLIGENCE ENGINE v2\n"+
    "Gerado em: "+new Date().toLocaleTimeString("pt-BR");
  }

  function gen(){
    if(credits<=0)return;
    sLd(true);
    var full=buildAnalysis();
    var entry={id:Date.now(),date:new Date().toLocaleDateString("pt-BR"),typed:"",full,done:false};
    sReports(function(r){return[entry].concat(r);});
    sCredits(function(c){return c-1;});
    var i=0;
    var iv=setInterval(function(){
      i+=8;
      sReports(function(r){return r.map(function(rep){return rep.id===entry.id?Object.assign({},rep,{typed:full.slice(0,i)}):rep;});});
      if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;
      if(i>=full.length){sLd(false);sReports(function(r){return r.map(function(rep){return rep.id===entry.id?Object.assign({},rep,{typed:full,done:true}):rep;});});clearInterval(iv);}
    },14);
  }

  return<div className="au" style={{display:"flex",flexDirection:"column",gap:12,padding:"0 0 20px"}}>
    <div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:C.text,letterSpacing:.5}}>INTELIGÊNCIA</div>
      <div style={{color:C.grayLight,fontSize:12,marginTop:2}}>Análise de performance com IA</div>
    </div>
    {!isPro&&<Card style={{padding:14}}>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:13,color:C.text}}>{credits>0?(credits+" análise"+(credits>1?"s":"")+" gratuita"+(credits>1?"s":"")):"Créditos esgotados"}</div>
          <div style={{color:C.grayLight,fontSize:11,marginTop:1}}>{credits>0?"Plano FREE inclui 2 análises":"Faça upgrade para análises ilimitadas"}</div>
        </div>
        {credits<=0?<Btn sm>Upgrade</Btn>:<div style={{display:"flex",gap:3}}>{[0,1].map(function(i){return<div key={i} style={{width:20,height:5,borderRadius:99,background:i<credits?C.red:C.faint}}/>;})}</div>}
      </div>
    </Card>}
    <Card style={{padding:20}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:48,height:48,background:C.redLight,border:"1px solid "+C.redMid,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="bolt" size={22} color={C.red}/></div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:14,color:C.text}}>ARES INTELLIGENCE ENGINE</div>
          <div style={{color:C.grayLight,fontSize:11,marginTop:1}}>Carga · Fadiga · Prescrição · Alertas</div>
        </div>
        <Btn onClick={gen} disabled={ld||credits<=0} sm icon={ld?undefined:"bolt"}>{ld?"...":credits<=0?"Sem créditos":"Analisar"}</Btn>
      </div>
    </Card>
    {reports.map(function(r){return<Card key={r.id} red style={{padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
        <span style={{color:C.gray,fontSize:11,fontWeight:600}}>{r.date}</span>
        {r.done&&<Tag color={C.green}>✓ Completo</Tag>}
      </div>
      <div ref={scrollRef} style={{maxHeight:400,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <pre style={{color:C.text,fontSize:11,lineHeight:1.9,fontFamily:"'JetBrains Mono',monospace,monospace",whiteSpace:"pre-wrap",margin:0}}>{r.typed}{!r.done&&<span style={{color:C.red,animation:"blink .6s infinite"}}>▍</span>}</pre>
      </div>
    </Card>;})}
  </div>;
}

/* ─── PROFILE TAB ────────────────────────────────────────── */
function ProfileTab({user,activity,onLogout,onSaveProfile,onChangeSport}){
  var sp=activity?SPORTS.find(function(s){return s.id===activity.sport;}):null;
  var xp=activity?activity.xp||0:0;
  var[section,setSection]=useState("main");
  var[editing,setEditing]=useState(false);
  var[d,sD]=useState({name:user?user.name:"",age:activity?activity.age||"":"",weight:activity?activity.weight||"":"",height:activity?activity.height||"":""});
  var[billing,sBilling]=useState("mensal");
  function set(k,v){sD(function(p){var n=Object.assign({},p);n[k]=v;return n;});}
  var plans=[
    {id:"free",name:"FREE",price:{mensal:"R$ 0",anual:"R$ 0"},color:C.gray,features:["1 atividade","2 análises IA","Dashboard básico"]},
    {id:"pro",name:"ATLETA PRO",price:{mensal:"R$ 39",anual:"R$ 31"},color:C.red,features:["3 atividades","IA ilimitada","Métricas avançadas","PRs e histórico"]},
    {id:"coach",name:"TREINADOR",price:{mensal:"R$ 119",anual:"R$ 95"},color:C.blue,features:["10 atletas","Dashboard time","Prescrição personalizada"]},
    {id:"club",name:"CLUBE",price:{mensal:"R$ 299",anual:"R$ 239"},color:C.amber,features:["Ilimitado","Multi-coach","API","Suporte VIP"]},
  ];
  if(section==="plans")return<div className="au" style={{display:"flex",flexDirection:"column",gap:12,padding:"0 0 20px"}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}><button onClick={function(){setSection("main");}} style={{width:32,height:32,borderRadius:8,background:C.faint,border:"1px solid "+C.border,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="back" size={16} color={C.gray}/></button><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:C.text}}>PLANOS ARES</div></div>
    <div style={{display:"inline-flex",background:C.faint,borderRadius:10,padding:2,gap:2,alignSelf:"center"}}>
      {["mensal","anual"].map(function(b){return<button key={b} onClick={function(){sBilling(b);}} style={{padding:"8px 18px",border:"none",cursor:"pointer",background:billing===b?C.white:"transparent",color:billing===b?C.red:C.gray,fontWeight:700,fontSize:11,textTransform:"uppercase",borderRadius:8,minHeight:36,display:"flex",alignItems:"center",gap:4}}>
        {b}{b==="anual"&&<Tag color={C.green} size={8}>-20%</Tag>}
      </button>;})}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
      {plans.map(function(pl){var isCur=(user?user.plan:"free")===pl.id;return<Card key={pl.id} red={isCur} style={{padding:20,display:"flex",flexDirection:"column"}}>
        <div style={{color:pl.color,fontWeight:700,fontSize:12,letterSpacing:1,marginBottom:8}}>{pl.name}</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:3,marginBottom:14}}><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:C.text,lineHeight:1}}>{pl.price[billing]}</span><span style={{color:C.grayLight,fontSize:10,marginBottom:2}}>/mês</span></div>
        <div style={{height:1,background:C.border,marginBottom:12}}/>
        <div style={{display:"flex",flexDirection:"column",gap:5,flex:1}}>{pl.features.map(function(f){return<div key={f} style={{display:"flex",gap:6,alignItems:"flex-start"}}><Icon name="check" size={12} color={C.green}/><span style={{fontSize:12,color:C.text}}>{f}</span></div>;})}</div>
        <div style={{marginTop:14}}><Btn v={isCur?"ghost":"primary"} full sm onClick={function(){if(!isCur&&pl.id!=="free")window.open("mailto:contato@aresperformance.app?subject=Upgrade+"+pl.name,"_blank");}}>{isCur?"Plano atual":pl.id==="free"?"Grátis":"Upgrade →"}</Btn></div>
      </Card>;})}
    </div>
  </div>;
  if(section==="sport")return<div className="au" style={{display:"flex",flexDirection:"column",gap:12,padding:"0 0 20px"}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}><button onClick={function(){setSection("main");}} style={{width:32,height:32,borderRadius:8,background:C.faint,border:"1px solid "+C.border,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="back" size={16} color={C.gray}/></button><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:C.text}}>TROCAR ESPORTE</div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8}}>
      {SPORTS.map(function(s){var isCur=activity&&activity.sport===s.id;return<Card key={s.id} hover red={isCur} onClick={function(){if(!isCur&&onChangeSport){onChangeSport(s.id);setSection("main");}}} style={{padding:"14px 10px",cursor:"pointer"}}>
        <div style={{fontSize:20,marginBottom:6}}>{s.icon}</div>
        <div style={{color:C.text,fontWeight:700,fontSize:12,lineHeight:1.3}}>{s.name}</div>
        <div style={{color:C.grayLight,fontSize:9,marginTop:2}}>{s.cat}</div>
        {isCur&&<div style={{position:"absolute",top:6,right:6}}><Tag color={C.green} size={9}>ATUAL</Tag></div>}
      </Card>;})}
    </div>
  </div>;
  return<div className="au" style={{display:"flex",flexDirection:"column",gap:12,padding:"0 0 20px"}}>
    <Card style={{padding:20,background:C.dark}}>
      <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        <div style={{width:56,height:56,background:"linear-gradient(135deg,"+C.red+","+C.redDk+")",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:1,flexShrink:0}}>{(d.name||"A").charAt(0).toUpperCase()}</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:"#fff",letterSpacing:.5}}>{(d.name||"ATLETA").toUpperCase()}</div>
          <div style={{color:"#ffffff55",fontSize:11,marginTop:2}}>{sp?(sp.icon+" "+sp.name):""}{activity?" · "+activity.position:""}</div>
          <div style={{color:"#ffffff33",fontSize:10,marginTop:1}}>{user?user.email:""}</div>
          <div style={{display:"flex",gap:5,marginTop:8}}>
            <Tag color={"#ffffff"}>{(user?user.plan:"free").toUpperCase()}</Tag>
            <Tag color={getLevel(xp).color}>{"LV."+(Math.floor(xp/100)+1)}</Tag>
          </div>
        </div>
      </div>
    </Card>
    <Card style={{padding:16}}><XPBar xp={xp}/></Card>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {[{id:"sport",label:"Trocar esporte",icon:"sport",desc:"Mude seu esporte principal"},{id:"plans",label:"Planos ARES",icon:"star",desc:"Upgrade e assinatura"}].map(function(m){return<Card key={m.id} hover onClick={function(){setSection(m.id);}} style={{padding:"14px 16px",cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:9,background:C.faint,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name={m.icon} size={18} color={C.gray}/></div>
          <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:C.text}}>{m.label}</div><div style={{color:C.grayLight,fontSize:11,marginTop:1}}>{m.desc}</div></div>
        </div>
      </Card>;})}
    </div>
    <Card style={{padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <SL mb={0}>Dados pessoais</SL>
        {!editing?<Btn sm v="ghost" icon="edit" onClick={function(){setEditing(true);}}>Editar</Btn>:<Btn sm v="ghost" onClick={function(){setEditing(false);}}>Cancelar</Btn>}
      </div>
      {editing?<div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Inp label="Nome" value={d.name} onChange={function(v){set("name",v);}} placeholder="Seu nome"/>
          <Inp label="Idade" value={d.age} onChange={function(v){set("age",v);}} type="number" placeholder="24"/>
          <Inp label="Peso (kg)" value={d.weight} onChange={function(v){set("weight",v);}} type="number" placeholder="78"/>
          <Inp label="Altura (cm)" value={d.height} onChange={function(v){set("height",v);}} type="number" placeholder="177"/>
        </div>
        <Btn full style={{marginTop:14}} onClick={async function(){if(onSaveProfile)await onSaveProfile(d);setEditing(false);}}>Salvar alterações</Btn>
      </div>:<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[{l:"Nome",v:d.name||"—"},{l:"Idade",v:d.age?d.age+" anos":"—"},{l:"Peso",v:d.weight?d.weight+" kg":"—"},{l:"Altura",v:d.height?d.height+" cm":"—"}].map(function(f){return<div key={f.l} style={{padding:"10px 12px",background:C.faint,borderRadius:8}}>
          <div style={{color:C.grayLight,fontSize:9,fontWeight:700,letterSpacing:.5,marginBottom:3}}>{f.l.toUpperCase()}</div>
          <div style={{color:C.text,fontWeight:600,fontSize:14}}>{f.v}</div>
        </div>;})}
      </div>}
    </Card>
    <Btn onClick={async function(){await supabase.auth.signOut();if(onLogout)onLogout();}} v="secondary" full icon="logout">Sair da conta</Btn>
  </div>;
}

/* ─── MAIN APP ───────────────────────────────────────────── */
function MainApp({user,initialActivity,onSaveSession,onSavePlanProgress,onSaveActivity,onSaveProfile,onLogout}){
  var[tab,sTab]=useState("home");
  var[activities,setActivities]=useState(initialActivity?[initialActivity]:[]);
  var[showOb,sShowOb]=useState(false);
  var[showLU,sShowLU]=useState(null);
  var activeIdx=0;
  var userPlan=getEffectivePlan(user);
  var ca=activities[activeIdx]||null;
  var sp=ca?SPORTS.find(function(s){return s.id===ca.sport;}):null;

  useEffect(function(){
    if(activities.length>0&&!activities[0].plan){
      var a=activities[0];
      setActivities(function(prev){return prev.map(function(act,i){return i===0?Object.assign({},act,{plan:generatePlan(a)}):act;});});
    }
  },[]);

  var addSession=useCallback(function(s){
    setActivities(function(prev){
      var updated=prev.map(function(a,i){return i===activeIdx?Object.assign({},a,{sessions:[s].concat(a.sessions||[])}):a;});
      if(onSaveSession)onSaveSession(s,updated[activeIdx]);
      return updated;
    });
  },[activeIdx]);

  var markComplete=useCallback(function(wn,sid){
    setActivities(function(prev){
      var updated=prev.map(function(a,i){
        if(i!==activeIdx||!a.plan)return a;
        var weeks=a.plan.weeks.map(function(w){return w.week!==wn?w:Object.assign({},w,{sessions:w.sessions.map(function(s){return s.id===sid?Object.assign({},s,{completed:true}):s;})});});
        return Object.assign({},a,{plan:Object.assign({},a.plan,{weeks:weeks,currentWeek:Math.min(wn+1,12)})});
      });
      if(onSavePlanProgress)onSavePlanProgress(updated[activeIdx]);
      return updated;
    });
  },[activeIdx]);

  var gainXP=useCallback(function(amt){
    setActivities(function(prev){
      var updated=prev.map(function(a,i){
        if(i!==activeIdx)return a;
        var nxp=(a.xp||0)+amt;
        var oL=getLevel(a.xp||0),nL=getLevel(nxp);
        if(nL.id!==oL.id)setTimeout(function(){sShowLU(nL);},400);
        return Object.assign({},a,{xp:nxp});
      });
      if(onSavePlanProgress)onSavePlanProgress(updated[activeIdx]);
      return updated;
    });
  },[activeIdx]);

  function changeSport(newSport){
    setActivities(function(prev){return prev.map(function(a,i){if(i!==activeIdx)return a;var na=Object.assign({},a,{sport:newSport,plan:generatePlan(Object.assign({},a,{sport:newSport}))});if(onSaveActivity)onSaveActivity(na);return na;});});
  }
  function addActivity(data){
    var full=Object.assign({id:Date.now()},data,{sessions:[],xp:0,plan:generatePlan(data)});
    setActivities(function(prev){return prev.concat([full]);});
    if(onSaveActivity)onSaveActivity(full);
    sShowOb(false);
  }

  var TABS=[{id:"home",label:"Início",icon:"home"},{id:"plan",label:"Treino",icon:"plan"},{id:"reg",fab:true},{id:"ai",label:"IA",icon:"ai"},{id:"me",label:"Perfil",icon:"profile"}];

  if(showOb)return<div>
    <div style={{background:C.white,borderBottom:"1px solid "+C.border,padding:"0 16px",height:50,display:"flex",alignItems:"center",gap:10}}>
      <button onClick={function(){sShowOb(false);}} style={{width:32,height:32,borderRadius:8,background:C.faint,border:"1px solid "+C.border,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="back" size={16} color={C.gray}/></button>
      <span style={{color:C.gray,fontSize:12,fontWeight:600}}>Nova atividade</span>
    </div>
    <OnboardScreen user={user} onComplete={addActivity}/>
  </div>;

  return<div style={{background:C.bg,minHeight:"100vh"}}>
    {showLU&&<div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.75)"}} onClick={function(){sShowLU(null);}}>
      <div className="pop" style={{background:C.dark,border:"1px solid "+C.red+"44",borderRadius:20,padding:"40px 32px",maxWidth:320,width:"90%",textAlign:"center"}}>
        <div style={{width:56,height:56,borderRadius:14,background:showLU.color,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:"#fff",margin:"0 auto 14px"}}>{showLU.rank}</div>
        <div style={{color:C.red,fontSize:10,fontWeight:700,letterSpacing:3,marginBottom:6}}>NÍVEL DESBLOQUEADO</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,color:"#fff",letterSpacing:2,marginBottom:20}}>{showLU.label.toUpperCase()}</div>
        <Btn onClick={function(){sShowLU(null);}} full>CONTINUAR →</Btn>
      </div>
    </div>}
    <div style={{background:C.white,borderBottom:"1px solid "+C.border,padding:"0 16px",paddingTop:SAT,display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:100,boxShadow:sh.xs,minHeight:"calc(50px + "+SAT+")"}}>
      <div style={{flex:1}}><AresLogo size={28}/></div>
      {sp&&<div style={{padding:"5px 12px",background:C.faint,border:"1px solid "+C.border,borderRadius:20,fontSize:11,fontWeight:600,color:C.text}}>{sp.icon+" "+sp.name}</div>}
      <div onClick={function(){sTab("me");}} style={{width:32,height:32,background:C.red,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontFamily:"'Bebas Neue',sans-serif",fontSize:13,cursor:"pointer",flexShrink:0}}>{(user?user.name:"A").charAt(0).toUpperCase()}</div>
    </div>
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100}}>
      <div style={{background:C.white,borderTop:"1px solid "+C.border,display:"flex",alignItems:"flex-end",justifyContent:"space-around",paddingBottom:SAB,minHeight:58}}>
        {TABS.map(function(t){
          if(t.fab)return<div key="fab" style={{marginTop:-18,marginBottom:2}}>
            <button onClick={function(){sTab("reg");}} style={{width:50,height:50,borderRadius:13,background:C.red,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px "+C.red+"55",transform:tab==="reg"?"scale(.95)":"scale(1)",transition:"transform .15s"}}>
              <Icon name="reg" size={22} color="#fff"/>
            </button>
          </div>;
          return<button key={t.id} onClick={function(){sTab(t.id);}} style={{flex:1,padding:"8px 4px 4px",border:"none",cursor:"pointer",background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:2,maxWidth:64,transition:"opacity .15s",opacity:tab===t.id?1:.6}}>
            <Icon name={t.icon} size={22} color={tab===t.id?C.red:C.grayLight}/>
            <div style={{fontSize:9,fontWeight:700,color:tab===t.id?C.red:C.grayLight,letterSpacing:.3}}>{t.label}</div>
            {tab===t.id&&<div style={{width:14,height:2,borderRadius:99,background:C.red}}/>}
          </button>;
        })}
      </div>
    </div>
    <div style={{maxWidth:800,margin:"0 auto",padding:"14px 14px calc(72px + "+SAB+")"}}>
      <div key={tab} className="au">
        {tab==="home"&&<DashboardTab activity={ca} user={Object.assign({},user,{plan:userPlan})} onGoToPlan={function(){sTab("plan");}}/>}
        {tab==="plan"&&<PlanTab activity={ca} onMarkComplete={markComplete} onXPGain={gainXP}/>}
        {tab==="reg"&&<RegisterTab onSave={addSession} activity={ca} onXPGain={gainXP}/>}
        {tab==="ai"&&<AITab activity={ca} user={Object.assign({},user,{plan:userPlan})}/>}
        {tab==="me"&&<ProfileTab user={Object.assign({},user,{plan:userPlan})} activity={ca} onLogout={onLogout} onSaveProfile={onSaveProfile} onChangeSport={changeSport}/>}
      </div>
      {activities.length===0&&tab!=="me"&&<Card style={{padding:28,textAlign:"center",marginTop:16}}>
        <div style={{fontSize:32,marginBottom:10}}>🏅</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:C.text,marginBottom:8}}>CONFIGURE SEU ESPORTE</div>
        <Btn onClick={function(){sShowOb(true);}}>Adicionar esporte</Btn>
      </Card>}
    </div>
  </div>;
}

/* ─── APP ROOT ───────────────────────────────────────────── */
function AppRoot(){
  var[screen,sScreen]=useState("loading");
  var[user,sUser]=useState(null);
  var aresData=useAresData(user);
  useEffect(function(){
    supabase.auth.getSession().then(function(res){
      var session=res.data.session;
      if(session){var u=session.user;sUser({name:u.user_metadata.name||u.user_metadata.full_name||u.email.split("@")[0],email:u.email,plan:"free",id:u.id});}
      sScreen("ready");
    });
    var sub=supabase.auth.onAuthStateChange(function(event,session){
      if(session){var u=session.user;sUser({name:u.user_metadata.name||u.user_metadata.full_name||u.email.split("@")[0],email:u.email,plan:"free",id:u.id});}
      else sUser(null);
    });
    return function(){sub.data.listener.subscription.unsubscribe();};
  },[]);
  var show;
  if(screen==="loading"||(user&&aresData.loading))show="loading";
  else if(!user)show="login";
  else if(!aresData.data||!aresData.data.activity)show="onboard";
  else show="app";
  if(show==="loading")return<div style={{minHeight:"100vh",background:C.dark,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}><style>{CSS}</style><AresLogo size={48} mono/><Spinner/></div>;
  if(show==="login")return<div><style>{CSS}</style><LoginScreen/></div>;
  if(show==="onboard")return<div><style>{CSS}</style><OnboardScreen user={user} onComplete={async function(d){var full=Object.assign({id:Date.now()},d,{sessions:[],xp:0,plan:generatePlan(d)});await aresData.saveActivity(full);}}/></div>;
  return<div><style>{CSS}</style><MainApp user={user} initialActivity={aresData.data.activity} onSaveSession={aresData.saveSession} onSavePlanProgress={aresData.savePlanProgress} onSaveActivity={aresData.saveActivity} onSaveProfile={aresData.saveProfile} onLogout={async function(){await supabase.auth.signOut();sUser(null);}}/></div>;
}

export default AppRoot;