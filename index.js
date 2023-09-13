const express = require("express");
const app = express();
app.use(express.static("public"));
app.set("view-engine","ejs");
const bodyParser = require("body-parser")
const parser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))
const WebSocket = require('ws');
const http = require('http');


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
    res.render("teamlogin.ejs");
})
app.get("/evaluate",(req,res)=>{
    res.render("peerevaluation.ejs");
    })

app.get("/peerlist",(req,res)=>{
        res.render("peerevaluationlist.ejs");
        })
   
app.get("/list",(req,res)=>{
            res.render("list.ejs");
            })        

app.listen(3000, function () {
    console.log('Server started at port 3000');
   })