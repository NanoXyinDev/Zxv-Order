module.exports=async(req,res)=>{
  try{
    const id=String(req.query.order_id||"");
    if(!id) return res.status(400).json({success:false,error:{message:"order_id required"}});
    const r=await fetch("https://www.rumahotp.io/api/v1/orders/get_status?order_id="+encodeURIComponent(id),{headers:{"x-apikey":process.env.RUMAHOTP_API_KEY,"Accept":"application/json"}});
    const data=await r.json(); res.status(r.status).json(data);
  }catch(e){res.status(502).json({success:false,error:{message:"Upstream unavailable"}})}
};