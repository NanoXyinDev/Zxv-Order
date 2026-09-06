const {initDb,requireSession}=require("../../lib");
module.exports=async(req,res)=>{
  try{await initDb();const u=await requireSession(req,res);if(!u)return res.status(401).json({authenticated:false});res.json({authenticated:true,user:{username:u.username}});}
  catch(e){res.status(500).json({error:"Session check failed"});}
};