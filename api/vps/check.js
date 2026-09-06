const {sql,initDb,requireSession,enc}=require("../../lib");
const {Client}=require("ssh2");
function sshCheck(host,port,username,password){
 return new Promise(resolve=>{
  const c=new Client();let done=false;
  const finish=x=>{if(done)return;done=true;try{c.end()}catch{}resolve(x)};
  c.on("ready",()=>finish({ok:true}))
   .on("error",e=>finish({ok:false,error:"SSH authentication or connection failed"}));
  try{c.connect({host,port,username,password,readyTimeout:10000})}
  catch(e){finish({ok:false,error:"SSH connection failed"})}
  setTimeout(()=>finish({ok:false,error:"SSH connection timeout"}),12000);
 });
}
module.exports=async(req,res)=>{
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 try{
  await initDb();if(!await requireSession(req,res))return res.status(401).json({error:"Unauthorized"});
  const {ip,username,port,password,price}=req.body||{};const p=Number(port||22),pr=Number(price||0);
  if(!ip||!username||!password||!Number.isInteger(p)||p<1||p>65535||!Number.isFinite(pr)||pr<0)return res.status(400).json({error:"Invalid fields"});
  const result=await sshCheck(ip,p,username,password);if(!result.ok)return res.status(400).json(result);
  const {rows}=await sql`INSERT INTO vps_stock(ip,username,ssh_port,password_cipher,price) VALUES(${ip},${username},${p},${enc(password)},${pr}) RETURNING id,ip,username,ssh_port,price,status,created_at`;
  res.json({ok:true,message:"SSH login valid; VPS added to stock",data:rows[0]});
 }catch(e){console.error(e);res.status(500).json({error:"SSH check failed"});}
};