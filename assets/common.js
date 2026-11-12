/* 공통 스크립트: 대만·일본 가이드가 함께 씁니다. 페이지에서 window.TRIP 설정을 먼저 정의하세요.
   TRIP = {tabKey, chkKey, tabNames, searchChips, accOpen, accSkip, planHomeOpen, plan, kw, onTab?, after?} */
(function(){
var T=window.TRIP;

/* ---------- tabs ---------- */
(function(){
  var btns=[].slice.call(document.querySelectorAll('nav.tabs button'));
  function show(k){
    if(!document.getElementById('tab-'+k)) k='home';
    btns.forEach(function(b){b.setAttribute('aria-selected',b.dataset.tab===k)});
    [].forEach.call(document.querySelectorAll('.pane'),function(p){p.classList.toggle('on',p.id==='tab-'+k)});
    try{localStorage.setItem(T.tabKey,k)}catch(e){}
    if(T.onTab) T.onTab(k);
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest('[data-go]'); if(!a) return;
    e.preventDefault();
    var b=document.querySelector('nav.tabs button[data-tab="'+a.dataset.go+'"]'); b&&b.click();
    var t=a.getAttribute('href'); var el=t&&t.length>1&&document.getElementById(t.slice(1));
    if(el) setTimeout(function(){openAnc(el);el.scrollIntoView()},60);
  });
  btns.forEach(function(b){b.addEventListener('click',function(){
    if(history.replaceState) history.replaceState(null,'','#'+b.dataset.tab); show(b.dataset.tab); window.scrollTo(0,0);
  })});
  var h=(location.hash||'').slice(1), saved=null; try{saved=localStorage.getItem(T.tabKey)}catch(e){}
  var el=h&&document.getElementById(h); var p=el&&el.closest&&el.closest('.pane');
  show(p?p.id.replace('tab-',''):(h&&document.getElementById('tab-'+h)?h:(saved||'home')));
  if(p&&el.tagName==='SECTION') setTimeout(function(){openAnc(el);el.scrollIntoView()},0);
})();

/* ---------- 일정: 요약의 접이식 목록(#plan-body)과 일정 탭(#plan-body2) ---------- */
(function(){
  function e(s){return s.replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
  function render(h,open){
    if(!h) return;
    h.innerHTML=T.plan.map(function(d){
      return '<details class="daydet"'+(open?' open':'')+'><summary><span><b>'+e(d[0])+'</b><small>'+d[1].filter(function(r){return r[3]!=='m'}).length+'개 일정</small></span></summary><div class="sched">'+d[1].map(function(i){
        return '<div class="r'+(i[3]==='k'?' key':i[3]==='w'?' warn':i[3]==='m'?' mv':'')+'"><span class="tm">'+e(i[0])+'</span><span class="tx">'+e(i[1])+(i[2]?'<small>'+e(i[2])+'</small>':'')+'</span></div>';
      }).join('')+'</div></details>';
    }).join('');
  }
  render(document.getElementById('plan-body'),T.planHomeOpen);
  render(document.getElementById('plan-body2'),true);
  var src=document.querySelector('#plan>.grid'), dst=document.getElementById('plan-notes2');
  if(src&&dst) dst.innerHTML=src.innerHTML;
})();

/* ---------- checklist memory ---------- */
(function(){
  var s={}; try{s=JSON.parse(localStorage.getItem(T.chkKey)||'{}')}catch(e){}
  [].forEach.call(document.querySelectorAll('.check input'),function(b,i){
    if(i in s) b.checked=s[i];
    b.addEventListener('change',function(){s[i]=b.checked; try{localStorage.setItem(T.chkKey,JSON.stringify(s))}catch(e){}});
  });
})();

(function(){
  [].forEach.call(document.querySelectorAll('table'),function(t){
    var r=t.querySelector('tr'); if(r&&r.querySelectorAll('th').length>=3) t.classList.add('stk');
  });
  [].forEach.call(document.querySelectorAll('.pinfo dd.mono, #sos td.mono'),function(el){
    var tx=el.textContent.trim(); if(!/^\+?[\d][\d\s-]{2,}$/.test(tx)) return;
    el.innerHTML='<a href="tel:'+tx.replace(/[\s-]/g,'')+'">'+el.innerHTML+'</a>';
  });
})();


/* ---------- 지도 검색어 (구글지도에서 눌러서 검색) ---------- */
(function(){
  var h=document.getElementById('kw-body'); if(!h||!T.kw) return;
  function e(s){return s.replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  h.innerHTML='<p class="more" style="margin-top:0">누르면 구글지도에서 근처 결과를 보여줍니다. (인터넷 필요)</p>'+
    T.kw.map(function(g){
      return '<h3>'+e(g[0])+'</h3><div class="kws">'+g[1].map(function(i){
        return '<a class="kw" target="_blank" rel="noopener" href="https://www.google.com/maps/search/'+encodeURIComponent(i[0])+'"><b>'+e(i[0])+'</b><span>'+e(i[1])+'</span></a>';
      }).join('')+'</div>';
    }).join('');
})();

/* ---------- search ---------- */
(function(){
  var SEL='h2,h3,p,li,td,dd,dt,.pzh,.pko,.memo,.pdesc,.ptip,.big-addr,.timeline .t,.sched .r,.note,.phrase,.kw';
  var TAB=T.tabNames;
  var sov=document.getElementById('sov'), sq=document.getElementById('sq'), sres=document.getElementById('sres');
  var idx=null;
  function build(){
    idx=[];
    [].forEach.call(document.querySelectorAll('.pane'),function(p){
      var tab=p.id.replace('tab-','');
      [].forEach.call(p.querySelectorAll(SEL),function(el){
        if(el.closest('svg')) return;
        if(el.querySelector(SEL)) return;
        var t=el.textContent.replace(/\s+/g,' ').trim(); if(t.length<2) return;
        var sec=el.closest('section'); var h=sec&&sec.querySelector('h2,h3');
        var card=el.closest('article.place'); var cname=card&&card.querySelector('.pzh');
        idx.push({el:el,tab:tab,t:t,low:t.toLowerCase(),where:TAB[tab]+' › '+(h?h.textContent.trim():'')+(cname?' › '+cname.textContent.replace(/^\d+/,'').trim():'')});
      });
    });
  }
  function esc(x){return x.replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
  function snip(t,q){var i=t.toLowerCase().indexOf(q); var a=Math.max(0,i-30), b=Math.min(t.length,i+q.length+50);
    var pre=(a>0?'…':'')+esc(t.slice(a,i)), mid=esc(t.slice(i,i+q.length)), post=esc(t.slice(i+q.length,b))+(b<t.length?'…':'');
    return pre+'<mark class="hl">'+mid+'</mark>'+post;}
  function search(){
    if(!idx) build();
    var q=sq.value.trim().toLowerCase(); sres.innerHTML='';
    if(!q) return;
    var terms=q.split(/\s+/);
    var hits=idx.filter(function(r){return terms.every(function(w){return r.low.indexOf(w)>=0})});
    var c=document.createElement('div'); c.className='scount'; c.textContent=hits.length?('결과 '+hits.length+'개'+(hits.length>40?' (40개까지 표시)':'')):'결과가 없습니다. 다른 단어로 찾아보세요.'; sres.appendChild(c);
    hits.slice(0,40).forEach(function(r){
      var b=document.createElement('button'); b.className='sitem';
      b.innerHTML='<div class="where">'+esc(r.where)+'</div><div class="snip">'+snip(r.t,terms[0])+'</div>';
      b.addEventListener('click',function(){go(r,terms[0])}); sres.appendChild(b);
    });
  }
  function clearMarks(){[].forEach.call(document.querySelectorAll('.pane mark.hl'),function(m){var p=m.parentNode; p.replaceChild(document.createTextNode(m.textContent),m); p.normalize();});}
  function markIn(el,q){
    var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null), n, list=[];
    while(n=w.nextNode()) list.push(n);
    list.forEach(function(n){var i=n.nodeValue.toLowerCase().indexOf(q); if(i<0) return;
      var r=n.splitText(i); r.splitText(q.length); var m=document.createElement('mark'); m.className='hl'; m.textContent=r.nodeValue; r.parentNode.replaceChild(m,r);});
  }
  function go(r,q){
    close(); clearMarks();
    var btn=document.querySelector('nav.tabs button[data-tab="'+r.tab+'"]'); if(btn) btn.click();
    setTimeout(function(){
      window.openAnc&&openAnc(r.el); markIn(r.el,q); idx=null;
      var y=r.el.getBoundingClientRect().top+window.pageYOffset-150; window.scrollTo(0,y);
      r.el.classList.remove('flash'); void r.el.offsetWidth; r.el.classList.add('flash');
    },80);
  }
  function open(){sov.classList.add('on'); setTimeout(function(){sq.focus(); sq.select();},30);}
  function close(){sov.classList.remove('on');}
  document.getElementById('sbtn').addEventListener('click',open);
  document.getElementById('sclose').addEventListener('click',close);
  sov.addEventListener('click',function(e){if(e.target===sov) close();});
  document.addEventListener('keydown',function(e){
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='f'){e.preventDefault();open();}
    if(e.key==='Escape') close();
  });
  var t; sq.addEventListener('input',function(){clearTimeout(t); t=setTimeout(search,150);});
  (T.searchChips||[]).forEach(function(k){
    var b=document.createElement('button'); b.textContent=k; b.addEventListener('click',function(){sq.value=k; search();}); document.getElementById('schips').appendChild(b);
  });
})();


/* ---------- 접기/펼치기 (스크롤 줄이기) ---------- */
window.openAnc=function(el){
  for(var n=el;n&&n!==document.body;n=n.parentElement){ if(n.tagName==='DETAILS') n.open=true; }
  if(el.tagName==='SECTION'){ var ad=el.querySelector(':scope>details.acc'); if(ad) ad.open=true; }
  var pl=el.closest&&el.closest('article.place'); if(pl){var m=pl.querySelector('details.pmore'); if(m) m.open=true;}
};
(function(){
  /* 장소 카드: 줄 전체를 누르면 펼쳐짐. 지도는 아이콘만 */
  var PIN='<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  [].forEach.call(document.querySelectorAll('article.place'),function(a){
    var top=a.querySelector('.ptop'), memo=a.querySelector('.memo'), map=a.querySelector('.pmap');
    if(memo){ memo.innerHTML=memo.innerHTML.replace(/^\s*우리 메모:\s*/,'메모 · '); var pko=a.querySelector('.pko'); if(pko) pko.parentNode.appendChild(memo); }
    var rest=[].filter.call(a.children,function(c){return c!==top});
    var d=null;
    if(rest.length){ d=document.createElement('details'); d.className='pmore'; d.appendChild(document.createElement('summary')); rest.forEach(function(c){d.appendChild(c)}); a.appendChild(d); }
    var rt=document.createElement('div'); rt.className='rt';
    if(map){ map.innerHTML=PIN; map.setAttribute('aria-label','구글지도에서 열기'); rt.appendChild(map); }
    if(d){ var cv=document.createElement('span'); cv.className='chev'; rt.appendChild(cv); }
    top.appendChild(rt);
    if(d){
      top.setAttribute('role','button'); top.tabIndex=0;
      var tg=function(ev){ if(ev.target.closest('.pmap')) return; d.open=!d.open; a.classList.toggle('open',d.open); };
      top.addEventListener('click',tg);
      top.addEventListener('keydown',function(ev){ if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();tg(ev);} });
      d.addEventListener('toggle',function(){a.classList.toggle('open',d.open)});
    }
  });
  /* 큰 섹션: 제목을 누르면 펼쳐짐 */
  [].forEach.call(document.querySelectorAll('.pane>section[id]'),function(sec){
    if(T.accSkip[sec.id]) return;
    var h=[].filter.call(sec.children,function(c){return c.tagName==='H2'})[0]; if(!h) return;
    var d=document.createElement('details'); d.className='acc'; if(T.accOpen[sec.id]) d.open=true;
    var sm=document.createElement('summary'); sm.appendChild(h);
    var body=document.createElement('div'); body.className='accbody';
    while(sec.firstChild) body.appendChild(sec.firstChild);
    d.appendChild(sm); d.appendChild(body); sec.appendChild(d);
  });
  if(T.after) T.after();
  window.addEventListener('beforeprint',function(){[].forEach.call(document.querySelectorAll('details'),function(d){d.open=true})});
})();

/* ---------- offline (installed web app) ---------- */
(function(){
  var os=document.getElementById('offstat');
  if('serviceWorker' in navigator && /^https?:/.test(location.protocol)){
    window.addEventListener('load',function(){
      navigator.serviceWorker.register('../sw.js').catch(function(){ if(os) os.textContent='오프라인 저장을 지원하지 않는 브라우저입니다.'; });
      navigator.serviceWorker.ready.then(function(){ if(os) os.textContent='✓ 오프라인 저장 완료 · 인터넷 없이도 열립니다'; });
    });
  }else if(os&&location.protocol==='file:') os.textContent='파일로 열린 상태입니다. 이 파일을 폰에 저장해 두면 오프라인에서도 열립니다.';
})();

})();
