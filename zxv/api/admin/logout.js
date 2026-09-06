const {initDb,logout}=require('../../lib');module.exports=async(req,res)=>{try{await initDb();await logout(req,res);res.json({ok:true})}catch(e){res.status(500).json({error:'Logout failed'})}};
