module.exports=async(req,res)=>{
  if(req.method!=="POST") return res.status(405).json({success:false,error:{message:"Method not allowed"}});
  try{
    const {number_id,provider_id,operator_id}=req.body||{};
    if(!number_id||!provider_id||!operator_id) return res.status(400).json({success:false,error:{message:"Missing order parameters"}});
    const q=new URLSearchParams({number_id:String(number_id),provider_id:String(provider_id),operator_id:String(operator_id)});
    const r=await fetch("https://www.rumahotp.io/api/v2/orders?"+q,{headers:{"x-apikey":process.env.RUMAHOTP_API_KEY,"Accept":"application/json"}});
    const data=await r.json();
    res.status(r.status).json(data);
  }catch(e){res.status(502).json({success:false,error:{message:"Upstream unavailable"}})}
};