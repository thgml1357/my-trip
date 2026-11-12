/* 회화 엔진: 페이지에서 window.TALK(문장 데이터, 음성 언어 등)를 정의하세요. */
(function(){
  var X=window.TALK; if(!X) return;
  var D=X.D;
  var host=document.getElementById('talk-body'); if(!host) return;
  function esc(s){return s.replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  var PLAY='<svg viewBox="0 0 16 16"><path d="M3 1.5v13l11-6.5z"/></svg>';
  function phrase(f){
    if(typeof f==='string') f=f.split('|');
    return '<div class="phrase" data-zh="'+esc(f[0])+'"><button class="pm" type="button"><span class="zh">'+esc(f[0])+'</span><span class="ko">'+esc(f[3])+'</span><span class="rom">'+esc(f[1])+' · '+esc(f[2])+'</span>'+(f[4]?'<span class="nt">'+esc(f[4])+'</span>':'')+'</button><button class="play" type="button" aria-label="발음 듣기"><i>'+PLAY+'</i></button></div>';
  }
  var html='';
  D.forEach(function(g){
    html+='<section class="pgroup" id="talk-'+g[0]+'"><h3>'+g[1]+'</h3>'+(g[2]?'<p class="gd">'+esc(g[2])+'</p>':'');
    g[3].forEach(function(it){
      html+=phrase(it.split('|'));
    });
    html+='</section>';
  });
  html+='<section class="pgroup" id="talk-num"><h3>숫자 · 가격</h3><p class="gd">'+X.numIntro+'</p><div class="nums">'+
    X.N.map(function(n){return '<button type="button" data-say="'+esc(n[1].split(' · ')[0])+'"><b>'+n[1]+'</b><small>'+n[2]+'</small><em>'+n[3]+' · '+n[0]+'</em></button>'}).join('')+'</div>'+
    X.price.map(phrase).join('')+'</section>';
  host.innerHTML=html;

  /* chips */
  var chips=document.getElementById('tchips');
  var L=X.chips;
  chips.innerHTML=Object.keys(L).map(function(k){return '<a href="#talk-'+k+'">'+L[k]+'</a>'}).join('');

  /* voice */
  var voice=null, slow=false, supported='speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  var vstat=document.getElementById('vstat');
  function pick(){
    if(!supported) return;
    var vs=speechSynthesis.getVoices()||[]; voice=null;
    for(var i=0;i<X.voice.length&&!voice;i++) voice=vs.filter(function(v){return new RegExp(X.voice[i],'i').test(v.lang)})[0]||null;
    if(!vstat) return;
    if(voice){vstat.className='vstat';vstat.textContent='재생 가능 · '+voice.name+' ('+voice.lang+')';}
    else if(vs.length){vstat.className='vstat bad';vstat.textContent='이 기기에서 '+X.langName+' 음성을 못 찾았어요. 아래 "소리가 안 날 때"를 확인하세요.';}
  }
  if(supported){pick(); speechSynthesis.onvoiceschanged=pick; setTimeout(pick,800); setTimeout(pick,2500);}
  else if(vstat){vstat.className='vstat bad';vstat.textContent='이 브라우저는 음성 재생을 지원하지 않아요. 구글 번역의 스피커 버튼을 쓰세요.';}
  var playing=null;
  function speak(text,btn){
    if(!supported) return;
    try{speechSynthesis.cancel();}catch(e){}
    if(playing){playing.classList.remove('on');playing=null;}
    var u=new SpeechSynthesisUtterance(text.replace(/\s*·\s*/g,'，'));
    u.lang=X.lang; if(voice) u.voice=voice; u.rate=slow?0.6:0.9;
    if(btn){btn.classList.add('on');playing=btn; u.onend=u.onerror=function(){btn.classList.remove('on')};}
    speechSynthesis.speak(u);
  }
  [].forEach.call(document.querySelectorAll('.seg button'),function(b){
    b.addEventListener('click',function(){
      slow=b.dataset.speed==='slow';
      [].forEach.call(document.querySelectorAll('.seg button'),function(x){x.setAttribute('aria-pressed',x===b)});
    });
  });

  /* phrase search */
  var tq=document.getElementById('tq'), tempty=document.getElementById('tempty');
  function plain(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,'')}
  var rows=[].slice.call(host.querySelectorAll('.phrase')).map(function(r){var t=r.textContent.toLowerCase();return {el:r,low:t,pl:plain(t)}});
  function filt(){
    var q=tq.value.trim().toLowerCase(), terms=q?q.split(/\s+/):[], shown=0;
    rows.forEach(function(r){
      var ok=!terms.length||terms.every(function(w){return r.low.indexOf(w)>=0||r.pl.indexOf(plain(w))>=0});
      r.el.classList.toggle('hide',!ok); if(ok) shown++;
    });
    [].forEach.call(host.querySelectorAll('.pgroup'),function(g){
      var any=g.querySelector('.phrase:not(.hide)');
      g.classList.toggle('hide',!!terms.length&&!any);
      var n=g.querySelector('.nums'); if(n) n.classList.toggle('hide',!!terms.length);
    });
    document.getElementById('tchips').classList.toggle('hide',!!terms.length);
    tempty.textContent=terms.length?(shown?'문장 '+shown+'개':''+X.hint+''):'';
  }
  tq.addEventListener('input',filt);
  [].forEach.call(document.querySelectorAll('.qk button'),function(b){b.addEventListener('click',function(){tq.value=b.textContent;filt();tq.focus()})});

  /* big overlay */
  var big=document.getElementById('big'), bz=document.getElementById('bz'), bk=document.getElementById('bk'), br=document.getElementById('br'), cur='';
  function showBig(zh,ko,rom,cls,say){
    bz.textContent=zh; bz.className='bz'+(cls?' '+cls:''); bk.textContent=ko||''; br.textContent=rom||''; cur=say||zh;
    document.getElementById('bplay').style.display=supported?'':'none';
    big.classList.add('on');
  }
  window.showBig=showBig;
  document.getElementById('bplay').addEventListener('click',function(){speak(cur,null)});
  document.getElementById('bclose').addEventListener('click',function(){big.classList.remove('on');try{speechSynthesis.cancel()}catch(e){}});
  document.addEventListener('keydown',function(e){if(e.key==='Escape') big.classList.remove('on')});

  document.addEventListener('click',function(e){
    var pl=e.target.closest('.phrase .play');
    if(pl){var row=pl.closest('.phrase'); speak(row.dataset.zh,pl); return;}
    var pm=e.target.closest('.phrase .pm');
    if(pm){var r=pm.closest('.phrase'); var zh=r.dataset.zh;
      showBig(zh,r.querySelector('.ko').textContent,r.querySelector('.rom').textContent,'',zh); return;}
    var nb=e.target.closest('.nums button');
    if(nb){speak(nb.dataset.say,null); return;}
    var ad=X.addr&&e.target.closest('.big-addr');
    if(ad){var z=ad.firstChild.textContent.trim(); showBig(z,X.addr[0],X.addr[1],'addr',z);}
  });
})();
