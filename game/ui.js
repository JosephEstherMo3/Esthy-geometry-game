let lastTime = performance.now();
function loop(now){
  const dt = Math.min(0.033, (now-lastTime)/1000);
  lastTime = now;
  update(dt);
  render();
  if(State.mode==='victory') updateVictoryParticles(dt);
  if(State.mode!=='playing' && State.mode!=='victory'){
    updateParticles(dt);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function showMenu(id){
  hideAllMenus();
  const el = $(id);
  if(el) el.classList.add('active');
  if(id==='menuMain') updateMainStats();
  if(id==='menuLevels') renderLevelGrid('levelGrid', false);
  if(id==='menuPractice') renderLevelGrid('practiceGrid', true);
  if(id==='menuSettings') syncSettingsUI();
}
function updateMainStats(){
  const completed = Object.keys(Storage.data.progress.completed).length;
  $('statCompleted').textContent = completed + '/5';
  let total = 0;
  for(const k in Storage.data.progress.attempts) total += Storage.data.progress.attempts[k];
  $('statAttempts').textContent = total;
}
function renderLevelGrid(containerId, practice){
  const c = $(containerId);
  c.innerHTML = '';
  LEVELS.forEach(L=>{
    const unlocked = L.id <= Storage.data.progress.unlocked;
    const completed = Storage.data.progress.completed[L.id];
    const best = Storage.data.progress.best[L.id]||0;
    const card = document.createElement('div');
    card.className = 'level-card' + (unlocked?'':' locked');
    card.innerHTML = `
      <div class="lnum">LEVEL ${L.id}</div>
      <div class="lname">${L.name}</div>
      <div class="ldiff">${'★'.repeat(L.difficulty)}${'☆'.repeat(5-L.difficulty)}</div>
      <div class="lprog">${completed?'✓ COMPLETE':(best>0?'Best: '+best+'%':'Not played')}</div>
      ${unlocked?'':'<div class="lock-icon">🔒</div>'}
    `;
    card.style.borderColor = L.palette.accent;
    if(unlocked){
      card.onclick = ()=>{ startLevel(L.id, practice); };
    }
    c.appendChild(card);
  });
}
function syncSettingsUI(){
  $('setMusic').value = Storage.data.settings.music;
  $('setMusicVal').textContent = Storage.data.settings.music;
  $('setSfx').value = Storage.data.settings.sfx;
  $('setSfxVal').textContent = Storage.data.settings.sfx;
  $('setMusicOn').classList.toggle('on', Storage.data.settings.musicOn);
  $('setSfxOn').classList.toggle('on', Storage.data.settings.sfxOn);
  $('setReduced').classList.toggle('on', Storage.data.settings.reduced);
}

$('btnPlay').addEventListener('click', ()=>{
  AudioMgr.init(); AudioMgr.resume();
  const firstUnlocked = Storage.data.progress.unlocked || 1;
  startLevel(firstUnlocked, false);
});

document.querySelectorAll('[data-goto]').forEach(b=>{
  b.addEventListener('click', ()=>{
    AudioMgr.init(); AudioMgr.resume();
    showMenu(b.dataset.goto);
  });
});

$('setMusic').addEventListener('input', e=>{
  const v = +e.target.value;
  $('setMusicVal').textContent = v;
  $('pauseMusic').value = v; $('pauseMusicVal').textContent = v;
  AudioMgr.setMusicVol(v);
});
$('setSfx').addEventListener('input', e=>{
  const v = +e.target.value;
  $('setSfxVal').textContent = v;
  $('pauseSfx').value = v; $('pauseSfxVal').textContent = v;
  AudioMgr.setSfxVol(v);
});
$('setMusicOn').addEventListener('click', e=>{
  const v = !Storage.data.settings.musicOn;
  AudioMgr.setMusicOn(v);
  e.currentTarget.classList.toggle('on', v);
});
$('setSfxOn').addEventListener('click', e=>{
  const v = !Storage.data.settings.sfxOn;
  AudioMgr.setSfxOn(v);
  e.currentTarget.classList.toggle('on', v);
});
$('setReduced').addEventListener('click', e=>{
  Storage.data.settings.reduced = !Storage.data.settings.reduced;
  Storage.save();
  e.currentTarget.classList.toggle('on', Storage.data.settings.reduced);
});
$('btnReset').addEventListener('click', ()=>{
  if(confirm('Reset all progress and settings? This cannot be undone.')){
    Storage.reset();
    syncSettingsUI();
    updateMainStats();
  }
});

$('pauseMusic').value = Storage.data.settings.music;
$('pauseMusicVal').textContent = Storage.data.settings.music;
$('pauseSfx').value = Storage.data.settings.sfx;
$('pauseSfxVal').textContent = Storage.data.settings.sfx;
$('pauseMusic').addEventListener('input', e=>{
  const v=+e.target.value; $('pauseMusicVal').textContent=v;
  $('setMusic').value=v; $('setMusicVal').textContent=v;
  AudioMgr.setMusicVol(v);
});
$('pauseSfx').addEventListener('input', e=>{
  const v=+e.target.value; $('pauseSfxVal').textContent=v;
  $('setSfx').value=v; $('setSfxVal').textContent=v;
  AudioMgr.setSfxVol(v);
});
$('btnPause').addEventListener('click', togglePause);
$('btnResume').addEventListener('click', resumeGame);
$('btnRestart').addEventListener('click', ()=>{ resetAttempt(); State.mode='playing'; hideAllMenus(); AudioMgr.startMusic(120+State.levelId*6); });
$('btnToMenu').addEventListener('click', ()=>{ State.mode='menu'; showHud(false); AudioMgr.stopMusic(); showMenu('menuMain'); });

$('btnRetry').addEventListener('click', ()=>{ resetAttempt(); State.mode='playing'; hideAllMenus(); AudioMgr.startMusic(120+State.levelId*6); });
$('btnDeathMenu').addEventListener('click', ()=>{ State.mode='menu'; showHud(false); AudioMgr.stopMusic(); showMenu('menuMain'); });

$('btnNext').addEventListener('click', ()=>{
  const next = State.levelId+1;
  if(next<=LEVELS.length){ startLevel(next, State.practice); }
  else { State.mode='menu'; showMenu('menuMain'); }
});
$('btnReplay').addEventListener('click', ()=>{ startLevel(State.levelId, State.practice); });
$('btnVictoryMenu').addEventListener('click', ()=>{ State.mode='menu'; showMenu('menuMain'); });

showMenu('menuMain');

canvas.addEventListener('contextmenu', e=>e.preventDefault());
