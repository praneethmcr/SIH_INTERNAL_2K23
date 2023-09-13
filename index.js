const express = require("express");
const session = require('express-session');
const app = express();
app.use(express.static("public"));
app.set("view-engine","ejs");
const bodyParser = require("body-parser");
const parser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const WebSocket = require('ws');
const http = require('http');
const mongoose = require('mongoose');
// Use a default session secret for development (not secure for production)
const defaultSessionSecret = 'mydefaultsecretkey';

app.use(session({
    secret: process.env.SESSION_SECRET || defaultSessionSecret,
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
const teams = new mongoose.model("teams",TeamSchema)

// Create an HTTP server
const server = http.createServer(app);

// Create a WebSocket server by passing the HTTP server
const wss = new WebSocket.Server({ server });

// Initialize timer variables
let timerValue = 24 * 60 * 60; // 24 hours in seconds
let timerInterval;

// Function to start the timer
function startTimer() {
    if (!timerInterval) {
        timerInterval = setInterval(() => {
            if (timerValue > 0) {
                timerValue--;
            }
            broadcastTimer();
        }, 1000);
    }
}

// Function to broadcast timer updates to all connected clients
function broadcastTimer() {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ timerValue }));
        }
    });
}



// WebSocket connection handling
wss.on('connection', (ws) => {
    // Send the current timer value to the newly connected client
    ws.send(JSON.stringify({ timerValue }));

    // Listen for messages from the client (e.g., start timer)
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.action === 'startTimer') {
            startTimer();
        }
    });
});

// Serve static files (e.g., HTML, CSS)
app.use(express.static('public'));

// Start the HTTP server
const PORT = process.env.PORT || 3838;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

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


app.get("/evaluate",(req,res)=>{
    if(req.session.user)
    {
        res.render("peerevaluation.ejs");
    }
    else{
    res.render("teamlogin.ejs");
    }
    
    })

app.get("/peerlist",(req,res)=>{
       
        if(req.session.user)
        {
            res.render("peerevaluationlist.ejs");
        }
        else{
        res.render("teamlogin.ejs");
        }
        })
   
app.get("/Schedule",(req,res)=>{
    if(req.session.user)
    {
        res.render("schedule.ejs");
    }
    else{
    res.render("teamlogin.ejs");
    }
            
            })        

app.listen(3000, function () {
    console.log('Server started at port 3000');
   })