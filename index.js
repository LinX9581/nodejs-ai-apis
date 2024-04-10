import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import 'dotenv/config';
import './global'
import indexRouter from './route/indexRouter';
import aiApiRouter from './route/aiApiRouter';
import './schedule/schedule';
import './test/api_test';
const app = express();
const http = require('http').Server(app);

console.log(process.env.NODE_ENV)

app.set("views", "views/");
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static('public'));

app.use('/', indexRouter);
app.use('/ai', aiApiRouter);

const host = '0.0.0.0';
const port = process.env.PORT || config.port || 3008;

http.listen(port, host, function() {
    console.log("Server started on " + port);
});
