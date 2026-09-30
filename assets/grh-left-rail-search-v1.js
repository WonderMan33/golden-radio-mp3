(function(){
'use strict';
if(document.getElementById('grh-nav-search')) return;
const header=document.querySelector('.grh-global-header-inner');
const brand=document.querySelector('.grh-global-brand');
const nav=document.querySelector('.grh-main-nav');
if(!header||!brand||!nav) return;
const css=`
.grh-nav-search{position:relative;width:100%;margin:-2px 0 2px;z-index:100001}
.grh-nav-search-label{display:block;margin:0 0 6px;color:#bdb3a4;font:800 10px/1.2 Epilogue,Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase}
.grh-nav-search-wrap{position:relative}
.grh-nav-search-input{width:100%!important;min-height:42px!important;padding:9px 34px 9px 11px!important;box-sizing:border-box!important;border:1px solid rgba(167,122,46,.38)!important;border-radius:8px!important;background:#1b1b1b!important;color:#f3eadb!important;font:600 13px/1.3 Epilogue,Arial,sans-serif!important;outline:none!important}
.grh-nav-search-input::placeholder{color:#9f9689!important;opacity:1}
.grh-nav-search-input:focus{border-color:#d6b55e!important;box-shadow:0 0 0 2px rgba(214,181,94,.12)!important}
.grh-nav-search-icon{position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#d6b55e;font-size:17px;line-height:1;pointer-events:none}
.grh-nav-search-results{position:absolute;left:0;right:0;top:calc(100% + 7px);max-height:min(62vh,520px);overflow:auto;background:#f7f1e7;color:#211a15;border:1px solid #aa8963;border-radius:9px;box-shadow:0 14px 34px rgba(0,0,0,.28);padding:8px;z-index:100005}
.grh-nav-search-results[hidden]{display:none!important}
.grh-nav-search-group{padding:4px 0 7px}
.grh-nav-search-group+.grh-nav-search-group{border-top:1px solid #dbcbb7;padding-top:8px}
.grh-nav-search-group-title{display:block;padding:0 5px 4px;color:#72573c;font:900 10px/1.2 Epilogue,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}
.grh-nav-search-result{display:block;padding:7px 8px;border-radius:6px;color:#332319!important;text-decoration:none!important;font:700 12px/1.28 Epilogue,Arial,sans-serif!important;text-transform:none!important;letter-spacing:0!important}
.grh-nav-search-result:hover,.grh-nav-search-result:focus{background:#eadcc7!important;color:#21170f!important}
.grh-nav-search-all{display:block;margin-top:4px;padding:8px;border-radius:6px;background:#2a241f;color:#fffaf2!important;text-decoration:none!important;font:800 11px/1.25 Epilogue,Arial,sans-serif!important;text-align:center;text-transform:none!important;letter-spacing:0!important}
.grh-nav-search-empty,.grh-nav-search-status{padding:10px 8px;color:#655043;font:700 12px/1.35 Epilogue,Arial,sans-serif}
@media(max-width:980px){.grh-nav-search{margin:0}.grh-nav-search-results{position:fixed;left:12px;right:12px;top:86px;max-height:65vh}.grh-nav-search-label{display:none}}
`;
let style=document.getElementById('grh-nav-search-css');
if(!style){style=document.createElement('style');style.id='grh-nav-search-css';style.textContent=css;document.head.appendChild(style)}
const box=document.createElement('div');
box.id='grh-nav-search';
box.className='grh-nav-search';
box.innerHTML='<label class="grh-nav-search-label" for="grh-nav-search-input">Search</label><div class="grh-nav-search-wrap"><input id="grh-nav-search-input" class="grh-nav-search-input" type="search" autocomplete="off" spellcheck="false" placeholder="Search Golden Radio Hour" aria-label="Search Golden Radio Hour" aria-controls="grh-nav-search-results" aria-expanded="false"><span class="grh-nav-search-icon" aria-hidden="true">⌕</span></div><div id="grh-nav-search-results" class="grh-nav-search-results" hidden></div>';
brand.insertAdjacentElement('afterend',box);
const input=box.querySelector('input');
const results=box.querySelector('.grh-nav-search-results');
let timer=0,seq=0,networkCache=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function open(){results.hidden=false;input.setAttribute('aria-expanded','true')}
function close(){results.hidden=true;input.setAttribute('aria-expanded','false')}
function group(label,items){if(!items.length)return '';return '<div class="grh-nav-search-group"><span class="grh-nav-search-group-title">'+label+'</span>'+items.map(x=>'<a class="grh-nav-search-result" href="'+esc(x.link)+'">'+esc(x.title)+'</a>').join('')+'</div>'}
async function wp(type,q){const u='/wp-json/wp/v2/'+type+'?search='+encodeURIComponent(q)+'&per_page=3&_fields=link,title';const r=await fetch(u,{credentials:'same-origin'});if(!r.ok)return [];const j=await r.json();return j.map(x=>({link:x.link,title:x.title&&x.title.rendered?x.title.rendered.replace(/<[^>]+>/g,''):'Untitled'}))}
async function networks(q){
 if(!networkCache){
  const r=await fetch('/old-time-radio-networks/',{credentials:'same-origin'});if(!r.ok)return [];
  const d=new DOMParser().parseFromString(await r.text(),'text/html');
  networkCache=[...d.querySelectorAll('a[href*="/old-time-radio-networks/"]')].filter(a=>a.querySelector('strong')&&new URL(a.href,location.href).pathname!='/old-time-radio-networks/').map(a=>({link:a.href,title:a.querySelector('strong').textContent.trim()}));
 }
 const s=q.toLowerCase();return networkCache.filter(x=>x.title.toLowerCase().includes(s)).slice(0,3);
}
async function search(q){
 const n=++seq;open();results.innerHTML='<div class="grh-nav-search-status">Searching…</div>';
 try{
  const [shows,episodes,people,nets]=await Promise.all([wp('grh_show',q),wp('grh_episode',q),wp('grh_actor',q),networks(q)]);
  if(n!==seq)return;
  const html=group('Shows',shows)+group('Episodes',episodes)+group('Performers',people)+group('Networks',nets);
  results.innerHTML=html||'<div class="grh-nav-search-empty">No direct matches yet.</div>';
  results.insertAdjacentHTML('beforeend','<a class="grh-nav-search-all" href="/old-time-radio-episodes/?s='+encodeURIComponent(q)+'">Search the full archive for “'+esc(q)+'”</a>');
 }catch(e){if(n===seq)results.innerHTML='<div class="grh-nav-search-empty">Search is temporarily unavailable.</div>'}
}
input.addEventListener('input',()=>{clearTimeout(timer);const q=input.value.trim();if(q.length<2){close();results.innerHTML='';return}timer=setTimeout(()=>search(q),220)});
input.addEventListener('focus',()=>{if(input.value.trim().length>=2&&results.innerHTML)open()});
input.addEventListener('keydown',e=>{if(e.key==='Escape'){close();input.blur()}});
document.addEventListener('click',e=>{if(!box.contains(e.target))close()});
})();
