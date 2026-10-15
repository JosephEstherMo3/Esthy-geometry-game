const GROUND_H = 80;
function mkSpike(x){ return {type:'spike',x,y:0,w:40,h:40}; }
function mkBlock(x,w,h){ return {type:'block',x,y:0,w:w,h:h}; }
function mkGap(x,w){ return {type:'gap',x,y:0,w,h:0}; }
function mkPlatform(x,y,w){ return {type:'platform',x,y,w,h:16}; }
function mkSaw(x,y,r=28){ return {type:'saw',x,y,r,rot:0}; }
function mkMovingSpike(x,y,range=120,speed=2){ return {type:'moving',x,y,w:40,h:40,baseY:y,range,speed,phase:0}; }

const LEVELS = [
  {
    id:1, name:'Neon Start', difficulty:1, speed:380,
    length:5200,
    palette:{ bg1:'#0a0420', bg2:'#1a0a4a', ground:'#2a1466', accent:'#00e7ff', player:'#39ff88', glow:'#00e7ff' },
    obstacles:(()=>{
      const o=[];
      let x=800;
      const pattern = [
        ['s',200],['s',280],['s',280],
        ['s',300],['g',120,'s',280],
        ['s',280],['s',280],
        ['g',140,'s',280],
        ['s',280],['s',280],['s',280],
        ['g',160,'s',280],
        ['s',280],
        ['g',140],['s',280],['s',280],
        ['g',160],['s',280],
        ['s',280],['s',280],
        ['g',180,'s',280],['s',280],
      ];
      for(const p of pattern){
        if(p[0]==='s'){ o.push(mkSpike(x)); x+=p[1]; }
        else if(p[0]==='g'){ o.push(mkGap(x,p[1])); x+=p[1]; if(p[2]==='s'){ o.push(mkSpike(x)); x+=p[3]; } }
      }
      return o;
    })()
  },
  {
    id:2, name:'Pulse Runner', difficulty:2, speed:420,
    length:6000,
    palette:{ bg1:'#14002a', bg2:'#3a0a5a', ground:'#5a1488', accent:'#ff2bd6', player:'#ffe94a', glow:'#ff2bd6' },
    obstacles:(()=>{
      const o=[];
      let x=700;
      const seq=[
        ['s',220],['s',220],
        ['g',120,'s',220],['s',220],
        ['b',40,40,'s',220],
        ['s',220],['g',140],['s',220],['s',220],
        ['s',220],['s',220],['s',220],
        ['g',160,'s',220],['s',220],
        ['b',80,40,'s',220],['s',220],
        ['g',140,'s',220],
        ['s',220],['s',220],['g',140],
        ['s',220],['s',220],['s',220],
        ['g',180,'s',220],['s',220],['s',220],
      ];
      for(const p of seq){
        if(p[0]==='s'){ o.push(mkSpike(x)); x+=p[1]; }
        else if(p[0]==='g'){ o.push(mkGap(x,p[1])); x+=p[1]; if(p[2]==='s'){ o.push(mkSpike(x)); x+=p[3]; } }
        else if(p[0]==='b'){ o.push(mkBlock(x,p[1],p[2])); x+=p[1]; if(p[3]==='s'){ o.push(mkSpike(x)); x+=p[4]; } }
      }
      return o;
    })()
  },
  {
    id:3, name:'Voltage Rush', difficulty:3, speed:470,
    length:6800,
    palette:{ bg1:'#001a2a', bg2:'#003a5a', ground:'#005a88', accent:'#39ff88', player:'#00e7ff', glow:'#39ff88' },
    obstacles:(()=>{
      const o=[];
      let x=700;
      const seq=[
        ['s',200],['s',200],['s',200],
        ['g',140,'s',200],['s',200],
        ['p',100,120,'s',200],
        ['s',200],['g',140],['s',200],['s',200],
        ['s',200],['s',200],['s',200],
        ['g',160,'p',140,100],
        ['s',200],['s',200],
        ['g',140,'s',200],['s',200],['s',200],
        ['p',120,140,'s',200],
        ['s',200],['g',160],['s',200],['s',200],
        ['s',200],['s',200],['s',200],
        ['g',180,'s',200],['s',200],
      ];
      for(const p of seq){
        if(p[0]==='s'){ o.push(mkSpike(x)); x+=p[1]; }
        else if(p[0]==='g'){ o.push(mkGap(x,p[1])); x+=p[1]; if(p[2]==='s'){ o.push(mkSpike(x)); x+=p[3]; } else if(p[2]==='p'){ o.push(mkPlatform(x+p[1]/2, p[2], p[3])); } }
        else if(p[0]==='p'){ o.push(mkPlatform(x, p[1], p[2])); x+=p[2]; if(p[3]==='s'){ o.push(mkSpike(x)); x+=p[4]; } }
      }
      return o;
    })()
  },
  {
    id:4, name:'Cyber Storm', difficulty:4, speed:500,
    length:7600,
    palette:{ bg1:'#1a0000', bg2:'#4a0020', ground:'#7a0040', accent:'#ffe94a', player:'#ff2bd6', glow:'#ffe94a' },
    obstacles:(()=>{
      const o=[];
      let x=700;
      o.push(mkSpike(x)); x+=200;
      o.push(mkSpike(x)); x+=200;
      o.push(mkSaw(x+40, 40, 28)); x+=260;
      o.push(mkGap(x,140)); x+=140;
      o.push(mkPlatform(x,80,120)); x+=120;
      o.push(mkSaw(x+20, 120, 28)); x+=180;
      o.push(mkSpike(x)); x+=180;
      o.push(mkMovingSpike(x, 60, 80, 2.2)); x+=220;
      o.push(mkSpike(x)); x+=180;
      o.push(mkSpike(x)); x+=180;
      o.push(mkGap(x,160)); x+=160;
      o.push(mkSaw(x+30, 30, 32)); x+=220;
      o.push(mkPlatform(x, 100, 140)); x+=140;
      o.push(mkMovingSpike(x, 40, 100, 2.5)); x+=240;
      o.push(mkSpike(x)); x+=180;
      o.push(mkSpike(x)); x+=180;
      o.push(mkSpike(x)); x+=180;
      o.push(mkGap(x,180)); x+=180;
      o.push(mkSaw(x+30, 40, 30)); x+=220;
      o.push(mkMovingSpike(x, 80, 120, 2.8)); x+=260;
      o.push(mkSpike(x)); x+=180;
      o.push(mkSpike(x)); x+=180;
      return o;
    })()
  },
  {
    id:5, name:'Final Overdrive', difficulty:5, speed:540,
    length:8600,
    palette:{ bg1:'#000014', bg2:'#1a0040', ground:'#3a0080', accent:'#ff2bd6', player:'#ffe94a', glow:'#ff2bd6' },
    obstacles:(()=>{
      const o=[];
      let x=700;
      o.push(mkSpike(x)); x+=180;
      o.push(mkSpike(x)); x+=180;
      o.push(mkSaw(x+30, 30, 28)); x+=220;
      o.push(mkGap(x,140)); x+=140;
      o.push(mkSpike(x)); x+=160;
      o.push(mkMovingSpike(x, 60, 100, 2.6)); x+=220;
      o.push(mkPlatform(x, 90, 100)); x+=100;
      o.push(mkSaw(x+20, 130, 28)); x+=180;
      o.push(mkSpike(x)); x+=160;
      o.push(mkSpike(x)); x+=160;
      o.push(mkGap(x,160)); x+=160;
      o.push(mkMovingSpike(x, 80, 120, 3)); x+=240;
      o.push(mkSaw(x+30, 40, 32)); x+=220;
      o.push(mkSpike(x)); x+=160;
      o.push(mkPlatform(x, 110, 120)); x+=120;
      o.push(mkGap(x,160)); x+=160;
      o.push(mkSpike(x)); x+=160;
      o.push(mkSpike(x)); x+=160;
      o.push(mkSpike(x)); x+=160;
      o.push(mkMovingSpike(x, 50, 100, 3.2)); x+=240;
      o.push(mkSaw(x+30, 30, 30)); x+=220;
      o.push(mkGap(x,180)); x+=180;
      o.push(mkSpike(x)); x+=160;
      o.push(mkSpike(x)); x+=160;
      return o;
    })()
  }
];
