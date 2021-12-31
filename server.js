'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const passport=require("passport");
const session=require("express-session");
const ObjectID=require("mongodb").ObjectID;
const LocalStrategy=require('passport-local');

const app = express();
fccTesting(app); //For FCC testing purposes
app.set('view engine','pug')
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:true,
    saveUninitialized:true,
    cookie:{secure:false}
}));
app.use(passport.initialize());
app.use(passport.session());
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

myDB(async (client)=>{
  const myDataBase=await client.db('database').collection('users');
app.route('/').get((req, res) => {
  res.render("./pug/index",{title: 'Connected to database', message: 'Please login',showLogin:true,showRegistration:true})
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
      myDataBase.insertOne({username:req.body.username,password:req.body.password},(err,doc)=>{
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
passport.serializeUser((user,done)=>{
  done(null,user._id);
});
passport.deserializeUser((id,done)=>{
  myDataBase.findOne({_id:new ObjectID(id)},(err,doc)=>{
    done(null,doc);
  })
})

passport.use(new LocalStrategy(function(username,password,done){
myDataBase.findOne({username:username},(err,user)=>{
  console.log("User "+username+" attempted a login")
  if(err)return done(null,err);
  if(!user)return done(null,false);
  if(password!=user.password)return done(null,false);
  return done(null,user);
})
}))

}).catch((e)=>{
app.route('/').get((req,res)=>{
  res.render("./pug/index",{title:e,message:"unable to login to the database"})
})
})







const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
