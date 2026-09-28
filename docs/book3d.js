import * as THREE from './vendor/three.module.js';

const pages=window.storyPages;
const stage=document.getElementById('flipbook-stage');
const canvas=document.getElementById('book-canvas');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}catch(error){document.body.classList.add('book-fallback');console.warn('3D book is unavailable',error);}
if(renderer){
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(35,1,.1,100);
  const light=new THREE.DirectionalLight(0xffffff,2.1);light.position.set(-3,6,8);scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff,1.25));
  const book=new THREE.Group();book.rotation.x=-.10;book.rotation.y=-.035;scene.add(book);
  const W=3.7,H=4.45;
  const paper=new THREE.MeshStandardMaterial({color:0xfff9e9,roughness:1});
  const board=new THREE.MeshStandardMaterial({color:0x28443e,roughness:.88});
  const edge=new THREE.MeshStandardMaterial({color:0xe6d9bd,roughness:1});
  const pageGeo=new THREE.PlaneGeometry(W,H);
  const left=new THREE.Mesh(pageGeo,paper.clone()),right=new THREE.Mesh(pageGeo,paper.clone());
  left.position.set(-W/2,0,.105);right.position.set(W/2,0,.105);book.add(left,right);
  for(const x of [-W/2,W/2]){const cover=new THREE.Mesh(new THREE.BoxGeometry(W+.12,H+.14,.13),[board,board,board,board,board,board]);cover.position.set(x,-.02,-.11);book.add(cover);const block=new THREE.Mesh(new THREE.BoxGeometry(W-.06,H-.07,.13),edge);block.position.set(x,0,-.01);book.add(block)}
  const spine=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,H+.1,16),board);spine.position.set(0,0,.02);book.add(spine);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(8.5,5.2),new THREE.MeshBasicMaterial({color:0x5e5646,transparent:true,opacity:.07,depthWrite:false}));shadow.position.set(0,-.18,-.35);book.add(shadow);
  const art=new Image();art.onload=()=>{textures.clear();setSpread(visualPage)};art.src='adventure.png';
  const textures=new Map();let visualPage=0,turning=null,shake=0,burst=null,hero=null,heroMotion=null,dragStart=null;
  const themes=[{bg:'#173441',accent:'#f7d083',icon:'✦',label:'AN ADVENTURE BEGINS'},
    {bg:'#173344',accent:'#e87c5c',icon:'🔴',label:'THE NIGHT SKY'},
    {bg:'#526a56',accent:'#ffd37f',icon:'📦',label:'THE GREAT SEARCH'},
    {bg:'#596764',accent:'#ffc671',icon:'🚀',label:'THE GARAGE'},
    {bg:'#1a3644',accent:'#ffd074',icon:'🚀',label:'LIFT-OFF'},
    {bg:'#a55036',accent:'#ffd38c',icon:'🪐',label:'MARS AT LAST'},
    {bg:'#315949',accent:'#ffe09b',icon:'🐾',label:'THE END'}];
  function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
  function wrap(ctx,text,x,y,maxWidth,lineHeight,maxLines=30){const words=text.split(/\s+/);let line='',lines=0;for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);y+=lineHeight;lines++;line=word;if(lines>=maxLines)break}else line=test}if(line&&lines<maxLines)ctx.fillText(line,x,y);return y+lineHeight}
  function pageTexture(index,side){const key=index+'-'+side;if(textures.has(key))return textures.get(key);const c=document.createElement('canvas');c.width=800;c.height=970;const ctx=c.getContext('2d');const p=pages[index],t=themes[index];ctx.fillStyle='#fffaf0';ctx.fillRect(0,0,800,970);ctx.fillStyle='#eee5d3';ctx.fillRect(side==='left'?782:0,0,18,970);ctx.fillStyle='#d7c7a8';ctx.fillRect(side==='left'?774:18,0,2,970);ctx.fillStyle='#70816e';ctx.font='700 22px sans-serif';ctx.letterSpacing='3px';ctx.fillText(side==='left'?'PARKER & PINE':'JOHNNY BUILDS TO MARS',62,78);ctx.letterSpacing='0px';
    if(side==='left'){
      ctx.fillStyle='#d9ae63';ctx.font='54px Georgia';ctx.fillText('✦',62,185);
      ctx.fillStyle='#294239';ctx.font='600 65px Georgia';let end=wrap(ctx,p.title,62,270,665,77,3);
      ctx.fillStyle='#536e5b';ctx.font='700 23px sans-serif';ctx.fillText(p.kicker,62,end+5);
      ctx.fillStyle='#344b42';ctx.font='35px Georgia';wrap(ctx,p.text,62,end+87,667,53,10);
      ctx.fillStyle='#aab8a3';ctx.fillRect(62,847,625,2);ctx.fillStyle='#65816b';ctx.font='24px Georgia';ctx.fillText('A little imagination goes a long way.',62,891);
    }else{
      rounded(ctx,45,120,700,710,27);ctx.fillStyle=t.bg;ctx.fill();ctx.save();rounded(ctx,45,120,700,710,27);ctx.clip();
      if(index===0&&art.complete&&art.naturalWidth){const ar=art.naturalWidth/art.naturalHeight,w=710,h=710;ctx.drawImage(art,45+(w-h*ar)/2,120,h*ar,h);}else{
        const grad=ctx.createRadialGradient(540,340,25,400,430,480);grad.addColorStop(0,t.accent+'77');grad.addColorStop(1,t.bg);ctx.fillStyle=grad;ctx.fillRect(45,120,700,710);
        for(let i=0;i<42;i++){const sx=70+((i*173)%630),sy=145+((i*257)%630);ctx.fillStyle=i%4===0?'#fff2b8':'#ffffff87';ctx.beginPath();ctx.arc(sx,sy,i%7===0?4:2,0,Math.PI*2);ctx.fill()}
        ctx.textAlign='center';ctx.font='245px system-ui, Apple Color Emoji, Segoe UI Emoji';ctx.fillText(t.icon,400,510);ctx.textAlign='left';
      }
      ctx.restore();ctx.fillStyle='#486a5c';ctx.font='700 23px sans-serif';ctx.letterSpacing='3px';ctx.fillText(t.label,60,883);ctx.letterSpacing='0px';
    }
    ctx.fillStyle='#8c9d83';ctx.font='23px Georgia';ctx.textAlign=side==='left'?'left':'right';ctx.fillText(String(index+1).padStart(2,'0'),side==='left'?62:735,932);ctx.textAlign='left';
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);textures.set(key,tex);return tex}
  function setSpread(index){left.material.map=pageTexture(index,'left');left.material.needsUpdate=true;right.material.map=pageTexture(index,'right');right.material.needsUpdate=true;visualPage=index;setHero(index)}
  const mat=(color)=>new THREE.MeshStandardMaterial({color,roughness:.58,metalness:.08});
  function rocket(){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,.8,16),mat(0xf5e5c6));g.add(body);const nose=new THREE.Mesh(new THREE.ConeGeometry(.19,.33,16),mat(0xc95842));nose.position.y=.55;g.add(nose);const window=new THREE.Mesh(new THREE.SphereGeometry(.125,16,12),mat(0x79b1b1));window.position.set(0,.15,.185);g.add(window);for(const dx of [-1,1]){const fin=new THREE.Mesh(new THREE.BoxGeometry(.08,.35,.18),mat(0xc95842));fin.position.set(dx*.22,-.28,0);fin.rotation.z=dx*.38;g.add(fin)}const flame=new THREE.Mesh(new THREE.ConeGeometry(.12,.35,10),new THREE.MeshBasicMaterial({color:0xffd45e}));flame.position.y=-.57;flame.rotation.z=Math.PI;g.add(flame);return g}
  function subject(index){const t=themes[index];let obj;if([0,3,4].includes(index))obj=rocket();else if([1,5].includes(index)){obj=new THREE.Mesh(new THREE.SphereGeometry(.5,24,16),mat(index===5?0xca6243:0xde634d));const ring=new THREE.Mesh(new THREE.TorusGeometry(.52,.018,8,48),mat(0xffd58a));ring.rotation.x=.5;obj.add(ring)}else if(index===2){obj=new THREE.Mesh(new THREE.BoxGeometry(.7,.7,.7),mat(0xd69a59));obj.rotation.set(.2,.3,.15)}else{obj=new THREE.Mesh(new THREE.SphereGeometry(.42,20,12),mat(0xe6c883));for(let i=0;i<3;i++){const dot=new THREE.Mesh(new THREE.SphereGeometry(.065,10,8),mat(0x916c43));dot.position.set((i-1)*.18,(i%2)*.13,.39);obj.add(dot)}}obj.position.set(1.8,-.4,.7);obj.scale.setScalar(index===4?.95:.7);book.add(obj);return obj}
  function setHero(index){if(hero){book.remove(hero);hero.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&o.material.dispose)o.material.dispose()})}hero=subject(index);heroMotion=null}
  function particles(color=0xffdd86,n=60){if(burst){scene.remove(burst.points);burst.points.geometry.dispose();burst.points.material.dispose()}const pos=new Float32Array(n*3),vel=[];for(let i=0;i<n;i++){pos[i*3]=1.7;pos[i*3+1]=-.5;pos[i*3+2]=1;vel.push(new THREE.Vector3((Math.random()-.5)*.085,(Math.random()-.32)*.085,Math.random()*.07))}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));const points=new THREE.Points(geo,new THREE.PointsMaterial({color,size:.075,transparent:true,opacity:1,depthWrite:false}));scene.add(points);burst={points,vel,life:1}}
  function effect(action,page=visualPage){if(!hero||document.getElementById('reader').hidden)return;heroMotion={start:performance.now(),action,origin:hero.position.clone()};if(['mars','foil','tape','box','nose','fins','body','bag','five','count','spark'].includes(action))particles(page===5?0xffca7d:0xffd985,action==='count'?25:55);if(action==='count'&&page===4)shake=Math.max(shake,.15);if(action==='launch'){particles(0xffd678,115);shake=reduced?0:.7;heroMotion.action='launch'}if(action==='mars'||action==='bag')shake=Math.max(shake,.16)}
  function flip(target,done){if(turning||target===visualPage)return false;if(reduced){setSpread(target);done();return true}const forward=target>visualPage;const leaf=new THREE.Group();leaf.position.z=.23;const front=new THREE.Mesh(pageGeo,new THREE.MeshStandardMaterial({map:pageTexture(visualPage,forward?'right':'left'),roughness:1,side:THREE.FrontSide}));front.position.x=forward?W/2:-W/2;leaf.add(front);const back=new THREE.Mesh(pageGeo,new THREE.MeshStandardMaterial({map:pageTexture(target,forward?'left':'right'),roughness:1,side:THREE.FrontSide}));back.position.x=front.position.x;back.rotation.y=Math.PI;leaf.add(back);leaf.rotation.y=forward?0:-Math.PI;book.add(leaf);turning={leaf,from:leaf.rotation.y,to:forward?-Math.PI:0,start:performance.now(),duration:750,target,done};effect('turn',visualPage);return true}
  function resize(){const rect=stage.getBoundingClientRect();if(!rect.width||!rect.height)return;renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;const fitH=H/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))*1.22;const fitW=(W*2.15)/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect);camera.position.z=Math.max(fitH,fitW);camera.updateProjectionMatrix()}
  const ro=new ResizeObserver(resize);ro.observe(stage);resize();setSpread(0);
  canvas.addEventListener('pointerdown',e=>{dragStart={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointerup',e=>{if(!dragStart)return;const dx=e.clientX-dragStart.x,dy=e.clientY-dragStart.y;dragStart=null;if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.2)return;const target=visualPage+(dx<0?1:-1);if(target>=0&&target<pages.length)window.turnStoryPage?.(target)});
  canvas.addEventListener('pointercancel',()=>dragStart=null);
  let last=performance.now();function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/16.67,3);last=now;if(document.getElementById('reader').hidden)return;if(turning){const t=Math.min(1,(now-turning.start)/turning.duration),ease=t*t*(3-2*t);turning.leaf.rotation.y=turning.from+(turning.to-turning.from)*ease;turning.leaf.position.z=.23+Math.sin(t*Math.PI)*.48;if(t>=1){book.remove(turning.leaf);turning.leaf.traverse(o=>{if(o.geometry===pageGeo)return;if(o.material?.dispose)o.material.dispose()});const done=turning.done,target=turning.target;turning=null;setSpread(target);done()}}
    if(hero){hero.rotation.y+=.005*dt;hero.position.y=-.4+Math.sin(now*.0017)*.09;if(heroMotion){const t=(now-heroMotion.start)/800;if(t<1){hero.position.z=.7+Math.sin(t*Math.PI)*2.2;hero.position.y=-.4+t*(heroMotion.action==='launch'?3:1.5);hero.rotation.z=heroMotion.action==='launch'?-.35*t:Math.sin(t*12)*.12}else{hero.position.set(1.8,-.4,.7);heroMotion=null}}}
    if(burst){const p=burst.points.geometry.attributes.position;for(let i=0;i<burst.vel.length;i++){p.array[i*3]+=burst.vel[i].x*dt;p.array[i*3+1]+=burst.vel[i].y*dt;p.array[i*3+2]+=burst.vel[i].z*dt;burst.vel[i].y-=.001*dt}p.needsUpdate=true;burst.life-=.018*dt;burst.points.material.opacity=Math.max(0,burst.life);if(burst.life<=0){scene.remove(burst.points);burst.points.geometry.dispose();burst.points.material.dispose();burst=null}}
    shake*=Math.pow(.82,dt);camera.position.x=(Math.random()-.5)*shake;camera.position.y=.12+(Math.random()-.5)*shake;camera.lookAt(0,0,0);renderer.render(scene,camera)}requestAnimationFrame(animate);
  window.book3d={flip,fx:effect,show:setSpread,resize};
}
