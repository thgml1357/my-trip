/* 내 서류 사진: 입국심사 QR 같은 캡처 이미지를 이 폰 안(IndexedDB)에 저장해 두고 크게 보여 줍니다.
   .docslot[data-doc="키"][data-label="이름"]  저장 칸(넣기·보기·바꾸기)
   [data-doc-open="키"][data-else-pop="팝업"]   저장돼 있으면 바로 크게 보기, 없으면 팝업을 엽니다 */
(function(){
  var NS=(window.DOCS_NS||'docs')+':', db=null, cur=null, url=null;
  function open(){
    return new Promise(function(ok,no){
      if(db) return ok(db);
      if(!window.indexedDB) return no(new Error('no idb'));
      var r=indexedDB.open('trip-docs',1);
      r.onupgradeneeded=function(){r.result.createObjectStore('docs')};
      r.onsuccess=function(){db=r.result;ok(db)};
      r.onerror=function(){no(r.error)};
    });
  }
  function run(mode,fn){
    return open().then(function(d){return new Promise(function(ok,no){
      var t=d.transaction('docs',mode), req=fn(t.objectStore('docs'));
      t.oncomplete=function(){ok(req&&req.result)}; t.onerror=t.onabort=function(){no(t.error)};
    })});
  }
  function get(k){return run('readonly',function(s){return s.get(NS+k)})}
  function put(k,b){return run('readwrite',function(s){return s.put(b,NS+k)})}
  function del(k){return run('readwrite',function(s){return s.delete(NS+k)})}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

  var file=document.getElementById('docfile'), v=document.getElementById('docv');
  function fail(){alert('이 브라우저에서는 사진을 저장할 수 없어요. 캡처한 사진은 사진첩에서 열어 주세요.')}

  function refresh(){
    [].forEach.call(document.querySelectorAll('.docslot[data-doc]'),function(el){
      var k=el.dataset.doc, lab=el.dataset.label||'사진';
      get(k).then(function(b){
        if(b){
          var u=URL.createObjectURL(b);
          el.innerHTML='<img alt="" src="'+u+'"><span class="dl">'+esc(lab)+'<small>저장됨</small></span><span class="acts"><button class="act" type="button" data-doc-view="'+k+'">크게 보기</button></span>';
        }else{
          el.innerHTML='<span class="dl">'+esc(lab)+'<small>사진을 넣어 두세요</small></span><span class="acts"><button class="act" type="button" data-doc-add="'+k+'">사진 넣기</button></span>';
        }
      }).catch(function(){el.innerHTML='<span class="dl">'+esc(lab)+'<small>이 브라우저에서는 저장할 수 없어요</small></span>'});
    });
    [].forEach.call(document.querySelectorAll('[data-doc-open]'),function(el){
      var sm=el.querySelector('small'); if(!sm) return;
      get(el.dataset.docOpen).then(function(b){ sm.textContent=b?'저장된 QR을 바로 크게 보기':'신청하고 QR 사진을 넣어 두세요'; }).catch(function(){});
    });
  }
  window.docsRefresh=refresh;

  function view(k){
    get(k).then(function(b){
      if(!b) return;
      cur=k; if(url) URL.revokeObjectURL(url); url=URL.createObjectURL(b);
      var lab=document.querySelector('.docslot[data-doc="'+k+'"]'); 
      document.getElementById('doct').textContent=(lab&&lab.dataset.label)||(v.dataset.titles&&JSON.parse(v.dataset.titles)[k])||'사진';
      document.getElementById('docimg').src=url; v.classList.add('on');
    }).catch(fail);
  }
  function close(){v.classList.remove('on')}
  function pick(k){ cur=k; file.value=''; file.click(); }

  if(file) file.addEventListener('change',function(){
    var f=file.files&&file.files[0]; if(!f||!cur) return;
    var k=cur;
    put(k,f).then(function(){refresh(); view(k);}).catch(fail);
  });

  document.addEventListener('click',function(e){
    var t;
    if((t=e.target.closest('[data-doc-add]'))) return pick(t.dataset.docAdd);
    if((t=e.target.closest('[data-doc-view]'))) return view(t.dataset.docView);
    if((t=e.target.closest('[data-doc-open]'))){
      var k=t.dataset.docOpen, pp=t.dataset.elsePop;
      get(k).then(function(b){
        if(b) view(k);
        else if(pp){ var tp=document.getElementById('pop-'+pp); var pop=document.getElementById('pop'); if(tp&&pop){document.getElementById('pbody').innerHTML=tp.innerHTML; refresh(); pop.classList.add('on');} }
      }).catch(function(){ var tp=document.getElementById('pop-'+pp), pop=document.getElementById('pop'); if(tp&&pop){document.getElementById('pbody').innerHTML=tp.innerHTML; pop.classList.add('on');} });
      return;
    }
    if(e.target.closest('[data-doc-close]')) return close();
    if(e.target.closest('[data-doc-change]')) return pick(cur);
    if(e.target.closest('[data-doc-del]')){
      if(cur&&confirm('이 사진을 지울까요?')) del(cur).then(function(){close();refresh();}).catch(fail);
    }
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape') close()});
  refresh();
})();
