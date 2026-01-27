const verifyAccessToken = (req,res,next)=>{
    if(!req.cookies.token){
        return res.status(403).json({error:"Access denied"})
    }
    next();
}
