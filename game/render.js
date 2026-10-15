function render(){
  const L = State.level || LEVELS[0];
  const pal = L.palette;

  let sx=0, sy=0;
  if(State.shake>0){ sx=(Math.random()-0.5)*State.shake; sy=(Math.random()-0.5)*State.shake; }

  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0, pal.bg1);
  g.addColorStop(1, pal.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  ctx.save();
  ctx.translate(sx,sy);

  if(!Storage.data.settings.reduced){
    for(const s of State.bgStars){
      const px = (s.x - State.cameraX*0.3) % (W*3);
      const x = px<0 ? px+W*3 : px;
      if(x>W) continue;
      s.tw += 0.03;
      const a = 0.4 + Math.sin(s.tw)*0.3;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath(); ctx.arc(x, s.y, s.r, 0, Math.PI*2); ctx.fill();
    }
  }

  drawMountains(State.cameraX*0.2, pal.bg2, 0.4, H-GROUND_H-120);
  drawMountains(State.cameraX*0.4, pal.bg2, 0.6, H-GROUND_H-60);

  const groundY = H - GROUND_H;
  ctx.save();
  ctx.translate(-State.cameraX, 0);

  const gaps = L.obstacles.filter(o=>o.type==='gap');
  const viewL = State.cameraX - 50;
  const viewR = State.cameraX + W + 50;

  let segs = [];
  let cursor = -1000;
  const sortedGaps = gaps.slice().sort((a,b)=>a.x-b.x);
  for(const gap of sortedGaps){
    if(gap.x > cursor){ segs.push([cursor, gap.x]); }
    cursor = gap.x + gap.w;
  }
  segs.push([cursor, L.length + 1000]);

  for(const [a,b] of segs){
    if(b < viewL || a > viewR) continue;
    const gx = Math.max(a, viewL);
    const gw = Math.min(b, viewR) - gx;
    const gg = ctx.createLinearGradient(0, groundY, 0, H);
    gg.addColorStop(0, pal.ground);
    gg.addColorStop(1, '#000');
    ctx.fillStyle = gg;
    ctx.fillRect(gx, groundY, gw, GROUND_H);
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 2;
    ctx.shadowColor = pal.accent;
    ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(gx, groundY); ctx.lineTo(gx+gw, groundY); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255,255,255,0.06)`;
    ctx.lineWidth = 1;
    for(let i=Math.floor(gx/40)*40; i<gx+gw; i+=40){
      ctx.beginPath(); ctx.moveTo(i, groundY); ctx.lineTo(i, H); ctx.stroke();
    }
  }

  const finishX = L.length;
  if(finishX > viewL && finishX < viewR){
    const fg = ctx.createLinearGradient(0,0,0,H);
    fg.addColorStop(0, pal.accent);
    fg.addColorStop(1, 'transparent');
    ctx.fillStyle = fg;
    ctx.fillRect(finishX-4, 0, 8, groundY);
    ctx.fillStyle = pal.accent;
    ctx.shadowColor = pal.accent; ctx.shadowBlur = 20;
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('FINISH', finishX-30, 40);
    ctx.shadowBlur = 0;
  }

  for(const o of L.obstacles){
    if(o.x + (o.w||o.r*2||60) < viewL || o.x - (o.r||0) > viewR) continue;
    if(o.type==='spike'){
      drawSpike(o.x, groundY - o.h, o.w, o.h, pal);
    } else if(o.type==='block'){
      drawBlock(o.x, groundY - o.h, o.w, o.h, pal);
    } else if(o.type==='platform'){
      drawPlatform(o.x, groundY - o.y, o.w, o.h, pal);
    } else if(o.type==='saw'){
      drawSaw(o.x, groundY - o.y, o.r, o.rot, pal);
    } else if(o.type==='moving'){
      drawSpike(o.x, groundY - o.y - o.h, o.w, o.h, pal, true);
    }
  }

  if(State.practice && State.checkpointX > 0){
    ctx.strokeStyle = '#39ff88';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#39ff88'; ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(State.checkpointX, groundY-100);
    ctx.lineTo(State.checkpointX, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#39ff88';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('CP', State.checkpointX-10, groundY-105);
  }

  if(State.player && State.player.alive){
    drawPlayer(State.player, pal);
  }

  for(const p of State.particles){
    ctx.fillStyle = p.color;
    ctx.globalAlpha = clamp(p.life, 0, 1);
    ctx.fillRect(p.x + State.cameraX - p.size/2, p.y - p.size/2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  ctx.restore();
  ctx.restore();
}

function drawMountains(offset, color, alpha, baseY){
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(0, H);
  const step = 80;
  const start = -((offset)%step) - step;
  for(let x=start; x<W+step; x+=step){
    const h = 60 + Math.sin((x+offset)*0.01)*40 + Math.cos((x+offset)*0.023)*30;
    ctx.lineTo(x, baseY - h);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawSpike(x,y,w,h,pal,moving=false){
  ctx.save();
  ctx.fillStyle = pal.accent;
  ctx.shadowColor = pal.accent;
  ctx.shadowBlur = moving ? 20 : 12;
  ctx.beginPath();
  ctx.moveTo(x, y+h);
  ctx.lineTo(x+w/2, y);
  ctx.lineTo(x+w, y+h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawBlock(x,y,w,h,pal){
  ctx.save();
  const g = ctx.createLinearGradient(x,y,x,y+h);
  g.addColorStop(0, pal.accent);
  g.addColorStop(1, pal.ground);
  ctx.fillStyle = g;
  ctx.shadowColor = pal.accent; ctx.shadowBlur = 15;
  ctx.fillRect(x,y,w,h);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x+1,y+1,w-2,h-2);
  ctx.restore();
}

function drawPlatform(x,y,w,h,pal){
  ctx.save();
  ctx.fillStyle = pal.accent;
  ctx.shadowColor = pal.accent; ctx.shadowBlur = 15;
  ctx.fillRect(x,y,w,h);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x,y,w,h);
  ctx.restore();
}

function drawSaw(x,y,r,rot,pal){
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(rot);
  ctx.shadowColor = pal.accent; ctx.shadowBlur = 20;
  const teeth = 10;
  ctx.fillStyle = pal.accent;
  ctx.beginPath();
  for(let i=0;i<teeth*2;i++){
    const a = (i/(teeth*2))*Math.PI*2;
    const rr = i%2===0 ? r : r*0.75;
    const px = Math.cos(a)*rr, py = Math.sin(a)*rr;
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(0,0,r*0.3,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(0,0,r*0.3,0,Math.PI*2); ctx.stroke();
  ctx.restore();
}

function drawPlayer(P, pal){
  ctx.save();
  const cx = P.x + P.size/2;
  const cy = P.y + P.size/2;
  ctx.translate(cx, cy);
  ctx.rotate(P.rot);
  ctx.shadowColor = pal.player;
  ctx.shadowBlur = 25;
  const g = ctx.createLinearGradient(-P.size/2,-P.size/2,P.size/2,P.size/2);
  g.addColorStop(0, pal.player);
  g.addColorStop(1, pal.accent);
  ctx.fillStyle = g;
  ctx.fillRect(-P.size/2, -P.size/2, P.size, P.size);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(-P.size/2+4, -P.size/2+4, P.size-8, P.size-8);
  ctx.fillStyle = '#000';
  ctx.fillRect(2, -6, 10, 10);
  ctx.fillStyle = '#fff';
  ctx.fillRect(6, -4, 4, 4);
  ctx.restore();

  if(!Storage.data.settings.reduced){
    for(let i=1;i<=4;i++){
      ctx.fillStyle = pal.player;
      ctx.globalAlpha = 0.15 * (1 - i/5);
      ctx.fillRect(P.x - i*8, P.y+4, P.size-8, P.size-8);
    }
    ctx.globalAlpha = 1;
  }
}

const victoryCanvas = $('victoryCanvas');
const vctx = victoryCanvas.getContext('2d');
let vparts = [];
function startVictoryParticles(){
  victoryCanvas.width = W*DPR; victoryCanvas.height = H*DPR;
  victoryCanvas.style.width = W+'px'; victoryCanvas.style.height = H+'px';
  vctx.setTransform(DPR,0,0,DPR,0,0);
  vparts = [];
  for(let i=0;i<120;i++){
    vparts.push({
      x:Math.random()*W, y:H+Math.random()*100,
      vx:(Math.random()-0.5)*200, vy:-300-Math.random()*400,
      life:2+Math.random()*2,
      color:['#00e7ff','#ff2bd6','#8a2bff','#39ff88','#ffe94a'][Math.floor(Math.random()*5)],
      size:3+Math.random()*4
    });
  }
}
function updateVictoryParticles(dt){
  if(vparts.length===0) return;
  vctx.clearRect(0,0,W,H);
  for(let i=vparts.length-1;i>=0;i--){
    const p = vparts[i];
    p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 200*dt;
    p.life -= dt;
    if(p.life<=0){ vparts.splice(i,1); continue; }
    vctx.fillStyle = p.color;
    vctx.globalAlpha = Math.min(1, p.life);
    vctx.fillRect(p.x, p.y, p.size, p.size);
  }
  vctx.globalAlpha = 1;
}
