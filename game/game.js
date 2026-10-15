const canvas = $('canvas');
const ctx = canvas.getContext('2d');
let W=0,H=0,DPR=1;
function resize(){
  DPR = Math.min(window.devicePixelRatio||1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W*DPR; canvas.height = H*DPR;
  canvas.style.width = W+'px'; canvas.style.height = H+'px';
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize', resize);
resize();

const State = {
  mode:'menu',
  practice:false,
  levelId:1,
  level:null,
  player:null,
  cameraX:0,
  attempts:0,
  startTime:0,
  elapsed:0,
  checkpointX:0,
  bestProgress:0,
  particles:[],
  bgStars:[],
  shake:0,
};

function createPlayer(x=80){
  const size = 38;
  return {
    x, y:H - GROUND_H - size, vy:0,
    size,
    rot:0,
    grounded:true,
    alive:true,
  };
}

const Input = { jumpQueued:false };
function queueJump(){
  if(State.mode==='playing') Input.jumpQueued = true;
}
window.addEventListener('keydown', e=>{
  if(e.code==='Space' || e.code==='ArrowUp'){
    e.preventDefault();
    queueJump();
  }
  if(e.code==='Escape'){ togglePause(); }
});
canvas.addEventListener('mousedown', e=>{ e.preventDefault(); queueJump(); });
canvas.addEventListener('touchstart', e=>{ e.preventDefault(); queueJump(); }, {passive:false});
document.addEventListener('touchmove', e=>{ if(State.mode==='playing') e.preventDefault(); }, {passive:false});

function spawnParticles(x,y,color,count=12,speed=300){
  if(Storage.data.settings.reduced) count = Math.min(count,4);
  for(let i=0;i<count;i++){
    const a = Math.random()*Math.PI*2;
    const s = speed*(0.4+Math.random()*0.6);
    State.particles.push({
      x,y,
      vx:Math.cos(a)*s, vy:Math.sin(a)*s,
      life:1, max:0.6+Math.random()*0.4,
      color, size:2+Math.random()*3
    });
  }
}
function updateParticles(dt){
  for(let i=State.particles.length-1;i>=0;i--){
    const p = State.particles[i];
    p.x += p.vx*dt; p.y += p.vy*dt;
    p.vy += 600*dt;
    p.life -= dt/p.max;
    if(p.life<=0) State.particles.splice(i,1);
  }
}

function initBgStars(){
  State.bgStars = [];
  for(let i=0;i<80;i++){
    State.bgStars.push({
      x:Math.random()*W*3,
      y:Math.random()*(H-GROUND_H-40),
      r:Math.random()*1.8+0.3,
      tw:Math.random()*Math.PI*2,
    });
  }
}
initBgStars();

function startLevel(id, practice=false){
  AudioMgr.init(); AudioMgr.resume();
  State.levelId = id;
  State.level = LEVELS.find(l=>l.id===id);
  State.practice = practice;
  State.attempts = (Storage.data.progress.attempts[id]||0);
  State.bestProgress = Storage.data.progress.best[id]||0;
  resetAttempt();
  State.mode = 'playing';
  State.startTime = performance.now();
  showHud(true);
  hideAllMenus();
  AudioMgr.startMusic(120 + id*6);
}
function resetAttempt(){
  State.attempts++;
  Storage.data.progress.attempts[State.levelId] = State.attempts;
  Storage.save();
  State.player = createPlayer(80);
  State.cameraX = 0;
  State.checkpointX = 0;
  State.particles = [];
  State.shake = 0;
  for(const o of State.level.obstacles){
    if(o.type==='moving'){ o.phase = 0; o.y = o.baseY; }
    if(o.type==='saw'){ o.rot = 0; }
  }
}
function showHud(v){
  $('hud').style.display = v?'flex':'none';
  $('progressBar').style.display = v?'block':'none';
}
function hideAllMenus(){
  document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('active'));
}

function togglePause(){
  if(State.mode==='playing'){
    State.mode='paused';
    $('menuPause').classList.add('active');
    AudioMgr.stopMusic();
  } else if(State.mode==='paused'){
    resumeGame();
  }
}
function resumeGame(){
  State.mode='playing';
  hideAllMenus();
  AudioMgr.startMusic(120 + State.levelId*6);
}

function die(){
  if(!State.player.alive) return;
  State.player.alive = false;
  AudioMgr.death();
  const px = State.player.x + State.player.size/2 - State.cameraX;
  const py = State.player.y + State.player.size/2;
  spawnParticles(px, py, State.level.palette.accent, 30, 500);
  State.shake = 18;
  $('deathFlash').classList.add('active');
  setTimeout(()=>$('deathFlash').classList.remove('active'), 160);
  const prog = getProgress();
  if(prog > State.bestProgress){
    State.bestProgress = prog;
    Storage.data.progress.best[State.levelId] = prog;
    Storage.save();
  }
  setTimeout(()=>{
    if(State.practice){
      State.player = createPlayer(Math.max(80, State.checkpointX));
      State.cameraX = Math.max(0, State.checkpointX - W*0.3);
      State.player.alive = true;
      State.mode = 'playing';
    } else {
      State.mode = 'dead';
      $('deathProgress').textContent = prog+'%';
      $('deathAttempts').textContent = State.attempts;
      $('deathBest').textContent = State.bestProgress+'%';
      $('menuDeath').classList.add('active');
      AudioMgr.stopMusic();
    }
  }, 600);
}

function victory(){
  State.mode = 'victory';
  AudioMgr.victory();
  AudioMgr.stopMusic();
  Storage.data.progress.completed[State.levelId] = true;
  Storage.data.progress.best[State.levelId] = 100;
  if(State.levelId >= Storage.data.progress.unlocked && State.levelId < LEVELS.length){
    Storage.data.progress.unlocked = State.levelId+1;
  }
  Storage.save();
  $('victoryTime').textContent = (State.elapsed/1000).toFixed(1)+'s';
  $('victoryAttempts').textContent = State.attempts;
  $('menuVictory').classList.add('active');
  showHud(false);
  startVictoryParticles();
}

function getProgress(){
  if(!State.level) return 0;
  const p = State.player.x / State.level.length;
  return clamp(Math.floor(p*100), 0, 100);
}

function update(dt){
  if(State.mode!=='playing') return;
  const L = State.level;
  const P = State.player;
  State.elapsed = performance.now() - State.startTime;

  for(const o of L.obstacles){
    if(o.type==='moving'){
      o.phase += dt*o.speed;
      o.y = o.baseY + Math.sin(o.phase)*o.range;
    }
    if(o.type==='saw'){ o.rot += dt*6; }
  }

  P.x += L.speed * dt;
  State.cameraX = Math.max(0, P.x - W*0.3);

  if(State.practice){
    const prog = P.x / L.length;
    const cp = Math.floor(prog * 6) / 6;
    const cpX = cp * L.length;
    if(cpX > State.checkpointX + 10){
      State.checkpointX = cpX;
      AudioMgr.checkpoint();
      spawnParticles(P.x+P.size/2 - State.cameraX, P.y+P.size/2, '#39ff88', 18, 250);
    }
  }

  if(Input.jumpQueued && P.grounded && P.alive){
    P.vy = -780;
    P.grounded = false;
    AudioMgr.jump();
    spawnParticles(P.x+P.size/2 - State.cameraX, P.y+P.size, L.palette.accent, 6, 180);
  }
  Input.jumpQueued = false;

  P.vy += 2200 * dt;
  P.y += P.vy * dt;

  if(!P.grounded){ P.rot += dt * 7; }
  else { P.rot = Math.round(P.rot/(Math.PI/2))*(Math.PI/2); }

  const inGap = L.obstacles.some(o=>o.type==='gap' && P.x+P.size > o.x && P.x < o.x+o.w);
  const groundY = H - GROUND_H - P.size;

  let onPlatform = false;
  for(const o of L.obstacles){
    if(o.type==='platform'){
      const py = H - GROUND_H - o.y;
      if(P.vy >= 0 && P.y + P.size <= py + 4 && P.y + P.size + P.vy*dt >= py - 4){
        if(P.x + P.size > o.x && P.x < o.x + o.w){
          P.y = py - P.size;
          P.vy = 0;
          P.grounded = true;
          onPlatform = true;
        }
      }
    }
  }

  if(!inGap){
    if(P.y >= groundY){
      P.y = groundY;
      if(P.vy > 400 && !P.grounded){
        spawnParticles(P.x+P.size/2 - State.cameraX, P.y+P.size, L.palette.accent, 5, 150);
      }
      P.vy = 0;
      P.grounded = true;
    } else if(!onPlatform) {
      if(P.y < groundY){
        P.grounded = false;
      }
    }
  } else {
    P.grounded = false;
    if(P.y > H + 100){ die(); return; }
  }

  for(const o of L.obstacles){
    if(o.type==='spike'){
      const gy = H - GROUND_H;
      const hx = o.x + 8, hy = gy - o.h + 10, hw = o.w-16, hh = o.h-10;
      if(rectOverlap(P.x, P.y, P.size, P.size, hx, hy, hw, hh)){ die(); return; }
    } else if(o.type==='block'){
      const by = H - GROUND_H - o.h;
      if(P.vy >= 0 && P.y + P.size <= by + 4 && P.y + P.size + P.vy*dt >= by - 4){
        if(P.x + P.size > o.x && P.x < o.x + o.w){
          P.y = by - P.size;
          P.vy = 0;
          P.grounded = true;
          continue;
        }
      }
      if(rectOverlap(P.x+2, P.y+2, P.size-4, P.size-4, o.x, by, o.w, o.h)){
        die(); return;
      }
    } else if(o.type==='saw'){
      const sx = o.x, sy = H - GROUND_H - o.y;
      const cx = P.x + P.size/2, cy = P.y + P.size/2;
      const dx = cx - sx, dy = cy - sy;
      const dist = Math.sqrt(dx*dx+dy*dy);
      if(dist < o.r + P.size*0.35){ die(); return; }
    } else if(o.type==='moving'){
      const mx = o.x, my = H - GROUND_H - o.y - o.h;
      if(rectOverlap(P.x+2, P.y+2, P.size-4, P.size-4, mx, my, o.w, o.h)){
        die(); return;
      }
    }
  }

  if(P.x >= L.length){ victory(); return; }

  updateParticles(dt);
  if(State.shake>0) State.shake = Math.max(0, State.shake - dt*60);

  const prog = getProgress();
  $('hudLevel').textContent = L.id;
  $('hudLevelName').textContent = L.name;
  $('hudProgress').textContent = prog+'%';
  $('hudBest').textContent = State.bestProgress+'%';
  $('progressFill').style.width = prog+'%';
}

function rectOverlap(ax,ay,aw,ah,bx,by,bw,bh){
  return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
}
