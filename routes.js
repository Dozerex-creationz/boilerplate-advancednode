const passport=require("passport");

module.exports=function(app,myDataBase){
  app.route('/').get((req, res) => {
  res.render("./pug/index",{title: 'Connected to database', message: 'Please login',showLogin:true,showRegistration:true,showSocialAuth:true})
})
app.post("/login",passport.authenticate("local",{failureRedirect:"/"}),function(req,res){
  res.redirect("/profile");
})
app.get("/profile",ensureAuthenticated,function(req,res){
  res.render("./pug/profile",{username:req.user.username});
})
app.get("/logout",(req,res)=>{
  req.logout();
  res.redirect('/');
})
app.use((req,res,next)=>{
  res.status('404').type("text").send("Not Found");
})
app.route("/register").post((req,res,next)=>{
  myDataBase.findOne({username:req.body.username},(err,user)=>{
    if(err) {console.log("not hi");next(err);}
    else if(user) res.redirect("/")
    else{
      console.log("hi")
      const hash = bcrypt.hashSync(req.body.password, 12);
      myDataBase.insertOne({username:req.body.username,password:hash},(err,doc)=>{
        if(err) res.redirect("/");
        else{
          next(null,doc.ops[0])
        }
      })
    }
  })
},passport.authenticate("local",{failureRedirect:"/"},(req,res,next)=>{
  res.redirect("/profile");
}))
app.route("/auth/github").get(passport.authenticate("github"))
app.route("/auth/github/callback").get(passport.authenticate('github',{failureRedirect:"/"},(req,res)=>{
  req.session.user_id = req.user.id
  res.redirect('/chat');
}))

app.route("/chat").get(ensureAuthenticated,(req,res)=>{
  res.resder("./pug/chat",{user:req.user})
})
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};}
