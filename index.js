const express = require("express");
const session = require('express-session');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');

const app = express();

app.use(express.static("public"));
app.set("view-engine","ejs");
app.use(bodyParser.urlencoded({ extended: true }));

const defaultSessionSecret = 'mydefaultsecretkey';

app.use(session({
    secret: defaultSessionSecret,
    resave: false,
    saveUninitialized: true
}));

mongoose.connect('mongodb+srv://saipraneethkambhampati800:PFTyvSKltwa4wBFB@cluster0.w2azzd2.mongodb.net/SIH_2K23_EVALUATION')
.then(()=>{
    console.log("mongodb conncted")
})
.catch(()=>{
    console.log("failed to connect")
})

const TeamSchema = new mongoose.Schema(
    {
        team_name:{
        type:String,
        required:true
        },
        password:{
            type:String,
            required:true
      }
    }
)
const JurySchema = new mongoose.Schema(
    {
        edition:{
        type:String,
        required:true
        },
        password:{
            type:String,
            required:true
      }
    }
)


const PeerevaluationSchema = new mongoose.Schema(
    {
        user_id:{
            type:String,
            required:true
        },
        peerid:{
            type:String,
            required:true
        },
        result:{
            type:String,
            required:true
        },
        set:{
            type:String,
            required:true
            }
    }
)
const teams = new mongoose.model("teams",TeamSchema)
const jury = new mongoose.model("juries",JurySchema)
const peerevals = new mongoose.model("peerevals",PeerevaluationSchema)



app.get("/",(req,res)=>{
res.render("index.ejs");
})

app.get("/teamlogin",(req,res)=>{
    if(req.session.user)
    {
    res.redirect('/teamdashboard')
    }
    else{
    res.render("teamlogin.ejs");
    }
})

app.get("/jurylogin",(req,res)=>{
    if(req.session.edition)
    {
    res.redirect('/jurydashboard')
    }
    else{
    res.render("jurylogin.ejs");
    }
})

app.get("/jurydashboard",(req,res)=>{
    if(req.session.edition)
    {
    const edition = req.session.edition.edition
    res.render("jurydashboard.ejs", { edition });
    }
    else{
        res.redirect('/jurylogin');
    }
})


app.post("/jurylogin",async (req,res)=>{
    try{
    const check1 = await jury.findOne({edition:req.body.jury_name,password:req.body.jury_password})
    if (check1) {
        req.session.edition = check1;
        res.redirect('/jurydashboard');
    } else {
        console.log("jury not found");
        res.redirect("/jurylogin");
    }
    }
    catch{
        res.redirect("/jurylogin");
    }
    })

app.get("/teamdashboard",(req,res)=>{
    if(req.session.user)
    {
    const teamName = req.session.user.team_name
    res.render("teamdashboard.ejs", { teamName });
    }
    else{
        res.redirect('/teamlogin');
    }
})

app.post("/teamlogin",async (req,res)=>{
try{
const check = await teams.findOne({team_name:req.body.team_name,password:req.body.team_password})
if (check) {
    req.session.user = check;
    res.redirect('/teamdashboard');
} else {
    console.log("Team not found");
    res.redirect("/teamlogin");
}
}
catch{
    res.redirect("/teamlogin");
}
})

app.get("/logout", (req, res) => {
    // Destroy the user's session
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
        } else {
            // Redirect to the login page or any other appropriate page
            res.redirect("/teamlogin");
        }
    });
});

app.get("/jurylogout", (req, res) => {
    // Destroy the user's session
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
        } else {
            // Redirect to the login page or any other appropriate page
            res.redirect("/jurylogin");
        }
    });
});

app.get("/evaluate",(req,res)=>{
    if(req.session.user)
    {
        const itemId = req.query._id;
        res.render("peerevaluation.ejs",{itemId});
    }
    else{
        res.redirect('/teamlogin');
    }
    
    })

app.post("/evaluate1",async (req,res)=>{
    const res1 = parseInt(req.body.q1)+parseInt(req.body.q2)+parseInt(req.body.q3)+parseInt(req.body.q4)+parseInt(req.body.q5)
    try {
     const Newpeer = new peerevals ({user_id:req.session.user._id,peerid:req.body.peerid,result:String(res1),set:"1"})
     await Newpeer.save();
     res.redirect('/peerlist')
    }
    catch(error){
        console.error(error);
        res.redirect("/teamdashboard");
    }
    })

app.get("/peerlist",async (req,res)=>{ 
        if(req.session.user)
        {
            const currentUserTeamName = req.session.user.team_name
            const Id = await teams.find({team_name:currentUserTeamName},{_id:1})
            const currentUserTeamNameId = String(Id[0]['_id'])
            const teamslist = await teams.find().exec();
            const filteredTeamsList = teamslist.filter((team) => team.team_name !== currentUserTeamName);
            const alreadyEvaluated = await peerevals.find({user_id:currentUserTeamNameId},{peerid:1, _id:0})
            const alreadyEvaluatedList = []
            for(let id of alreadyEvaluated)
            {
                alreadyEvaluatedList.push(id['peerid'])
            }
            res.render("peerevaluationlist.ejs",{ filteredTeamsList, alreadyEvaluatedList });
        }
        else{
            res.redirect('/teamlogin');
        }
        })
        
app.get("/Schedule",(req,res)=>{
    if(req.session.user)
    {
        res.render("schedule.ejs", { sidebar:0 });
    }
    else if(req.session.edition){
        res.render("schedule.ejs", { sidebar:1 });
    }
    else{
    res.redirect('/teamlogin');
    }
            
   })        


app.listen(3000, function () {
    console.log('Server started at port 3000');
   })