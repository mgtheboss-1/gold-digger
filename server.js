// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.set('view engine', 'ejs');

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));





const session = require('express-session');
const {
    ExpressOIDC
} = require('@okta/oidc-middleware');

// session support is required to use ExpressOIDC
app.use(session({
    secret: 'gold-digger-secret',
    resave: true,
    saveUninitialized: false
}));

const oidc = new ExpressOIDC({
    appBaseUrl: 'https://gold-digger.glitch.me',
    issuer: 'https://dev-111874.okta.com/oauth2/default',
    client_id: 'REDACTED',
    client_secret: 'REDACTED',
    redirect_uri: 'https://gold-digger.glitch.me/authorization-code/callback',
    scope: 'openid profile'
});

// ExpressOIDC will attach handlers for the /login and /authorization-code/callback routes
app.use(oidc.router);


app.use(bodyParser.urlencoded({
    extended: true
}));


app.get('/protected', oidc.ensureAuthenticated(), (req, res) => {
    res.send(JSON.stringify(req.userContext.userinfo));
});



app.get('/', (req, res) => {
    if (req.userContext) {


        res.render(__dirname + "/views/index", {
            name: req.userContext.userinfo.name,
            loggedin: true
        });
    } else {

        res.render(__dirname + "/views/index", {
            loggedin: false
        });
    }
});


app.post('/submit', function(req, res) {

    const MongoClient = require('mongodb').MongoClient;
    const uri = "REDACTED";
    const client = new MongoClient(uri, {
        useNewUrlParser: true
    });
    client.connect(err => {
        const collection = client.db("gd-db").collection("c-1");
        // perform actions on the collection object

        collection.insertMany([
                // MongoDB adds the _id field with an ObjectId if _id is not present
                {
                    "timestamp": req.body["d-timestamp"],
                    "email-address": req.body["d-email-address"],
                    "image-url": req.body["d-image-url"]
                }
            ])
            .then(function(result) {
                // process result
            })
        client.close();
        res.render(__dirname + "/views/submit")
    });
})


oidc.on('ready', () => {
    app.listen(3000, () => console.log(`Started!`));
});

oidc.on('error', err => {
    console.log('Unable to configure ExpressOIDC', err);
});
