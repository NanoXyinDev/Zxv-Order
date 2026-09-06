module.exports=async(req,res)=>{
  if(req.method!=="POST") return res.status(405).json({success:false,error:{message:"Method not allowed"}});
  try{
    const id=String(req.body?.order_id||"").trim();
    if(!id) return res.status(400).json({success:false,error:{message:"order_id required"}});
    const r=await fetch("https://www.rumahotp.io/api/v1/orders/set_status?"+new URLSearchParams({order_id:id,status:"cancel"}),{
      headers:{"x-apikey":process.env.RUMAHOTP_API_KEY,"Accept":"application/json"}
    });
    const data=await r.json();
    res.status(r.status).json(data);
  }catch(e){res.status(502).json({success:false,error:{message:"Upstream unavailable"}})}
};
