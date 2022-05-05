//Define app using express
const express = require("express");
const app = express();
// install/require morgan
const morgan = require('morgan');
// install/require fs
const fs = require('fs');

// Allow JSON body messages on all endpoints
app.use(express.urlencoded({ extended: true }));
app.use(express.json())

// take in multiple inputs to command line arguement
const args =require('minimist')(process.argv.slice(2));
// help text
const help = (`
    server.js [options]

    --port	Set the port number for the server to listen on. Must be an integer
        between 1 and 65535.

    --debug	If set to true, creates endlpoints /app/log/access/ which returns
        a JSON access log from the database and /app/error which throws 
        an error with the message "Error test successful." Defaults to 
        false.

    --log		If set to false, no log files are written. Defaults to true.
        Logs are always written to database.

    --help	Return this message and exit.
`)

// if command line argument --help, echo help text and exit
if (args.help == true || args.h) {
    console.log(help)
    process.exit(0)
}


// Require database
const db = require("./src/services/database.js")
// server port
const port = args.port || process.env.PORT || 5000;

// if --log = false, then do not create a log file
if (args.log == true) {
    // Use morgan for logging to files
    const morgan = require('morgan')
    // Create a write stream to append (flags: 'a') to a file
    const accessLog = fs.createWriteStream('./log/access.log', { flags: 'a' })
    // Set up the access logging middleware
    app.use(morgan('combined', { stream: accessLog })) 
}

//middleware for querying to access log database, always log to database
app.use((req, res, next) =>{
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }
    const stmt = db.prepare(`INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`)
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url,
           logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)
    next()
})


//functions from coin.mjs
//flip one coin
function coinFlip() {
    return (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';
}

//flip many coins
function coinFlips(flips) {
    const sides = [];
    for(var i = 0; i < flips; i++){
        sides[i] = coinFlip();
    }
    return sides
}

//count coin flips
function countFlips(array) {
    var numHeads = 0;
    var numTails = 0;
    for(var i = 0; i < array.length; i++){
      if(array[i] == "heads"){
          numHeads++;
      }
      else if(array[i] == "tails"){
          numTails++;
      }
    }
    if(numHeads == 0){
        let summary_tails = {
            tails: numTails
        }
        return summary_tails;
    }
    else if(numTails == 0){
        let summary_heads = {
            heads:numHeads
        }
        return summary_heads;
    }
    else{
        let summary = {
            tails: numTails,
            heads: numHeads
        }
        return summary;
    }
}    

//call a coin flip
function flipACoin(call) {
    let flip = coinFlip();
    let result;
    if(flip == call){
      result = 'win';
    }
    else{
      result = 'lose';
    }
    let game_summary = {
       call: call,
       flip: flip,
       result: result
    }
    return game_summary;
}

// serve static HTML public directory
app.use(express.static('./public'))

//API endpoints
// root endpoint /app/
app.get('/app/', (req, res) => {
    const statusCode = 200;
    const statusMessage = 'OK';
    res.status(statusCode).end(statusCode + ' ' + statusMessage);
    res.type("text/plain");
})

//corresponding to results of random coin flip
app.get('/app/flip/', (req, res) => {
    const flip = coinFlip();
    res.status(200).json({ "flip" : flip});
})

app.get('/app/flips/coins/', (req, res) =>{
    const flips_arr = coinFlips(req.body.number);
    const count_flips = countFlips(flips_arr);
    res.status(200).json({"raw": flips_arr, "summary": count_flips});
})

app.get('/app/flips/:number', (req, res) =>{
    const flips_arr = coinFlips(req.params.number);
    const count_flips = countFlips(flips_arr);
    res.status(200).json({"raw": flips_arr, "summary": count_flips});
})

app.get('/app/flip/call/:guess(heads|tails)/', (req, res) =>{
    const game_summary = flipACoin(req.params.guess);
    res.status(200).json(game_summary);
})

app.get('/app/flip/call/', (req, res) =>{
    const game_summary = flipACoin(req.params.guess);
    res.status(200).json(game_summary);
})

// debug
if (args.debug == true) {
    app.get('/app/log/access', (req, res) => {
        try{
            const stmt = db.prepare('SELECT * FROM accesslog').all()
            res.status(200).json(stmt)
        } catch{
            console.error(e)
        }
    });
    app.get('/app/error', (req, res) => {
        res.status(500);
        throw new Error('Error test completed successfully.')
    })
}

// start server
const server = app.listen(port, () => {
    console.log('App is running on %PORT%'.replace('%PORT%', port))
})

// default api endpoint that returns 404 NOT FOUND for any undefined endpoints
app.use(function(req, res){
    const statusCode = 404;
    const statusMessage = "NOT FOUND";
    res.status(statusCode).end(statusCode + ' ' + statusMessage);
    res.type("text/plain");
})
