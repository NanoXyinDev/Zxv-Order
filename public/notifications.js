(function(){
  const KEY='zxv_otp_notifications';
  const CANCEL_AFTER=180000;
  const state={orders:new Map(),timer:null,uiTimer:null};

  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
  function save(x){try{localStorage.setItem(KEY,JSON.stringify(x))}catch{}}
  function text(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  function flag(iso,country){
    const code=String(iso||'').trim().toUpperCase();
    if(/^[A-Z]{2}$/.test(code)) return String.fromCodePoint(...[...code].map(c=>127397+c.charCodeAt()));
    const map={'indonesia':'🇮🇩','malaysia':'🇲🇾','singapore':'🇸🇬','thailand':'🇹🇭','vietnam':'🇻🇳','philippines':'🇵🇭','india':'🇮🇳','united states':'🇺🇸','united kingdom':'🇬🇧','japan':'🇯🇵','south korea':'🇰🇷','china':'🇨🇳'};
    return map[String(country||'').toLowerCase()]||'🌐';
  }

  function findOtp(data){
    const candidates=[data?.data,data?.order,data?.result,data];
    for(const x of candidates){
      if(!x||typeof x!=='object') continue;
      for(const k of ['otp','code','verification_code','sms_code','otp_code']) if(x[k] && /\d{3,8}/.test(String(x[k]))) return String(x[k]);
      for(const k of ['message','sms','sms_text','text','otp_msg']) if(typeof x[k]==='string'){const m=x[k].match(/\b\d{3,8}\b/);if(m)return m[0]}
    }
    return null;
  }

  function statusOf(data){return String(data?.data?.status||data?.status||'').toLowerCase()}
  function isDone(data){return !!findOtp(data)}
  function isCanceled(data){return ['canceled','cancelled','cancel','expired','expiring'].includes(statusOf(data))}

  async function requestPermission(){
    if(!('Notification' in window)) return {ok:false,message:'Browser ini tidak mendukung notifikasi.'};
    if(Notification.permission==='granted') return {ok:true};
    if(Notification.permission==='denied') return {ok:false,message:'Notifikasi diblokir browser. Aktifkan dari pengaturan situs.'};
    const p=await Notification.requestPermission();
    return {ok:p==='granted',message:p==='granted'?'Notifikasi aktif.':'Izin notifikasi ditolak.'};
  }

  function ensureUI(){
    let wrap=document.getElementById('otpOrders');
    if(!wrap){
      const notice=document.getElementById('otpNotice');
      wrap=document.createElement('div');wrap.id='otpOrders';wrap.className='otp-orders';
      notice?.parentNode?.insertBefore(wrap,notice);
    }
    return wrap;
  }

  function render(meta){
    const wrap=ensureUI();
    let card=document.getElementById('otp-order-'+CSS.escape(meta.id));
    if(!card){
      card=document.createElement('article');card.className='otp-order';card.id='otp-order-'+meta.id;
      wrap.prepend(card);
    }
    const age=Math.max(0,Date.now()-(meta.createdAt||Date.now()));
    const remaining=Math.max(0,CANCEL_AFTER-age);
    const mins=Math.floor(remaining/60000), secs=Math.floor((remaining%60000)/1000);
    const canCancel=remaining<=0 && !meta.done && !meta.canceled;
    const country=`${flag(meta.iso,meta.country)} ${text(meta.country||'Negara')}`;
    card.innerHTML=`<div class="otp-order-head"><div><span class="eyebrow">ORDER OTP</span><h3>${text(meta.id)}</h3></div><span class="otp-country">${country}</span></div>
      <div class="otp-order-body"><span>${meta.done?'✓ OTP diterima':meta.canceled?'× Dibatalkan':'Menunggu OTP'}</span>
      <span>${meta.done?'Kode tersedia di halaman':canCancel?'Sudah lebih dari 3 menit — dapat dibatalkan':`Tombol cancel tersedia dalam ${mins}:${String(secs).padStart(2,'0')}`}</span></div>
      <div class="otp-order-actions">${canCancel?`<button class="smallbtn danger" data-cancel="${text(meta.id)}">Batalkan order</button>`:'<span class="cancel-lock">Cancel terkunci sampai 3 menit</span>'}</div>`;
    card.querySelector('[data-cancel]')?.addEventListener('click',()=>cancelOrder(meta.id));
  }

  async function cancelOrder(id){
    const meta=state.orders.get(String(id)); if(!meta||meta.done||meta.canceled)return;
    const age=Date.now()-(meta.createdAt||Date.now());
    if(age<CANCEL_AFTER)return;
    const btn=document.querySelector(`[data-cancel="${CSS.escape(String(id))}"]`);
    if(btn){btn.disabled=true;btn.textContent='Membatalkan…'}
    try{
      const r=await fetch('/api/otp/cancel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({order_id:id}),credentials:'same-origin'});
      const data=await r.json();
      if(!r.ok||data?.success===false)throw new Error(data?.error?.message||'Gagal membatalkan order');
      meta.canceled=true;meta.done=true;state.orders.set(String(id),meta);
      const all=load();all[id]=meta;save(all);render(meta);
      const box=document.getElementById('otpNotice');if(box){box.hidden=false;box.innerHTML='<strong>Order dibatalkan</strong><span>Order OTP telah dibatalkan.</span>'}
    }catch(e){
      if(btn){btn.disabled=false;btn.textContent='Batalkan order'}
      const box=document.getElementById('otpNotice');if(box){box.hidden=false;box.innerHTML=`<strong>Gagal membatalkan</strong><span>${text(e.message)}</span>`}
    }
  }

  function notify(orderId){
    const title='OTP masuk — ZxvCode';
    const body=`OTP baru masuk untuk order ${orderId}. Buka halaman untuk melihat kode.`;
    if('Notification' in window && Notification.permission==='granted'){
      try{new Notification(title,{body,tag:`zxv-otp-${orderId}`,renotify:true})}catch{}
    }
    const box=document.getElementById('otpNotice');
    if(box){box.hidden=false;box.innerHTML=`<strong>OTP masuk</strong><span>${text(body)}</span>`}
  }

  async function poll(orderId){
    const meta=state.orders.get(orderId);if(!meta||meta.done||meta.canceled)return;
    try{
      const r=await fetch('/api/otp/status?order_id='+encodeURIComponent(orderId),{credentials:'same-origin',cache:'no-store'});
      if(!r.ok)return;
      const data=await r.json();
      meta.country=meta.country||data?.data?.country||'';
      meta.iso=meta.iso||data?.data?.iso_code||data?.data?.country_code||'';
      if(isDone(data)){
        const otp=findOtp(data);
        meta.done=true;meta.otp=otp;state.orders.set(orderId,meta);
        const all=load();all[orderId]=meta;save(all);render(meta);notify(orderId);
      }else if(isCanceled(data)){
        meta.canceled=true;meta.done=true;state.orders.set(orderId,meta);save(Object.assign(load(),{[orderId]:meta}));render(meta);
      }else render(meta);
    }catch{}
  }

  function start(orderId,meta){
    if(!orderId)return;
    const id=String(orderId);
    const old=state.orders.get(id)||{};
    state.orders.set(id,Object.assign({},old,meta||{id}, {id}));
    render(state.orders.get(id));poll(id);
    if(!state.timer)state.timer=setInterval(()=>state.orders.forEach((_,oid)=>poll(oid)),7000);
    if(!state.uiTimer)state.uiTimer=setInterval(()=>state.orders.forEach(m=>{if(!m.done&&!m.canceled)render(m)}),1000);
  }

  function button(){return document.getElementById('enableOtpNotifications')}
  async function setup(){
    const b=button();if(!b)return;
    if(!('Notification' in window)){b.disabled=true;b.textContent='Notifikasi tidak didukung';return}
    const update=()=>{b.textContent=Notification.permission==='granted'?'✓ Notifikasi aktif':'Aktifkan notifikasi OTP'};update();
    b.addEventListener('click',async()=>{const r=await requestPermission();update();const s=document.getElementById('notificationState');if(s)s.textContent=r.ok?'Notifikasi OTP aktif.':r.message||'Izin belum aktif.'});
  }

  function restore(){const all=load();Object.values(all).forEach(m=>{if(m&&!m.done&&!m.canceled&&m.id)start(m.id,m)})}
  window.ZxvOtpNotifications={requestPermission,start,restore};
  document.addEventListener('DOMContentLoaded',()=>{setup();restore()});
})();
