const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || '');
module.exports=async(req,res)=>{try{await sql`SELECT 1`;res.json({ok:true,service:"zxvcode-order",database:"online"});}catch(e){res.status(503).json({ok:false,database:"offline"});}};