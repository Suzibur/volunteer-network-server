const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0ibid.mongodb.net/Volunteer?retryWrites=true&w=majority`;

const admin = require("firebase-admin");
const serviceAccount = require("./configs/volunteer-network-ef502-firebase-adminsdk-sk21z-284bbdb5b4.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://volunteer-network-ef502.firebaseio.com"
});
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const collection = client.db("Volunteer").collection("Activity");
    app.get('/activity', (req, res) => {
        collection.find({})
            .toArray((err, document) => {
                res.send(document);
            })
    })
    app.post('/addActivity', (req, res) => {
        const activity = req.body
        collection.insertOne(activity)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })
    app.get('/userActivity', (req, res) => {
        const token = req.headers.authorization;
        if (token && token.startsWith('Bearer ')) {
            const idToken = token.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const userEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (userEmail == queryEmail) {
                        collection.find({ userEmail: userEmail })
                            .toArray((err, documents) => {
                                res.send(documents);
                            })
                    }
                    else {
                        res.status(401).send('Unauthorized Access.')
                    }
                }).catch(function (error) {
                    // Handle error
                    res.status(401).send('Unauthorized Access.')
                });
        }
        else {
            res.status(401).send('Unauthorized Access.')
        }
    });
    app.delete('/deleteUserActivity/:_id', (req,res) => {
        collection.deleteOne({ _id : ObjectId(req.params._id)})
        .then(result => {
            res.send(result.deletedCount > 0)
        })
    })
});


app.listen(process.env.PORT || 7000);