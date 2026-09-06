const {sql,initDb,requireSession}=require("../../lib");
module.exports=async(req,res)=>{
 try{await initDb();if(!await requireSession(req,res))return res.status(401).json({error:"Unauthorized"});
 const {rows}=await sql`SELECT id,ip,username,ssh_port,price,status,created_at FROM vps_stock ORDER BY id DESC`;
 res.json({ok:true,data:rows});}catch(e){res.status(500).json({error:"Database error"});}
};