async function loadServices(){const s=document.getElementById("state"),box=document.getElementById("services");s.textContent="Mengambil layanan…";try{const r=await fetch("/api/otp/services",{credentials:"same-origin"}),j=await r.json();if(!r.ok)throw new Error(j.error||"Request failed");const arr=Array.isArray(j.data)?j.data:[];box.innerHTML=arr.slice(0,30).map(x=>`<article class="card"><span class="eyebrow">${esc(x.service_code||x.id||"SERVICE")}</span><h3>${esc(x.name||x.service_name||"OTP Service")}</h3><p>${esc(x.description||"Layanan OTP digital.")}</p></article>`).join("")||'<div class="empty">Belum ada layanan.</div>';s.textContent=`${arr.length} layanan tersedia`;}catch(e){s.textContent="Gagal memuat layanan";box.innerHTML='<div class="empty">Layanan sementara tidak dapat dimuat.</div>'}}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
(function(){
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const response=await nativeFetch(input,init);
    try{
      const url=typeof input==='string'?input:(input&&input.url)||'';
      if(url.includes('/api/otp/order') && response.ok){
        const clone=response.clone(); const data=await clone.json();
        const order=data?.order_id||data?.data?.order_id||data?.data?.id||data?.order?.id;
        if(order){
          const id=String(order);
          const meta={
            id,
            country:data?.data?.country||data?.country||'',
            iso:data?.data?.iso_code||data?.data?.country_code||data?.iso_code||'',
            phone:data?.data?.phone_number||'',
            createdAt:Date.now(),
            done:false
          };
          const all=JSON.parse(localStorage.getItem('zxv_otp_notifications')||'{}');
          all[id]=meta; localStorage.setItem('zxv_otp_notifications',JSON.stringify(all));
          window.ZxvOtpNotifications?.start(id,meta);
        }
      }
    }catch{}
    return response;
  };
})();
