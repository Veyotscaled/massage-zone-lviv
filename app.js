'use strict';
document.documentElement.classList.add('js');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
menuToggle?.addEventListener('click', () => { const open = menuToggle.getAttribute('aria-expanded') !== 'true'; menuToggle.setAttribute('aria-expanded', String(open)); menuToggle.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню'); mobileNav.hidden = !open; });
mobileNav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { mobileNav.hidden = true; menuToggle.setAttribute('aria-expanded','false'); menuToggle.setAttribute('aria-label','Відкрити меню'); }));
document.addEventListener('keydown', e => { if(e.key==='Escape' && mobileNav && !mobileNav.hidden){ mobileNav.hidden=true;menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Відкрити меню');menuToggle.focus(); } });
document.querySelectorAll('.year').forEach(el => el.textContent = String(new Date().getFullYear()));
// Reveal whole lines so Ukrainian words remain intact and readable.
document.querySelectorAll('.hero-copy h1,.studio-copy h1,.section-heading h2,.faq-heading h2,.contact-main h2,.studio-visit h2').forEach(heading => {
  const label = [...heading.childNodes].map(node=>node.nodeName==='BR'?' ':node.textContent).join('').replace(/\s+/g, ' ').trim();
  const lines = []; let content = [];
  const appendLine = () => {
    if (!content.length) return;
    const mask = document.createElement('span'); mask.className = 'line-mask';
    const inner = document.createElement('span'); inner.className = 'line-inner';
    inner.style.setProperty('--line-delay', `${lines.length * .09}s`);
    inner.append(...content); mask.append(inner); lines.push(mask); content = [];
  };
  [...heading.childNodes].forEach(node => { if(node.nodeName === 'BR') appendLine(); else content.push(node); });
  appendLine(); heading.replaceChildren(...lines); heading.setAttribute('aria-label',label); heading.classList.add('scroll-reveal');
});
document.querySelectorAll('.faq-heading,.faq-list details,.contact-info,.studio-photo,.studio-copy>p,.studio-stat,.studio-visit-info').forEach(el=>el.classList.add('reveal'));
document.querySelectorAll('.service-grid,.process-grid').forEach(grid => {
  [...grid.children].forEach((card,index)=>card.style.setProperty('--reveal-delay',`${index*.1}s`));
});
const revealElements = [...document.querySelectorAll('.reveal,.scroll-reveal')];
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
  }, {threshold:.08,rootMargin:'0px 0px -35px 0px'});
  revealElements.forEach(el=>observer.observe(el));
} else revealElements.forEach(el=>el.classList.add('visible'));
const curtain = document.querySelector('.page-curtain');
let navigating = false;
let navigationTimer=0,entryTimer=0,entryFrame=0;
function cancelTransitionWork(){
  window.clearTimeout(navigationTimer);window.clearTimeout(entryTimer);cancelAnimationFrame(entryFrame);
  navigationTimer=entryTimer=entryFrame=0;
}
document.querySelectorAll('a[href]').forEach(link => {
  link.addEventListener('click',e => {
    if(e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button!==0 || link.target==='_blank' || reducedMotion.matches) return;
    const destination = new URL(link.href);
    if(destination.origin!==location.origin || destination.pathname===location.pathname || !destination.pathname.endsWith('.html')) return;
    e.preventDefault(); if(navigating) return; cancelTransitionWork(); navigating=true;
    try{sessionStorage.setItem('mz-page-transition',destination.pathname);}catch{}
    curtain.classList.remove('exiting'); curtain.classList.add('active');
    document.documentElement.classList.add('page-leaving');
    navigationTimer=window.setTimeout(()=>{navigationTimer=0;location.assign(destination.href);},600);
  });
});
function revealPage() {
  cancelTransitionWork();
  navigating=false; document.documentElement.classList.remove('page-leaving');
  if(document.documentElement.dataset.pageTransition==='enter'){
    entryFrame=requestAnimationFrame(()=>{entryFrame=requestAnimationFrame(()=>{
      entryFrame=0;
      curtain?.classList.add('exiting');
      delete document.documentElement.dataset.pageTransition;
      entryTimer=window.setTimeout(()=>{entryTimer=0;curtain?.classList.remove('active','exiting');},650);
    });});
  } else curtain?.classList.remove('active','exiting');
}
window.addEventListener('pageshow',revealPage);
window.addEventListener('pagehide',cancelTransitionWork);
if(document.readyState==='complete')revealPage();
const treatments = {back:{tag:'СПИНА / ШИЯ',title:'Розправити плечі',description:'Довгий день за комп’ютером часто відчувається в плечах та між лопатками. Розкажіть про свої відчуття — під час запису обговоримо масаж спини й шиї та ділянки, яким потрібна увага.'},lower:{tag:'ПОПЕРЕК / УВАГА ДО ТІЛА',title:'Почути своє тіло',description:'Якщо напруження відчувається в попереку, почнімо з розмови про ваш запит. Узгодимо, яким ділянкам приділити увагу, і підберемо відповідний формат сеансу.'},personal:{tag:'ІНДИВІДУАЛЬНИЙ СЕАНС',title:'Побути для себе',description:'Не обов’язково знати назву масажу. Розкажіть, як почуваєтеся і чого очікуєте від візиту. У Massage Zone масаж підбирають під індивідуальний запит.'}};
const dialog=document.getElementById('service-dialog');
if(dialog){ dialog.setAttribute('aria-labelledby','dialog-title');dialog.setAttribute('aria-describedby','dialog-description');document.querySelectorAll('[data-service]').forEach(button=>button.addEventListener('click',()=>{const data=treatments[button.dataset.service];document.getElementById('dialog-tag').textContent=data.tag;document.getElementById('dialog-title').textContent=data.title;document.getElementById('dialog-description').textContent=data.description;dialog.showModal();document.body.classList.add('dialog-open');}));dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>document.body.classList.remove('dialog-open'));dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}}); }
const depthLayers = [...document.querySelectorAll('[data-depth]')];
const cursor = document.querySelector('.cursor');
let mouseX = innerWidth/2, mouseY=innerHeight/2, cursorX=mouseX, cursorY=mouseY, scrollPosition=window.scrollY;
const finePointer=window.matchMedia('(hover: hover) and (pointer: fine)');
let cursorVisible=false;
window.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;mouseX=event.clientX;mouseY=event.clientY;cursorVisible=true;if(finePointer.matches&&!reducedMotion.matches)document.body.classList.add('custom-cursor');cursor?.classList.remove('hidden');}, {passive:true});
document.addEventListener('pointerover',event=>cursor?.classList.toggle('hover',!!event.target.closest('a,button,summary,canvas')));
document.addEventListener('pointerleave',()=>cursor?.classList.add('hidden'));
window.addEventListener('blur',()=>cursor?.classList.add('hidden'));
const progressBar=document.createElement('div');progressBar.className='scroll-progress';progressBar.setAttribute('aria-hidden','true');document.body.append(progressBar);
const pauseSection=document.querySelector('.pause-section');
const heroSection=document.querySelector('.hero');
let scrollTarget=window.scrollY,scrollSmooth=scrollTarget,motionFrameId=0,motionDirty=true;
let layerMetrics=[];
function measureMotion(){
  layerMetrics=depthLayers.map(layer=>{const section=layer.closest('section');let speed=Number(layer.dataset.depth);if(layer.classList.contains('hero-copy'))speed=-.09;else if(layer.classList.contains('sculpture-stage'))speed=.19;else if(layer.id==='pause-title')speed=-.1;return{layer,speed,top:section?.offsetTop||0,height:section?.offsetHeight||0};});
  motionDirty=true;startMotion();
}
function paintScroll(){
  const documentHeight=document.documentElement.scrollHeight-innerHeight;
  progressBar.style.transform=`scaleX(${documentHeight>0?Math.min(1,Math.max(0,scrollTarget/documentHeight)):0})`;
  if(reducedMotion.matches)return;
  layerMetrics.forEach(({layer,speed,top,height})=>{
    if(scrollTarget+innerHeight<top-200||scrollTarget>top+height+200)return;
    const displacement=Math.max(-innerHeight,Math.min(innerHeight,scrollSmooth-top));
    layer.style.transform=`translate3d(0,${(displacement*speed).toFixed(2)}px,0)`;
  });
  if(heroSection){const progress=Math.min(1,Math.max(0,scrollSmooth/heroSection.offsetHeight));heroSection.style.setProperty('--hero-scroll',progress.toFixed(4));}
  if(pauseSection){
    const distance=pauseSection.offsetTop-scrollSmooth;
    if(distance<innerHeight+100&&distance>-pauseSection.offsetHeight-100){
      const open=Math.min(1,Math.max(0,(innerHeight*.9-distance)/(innerHeight*.6)));
      pauseSection.style.setProperty('--pause-inset',`${((1-open)*4).toFixed(2)}%`);
      pauseSection.style.setProperty('--pause-radius',`${((1-open)*48).toFixed(1)}px`);
    }
  }
}
function motionFrame(){
  motionFrameId=0;if(document.hidden)return;
  const difference=scrollTarget-scrollSmooth;
  if(reducedMotion.matches)scrollSmooth=scrollTarget;else scrollSmooth+=difference*.12;
  if(motionDirty||Math.abs(difference)>.1){paintScroll();motionDirty=false;}
  let cursorMoving=false;
  if(cursorVisible&&finePointer.matches&&!reducedMotion.matches&&cursor){
    cursorX+=(mouseX-cursorX)*.12;cursorY+=(mouseY-cursorY)*.12;
    const half=cursor.classList.contains('hover')?29:18;
    cursor.style.transform=`translate3d(${cursorX-half}px,${cursorY-half}px,0)`;
    cursorMoving=Math.abs(mouseX-cursorX)+Math.abs(mouseY-cursorY)>.2;
  }
  if(Math.abs(difference)>.1||cursorMoving)startMotion();
}
function startMotion(){if(!motionFrameId)motionFrameId=requestAnimationFrame(motionFrame);}
window.addEventListener('scroll',()=>{scrollTarget=window.scrollY;motionDirty=true;startMotion();},{passive:true});
window.addEventListener('pointermove',startMotion,{passive:true});
document.addEventListener('pointerover',startMotion);
window.addEventListener('resize',measureMotion,{passive:true});
window.addEventListener('pageshow',measureMotion);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){scrollTarget=window.scrollY;measureMotion();}});
reducedMotion.addEventListener('change',()=>{
  if(reducedMotion.matches){document.body.classList.remove('custom-cursor');depthLayers.forEach(layer=>layer.style.transform='');revealElements.forEach(el=>el.classList.add('visible'));if(pauseSection){pauseSection.style.setProperty('--pause-inset','0%');pauseSection.style.setProperty('--pause-radius','0px');}}
  measureMotion();
});
document.fonts?.ready.then(measureMotion);measureMotion();
