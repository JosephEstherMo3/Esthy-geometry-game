const $ = id => document.getElementById(id);
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

const Storage = {
  key: 'neonDash_v1',
  data: null,
  defaults(){
    return {
      settings:{music:50,sfx:70,musicOn:true,sfxOn:true,reduced:false},
      progress:{unlocked:1,best:{},completed:{},attempts:{}}
    };
  },
  load(){
    try{
      const raw = localStorage.getItem(this.key);
      if(raw){ this.data = JSON.parse(raw); }
      else { this.data = this.defaults(); }
    }catch(e){ this.data = this.defaults(); }
    const d = this.defaults();
    this.data.settings = {...d.settings, ...(this.data.settings||{})};
    this.data.progress = {...d.progress, ...(this.data.progress||{})};
    this.data.progress.best = this.data.progress.best||{};
    this.data.progress.completed = this.data.progress.completed||{};
    this.data.progress.attempts = this.data.progress.attempts||{};
  },
  save(){ try{ localStorage.setItem(this.key, JSON.stringify(this.data)); }catch(e){} },
  reset(){ this.data = this.defaults(); this.save(); }
};
Storage.load();

const AudioMgr = {
  ctx:null, master:null, musicGain:null, sfxGain:null,
  musicTimer:null, musicStep:0, musicOn:true,
  init(){
    if(this.ctx) return;
    try{
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = (Storage.data.settings.music/100) * (Storage.data.settings.musicOn?1:0);
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = (Storage.data.settings.sfx/100) * (Storage.data.settings.sfxOn?1:0);
      this.sfxGain.connect(this.master);
    }catch(e){ console.warn('Audio init failed',e); }
  },
  resume(){ if(this.ctx && this.ctx.state==='suspended') this.ctx.resume(); },
  setMusicVol(v){ Storage.data.settings.music=v; Storage.save(); if(this.musicGain) this.musicGain.gain.value = (v/100)*(Storage.data.settings.musicOn?1:0); },
  setSfxVol(v){ Storage.data.settings.sfx=v; Storage.save(); if(this.sfxGain) this.sfxGain.gain.value = (v/100)*(Storage.data.settings.sfxOn?1:0); },
  setMusicOn(v){ Storage.data.settings.musicOn=v; Storage.save(); if(this.musicGain) this.musicGain.gain.value = ((Storage.data.settings.music)/100)*(v?1:0); },
  setSfxOn(v){ Storage.data.settings.sfxOn=v; Storage.save(); if(this.sfxGain) this.sfxGain.gain.value = ((Storage.data.settings.sfx)/100)*(v?1:0); },
  blip(freq=600, dur=0.08, type='square', vol=0.3){
    if(!this.ctx || !Storage.data.settings.sfxOn) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq,t);
    o.frequency.exponentialRampToValueAtTime(freq*0.5, t+dur);
    g.gain.setValueAtTime(vol,t);
    g.gain.exponentialRampToValueAtTime(0.001, t+dur);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t+dur);
  },
  jump(){ this.blip(720, 0.09, 'square', 0.25); this.blip(1080, 0.06, 'sine', 0.15); },
  death(){
    if(!this.ctx || !Storage.data.settings.sfxOn) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type='sawtooth'; o.frequency.setValueAtTime(400,t); o.frequency.exponentialRampToValueAtTime(60,t+0.5);
    g.gain.setValueAtTime(0.3,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.5);
    o.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t+0.5);
  },
  checkpoint(){ this.blip(880,0.1,'sine',0.25); setTimeout(()=>this.blip(1320,0.12,'sine',0.25),80); },
  victory(){
    const notes=[523,659,784,1046];
    notes.forEach((f,i)=>setTimeout(()=>this.blip(f,0.18,'triangle',0.3), i*110));
  },
  startMusic(bpm=128){
    if(!this.ctx) return;
    this.stopMusic();
    const stepTime = 60/bpm/2;
    const bass = [65.41,0,65.41,0,82.41,0,73.42,0, 65.41,0,98.00,0,82.41,0,73.42,0];
    const lead = [523,0,659,0,784,0,659,0, 523,0,784,0,1046,0,784,0];
    const hat  = [1,0,1,0,1,0,1,1, 1,0,1,0,1,0,1,1];
    const kick = [1,0,0,0,1,0,0,0, 1,0,0,0,1,0,0,0];
    this.musicStep = 0;
    const tick = ()=>{
      if(!this.musicOn) return;
      const s = this.musicStep % 16;
      const t = this.ctx.currentTime;
      if(bass[s]>0){
        const o=this.ctx.createOscillator(); const g=this.ctx.createGain();
        o.type='sawtooth'; o.frequency.value=bass[s];
        g.gain.setValueAtTime(0.18,t); g.gain.exponentialRampToValueAtTime(0.001,t+stepTime*0.9);
        const f=this.ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=400;
        o.connect(f); f.connect(g); g.connect(this.musicGain);
        o.start(t); o.stop(t+stepTime);
      }
      if(lead[s]>0){
        const o=this.ctx.createOscillator(); const g=this.ctx.createGain();
        o.type='triangle'; o.frequency.value=lead[s];
        g.gain.setValueAtTime(0.08,t); g.gain.exponentialRampToValueAtTime(0.001,t+stepTime*0.8);
        o.connect(g); g.connect(this.musicGain);
        o.start(t); o.stop(t+stepTime);
      }
      if(kick[s]){
        const o=this.ctx.createOscillator(); const g=this.ctx.createGain();
        o.type='sine'; o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(40,t+0.12);
        g.gain.setValueAtTime(0.5,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.15);
        o.connect(g); g.connect(this.musicGain);
        o.start(t); o.stop(t+0.16);
      }
      if(hat[s]){
        const buf=this.ctx.createBuffer(1,this.ctx.sampleRate*0.05,this.ctx.sampleRate);
        const d=buf.getChannelData(0);
        for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
        const src=this.ctx.createBufferSource(); src.buffer=buf;
        const g=this.ctx.createGain(); g.gain.value=0.12;
        const f=this.ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=6000;
        src.connect(f); f.connect(g); g.connect(this.musicGain);
        src.start(t);
      }
      this.musicStep++;
      this.musicTimer = setTimeout(tick, stepTime*1000);
    };
    this.musicOn = true;
    tick();
  },
  stopMusic(){ this.musicOn=false; if(this.musicTimer){ clearTimeout(this.musicTimer); this.musicTimer=null; } }
};
