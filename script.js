/* TIDE RUNNER
   Self-contained educational endless runner.
   Edit QUESTION_BANK, DIFFICULTY, and LEVELS to customize the experience.
*/
"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const $ = (id) => document.getElementById(id);

const CONFIG = {
  lives: 3,
  laneCount: 3,
  laneNames: [-1, 0, 1],
  baseSpeed: 0.46,
  maxSpeed: 1.04,
  gravity: 0.022,
  jumpPower: 0.46,
  obstacleEvery: 900,
  collectibleEvery: 470,
  checkpointEvery: 2100,
  score: { shell: 50, star: 100, correct: 250, gate: 300, obstacle: -100, wrong: -75 },
  levelDistance: 7200
};

const LEVELS = [
  {name:"MEET THE MOON", speed:.46, tideStart:8, checkpoints:1, intro:"Build the Earth–Moon connection."},
  {name:"THE SUN JOINS THE RUN", speed:.57, tideStart:14, checkpoints:2, intro:"Compare aligned and right-angle arrangements."},
  {name:"CHANGE THE POSITION", speed:.68, tideStart:20, checkpoints:2, intro:"Arrange the bodies and reason from position."},
  {name:"ESCAPE THE RISING TIDE", speed:.82, tideStart:27, checkpoints:3, intro:"Make science decisions while the run accelerates."},
  {name:"TIDAL CHAOS", speed:.96, tideStart:35, checkpoints:4, intro:"Apply the relationship to changing arrangements."}
];

const QUESTION_BANK = [
  {id:1,type:"choice",difficulty:1,prompt:"In this simplified arrangement, the Sun, Earth, and Moon are aligned. Which tidal condition is associated with this alignment?",arr:["sun-earth-moon"],choices:["🌊 SPRING TIDE","🌗 NEAP TIDE","☁️ NO TIDAL EFFECT"],correct:0,explanation:"When the Sun, Earth, and Moon are aligned, their tidal effects reinforce one another, producing a larger tidal range called a spring tide."},
  {id:2,type:"choice",difficulty:1,prompt:"The Moon's position is the main changing relationship to notice in this run. Which body orbits Earth and strongly influences tides?",choices:["☀️ SUN","🌙 MOON","☁️ CLOUDS"],correct:1,explanation:"The Moon's gravitational effect is the strongest contributor to the regular tidal pattern, while the Sun also affects tides."},
  {id:3,type:"arrange",difficulty:2,prompt:"Arrange the bodies to represent a simplified spring-tide alignment.",target:"spring",explanation:"A spring-tide situation occurs when the Sun, Earth, and Moon are approximately aligned: Sun–Earth–Moon or Sun–Moon–Earth."},
  {id:4,type:"choice",difficulty:2,prompt:"In a simplified model, the Sun and Moon are approximately at right angles relative to Earth. Which condition is associated with this arrangement?",choices:["🌊 SPRING TIDE","🌗 NEAP TIDE","⚡ TIDAL BOOST"],correct:1,explanation:"When the Sun and Moon are approximately at right angles relative to Earth, their tidal effects partly offset one another, producing a smaller tidal range called a neap tide."},
  {id:5,type:"predict",difficulty:2,prompt:"The Moon moves from an aligned position to a position roughly at a right angle to the Sun–Earth line. What tidal condition does this simplified change represent?",choices:["🌊 Larger-range spring tide","🌗 Smaller-range neap tide","☁️ No tides"],correct:1,explanation:"Changing the relative position toward a right-angle arrangement corresponds to a neap-tide situation, with a smaller tidal range."},
  {id:6,type:"gate",difficulty:2,prompt:"Choose the gate that matches this arrangement.",arr:["sun-earth-moon"],choices:["🌊 SPRING TIDE","🌗 NEAP TIDE","❓ REVIEW"],correct:0,explanation:"The bodies are aligned in this simplified model, so choose SPRING TIDE."},
  {id:7,type:"arrange",difficulty:3,prompt:"Arrange the bodies to represent a simplified neap-tide situation.",target:"neap",explanation:"For a neap-tide situation, the Sun and Moon are approximately at right angles relative to Earth."},
  {id:8,type:"predict",difficulty:3,prompt:"A spring-tide alignment changes toward a right-angle relationship between the Sun and Moon as seen from Earth. What happens to the tidal range in this simplified model?",choices:["It becomes smaller.","It becomes larger.","It becomes exactly zero."],correct:0,explanation:"The tidal range becomes smaller in the neap-tide arrangement because the Sun's and Moon's tidal effects partly offset one another."},
  {id:9,type:"choice",difficulty:3,prompt:"Which statement best connects the game mechanic to the science?",choices:["Tides change because the player runs faster.","Tidal conditions are related to the relative positions of Earth, Moon, and Sun.","Tides happen only when the weather changes."],correct:1,explanation:"The competency focuses on relating the relative positions and movements of Earth, Moon, and Sun to tidal conditions."},
  {id:10,type:"gate",difficulty:4,prompt:"The diagram shows the Sun and Moon approximately at right angles relative to Earth. Pick the matching gate.",choices:["🌊 SPRING TIDE","🌗 NEAP TIDE","❓ REVIEW"],correct:1,explanation:"A right-angle relationship in this simplified model represents a neap-tide condition."},
  {id:11,type:"predict",difficulty:4,prompt:"The Moon moves so the Sun, Earth, and Moon become approximately aligned. What condition should the runner predict?",choices:["🌊 Spring tide","🌗 Neap tide","No tidal range"],correct:0,explanation:"Alignment of the Sun, Earth, and Moon is associated with spring tides and a larger tidal range."},
  {id:12,type:"choice",difficulty:5,prompt:"Why does the game ask you to observe positions instead of simply memorize names?",choices:["Because the same idea can be applied when the arrangement changes.","Because tides are random.","Because the Moon does not affect tides."],correct:0,explanation:"The goal is to apply the relationship between relative positions and tidal conditions, even when the arrangement changes."},
  {id:13,type:"arrange",difficulty:4,prompt:"Create a spring-tide alignment using the draggable bodies.",target:"spring2",explanation:"Either aligned order is acceptable in this simplified model: Sun–Earth–Moon or Moon–Earth–Sun."},
  {id:14,type:"gate",difficulty:5,prompt:"A changing arrangement is shown above the road. Identify the tidal condition before entering a gate.",arr:["neap"],choices:["🌊 SPRING TIDE","🌗 NEAP TIDE","❓ REVIEW"],correct:1,explanation:"This arrangement represents the simplified right-angle relationship associated with a neap tide."}
];

const ACHIEVEMENTS = [
  ["🌙","MOON EXPLORER","Complete the first Moon challenge."],
  ["☀️","SUN & MOON","Correctly identify a spring-tide arrangement."],
  ["🌊","TIDE TRACKER","Complete three science checkpoints."],
  ["🧭","TIDAL THINKER","Complete an arrangement challenge."],
  ["👑","TIDE MASTER","Complete the entire game."]
];

const SAVE_KEY = "tideRunnerSaveV1";
let save = loadSave();
let W = innerWidth, H = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
let state = "MENU", lastTime = 0, animationId = null;
let game = null;
let currentQuestion = null;
let labDrag = null;
let soundOn = true;
let reducedMotion = false;

function loadSave(){
  try{
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
    return Object.assign({highScore:0,highestLevel:0,challenges:0,correct:0,bestRun:0,achievements:[]},raw);
  }catch{return {highScore:0,highestLevel:0,challenges:0,correct:0,bestRun:0,achievements:[]}}
}
function saveProgress(){localStorage.setItem(SAVE_KEY,JSON.stringify(save));}
function resize(){
  W=innerWidth; H=innerHeight; dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.floor(W*dpr); canvas.height=Math.floor(H*dpr); canvas.style.width=W+"px";canvas.style.height=H+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener("resize",resize); resize();

const screens = ["menuScreen","tutorialScreen","objectiveScreen","progressScreen","settingsScreen","checkpointScreen","feedbackScreen","pauseScreen","levelScreen","winScreen","loseScreen","labScreen"];
function showOnly(name){
  screens.forEach(id=>$(id).classList.toggle("active",id===name));
}
function hideOverlays(){
  ["checkpointScreen","feedbackScreen","pauseScreen","levelScreen","winScreen","loseScreen"].forEach(id=>$(id).classList.add("hidden"));
}
function showScreen(id){
  screens.forEach(s=>$(s).classList.toggle("active",s===id));
  ["checkpointScreen","feedbackScreen","pauseScreen","levelScreen","winScreen","loseScreen"].forEach(s=>{
    if(id===s) $(s).classList.remove("hidden");
    else if(s!==id) $(s).classList.add("hidden");
  });
  $("gameHUD").classList.toggle("hidden",!["RUNNING","PAUSED"].includes(state));
}
function startGame(){
  initGame();
  state="RUNNING";
  showScreen("menuScreen");
  screens.forEach(s=>$(s).classList.remove("active"));
  $("gameHUD").classList.remove("hidden");
  $("mobileControls").classList.toggle("hidden",!isMobile());
  toast("Run started — watch for the first science checkpoint!");
  if(!animationId){lastTime=performance.now(); animationId=requestAnimationFrame(loop);}
}
function initGame(){
  game={
    score:0,lives:CONFIG.lives,level:1,distance:0,tide:LEVELS[0].tideStart,
    science:0,correct:0,combo:0,obstacles:[],collectibles:[],particles:[],
    runner:{lane:0,x:W/2,y:0,vy:0,jumping:false,hit:0},
    nextObstacle:700,nextCollect:300,nextCheckpoint:1450,
    checkpointCount:0, mistakes:[],gatePending:false,worldTime:0,flash:0
  };
  updateHUD();
}
function isMobile(){return matchMedia("(pointer:coarse)").matches || W<720}
function laneX(lane, depth=1){
  const center=W/2, spread=Math.min(W*.22,300);
  return center + lane*spread*depth;
}
function updateHUD(){
  if(!game)return;
  $("score").textContent=Math.max(0,Math.floor(game.score)).toLocaleString();
  $("level").textContent=game.level;
  $("lives").textContent="❤️".repeat(game.lives)+"🖤".repeat(Math.max(0,3-game.lives));
  $("tideMeter").style.width=Math.min(100,game.tide)+"%";
  $("scienceProgress").textContent=`${game.science} / ${6+game.level-1}`;
  $("comboBadge").textContent=game.combo>=3?`🔥 x${game.combo>=5?3:2} COMBO`:"";
}
function loop(t){
  animationId=requestAnimationFrame(loop);
  const dt=Math.min(32,t-lastTime); lastTime=t;
  if(state==="RUNNING"){update(dt);draw();}
  else if(state==="PAUSED"){draw();}
  else if(state==="MENU"){drawMenu();}
}
function update(dt){
  const lvl=LEVELS[game.level-1];
  const speed=Math.min(CONFIG.maxSpeed,lvl.speed + game.combo*.006);
  game.worldTime += dt;
  game.distance += speed*dt;
  game.tide += dt*.0025 + speed*.0007;
  game.tide=Math.min(100,game.tide);
  game.nextObstacle -= dt*speed;
  game.nextCollect -= dt*speed;
  game.nextCheckpoint -= dt*speed;
  game.runner.hit=Math.max(0,game.runner.hit-dt);
  if(game.runner.jumping){game.runner.vy += CONFIG.gravity*dt;game.runner.y += game.runner.vy*dt;if(game.runner.y>=0){game.runner.y=0;game.runner.vy=0;game.runner.jumping=false}}
  if(game.nextObstacle<=0){spawnObstacle();game.nextObstacle=CONFIG.obstacleEvery*(.7+Math.random()*.6)/(1+game.level*.08)}
  if(game.nextCollect<=0){spawnCollectible();game.nextCollect=CONFIG.collectibleEvery*(.7+Math.random()*.7)}
  if(game.nextCheckpoint<=0){openCheckpoint();return}
  updateObjects(dt,speed);
  if(game.tide>=100 || game.lives<=0){loseGame();return}
  if(game.distance>=CONFIG.levelDistance){
    if(game.level<5){completeLevel();return}else{winGame();return}
  }
  updateHUD();
}
function spawnObstacle(){
  const lane=randLane(), types=["rock","log","branch","splash"], type=types[Math.floor(Math.random()*types.length)];
  game.obstacles.push({lane,z:0,type,hit:false});
}
function spawnCollectible(){
  const lane=randLane(), type=Math.random()<.75?"shell":"star";
  game.collectibles.push({lane,z:0,type,spin:Math.random()*6.28});
}
function randLane(){return [-1,0,1][Math.floor(Math.random()*3)]}
function updateObjects(dt,speed){
  for(const o of game.obstacles){o.z+=dt*.0018*speed;o.spin=(o.spin||0)+dt*.004}
  for(const c of game.collectibles){c.z+=dt*.0022*speed;c.spin+=dt*.006}
  for(const p of game.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.0008*dt;p.life-=dt}
  game.obstacles=game.obstacles.filter(o=>{
    if(o.hit)return false;
    if(o.z>0.88 && o.z<1.03 && o.lane===game.runner.lane && game.runner.y>-35){
      hitObstacle(o);return false;
    }
    return o.z<1.1;
  });
  game.collectibles=game.collectibles.filter(c=>{
    if(c.z>0.86 && c.z<1.05 && c.lane===game.runner.lane && Math.abs(game.runner.y)<55){
      collect(c);return false;
    }
    return c.z<1.1;
  });
  game.particles=game.particles.filter(p=>p.life>0);
}
function hitObstacle(o){
  game.lives--;game.score=Math.max(0,game.score+CONFIG.score.obstacle);game.combo=0;game.flash=180;
  burst(laneX(o.lane),H*.72,["#ff6f73","#ffd66b"]);
  sfx("hit");toast("Watch the path! −100");
  updateHUD();
}
function collect(c){
  const pts=c.type==="shell"?CONFIG.score.shell:CONFIG.score.star;
  game.score+=pts;
  burst(laneX(c.lane),H*.72,["#43e7ff","#ffd66b","#ffffff"]);
  sfx("collect");
}
function burst(x,y,colors){
  for(let i=0;i<12;i++)game.particles.push({x,y,vx:(Math.random()-.5)*.35,vy:(Math.random()-.7)*.35,life:500+Math.random()*400,color:colors[i%colors.length]});
}
function move(dir){
  if(state!=="RUNNING"||!game)return;
  game.runner.lane=Math.max(-1,Math.min(1,game.runner.lane+dir));sfx("click");
}
function jump(){
  if(state!=="RUNNING"||!game||game.runner.jumping)return;
  game.runner.jumping=true;game.runner.vy=-CONFIG.jumpPower*1.7;sfx("jump");
}
function openCheckpoint(){
  state="SCIENCE_CHECKPOINT";
  game.nextCheckpoint=CONFIG.checkpointEvery*(.78+Math.random()*.22)/(1+game.level*.04);
  currentQuestion=chooseQuestion();
  renderChallenge(currentQuestion);
  showScreen("checkpointScreen");
  $("mobileControls").classList.add("hidden");
}
function chooseQuestion(){
  const eligible=QUESTION_BANK.filter(q=>q.difficulty<=game.level+1 && !game.recentIds?.includes(q.id));
  const pool=eligible.length?eligible:QUESTION_BANK;
  const q=pool[Math.floor(Math.random()*pool.length)];
  game.recentIds=(game.recentIds||[]).concat(q.id).slice(-5);
  return q;
}
function renderChallenge(q){
  $("challengeTypeLabel").textContent=q.type==="choice"?"CHOOSE":q.type==="arrange"?"DRAG & ARRANGE":q.type==="gate"?"RUN THE GATE":"PREDICT";
  const body=$("challengeBody");
  if(q.type==="arrange"){
    body.innerHTML=`
      <div class="challenge-question">${q.prompt}</div>
      <div class="arrange-zone" id="arrangeZone">
        <div class="drop-slot" data-slot="0"><small>SLOT 1</small></div>
        <div class="drop-slot" data-slot="1"><small>SLOT 2</small></div>
        <div class="drop-slot" data-slot="2"><small>SLOT 3</small></div>
      </div>
      <div class="arrange-zone" id="dragPool" style="height:90px;background:transparent">
        <div class="drag-item" draggable="true" data-body="sun">☀️<small>SUN</small></div>
        <div class="drag-item" draggable="true" data-body="earth">🌎<small>EARTH</small></div>
        <div class="drag-item" draggable="true" data-body="moon">🌙<small>MOON</small></div>
      </div>
      <div class="challenge-actions"><button class="primary" id="submitArrange">CHECK ALIGNMENT</button></div>`;
    setupDragDrop();
    $("submitArrange").onclick=()=>{
      const order=[...document.querySelectorAll(".drop-slot")].map(x=>x.dataset.body||"");
      const ok=q.target==="neap"?isNeapOrder(order):isSpringOrder(order);
      answerQuestion(ok,q,ok?`Alignment matches the ${q.target.startsWith("spring")?"spring":"neap"}-tide model.`:"Reconsider how the Sun and Moon are positioned relative to Earth.");
    };
  }else if(q.type==="gate"){
    body.innerHTML=`<div class="challenge-diagram">${diagramHTML(q.arr?.[0]||"sun-earth-moon")}</div><div class="challenge-question">${q.prompt}</div>
      <div class="gate-preview"><div class="gate spring">🌊<br>SPRING TIDE</div><div class="gate neap">🌗<br>NEAP TIDE</div><div class="gate review">❓<br>REVIEW</div></div>
      <div class="challenge-actions"><button class="primary" id="gate0">SPRING</button><button id="gate1">NEAP</button><button id="gate2">REVIEW</button></div>`;
    [0,1,2].forEach(i=>$(["gate0","gate1","gate2"][i]).onclick=()=>answerQuestion(i===q.correct,q,i===q.correct?"Correct gate! You read the arrangement before choosing.":"That gate does not match the shown arrangement."));
  }else{
    body.innerHTML=`<div class="challenge-diagram">${diagramHTML(q.arr?.[0]||((q.id%2)?"sun-earth-moon":"neap"))}</div><div class="challenge-question">${q.prompt}</div>
      <div class="choice-grid">${q.choices.map((c,i)=>`<button data-choice="${i}">${c}</button>`).join("")}</div>`;
    body.querySelectorAll("[data-choice]").forEach(btn=>btn.onclick=()=>answerQuestion(Number(btn.dataset.choice)===q.correct,q,Number(btn.dataset.choice)===q.correct?"Your prediction matches the science model.":"Look again at how the relative positions changed."));
  }
}
function diagramHTML(kind){
  if(kind==="neap") return `<div style="font-size:52px">☀️ <span style="font-size:25px">⟂</span> 🌎 <span style="font-size:25px">⟂</span> 🌙</div>`;
  return `<div style="font-size:52px">☀️ <span style="font-size:25px">—</span> 🌎 <span style="font-size:25px">—</span> 🌙</div>`;
}
function setupDragDrop(){
  let dragging=null;
  document.querySelectorAll(".drag-item").forEach(el=>{
    el.addEventListener("dragstart",e=>{dragging=el.dataset.body;e.dataTransfer.setData("text/plain",dragging)});
    el.addEventListener("touchstart",()=>{dragging=el.dataset.body},{passive:true});
  });
  document.querySelectorAll(".drop-slot").forEach(slot=>{
    slot.addEventListener("dragover",e=>e.preventDefault());
    slot.addEventListener("drop",e=>{e.preventDefault();placeBody(slot,e.dataTransfer.getData("text/plain"))});
    slot.addEventListener("click",()=>{if(dragging)placeBody(slot,dragging)});
  });
}
function placeBody(slot,body){
  if(slot.dataset.body)return;
  slot.dataset.body=body;
  const icons={sun:"☀️",earth:"🌎",moon:"🌙"};
  slot.innerHTML=`<span style="font-size:40px">${icons[body]}</span><small>${body.toUpperCase()}</small>`;
  document.querySelector(`.drag-item[data-body="${body}"]`)?.remove();
}
function isSpringOrder(a){return (a[0]==="sun"&&a[1]==="earth"&&a[2]==="moon")||(a[0]==="moon"&&a[1]==="earth"&&a[2]==="sun")}
function isNeapOrder(a){
  return a[1]==="earth" && ((a[0]==="sun"&&a[2]==="moon")||(a[0]==="moon"&&a[2]==="sun"));
}
function answerQuestion(ok,q,extra=""){
  game.science++;save.challenges++;if(ok){game.correct++;save.correct++;game.combo++;game.score+=CONFIG.score.correct + (game.combo>=3?100:0);unlockByQuestion(q);showFeedback(true,q,extra)}else{game.combo=0;game.score=Math.max(0,game.score+CONFIG.score.wrong);game.mistakes.push(q);showFeedback(false,q,extra)}
  save.highScore=Math.max(save.highScore,Math.floor(game.score));saveProgress();updateHUD();
}
function showFeedback(ok,q,extra){
  state="FEEDBACK";
  $("feedbackPanel").innerHTML=`
    <div class="feedback-icon">${ok?"✓":"✗"}</div>
    <p class="eyebrow">${ok?"CORRECT!":"NOT QUITE"}</p>
    <h2>${ok?"TIDAL BOOST!":"KEEP OBSERVING"}</h2>
    <p>${q.explanation}</p>
    ${extra?`<p><strong>${extra}</strong></p>`:""}
    <div class="reward">${ok?`+${CONFIG.score.correct + (game.combo>=3?100:0)} POINTS ${game.combo>=3?`• 🔥 COMBO x${game.combo>=5?3:2}`:""}`:`${CONFIG.score.wrong} POINTS`}</div>
    <button class="primary" id="feedbackContinue">▶ RETURN TO RUN</button>`;
  showScreen("feedbackScreen");sfx(ok?"correct":"wrong");
  $("feedbackContinue").onclick=resumeAfterFeedback;
}
function resumeAfterFeedback(){
  state="RUNNING";showScreen("menuScreen");screens.forEach(s=>s.classList.remove("active"));$("gameHUD").classList.remove("hidden");$("mobileControls").classList.toggle("hidden",!isMobile());
  if(game.science>=6+game.level-1 && game.level<5 && game.distance>CONFIG.levelDistance*.55){completeLevel()}
}
function completeLevel(){
  state="LEVEL_COMPLETE";save.highestLevel=Math.max(save.highestLevel,game.level);saveProgress();
  const old=game.level;game.level=Math.min(5,game.level+1);game.tide=Math.max(LEVELS[game.level-1].tideStart,game.tide-12);
  $("levelTitle").textContent=`LEVEL ${old} COMPLETE`;
  $("levelMessage").textContent=`${LEVELS[game.level-1].name} — ${LEVELS[game.level-1].intro}`;
  showScreen("levelScreen");sfx("level");
  unlock("🌊","TIDE TRACKER");
}
function unlockByQuestion(q){
  if(q.id===1||q.id===6||q.id===11)unlock("☀️","SUN & MOON");
  if(q.type==="arrange")unlock("🧭","TIDAL THINKER");
  if(game.science>=1)unlock("🌙","MOON EXPLORER");
}
function unlock(icon,name){
  if(!save.achievements.includes(name)){save.achievements.push(name);saveProgress();toast(`Achievement unlocked: ${name}`)}
}
function winGame(){
  state="WIN";save.highestLevel=5;save.highScore=Math.max(save.highScore,Math.floor(game.score));unlock("👑","TIDE MASTER");saveProgress();
  $("winStats").innerHTML=statsHTML();showScreen("winScreen");sfx("win");burst(W*.5,H*.4,["#43e7ff","#ffd66b","#fff"]);
}
function loseGame(){
  state="LOSE";save.highScore=Math.max(save.highScore,Math.floor(game.score));save.bestRun=Math.max(save.bestRun,Math.floor(game.distance));saveProgress();
  $("loseStats").innerHTML=statsHTML();
  const last=game.mistakes[game.mistakes.length-1];
  $("reviewBox").innerHTML=last?`<strong>WHAT TO REVIEW</strong><br>${last.explanation}`:`<strong>KEEP PRACTICING</strong><br>Focus on how relative positions of the Sun, Earth, and Moon relate to tidal conditions.`;
  showScreen("loseScreen");sfx("lose");
}
function statsHTML(){
  return `<div class="result-stat"><b>${Math.floor(game.score).toLocaleString()}</b><span>FINAL SCORE</span></div>
  <div class="result-stat"><b>${game.science}</b><span>SCIENCE CHALLENGES</span></div>
  <div class="result-stat"><b>${game.correct}</b><span>CORRECT ANSWERS</span></div>
  <div class="result-stat"><b>${game.lives}</b><span>LIVES REMAINING</span></div>`;
}
function pauseGame(){
  if(state!=="RUNNING")return;state="PAUSED";showScreen("pauseScreen");$("mobileControls").classList.add("hidden");
}
function resumeGame(){
  if(state!=="PAUSED")return;state="RUNNING";showScreen("menuScreen");screens.forEach(s=>s.classList.remove("active"));$("gameHUD").classList.remove("hidden");$("mobileControls").classList.toggle("hidden",!isMobile());
}
function restart(){hideOverlays();startGame()}
function menu(){
  state="MENU";
  game=null;
  currentQuestion=null;
  hideOverlays();
  $("gameHUD").classList.add("hidden");
  $("mobileControls").classList.add("hidden");
  showScreen("menuScreen");
  drawMenu();
}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),1800)}
function renderProgress(){
  const unlocked=save.achievements;
  $("progressStats").innerHTML=`
    <div class="stat"><b>${save.highScore.toLocaleString()}</b><span>HIGH SCORE</span></div>
    <div class="stat"><b>${save.highestLevel}</b><span>HIGHEST LEVEL</span></div>
    <div class="stat"><b>${save.challenges}</b><span>CHALLENGES</span></div>
    <div class="stat"><b>${save.correct}</b><span>CORRECT ANSWERS</span></div>`;
  $("achievementGrid").innerHTML=ACHIEVEMENTS.map(a=>`<div class="badge ${unlocked.includes(a[1])?"unlocked":""}"><div class="badge-icon">${a[0]}</div><b>${a[1]}</b><small>${a[2]}</small></div>`).join("");
}
function renderLab(condition="spring"){
  const stage=$("labStage"),sun=$("labSun"),moon=$("labMoon");
  if(condition==="spring"){sun.style.left="16%";sun.style.top="50%";moon.style.left="84%";moon.style.top="50%";$("labCondition").textContent="SPRING TIDE";$("labReason").textContent="Sun, Earth, and Moon are aligned in this simplified model.";setBars(10)}
  else if(condition==="neap"){sun.style.left="50%";sun.style.top="12%";moon.style.left="84%";moon.style.top="50%";$("labCondition").textContent="NEAP TIDE";$("labReason").textContent="Sun and Moon are approximately at right angles relative to Earth.";setBars(5)}
  else{sun.style.left="25%";sun.style.top="50%";moon.style.left="78%";moon.style.top="50%";$("labCondition").textContent="EARTH–MOON FOCUS";$("labReason").textContent="The Moon's relative position is especially important to the regular tidal pattern.";setBars(7)}
}
function setBars(n){$("labBars").innerHTML=Array.from({length:10},(_,i)=>`<i style="height:${Math.max(12,n*9 - i*3)}%"></i>`).join("")}
function drawMenu(){
  drawBackground(0);
  const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,"rgba(8,51,72,.08)");g.addColorStop(1,"rgba(2,12,22,.35)");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}
function draw(){
  drawBackground(game?.worldTime||0);
  drawRoad();
  if(game){drawObjects();drawRunner();drawParticles();drawTide();drawFlash()}
}
function drawBackground(t){
  const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,"#68cbe2");sky.addColorStop(.45,"#167da9");sky.addColorStop(1,"#06283c");ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  const sunX=W*.78,sunY=H*.19;const glow=ctx.createRadialGradient(sunX,sunY,5,sunX,sunY,110);glow.addColorStop(0,"rgba(255,246,182,.9)");glow.addColorStop(1,"rgba(255,246,182,0)");ctx.fillStyle=glow;ctx.fillRect(sunX-120,sunY-120,240,240);ctx.fillStyle="#fff2a3";ctx.beginPath();ctx.arc(sunX,sunY,28,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="rgba(5,35,49,.58)";ctx.beginPath();ctx.moveTo(0,H*.44);for(let x=0;x<=W;x+=90)ctx.lineTo(x,H*.41+Math.sin(x*.009+t*.0005)*25);ctx.lineTo(W,H*.62);ctx.lineTo(0,H*.62);ctx.fill();
  ctx.fillStyle="#075b78";ctx.fillRect(0,H*.48,W,H*.52);
  ctx.strokeStyle="rgba(133,238,255,.35)";ctx.lineWidth=3;for(let y=H*.5;y<H*.68;y+=22){ctx.beginPath();for(let x=0;x<W;x+=35)ctx.quadraticCurveTo(x+17,y+Math.sin((x+y+t*.02)*.04)*5,x+35,y);ctx.stroke()}
  // distant islands
  ctx.fillStyle="#06384c";ctx.beginPath();ctx.moveTo(0,H*.49);ctx.quadraticCurveTo(W*.12,H*.39,W*.25,H*.49);ctx.quadraticCurveTo(W*.38,H*.41,W*.52,H*.49);ctx.lineTo(W,H*.58);ctx.lineTo(0,H*.58);ctx.fill();
  // palms
  for(let i=0;i<5;i++){const x=(i+.1)*W/5;const base=H*.56;ctx.strokeStyle="#153b31";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x,base);ctx.quadraticCurveTo(x-10,base-45,x+5,base-95);ctx.stroke();ctx.fillStyle="#174f37";for(let a=0;a<6;a++){ctx.beginPath();ctx.ellipse(x+5+Math.cos(a*Math.PI/3)*24,base-98+Math.sin(a*Math.PI/3)*10,28,6,a*Math.PI/3,0,Math.PI*2);ctx.fill()}}
}
function drawRoad(){
  const horizon=H*.47, bottom=H*1.08;
  ctx.fillStyle="#a98a63";ctx.beginPath();ctx.moveTo(W*.37,horizon);ctx.lineTo(W*.63,horizon);ctx.lineTo(W*.94,bottom);ctx.lineTo(W*.06,bottom);ctx.closePath();ctx.fill();
  ctx.fillStyle="#8b6e4f";ctx.beginPath();ctx.moveTo(W*.42,horizon);ctx.lineTo(W*.58,horizon);ctx.lineTo(W*.72,bottom);ctx.lineTo(W*.28,bottom);ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(255,235,185,.65)";ctx.lineWidth=3;
  for(const lane of [-.5,.5]){ctx.beginPath();ctx.moveTo(W/2+lane*W*.12,horizon);ctx.lineTo(W/2+lane*W*.45,bottom);ctx.stroke()}
  for(let z=0;z<1;z+=.1){const y=horizon+(bottom-horizon)*z;ctx.strokeStyle=`rgba(255,255,255,${.08+z*.1})`;ctx.beginPath();ctx.moveTo(W*.12-(z*W*.04),y);ctx.lineTo(W*.88+(z*W*.04),y);ctx.stroke()}
}
function depthY(z){return H*.47+(H*.7-H*.47)*Math.pow(Math.max(0,z),1.6)}
function drawObjects(){
  for(const o of game.obstacles){const z=o.z,y=depthY(z),scale=.3+z*1.2,x=laneX(o.lane,z);ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);if(o.type==="rock"){ctx.fillStyle="#5d6e72";ctx.beginPath();ctx.moveTo(-32,20);ctx.lineTo(-20,-10);ctx.lineTo(10,-25);ctx.lineTo(34,8);ctx.lineTo(20,27);ctx.closePath();ctx.fill()}else if(o.type==="log"){ctx.fillStyle="#6d4a31";ctx.rotate(.12);ctx.fillRect(-35,-12,70,24);ctx.fillStyle="#9c6d45";ctx.beginPath();ctx.arc(-35,0,12,0,Math.PI*2);ctx.fill()}else if(o.type==="branch"){ctx.strokeStyle="#4c3826";ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(-35,20);ctx.lineTo(0,-15);ctx.lineTo(38,10);ctx.stroke()}else{ctx.fillStyle="rgba(126,239,255,.75)";for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(-25+i*13,10-Math.sin(i)*12,12,0,Math.PI*2);ctx.fill()}}ctx.restore()}
  for(const c of game.collectibles){const y=depthY(c.z),scale=.25+c.z*1.1,x=laneX(c.lane,c.z);ctx.save();ctx.translate(x,y-20*scale);ctx.scale(scale,scale);ctx.rotate(Math.sin(c.spin)*.18);ctx.font="38px sans-serif";ctx.textAlign="center";ctx.fillText(c.type==="shell"?"🐚":"⭐",0,0);ctx.restore()}
}
function drawRunner(){
  const x=laneX(game.runner.lane),base=H*.79-game.runner.y, bob=Math.sin(game.worldTime*.018)*3;
  ctx.save();ctx.translate(x,base+bob);if(game.runner.hit>0&&Math.floor(game.runner.hit/50)%2===0)ctx.globalAlpha=.45;
  // shadow
  ctx.fillStyle="rgba(0,0,0,.25)";ctx.beginPath();ctx.ellipse(0,31,27,8,0,0,Math.PI*2);ctx.fill();
  // stylized original runner
  ctx.fillStyle="#10283b";ctx.fillRect(-12,4,10,27);ctx.fillRect(3,4,10,27);ctx.fillStyle="#f2b48f";ctx.beginPath();ctx.arc(0,-25,15,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#e94e57";ctx.beginPath();ctx.arc(0,-28,16,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle="#14b9ca";ctx.fillRect(-17,-7,34,25);
  ctx.strokeStyle="#f2b48f";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(-28,15+Math.sin(game.worldTime*.02)*5);ctx.moveTo(14,0);ctx.lineTo(28,12-Math.sin(game.worldTime*.02)*5);ctx.stroke();
  ctx.restore();
}
function drawParticles(){for(const p of game.particles){ctx.globalAlpha=Math.max(0,p.life/800);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
function drawTide(){
  const h=H*(.04+game.tide/100*.17);ctx.fillStyle="rgba(10,111,165,.28)";ctx.fillRect(0,H-h,W,h);
  ctx.strokeStyle="rgba(67,231,255,.55)";ctx.lineWidth=3;ctx.beginPath();for(let x=0;x<=W;x+=20){const y=H-h+Math.sin(x*.04+game.worldTime*.004)*6;ctx.lineTo(x,y)}ctx.stroke();
}
function drawFlash(){if(game.flash>0){ctx.fillStyle=`rgba(255,80,80,${game.flash/700})`;ctx.fillRect(0,0,W,H);game.flash-=16}}
function keydown(e){
  if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a"){e.preventDefault();move(-1)}
  if(e.key==="ArrowRight"||e.key.toLowerCase()==="d"){e.preventDefault();move(1)}
  if(e.key==="ArrowUp"||e.key===" "||e.key.toLowerCase()==="w"){e.preventDefault();jump()}
  if(e.key.toLowerCase()==="p")pauseGame();
}
addEventListener("keydown",keydown);
document.querySelectorAll("[data-action]").forEach(btn=>btn.addEventListener("click",()=>{
  const a=btn.dataset.action;
  if(a==="start")startGame();
  if(a==="tutorial"){state="TUTORIAL";showScreen("tutorialScreen")}
  if(a==="objective"){state="OBJECTIVE";showScreen("objectiveScreen")}
  if(a==="progress"){state="PROGRESS";renderProgress();showScreen("progressScreen")}
  if(a==="settings"){state="SETTINGS";showScreen("settingsScreen")}
  if(a==="lab"){state="TIDE_LAB";showScreen("labScreen");renderLab("spring")}
  if(a==="menu")menu();
  if(a==="pause")pauseGame();
  if(a==="resume")resumeGame();
  if(a==="restart")restart();
  if(a==="continue"){state="RUNNING";showScreen("menuScreen");screens.forEach(s=>s.classList.remove("active"));$("gameHUD").classList.remove("hidden");$("mobileControls").classList.toggle("hidden",!isMobile())}
  if(a==="reset"){if(confirm("Reset all saved Tide Runner progress?")){localStorage.removeItem(SAVE_KEY);save=loadSave();renderProgress();toast("Progress reset.")}}
}));
document.querySelectorAll("[data-control]").forEach(btn=>{
  const action=btn.dataset.control;const fn=()=>action==="left"?move(-1):action==="right"?move(1):jump();
  btn.addEventListener("pointerdown",e=>{e.preventDefault();fn()});
});
document.querySelectorAll("[data-lab]").forEach(btn=>btn.addEventListener("click",()=>renderLab(btn.dataset.lab)));
$("soundToggle").addEventListener("change",e=>soundOn=e.target.checked);
$("motionToggle").addEventListener("change",e=>{reducedMotion=e.target.checked;document.body.classList.toggle("reduced",reducedMotion)});
function sfx(type){
  if(!soundOn)return;
  try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    if(!sfx.ctx)sfx.ctx=new AC();
    const ac=sfx.ctx,o=ac.createOscillator(),g=ac.createGain();
    const map={click:[500,.05],jump:[330,.09],collect:[780,.1],correct:[920,.16],wrong:[190,.18],hit:[110,.18],level:[620,.28],win:[980,.35],lose:[130,.3]};
    const [freq,dur]=map[type]||[400,.08];o.frequency.value=freq;o.type=type==="wrong"||type==="hit"?"sawtooth":"sine";g.gain.setValueAtTime(.0001,ac.currentTime);g.gain.exponentialRampToValueAtTime(.08,ac.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+dur+.02);
  }catch{}
}
// Lab drag: touch/pointer friendly.
["labSun","labMoon"].forEach(id=>{
  const el=$(id);
  el.addEventListener("pointerdown",e=>{labDrag={id,offsetX:e.clientX,offsetY:e.clientY};el.setPointerCapture(e.pointerId)});
  el.addEventListener("pointermove",e=>{
    if(!labDrag||labDrag.id!==id)return;
    const r=$("labStage").getBoundingClientRect();
    let x=((e.clientX-r.left)/r.width)*100,y=((e.clientY-r.top)/r.height)*100;
    x=Math.max(8,Math.min(92,x));y=Math.max(8,Math.min(92,y));el.style.left=x+"%";el.style.top=y+"%";updateLabFromPositions();
  });
  el.addEventListener("pointerup",()=>{labDrag=null});
});
function updateLabFromPositions(){
  const s=$("labSun").getBoundingClientRect(),m=$("labMoon").getBoundingClientRect(),e=$("labEarth").getBoundingClientRect();
  const ax=Math.atan2(s.top-e.top,s.left-e.left),bx=Math.atan2(m.top-e.top,m.left-e.left);
  let deg=Math.abs(((ax-bx)*180/Math.PI+360)%360);deg=Math.min(deg,360-deg);
  if(deg<28||deg>152){$("labCondition").textContent="SPRING TIDE";$("labReason").textContent="The simplified model is close to an aligned arrangement.";setBars(10)}
  else if(Math.abs(deg-90)<28){$("labCondition").textContent="NEAP TIDE";$("labReason").textContent="The simplified model is close to a right-angle arrangement.";setBars(5)}
  else{$("labCondition").textContent="TRANSITION";$("labReason").textContent="The arrangement is between the simplified spring and neap examples.";setBars(7)}
}
// --- BOOT SAFETY ---
// Always open the website at the TIDE RUNNER main menu.
// This also prevents a browser/bfcache/hash restoration from reopening Tide Lab.
function bootTideRunner(){
  state = "MENU";
  game = null;
  currentQuestion = null;
  labDrag = null;
  hideOverlays();
  showScreen("menuScreen");
  $("gameHUD").classList.add("hidden");
  $("mobileControls").classList.add("hidden");
  drawMenu();
}

// Clear any URL hash that could represent an old/restored navigation state.
if (location.hash) {
  try { history.replaceState(null, "", location.pathname + location.search); } catch {}
}

renderLab("spring");
bootTideRunner();
addEventListener("pageshow", () => {
  if (state !== "RUNNING" && state !== "PAUSED") bootTideRunner();
});
