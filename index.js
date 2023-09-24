const express = require("express");
const session = require('express-session');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');

const app = express();
app.set("view-engine","ejs");
app.use(express.static(__dirname + '/public'));


app.use(bodyParser.urlencoded({ extended: true }));


const defaultSessionSecret = 'mydefaultsecretkey';

app.use(session({
    secret: defaultSessionSecret,
    resave: false,
    saveUninitialized: true
}));

mongoose.connect('MONGO_DB_URL')
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
    type:mongoose.Schema.Types.Mixed,
    required:true
   },
   endtime:{
    type:mongoose.Schema.Types.Mixed,
    required:true
   },
   rset:{
    type:Number,
    required:true
   },
   rlogin:{
    type:Number,
    required:true
   },
   llogin:{
    type:Number,
    required:true
   },
   peerset:{
    type:Number,
    required:true
   },
   peerstart:{
    type:mongoose.Schema.Types.Mixed,
    required:true
   },
   peerend:{
    type:mongoose.Schema.Types.Mixed,
    required:true
   }
})

const TeamSchema = new mongoose.Schema(
    {
            team_id: {
              type: String,
              required: true
            },
            password: {
              type: String,
              required: true
            },
            team_lead: {
              type: String,
              required: true
            },
            team_name: {
              type: String,
              required: true
            },
            team_mail: {
              type: String,
              required: true
            },
            team_phone: {
              type: String,
              required: true
            },
            edition: {
              type: String,
              required: true
            },
            ps_id: {
              type: String,
              required: true
            },
            ps_title: {
              type: String,
              required: true
            },
            ps_description: {
              type: String,
              required: true
            },
            category: {
              type: String,
              required: true
            },
            ppt_drive: {
              type: String,
              required: true
            },
            reportid: {
              type: Number,
              required: true
            },
            report_timestamp: {
              type: String,
              required: true
            },
            peerresult: {
              type: Number,
              required: true
            },
            juryresult: {
              type: Number,
              required: true
            },
            logcount: {
              type: Number,
              required: true
            }
        })
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
            type:Number,
            required:true
        },
        set:{
            type:Number
            ,
            required:true
            },
        start:{
            type:mongoose.Schema.Types.Mixed,
            required:true
            },
        end:{
            type:mongoose.Schema.Types.Mixed,
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
try{
const starti = await starts.find({},{set:1}).exec()
res.render("index.ejs",{starti});
}
catch(error){
    console.log(error)
}
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

// Teams Route Handling Functions
app.get("/teamlogin",(req,res)=>{
    if(req.session.user)
    {
    
    res.redirect('/teamdashboard')
    }
    else{
    res.render("teamlogin.ejs");
    }
})


app.get("/teamdashboard", async (req,res)=>{
    try{
    if(req.session.user)
    {

    const team = req.session.user
    const tasks = await juryevals.find({teamid:req.session.user._id},{_id:0,tasksr1:1,tasksr2:1,tasksr3:1})
    const round = await rounds.find().exec()
    const id1 = await starts.find().exec()
    const id = id1[0]['_id']
    const st = await starts.find({_id:id},{rset:1})
    const sta = st[0]['rset']

    res.render("teamdashboard.ejs", { team,tasks,round,sta });
    }
    else{
        res.redirect('/teamlogin');
    }}
    catch(error){
        console.log(error);
        res.redirect('/teamlogin')
    }
})

app.get("/teamdetails", async (req,res)=>{
    try{
    if(req.session.user)
    {
    const team = req.session.user
    console.log(team)
    res.render("teamdetails.ejs", { team });
    }
    else{
        res.redirect('/teamlogin');
    }}
    catch(error){
        console.log(error);
        res.redirect('/teamlogin')
    }
})

app.post("/teamlogin",async (req,res)=>{
try{

const check = await teams.findOne({team_id:req.body.team_name,password:req.body.team_password,logcount:0}).exec()

const access = await starts.findOne().exec()
if (check && access['llogin']==1) {
    req.session.user = check;
    const ulog =  await teams.updateOne({team_id:req.body.team_name,password:req.body.team_password},{logcount:1}).exec()
    res.redirect('/teamdashboard');
} else {
    res.redirect("/teamlogin");
}
}
catch(error){
    console.log(error)
    res.redirect("/teamlogin");
}
})

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
     const peerresult = await teams.updateOne({_id:req.body.peerid},{$inc:{peerresult:res1}}).exec()

     res.redirect('/peerlist')
    }
    catch(error){
        console.log(error);
        res.redirect("/teamdashboard");
    }
    })

    app.get("/peerlist",async (req,res)=>{ 
        try{
        if(req.session.user)
        {
            const id1 = await starts.find().exec()
            const id2 = id1[0]['_id']
            const currentUserTeamName = req.session.user.team_name
            const Id = await teams.find({team_name:currentUserTeamName},{_id:1,edition:1})
            const peerset = await starts.find({_id:id2},{peerset:1,_id:0})
            console.log(peerset)
            const currentUserTeamNameId = String(Id[0]['_id'])
            const teamslist = await teams.find({edition:Id[0]['edition']}).exec();
            const filteredTeamsList = teamslist.filter((team) => team.team_name !== currentUserTeamName);
            const alreadyEvaluated = await peerevals.find({user_id:currentUserTeamNameId},{peerid:1, _id:0})
            const alreadyEvaluatedList = []
           
            for(let id of alreadyEvaluated)
            {
                alreadyEvaluatedList.push(id['peerid'])
            }
            res.render("peerevaluationlist.ejs",{ filteredTeamsList, alreadyEvaluatedList, peerset });
        }
        else{
            res.redirect('/teamlogin');
        }}
        catch(error)
        {
            console.log(error)
            res.redirect('/teamlogin');
        }
        })

app.get("/logout", async (req, res) => {
    // Destroy the user's session
    try{
    const acess = await teams.updateOne({'_id':req.session.user._id},{logcount:0}).exec()
    if(acess){
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
        } else {
            // Redirect to the login page or any other appropriate page
            res.redirect("/teamlogin");
        }
    });}}
    catch(error){
        console.log(error);
        res.redirect("/teamlogin");
    }
});
// End of Teams Route Handling Functions

//  Jury Route Handling Functions
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
        const juryresult = await teams.updateOne({_id:req.body.teamid},{$inc:{juryresult:jres1}}).exec()
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
        const juryresult = await teams.updateOne({_id:req.body.teamid},{$inc:{juryresult:jres2}}).exec()
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
        const juryresult = await teams.updateOne({_id:req.body.teamid},{$inc:{juryresult:jres2}}).exec()
        res.redirect('/juryevaluationlist3')
    }
    catch(error){
        console.log(error);
        res.redirect('/jurydashboard')
    }
})
app.post("/jurylogin",async (req,res)=>{
    try{
    const check1 = await jury.findOne({edition:req.body.jury_name,password:req.body.jury_password}).exec()
    const access = await starts.findOne({},{rlogin:1}).exec()
    if (check1 && access['rlogin']=='1') {
        req.session.edition = check1;
        res.redirect('/jurydashboard');
    } else {
        res.redirect("/jurylogin");
    }
    }
    catch{
        res.redirect("/jurylogin");
    }
    })

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
// Jury end of  Route Handling Functions
    
// Admin Route Handling Functions
app.get("/adminlogin", (req,res)=>{

    if(req.session.admin=='admin')
    {

    res.redirect('/admindashboard')
    }
    else{
    res.render("adminlogin.ejs");
    }
})

app.post("/adminlogin",(req,res)=>{

    const  admin = req.body.admin_name
    const password =req.body.admin_password
    if(admin=='admin' && password=='sih2k23'){
    req.session.admin = "admin"
    res.redirect('/admindashboard')}
    else{
        res.redirect('/adminlogin')
    }
})

app.get("/admindashboard", async (req,res)=>{
    try{
    if(req.session.admin=='admin'){
        const admin1 = await starts.find({})
        const admin = admin1[0]
        const round = await rounds.find().exec()
        const rset1 = await starts.find({},{rset:1,_id:0})

        const peer = await starts.find({},{peerstart:1,peerend:1,peerset:1,_id:0})
        
        const rset =rset1[0]['rset']
        res.render("admindashboard.ejs",{round,rset,admin,peer})
    }
    else{
        res.redirect('/adminlogin')
    }}
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})

app.get("/adminsoftwarelist", async (req,res)=>{
    try{
    if(req.session.admin=='admin'){
        const slist = await teams.find({ edition: 'software' }, { team_name: 1, _id: 1,juryresult:1,peerresult:1 }).exec();
        res.render("adminsoftwarelist.ejs",{slist})
    }
    else{
        res.redirect('/adminlogin')
    }}
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})

app.get("/adminhardwarelist", async (req,res)=>{
    try{
    if(req.session.admin=='admin'){
        const hlist = await teams.find({ edition: 'hardware' }, { team_name: 1, _id: 1,juryresult:1,peerresult:1 }).exec();
        
        
        res.render("adminhardwarelist.ejs",{hlist})
    }
    else{
        res.redirect('/adminlogin')
    }}
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})

app.get("/setround1", async (req,res)=>{
    try{
        if(req.session.admin==="admin"){
            const timestamp = new Date();
            const check = await rounds.updateOne({RoundNumber:parseInt(1)},{set:1,start:timestamp}).exec()
            if(check){
                res.redirect('/admindashboard')
            }
            else{
                res.redirect('/adminlogin')
            }
        }
    }
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})

app.get("/endround1", async (req,res)=>{
    try{
        if(req.session.admin==="admin"){
            const id1 = await starts.find()
            const id = id1[0]['_id']
            const timestamp = new Date();
            const check = await rounds.updateOne({RoundNumber:parseInt(1)},{set:2,end:timestamp}).exec()
            const scheck = await starts.updateOne({_id:id},{rset:2}).exec() 
            if(scheck){
                res.redirect('/admindashboard')
            }
            else{
                res.redirect('/adminlogin')
            }
        }
    }
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})

app.get("/endround2", async (req,res)=>{
    try{
        if(req.session.admin==="admin"){
            const id1 = await starts.find()
            const id = id1[0]['_id']
            const timestamp = new Date();
            const check = await rounds.updateOne({RoundNumber:parseInt(2)},{set:2,end:timestamp}).exec()
            const scheck = await starts.updateOne({_id:id},{rset:3}).exec() 
            if(scheck){
                res.redirect('/admindashboard')
            }
            else{
                res.redirect('/adminlogin')
            }
        }
    }
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})

app.get("/setround2", async (req,res)=>{
    try{
        if(req.session.admin==="admin"){
            const timestamp = new Date();
            const check = await rounds.updateOne({RoundNumber:parseInt(2)},{set:1,start:timestamp}).exec()
            if(check){
                res.redirect('/admindashboard')
            }
            else{
                res.redirect('/adminlogin')
            }
           
        }
    }
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})

app.get("/setround3", async (req,res)=>{
    try{
        if(req.session.admin==="admin"){
            const timestamp = new Date();
            const check = await rounds.updateOne({RoundNumber:parseInt(3)},{set:1,start:timestamp}).exec()
            if(check){
                res.redirect('/admindashboard')
            }
            else{
                res.redirect('/adminlogin')
            }
           
        }
    }
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})

app.get("/endround3", async (req,res)=>{
    try{
        if(req.session.admin==="admin"){
            const id1 = await starts.find()
            const id = id1[0]['_id']
            const timestamp = new Date();
            const check = await rounds.updateOne({RoundNumber:parseInt(3)},{set:2,end:timestamp}).exec()
            const scheck = await starts.updateOne({_id:id},{rset:4}).exec() 
            if(scheck){
                res.redirect('/admindashboard')
            }
            else{
                res.redirect('/adminlogin')
            }
        }
    }
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})

app.post("/setteamlogincount", async (req,res)=>{
    try{
        if(req.session.admin==="admin"){
            const id1 = req.body.team_name
            const id = await teams.updateOne({team_name:id1},{logcount:0}).exec()
            res.redirect('/admindashboard')
        }
    }
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})

app.get("/adminendpeer", async (req,res)=>{
    try{
        if(req.session.admin==="admin"){
            const id1 = await starts.find()
            const id = id1[0]['_id']
            const timestamp = new Date();
            const scheck = await starts.updateOne({_id:id},{peerend:timestamp,peerset:2}).exec() 

            if(scheck){
                res.redirect('/admindashboard')
            }
            else{
                res.redirect('/adminlogin')
            }
        }
    }
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})

app.get("/adminstartpeer", async (req,res)=>{
    try{
        if(req.session.admin==="admin"){
            const id1 = await starts.find()
            const id = id1[0]['_id']
            const timestamp = new Date();
            const scheck = await starts.updateOne({_id:id},{peerstart:timestamp,peerset:1}).exec() 

            if(scheck){
                res.redirect('/admindashboard')
            }
            else{
                res.redirect('/adminlogin')
            }
        }
    }
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})

app.get("/adminsetteamlogin", async (req,res)=>{
    try{
        if(req.session.admin==="admin"){
            const id1 = await starts.find()
            const id = id1[0]['_id']
            const acessteam = await starts.updateOne({_id:id},{llogin:1}).exec()
            console.log(acessteam)
            if(acessteam)
            {
            res.redirect('/admindashboard')
            }
        }
    }
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})

app.get("/adminsetjurylogin", async (req,res)=>{
    try{
        if(req.session.admin==="admin"){
            const id1 = await starts.find()
            const id = id1[0]['_id']
            const acessteam = await starts.updateOne({_id:id},{rlogin:1}).exec()
            console.log(acessteam)
            if(acessteam)
            {
            res.redirect('/admindashboard')
            }
        }
    }
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})



app.get("/admindenyteamlogin", async (req,res)=>{
    try{
        if(req.session.admin==="admin"){
            const id1 = await starts.find()
            const id = id1[0]['_id']
            const acessteam = await starts.updateOne({_id:id},{llogin:0}).exec()
            console.log(acessteam)
            if(acessteam)
            {
            res.redirect('/admindashboard')
            }
        }
    }
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})

app.get("/admindenyjurylogin", async (req,res)=>{
    try{
        if(req.session.admin==="admin"){
            const id1 = await starts.find()
            const id = id1[0]['_id']
            const acessteam = await starts.updateOne({_id:id},{rlogin:0}).exec()
            console.log(acessteam)
            if(acessteam)
            {
            res.redirect('/admindashboard')
            }
        }
    }
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})

app.get("/adminsetrounds", async (req,res)=>{
    try{
        if(req.session.admin=="admin"){
           
            
            const round1 = await rounds.updateOne({RoundNumber:1},{set:0,start:"hii",end:"hii"}).exec();
            const round2 = await rounds.updateOne({RoundNumber:2},{set:0,start:"hii",end:"hii"}).exec();
            const round3 = await rounds.updateOne({RoundNumber:3},{set:0,start:"hii",end:"hii"}).exec();
            const id1 = await starts.find()
            const id = id1[0]['_id']
            const scheck1 = await starts.updateOne({_id:id},{rset:1}).exec() 
            if(round3 && round2 && round1&&scheck1)
            {
            res.redirect('/admindashboard')
            }
        }
    }
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})

app.get("/adminsethackathon", async (req,res)=>{
    try{
        if(req.session.admin==="admin"){
            const id1 = await starts.find().exec()
            const id = id1[0]['_id']
            const acessteam = await starts.updateOne({_id:id},{set:0,rlogin:0,llogin:0,starttime:'hii',rset:1,endtime:'hii'}).exec()
            if(acessteam)
            {
            res.redirect('/admindashboard')
            }
        }
    }
    catch(error){
        console.log(error);
        res.redirect('/adminlogin')
    }
})



app.get("/adminlogout", (req, res) => {
    // Destroy the user's session
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
        } else {
            // Redirect to the login page or any other appropriate page
            res.redirect('/adminlogin');
        }
    });
   })


// end of the Admin Route Handling Function

//Schedule route for both Teams and Jury Routes 
app.get("/Schedule",(req,res)=>{
    if(req.session.user)
    {
        res.render('schedule.ejs', { sidebar:0 });
    }
    else if(req.session.edition){
        res.render('schedule.ejs', { sidebar:1 });
    }
    else{
    res.redirect('/teamlogin');
    }
            
   })
//End of Schedule route for both Teams and Jury Routes

//reportadmin route handling pages

app.get("/reportadminlogin",(req,res)=>{
    if(req.session.reportadmin)
    {
    res.redirect('/reportadmindashboard')
    }
    else{
    res.render("reportadminlogin.ejs");
    }
})


app.get("/reportadmindashboard", async (req,res)=>{
    try{
    if(req.session.reportadmin)
    {
    const list = await teams.find({edition:'software'},{reportid:1,team_name:1,report_timestamp:1}).sort({ reportid: 1 }).exec()
    res.render("reportadmindashboard.ejs", { list});
    }
    else{
        res.redirect('/reportadminlogin');
    }}
    catch(error){
        console.log(error);
        res.redirect('/reportadminlogin')
    }
})

app.get("/reportadmindashboard1", async (req,res)=>{
    try{
    if(req.session.reportadmin)
    {
    const list = await teams.find({edition:'hardware'},{reportid:1,team_name:1,report_timestamp:1}).exec()
   
    res.render("reportdashboard1.ejs", { list});
    }
    else{
        res.redirect('/reportadminlogin');
    }}
    catch(error){
        console.log(error);
        res.redirect('/reportadminlogin')
    }
})

app.post("/reportadminlogin", (req,res)=>{
    const  admin = req.body.report_name
    const password =req.body.report_password
    if(admin=='reportadmin' && password=='sih2k23'){
    req.session.reportadmin = "reportadmin"
    res.redirect('/reportadmindashboard')}
    else{
        res.redirect('/reportadminlogin')
    }
})

app.get("/selfreport", async (req,res)=>{
    try{
    if(req.session.reportadmin)
    {
    const id = req.query.id
    const timestamp  = new Date();
    const list = await teams.updateOne({_id:id},{report_timestamp:timestamp}).exec()
    res.redirect("/reportadmindashboard");
    }
    else{
        res.redirect('/reportadminlogin');
    }}
    catch(error){
        console.log(error);
        res.redirect('/reportadminlogin')
    }
})

app.get("/reportadminlogout", (req, res) => {
    // Destroy the user's session
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
        } else {
            // Redirect to the login page or any other appropriate page
            res.redirect('/reportadminlogin');
        }
    });
   })
//end of reportadmin route handling pages



app.listen(3000, function () {
    console.log('Server started at port 3000');
   })
