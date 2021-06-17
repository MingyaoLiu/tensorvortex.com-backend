/**
 * @file index.ts
 * @author Mingyao Liu <tensorvortex@gmail.com>
 * @version 1.0
 * @license tensorvortex@2020
 */

import { SecureContext, createSecureContext } from 'tls';
import { getCommonSecret, getConfig } from './util/config';

import { BlogDataAccess } from './dataAccess/blogDataAccess';
import { BlogRoute } from './route/blogRoute';
import { Express } from 'express';
import { GridFS } from './util/gridfs';
import { ImageDataAccess } from './dataAccess/imageDataAccess';
import { ImageRoute } from './route/imageRoute';
import { MongoClient } from 'mongodb';
import { PurchaseDataAccess } from './dataAccess/purchaseDataAccess';
import { PurchaseRoute } from './route/purchaseRoute';
import { SecureServerSessionOptions } from 'http2';

import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import rateLimit from 'express-rate-limit';

// Connection URL
const mongoURI = getConfig().mongodb;

const app = express();

app.set('secPort', getConfig().httpsPort);

// enable rate limiter
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
});
app.use('/api/', apiLimiter);

// Define Express routes
app.use('/', express.static(path.join(__dirname, '../ts-app')));
app.use('/home', express.static(path.join(__dirname, '../ts-app')));
app.use('/project', express.static(path.join(__dirname, '../ts-app')));
app.use('/blog', express.static(path.join(__dirname, '../ts-app')));
app.use('/about', express.static(path.join(__dirname, '../ts-app')));
app.use('/blog-gen', express.static(path.join(__dirname, '../ts-app')));
app.use('/purchase', express.static(path.join(__dirname, '../ts-app')));
app.use('/resume', express.static(path.join(__dirname, '../ts-app')));

// Cors
app.use(cors());
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// bodyparser
app.use(bodyParser.urlencoded({
    extended: false,
}));
app.use(bodyParser.text());
app.use(bodyParser.json());



// enable api routes
const enableRoute = (app: Express, mongo: MongoClient, gfs: GridFS) => {

    app.use(new BlogRoute(new BlogDataAccess(mongo)).getRoutes());
    app.use(new ImageRoute(new ImageDataAccess(mongo, gfs)).getRoutes());
    app.use(new PurchaseRoute(new PurchaseDataAccess(mongo)).getRoutes());
};


// start the Express server
const startServer = (application: Express) => {

    // Certificate
    const secureContext: Record<string, SecureContext> = {
        'liumingyao.com': createSecureContext({
            key: fs.readFileSync(path.join(__dirname, ('/secrets/cert/liumingyao.com/' + getCommonSecret().liumingyao_key_filename)), 'utf8'),
            cert: fs.readFileSync(path.join(__dirname, ('/secrets/cert/liumingyao.com/' + getCommonSecret().liumingyao_pem_filename)), 'utf8'),
        }),
        'mingyaoliu.com': createSecureContext({
            key: fs.readFileSync(path.join(__dirname, ('/secrets/cert/mingyaoliu.com/' + getCommonSecret().mingyaoliu_key_filename)), 'utf8'),
            cert: fs.readFileSync(path.join(__dirname, ('/secrets/cert/mingyaoliu.com/' + getCommonSecret().mingyaoliu_pem_filename)), 'utf8'),
        }),
        'tensorvortex.com': createSecureContext({
            key: fs.readFileSync(path.join(__dirname, '/secrets/cert/tensorvortex.com/' + getCommonSecret().tensorvortex_com_key_filename), 'utf8'),
            cert: fs.readFileSync(path.join(__dirname, '/secrets/cert/tensorvortex.com/' + getCommonSecret().tensorvortex_com_pem_filename), 'utf8'),
        }),
        'tensorvortex.cn': createSecureContext({
            key: fs.readFileSync(path.join(__dirname, '/secrets/cert/tensorvortex.cn/' + getCommonSecret().tensorvortex_cn_key_filename), 'utf8'),
            cert: fs.readFileSync(path.join(__dirname, '/secrets/cert/tensorvortex.cn/' + getCommonSecret().tensorvortex_cn_pem_filename), 'utf8'),
        }),
        'localhost': createSecureContext({
            key: fs.readFileSync(path.join(__dirname, '/secrets/cert/localhost/' + getCommonSecret().localhost_key_filename), 'utf8'),
            cert: fs.readFileSync(path.join(__dirname, '/secrets/cert/localhost/' + getCommonSecret().localhost_pem_filename), 'utf8'),
            // ca: fs.readFileSync("../path_to_certificate_authority_bundle.ca-bundle1", "utf8"), // this ca property is optional
        }),
    };


    try {

        const options: SecureServerSessionOptions = {
            SNICallback: (domainStr, cb) => {
                if (secureContext[domainStr]) {
                    if (cb) {
                        return cb(null, secureContext[domainStr]);
                    }
                    return secureContext[domainStr];
                } else {
                    if (cb) {
                        return cb(null, secureContext['localhost']);
                    }
                    return secureContext['localhost'];
                }
            },
            key: fs.readFileSync(path.join(__dirname, '/secrets/cert/localhost/' + getCommonSecret().localhost_key_filename), 'utf8'),
            cert: fs.readFileSync(path.join(__dirname, '/secrets/cert/localhost/' + getCommonSecret().localhost_pem_filename), 'utf8'),
            requestCert: false,
        };
        https.createServer(options, application).listen(app.get('secPort'), () => {
            console.log('SERVER', ' started at https://localhost:' + app.get('secPort'));
        });
    } catch (err) {
        console.error(err.message);
        console.error(err.stack);
    }

};

const enableInsecureServerRedirect = () => {
    const httpApp = express();
    // force https
    httpApp.all('*', (req, res, next) => {
        if (req.secure) return next();

        else if (req.hostname === 'localhost') return res.redirect(307, 'https://' + req.hostname + ':8200' + req.url);
        else return res.redirect(307, 'https://' + req.hostname + req.url);

    });
    http.createServer({}, httpApp).listen(getConfig().httpPort, () => {
        console.log('SERVER', ' started at https://localhost:' + getConfig().httpPort);
    });
};

// Create a new MongoClient
const mongoOptions = {
    useUnifiedTopology: true,
};
const client = new MongoClient(mongoURI, mongoOptions);

client.connect((err: Error, mongoClient) => {
    if (err) {
        throw err;
    }
    console.log('Connected successfully to Mongodb server');

    const gfs = new GridFS(mongoClient);

    enableRoute(app, mongoClient, gfs);
    startServer(app);

    enableInsecureServerRedirect();
});


