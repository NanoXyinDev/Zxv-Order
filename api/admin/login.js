const {initDb,ensureAdmin,sql,bcrypt,createSession,setCookie}=require("../../lib");
module.exports=async(req,res)=>{
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    await initDb(); await ensureAdmin();
    const {username,password}=req.body||{};
    if(!username||!password) return res.status(400).json({error:"Username and password required"});
    const {rows}=await sql`SELECT id,username,password_hash FROM admins WHERE username=${username} LIMIT 1`;
    if(!rows[0] || !(await bcrypt.compare(password,rows[0].password_hash))) return res.status(401).json({error:"Invalid credentials"});
    const sid=await createSession(rows[0].id);
    setCookie(res,"zxv_session",sid,60*60*12);
    res.json({ok:true,user:{username:rows[0].username}});
  }catch(e){console.error(e);res.status(500).json({error:"Login failed"});}
};