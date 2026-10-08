import * as THREE from './assets/three.module.js';
const canvas=document.getElementById('sculpture');
if(canvas){
 const stage=canvas.parentElement;
 const fallback=document.getElementById('webgl-fallback');
 const motionButton=document.getElementById('motion-toggle');
 try{
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));
  renderer.setClearColor(0x171917,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(32,1,.1,100);camera.position.set(0,0,10.8);
  const environmentScene=new THREE.Scene();environmentScene.background=new THREE.Color('#727265');
  const panelGeometry=new THREE.PlaneGeometry(8,10);
  [[-5,3,4,0xffead1,4],[5,1,1,0xe2cdb6,2],[0,6,-3,0xffffff,3]].forEach(([x,y,z,color,intensity])=>{const panel=new THREE.Mesh(panelGeometry,new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(intensity),side:THREE.DoubleSide}));panel.position.set(x,y,z);panel.lookAt(0,0,0);environmentScene.add(panel);});
  const pmrem=new THREE.PMREMGenerator(renderer);const environment=pmrem.fromScene(environmentScene,.035);scene.environment=environment.texture;pmrem.dispose();
  scene.add(new THREE.AmbientLight(0xc9bc9f,1.5));const light=new THREE.DirectionalLight(0xffdfb9,3.8);light.position.set(-3,5,5);scene.add(light);const rim=new THREE.DirectionalLight(0xfff4e4,2.6);rim.position.set(4,0,-3);scene.add(rim);const lower=new THREE.DirectionalLight(0x956b49,1.5);lower.position.set(-3,-4,3);scene.add(lower);
  const material=new THREE.MeshPhysicalMaterial({color:0xb78b69,metalness:.48,roughness:.24,clearcoat:1,clearcoatRoughness:.35,envMapIntensity:1.05});
  const geometry=new THREE.TorusKnotGeometry(1.45,.46,240,48,2,3);
  const points=geometry.attributes.position;for(let i=0;i<points.count;i++){const x=points.getX(i),y=points.getY(i),z=points.getZ(i);const variation=1+.035*Math.sin(y*2.4+x*1.7);points.setXYZ(i,x*.88*variation,y*1.08,z*.85);}geometry.computeVertexNormals();
  const group=new THREE.Group();const object=new THREE.Mesh(geometry,material);object.rotation.set(.38,.12,-.5);group.add(object);group.position.set(-.02,.05,0);scene.add(group);
  const bead=new THREE.Mesh(new THREE.SphereGeometry(.23,32,24),material);bead.position.set(2.3,1.45,-2);scene.add(bead);
  let targetX=0,targetY=0,scroll=window.scrollY,rotationX=0,rotationY=0,visible=true,manualPause=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  motionButton.setAttribute('aria-pressed',String(reduced.matches));motionButton.querySelector('.motion-label').textContent=reduced.matches?'Увімкнути рух':'Зупинити рух';motionButton.setAttribute('aria-label',reduced.matches?'Увімкнути рух 3D-об’єкта':'Зупинити рух 3D-об’єкта');
  window.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;targetY=(e.clientX/innerWidth-.5)*.3;targetX=(e.clientY/innerHeight-.5)*.18;},{passive:true});
  window.addEventListener('scroll',()=>scroll=window.scrollY,{passive:true});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:'150px'}).observe(stage);
  function resize(){const width=stage.clientWidth,height=stage.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.position.z=width/height<.8?12.1:10.8;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(stage);resize();
  let elapsed=0,lastTime=0;
  motionButton.addEventListener('click',()=>{if(reduced.matches){manualPause=!manualPause;}else{manualPause=!manualPause;}const paused=manualPause||reduced.matches;motionButton.setAttribute('aria-pressed',String(paused));motionButton.querySelector('.motion-label').textContent=paused?'Увімкнути рух':'Зупинити рух';motionButton.querySelector('span:first-child').textContent=paused?'▷':'Ⅱ';motionButton.setAttribute('aria-label',paused?'Увімкнути рух 3D-об’єкта':'Зупинити рух 3D-об’єкта');});
  reduced.addEventListener('change',()=>{motionButton.disabled=reduced.matches;motionButton.style.visibility=reduced.matches?'hidden':'visible';});if(reduced.matches)motionButton.style.visibility='hidden';
  function frame(time){requestAnimationFrame(frame);const delta=lastTime?Math.min((time-lastTime)/1000,.05):0;lastTime=time;if(!visible||document.hidden)return;if(!manualPause&&!reduced.matches){elapsed+=delta;rotationX+=(targetX-rotationX)*.045;rotationY+=(targetY-rotationY)*.045;group.rotation.set(rotationX,rotationY+elapsed*.045+scroll*.00028,Math.sin(elapsed*.21)*.035);group.position.y=.05+Math.sin(elapsed*.55)*.075;bead.position.y=1.45+Math.sin(elapsed*.45+.6)*.08;bead.position.x=2.3+rotationY*.5;}renderer.render(scene,camera);}requestAnimationFrame(frame);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();canvas.hidden=true;fallback.hidden=false;motionButton.hidden=true;});
 }catch(error){canvas.hidden=true;fallback.hidden=false;motionButton.hidden=true;console.warn('3D display unavailable; typography fallback enabled.',error.message);}
}
