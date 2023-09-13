const express = require("express");
const app = express();
app.use(express.static("public"));
app.set("view-engine","ejs");
const bodyParser = require("body-parser")
const parser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))


app.get("/",(req,res)=>{
res.render("index.ejs");
})

app.get("/teamlogin",(req,res)=>{
    res.render("teamlogin.ejs");
})
app.get("/evaluate",(req,res)=>{
    res.render("peerevaluation.ejs");
    })

app.get("/peerlist",(req,res)=>{
        res.render("peerevaluationlist.ejs");
        })

app.listen(3000, function () {
    console.log('Server started at port 3000');
   })