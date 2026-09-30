(function(){
'use strict';
const api=()=>window.GRH_PERSISTENT_V2||window.GRHPersistentPlayerV2||null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const clean=s=>String(s??'').trim();
const same=(a,b)=>{try{return new URL(a,location.href).href===new URL(b,location.href).href}catch(e){return a===b}};
const item=el=>({contentId:clean(el.dataset.grhPlaySourceId),sourceId:clean(el.dataset.grhPlaySourceId),url:clean(el.dataset.grhPlayUrl),title:clean(el.dataset.grhPlayTitle)||clean(el.textContent),show:clean(el.dataset.grhPlayShow)||'Golden Radio Hour',artwork:clean(el.dataset.grhPlayArt),canonicalUrl:clean(el.dataset.grhPlayCanonical)});
async function getDoc(url){const r=await fetch(url,{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);return new DOMParser().parseFromString(await r.text(),'text/html')}
function yearOf(i){const direct=clean(i&&i.broadcastDate).slice(0,4);if(/^\d{4}$/.test(direct))return direct;const m=clean(i&&i.canonicalUrl).match(/-(\d{4})-\d{2}-\d{2}-/);return m?m[1]:''}
async function playPage(url){const a=api();if(!a)return;const d=await getDoc(url),el=d.querySelector('[data-grh-play-url]');if(el)a.playFromItem(item(el),{autoplay:true,origin:'companion-next',analyticsSelect:true})}
async function randomPick(year){const a=api(),cfg=window.GRH_PERSISTENT_V2_CONFIG||{};if(!a||!cfg.archiveDataUrl)return;let r=await fetch(cfg.archiveDataUrl,{cache:'force-cache'}).then(x=>x.json());r=(Array.isArray(r)?r:r.shows||[]).filter(x=>x.url&&(!year||String(x.broadcastDate||'').startsWith(year)));const cur=a.state&&a.state.item;if(cur)r=r.filter(x=>!same(x.url,cur.url));if(!r.length)return;const x=r[Math.floor(Math.random()*r.length)];a.playFromItem({url:x.url,title:x.displayTitle||x.title,show:x.showTitle||x.show,broadcastDate:x.broadcastDate||'',episodeNumber:x.episodeNumber??'',description:x.plotSynopsis||x.episodeDescription||''},{autoplay:true,origin:year?'companion-year':'companion-surprise',analyticsSelect:true})}
async function followPerson(name,url,button){const a=api();if(!a||!url)return;if(button){button.disabled=true;button.textContent='Building listening trail…'}try{const u=new URL(url,location.href);u.searchParams.delete('show');const d=await getDoc(u.href),seen=new Set(),q=[...d.querySelectorAll('[data-grh-play-url]')].map(item).filter(x=>x.url&&!seen.has(x.url)&&(seen.add(x.url),true));if(!q.length)throw new Error('No playable episodes');const cur=a.state&&a.state.item;let idx=q.findIndex(x=>cur&&x.show!==cur.show);if(idx<0)idx=q.findIndex(x=>!cur||!same(x.url,cur.url));if(idx<0)idx=0;await a.playArchive(q[idx],q,idx,{autoplay:true,autoAdvance:true,shuffle:false,origin:'follow-the-voice',analyticsSelect:true});const s=document.querySelector('#grh-trailbox .grh-trail-status');if(s)s.textContent='Following '+name+'. '+q.length+' matching broadcasts are queued.'}catch(e){const s=document.querySelector('#grh-trailbox .grh-trail-status');if(s)s.textContent='That listening trail could not be built right now.'}finally{if(button)setTimeout(()=>{button.disabled=false;button.textContent=name},900)}}
let renderToken=0,lastKey='';
async function render(state){
 if(!state||state.mode!=='archive'||!state.item||!state.item.url)return;
 const body=document.querySelector('#grh-ppv2-details-popup .grh-ppv2-popup-body');if(!body)return;
 let box=document.getElementById('grh-trailbox');if(!box){box=document.createElement('div');box.id='grh-trailbox';box.className='grh-trailbox';body.appendChild(box)}
 const key=clean(state.item.canonicalUrl)||clean(state.item.url);if(key===lastKey&&box.textContent.trim())return;lastKey=key;const token=++renderToken;box.innerHTML='<div class="grh-trails-loading">Finding connections in this broadcast…</div>';
 let canonical=clean(state.item.canonicalUrl);
 if(!canonical){try{const q='?search='+encodeURIComponent(state.item.title||'')+'&per_page=10&_fields=link,title';const rows=await fetch('/wp-json/wp/v2/grh_episode'+q).then(r=>r.json());const slug=clean(state.item.show).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');canonical=((rows.find(x=>slug&&String(x.link||'').includes('/old-time-radio-episodes/'+slug+'-'))||rows[0]||{}).link)||''}catch(e){}}
 if(token!==renderToken)return;if(!canonical){box.innerHTML='<p class="grh-trails-note">More connections will appear when this recording is linked to its episode page.</p>';return}
 try{
  const d=await getDoc(canonical);if(token!==renderToken)return;
  const nav=[...d.querySelectorAll('.grh-episode-nav-grid a')],next=nav.find(a=>/next episode/i.test(a.textContent))||null;
  const people=[...d.querySelectorAll('.grh-person-card')].map(k=>({name:clean(k.querySelector('strong')&&k.querySelector('strong').textContent),url:k.querySelector('.grh-person-episodes-link')&&k.querySelector('.grh-person-episodes-link').href})).filter(x=>x.name&&x.url).slice(0,8);
  const yr=yearOf({...state.item,canonicalUrl:canonical});
  let h='<div class="grh-trails-rule"></div><strong class="grh-trails-heading">Keep exploring this broadcast</strong><div class="grh-trails-actions">';
  if(next)h+='<button type="button" data-patch-next>Next in '+esc(state.item.show||'this program')+'</button>';
  if(yr)h+='<button type="button" data-patch-year="'+esc(yr)+'">Another from '+esc(yr)+'</button>';
  h+='<button type="button" data-patch-surprise>Take me somewhere unexpected</button></div>';
  if(people.length)h+='<strong class="grh-trails-subheading">Follow the Voice</strong><p class="grh-trails-note">Choose someone in this broadcast and keep listening to that person across the archive.</p><div class="grh-trails-people">'+people.map((p,i)=>'<button type="button" data-patch-person="'+i+'">'+esc(p.name)+'</button>').join('')+'</div>';
  h+='<div class="grh-trail-status" aria-live="polite"></div>';box.innerHTML=h;
  box.querySelector('[data-patch-next]')?.addEventListener('click',()=>playPage(next.href));
  box.querySelector('[data-patch-year]')?.addEventListener('click',e=>randomPick(e.currentTarget.dataset.patchYear));
  box.querySelector('[data-patch-surprise]')?.addEventListener('click',()=>randomPick(''));
  box.querySelectorAll('[data-patch-person]').forEach(b=>b.addEventListener('click',()=>{const p=people[Number(b.dataset.patchPerson)];followPerson(p.name,p.url,b)}));
 }catch(e){if(token===renderToken)box.innerHTML='<p class="grh-trails-note">Connections are temporarily unavailable for this recording.</p>'}
}
let t=0;function schedule(state){if(!state||state.mode!=='archive'||!state.item||!state.item.url)return;clearTimeout(t);t=setTimeout(()=>render(state),350)}
function decodeEntityText(root){if(!root)return;const ta=document.createElement('textarea');root.querySelectorAll('a').forEach(a=>{if(a.textContent.includes('&#')){ta.innerHTML=a.textContent;a.textContent=ta.value}})}
function boot(){
 document.addEventListener('grh:persistent-v2-change',e=>schedule(e.detail||{}));
 const wait=()=>{const a=api();if(!a){setTimeout(wait,250);return}schedule(a.publicState?a.publicState('companion-patch'):a.state||{})};wait();
 const results=document.querySelector('.grh-uni-results');if(results){new MutationObserver(()=>decodeEntityText(results)).observe(results,{childList:true,subtree:true})}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
