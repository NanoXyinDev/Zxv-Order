module.exports=async(req,res)=>{
  try{
    const r=await fetch("https://www.rumahotp.io/api/v2/services",{headers:{"x-apikey":process.env.RUMAHOTP_API_KEY,"Accept":"application/json"}});
    const data=await r.json();
    res.status(r.status).json(data);
  }catch(e){res.status(502).json({success:false,error:{message:"Upstream unavailable"}})}
};