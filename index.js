const express = require("express");
const session = require('express-session');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');

const app = express();

app.use(express.static(__dirname + '/public'));

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

const startSchema = new mongoose.Schema({
   set:{
    type:Number,
    required:true
   },
   starttime:{
    type:Date,
    required:true
   },
   endtime:{
    type:Date,
    required:true
   }
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
      },
      edition:{
        type:String,
        required:true
  }
    }
)

const juryEvalschema = new mongoose.Schema(
    {
        teamid:{
            type:String,
            required:true
        },
        result:{
            type:Number,
            required:true
        },
        tasksr1:{
            type:Array,
            required:true
        },
        tasksr2:{
            type:Array,
            required:true
        },
        tasksr3:{
            type:Array,
            required:true
        }, 
        feedback1:{
            type:String,
            required:true
        },
        feedback2:{
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


const roundSchema = new mongoose.Schema(
    {
        RoundNumber:{
            type:String,
            required:true
        },
        set:{
            type:Number
            ,
            required:true
            },
        start:{
            type:String,
            required:true
            },
        end:{
            type:String,
            required:true
            }
    }
)
const teams = new mongoose.model("teams",TeamSchema)
const jury = new mongoose.model("juries",JurySchema)
const peerevals = new mongoose.model("peerevals",PeerevaluationSchema)
const rounds = new mongoose.model("rounds", roundSchema)
const juryevals = new mongoose.model("juryevals", juryEvalschema)
const starts = new mongoose.model("starts",startSchema)

app.get("/",async (req,res)=>{
const starti = await starts.find({},{set:1}).exec()
res.render("index.ejs",{starti});
})

// Route to store the timestamp in the database
app.post("/startTimer", async (req, res) => {
    try {
        // Calculate the end timestamp (current time + 24 hours)
        const currentTime = new Date();
        
        const endTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours in milliseconds
        console.log(currentTime,' ',endTime)
        // Store the end timestamp in the database (replace 'Team' with your model)
        const start = await starts.updateOne({set:0},{set:1,starttime:currentTime,endtime:endTime}).exec();

        // Send the stored timestamp back to the frontend
        res.json({ timestamp: endTime });
    } catch (error) {
        console.error("Error storing timestamp:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Route to retrieve the stored timestamp from the database
app.get("/getStoredTime", async (req, res) => {
    try {

        const start= await starts.find({},{}).exec();
        res.json({ timestamp: start[0]['endtime'] });
    } catch (error) {
        console.error("Error retrieving stored timestamp:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

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


app.get("/jurydashboard",async (req,res)=>{
    try{
    if(req.session.edition)
    {
    const edition = req.session.edition.edition
    const round = await rounds.find().exec()
    res.render("jurydashboard.ejs", { edition , round });
    }
    else{
        res.redirect('/jurylogin');
    }}
    catch(error){
        console.log(error);
        res.redirect('/jurylogin')
    }
})

app.get("/juryevaluationlist1",async (req,res)=>{
    try{
    if(req.session.edition)
    {
    const juryTeamsList = await teams.find({edition:req.session.edition.edition}).exec();
    const juryalreadyEvaluate = await juryevals.find({},{teamid:1,_id:0}).exec();
    const juryalreadyEvaluatedList=[]
    for(let id of juryalreadyEvaluate)
    {
        juryalreadyEvaluatedList.push(id['teamid'])
    }
    res.render("juryevaluationlist1.ejs", { juryTeamsList, juryalreadyEvaluatedList });
    }
    else{
        res.redirect('/jurylogin');
    }}
    catch(error){
        console.log(error);
        res.redirect('/jurylogin')
    }
})

app.get("/juryevaluate1",async (req,res)=>{
    try{
    if(req.session.edition)
    {
    const teamId = req.query._id;
    const jteam1 = await teams.find({_id:teamId})
    res.render("juryevaluate1.ejs",{teamId, jteam1 });
    }
    else{
        res.redirect('/jurylogin');
    }}
    catch(error){
        console.log(error);
        res.redirect('/jurylogin')
    }
})

app.post("/juryevaluation1",async (req,res)=>{
    try{
        const jres1 = parseInt(req.body.q1)+parseInt(req.body.q2)+parseInt(req.body.q3)+parseInt(req.body.q4)+parseInt(req.body.q5)
        const tasks = req.body.task
        const jcheck = new juryevals({teamid:req.body.teamid,result:jres1,tasksr1:tasks,tasksr2:['hii'],tasksr3:['hii'],feedback1:" ",feedback2:" "})
        await jcheck.save()
        res.redirect('/juryevaluationlist1')
    }
    catch(error){
        console.log(error);
        res.redirect('/jurydashboard')
    }
})

app.get("/juryevaluationlist2",async (req,res)=>{
    try{
    if(req.session.edition)
    {
    const juryTeamsList = await teams.find({edition:req.session.edition.edition}).exec();
    const juryalreadyEvaluate = await juryevals.find({__v:1},{teamid:1,_id:0}).exec();
    const juryalreadyEvaluatedList=[]
    for(let id of juryalreadyEvaluate)
    {
        juryalreadyEvaluatedList.push(id['teamid'])
    }
    res.render("juryevaluationlist2.ejs", { juryTeamsList, juryalreadyEvaluatedList });
    }
    else{
        res.redirect('/jurylogin');
    }}
    catch(error){
        console.log(error);
        res.redirect('/jurylogin')
    }
})

app.get("/juryevaluate2",async (req,res)=>{
    try{
    if(req.session.edition)
    {
    const teamId = req.query._id;
    const jteam2 = await teams.find({_id:teamId})
    const jdata2 = await juryevals.find({teamid:teamId})
    res.render("juryevaluate2.ejs",{ teamId,jteam2,jdata2});
    }
    else{
        res.redirect('/jurylogin');
    }}
    catch(error){
        console.log(error);
        res.redirect('/jurylogin')
    }
})

app.post("/juryevaluation2",async (req,res)=>{
    try{
        const jres2 = parseInt(req.body.q1)+parseInt(req.body.q2)+parseInt(req.body.q3)+parseInt(req.body.q4)+parseInt(req.body.q5)
        const tasks2 = req.body.task
        const teamid = req.body.teamid
        const feedback = req.body.feedback
        const jcheck2 = await juryevals.updateOne({teamid:teamid},{tasksr2:tasks2,feedback1:feedback,$inc:{result:jres2},__v:1}).exec()
        res.redirect('/juryevaluationlist2')
    }
    catch(error){
        console.log(error);
        res.redirect('/jurydashboard')
    }
})

app.get("/juryevaluationlist3",async (req,res)=>{
    try{
    if(req.session.edition)
    {
    const juryTeamsList = await teams.find({edition:req.session.edition.edition}).exec();
    const juryalreadyEvaluate = await juryevals.find({__v:2},{teamid:1,_id:0}).exec();
    const juryalreadyEvaluatedList=[]
    for(let id of juryalreadyEvaluate)
    {
        juryalreadyEvaluatedList.push(id['teamid'])
    }
    res.render("juryevaluationlist3.ejs", { juryTeamsList, juryalreadyEvaluatedList });
    }
    else{
        res.redirect('/jurylogin');
    }}
    catch(error){
        console.log(error);
        res.redirect('/jurylogin')
    }
})

app.get("/juryevaluate3",async (req,res)=>{
    try{
    if(req.session.edition)
    {
    const teamId = req.query._id;
    const jteam3 = await teams.find({_id:teamId})
    const jdata3 = await juryevals.find({teamid:teamId})
    res.render("juryevaluate3.ejs",{ teamId,jteam3,jdata3});
    }
    else{
        res.redirect('/jurylogin');
    }}
    catch(error){
        console.log(error);
        res.redirect('/jurylogin')
    }
})

app.post("/juryevaluation3",async (req,res)=>{
    try{
        const jres2 = parseInt(req.body.q1)+parseInt(req.body.q2)+parseInt(req.body.q3)+parseInt(req.body.q4)+parseInt(req.body.q5)
        const tasks3 = req.body.task
        const feedback2 = req.body.feedback
        const teamid = req.body.teamid
        const jcheck3 = await juryevals.updateOne({teamid:teamid},{tasksr3:tasks3,__v:2,feedback2:feedback2,$inc:{result:jres2}}).exec()
        res.redirect('/juryevaluationlist3')
    }
    catch(error){
        console.log(error);
        res.redirect('/jurydashboard')
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
        res.redirect("/teamdashboard");
    }
    })

    app.get("/peerlist",async (req,res)=>{ 
        if(req.session.user)
        {
            const currentUserTeamName = req.session.user.team_name
            const Id = await teams.find({team_name:currentUserTeamName},{_id:1,edition:1})
            const currentUserTeamNameId = String(Id[0]['_id'])
            const teamslist = await teams.find({edition:Id[0]['edition']}).exec();
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