/**
 * @file index.ts
 * @author Mingyao Liu <tensorvortex@gmail.com>
 * @version 1.0
 * @license tensorvortex@2020
 */

import bodyParser from "body-parser";
import cors from "cors";
import express, { Express, Request, Response } from "express";
const rateLimit = require("express-rate-limit");
import fs from "fs";
import http from "http";
import https from "https";
import { MongoClient } from "mongodb";
import path from "path";
import tls from "tls";
import { BlogDataAccess } from "./dataAccess/blogDataAccess";
import { ImageDataAccess } from "./dataAccess/imageDataAccess";
import { PurchaseDataAccess } from "./dataAccess/purchaseDataAccess";
import { BlogRoute } from "./route/blogRoute";
import { ImageRoute } from "./route/imageRoute";
import { PurchaseRoute } from "./route/purchaseRoute";
import { getCommonSecret, getConfig } from "./util/config";
import { GridFS } from "./util/gridfs";

// Connection URL
const mongoURI = getConfig().mongodb;

const app = express();

app.set("secPort", getConfig().httpsPort);

// enable rate limiter
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
});
app.use("/api/", apiLimiter);

// Define Express routes
app.use("/", express.static(path.join(__dirname, "../../dist/ts-app")));
app.use("/home", express.static(path.join(__dirname, "../../dist/ts-app")));
app.use("/project", express.static(path.join(__dirname, "../../dist/ts-app")));
app.use("/blog", express.static(path.join(__dirname, "../../dist/ts-app")));
app.use("/about", express.static(path.join(__dirname, "../../dist/ts-app")));
app.use("/blog-gen", express.static(path.join(__dirname, "../../dist/ts-app")));
app.use("/purchase", express.static(path.join(__dirname, "../../dist/ts-app")));
app.use("/resume", express.static(path.join(__dirname, "../../dist/ts-app")));

// Cors
app.use(cors());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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
    const secureContext: any = {
        "liumingyao.com": tls.createSecureContext({
            key: fs.readFileSync(path.join(__dirname, ("/secrets/cert/www.liumingyao.com/" + getCommonSecret().liumingyao_key_filename)), "utf8"),
            cert: fs.readFileSync(path.join(__dirname, ("/secrets/cert/www.liumingyao.com/" + getCommonSecret().liumingyao_pem_filename)), "utf8"),
        }),
        "mingyaoliu.com": tls.createSecureContext({
            key: fs.readFileSync(path.join(__dirname, ("/secrets/cert/www.mingyaoliu.com/" + getCommonSecret().mingyaoliu_key_filename)), "utf8"),
            cert: fs.readFileSync(path.join(__dirname, ("/secrets/cert/www.mingyaoliu.com/" + getCommonSecret().mingyaoliu_pem_filename)), "utf8"),
        }),
        "tensorvortex.com": tls.createSecureContext({
            key: fs.readFileSync(path.join(__dirname, "/secrets/cert/www.tensorvortex.com/" + getCommonSecret().tensorvortex_com_key_filename), "utf8"),
            cert: fs.readFileSync(path.join(__dirname, "/secrets/cert/www.tensorvortex.com/" + getCommonSecret().tensorvortex_com_pem_filename), "utf8"),
        }),
        "tensorvortex.cn": tls.createSecureContext({
            key: fs.readFileSync(path.join(__dirname, "/secrets/cert/www.tensorvortex.cn/" + getCommonSecret().tensorvortex_cn_key_filename), "utf8"),
            cert: fs.readFileSync(path.join(__dirname, "/secrets/cert/www.tensorvortex.cn/" + getCommonSecret().tensorvortex_cn_pem_filename), "utf8"),
        }),
        "localhost": tls.createSecureContext({
            key: fs.readFileSync(path.join(__dirname, "/secrets/cert/localhost/" + getCommonSecret().localhost_key_filename), "utf8"),
            cert: fs.readFileSync(path.join(__dirname, "/secrets/cert/localhost/" + getCommonSecret().localhost_pem_filename), "utf8"),
            // ca: fs.readFileSync("../path_to_certificate_authority_bundle.ca-bundle1", "utf8"), // this ca property is optional
        }),
    };


    try {

        let options = {
            SNICallback: function (domain: any, cb: any) {
                if (secureContext[domain]) {
                    if (cb) {
                        cb(null, secureContext[domain]);
                    } else {
                        // compatibility for older versions of node
                        return secureContext[domain];
                    }
                } else {
                    // No such domain, use local host self signed cert.
                    if (cb) {
                        cb(null, secureContext["localhost"]);
                    } else {
                        return secureContext["localhost"];
                    }
                }
            },
            key: fs.readFileSync(path.join(__dirname, "/secrets/cert/localhost/" + getCommonSecret().localhost_key_filename), "utf8"),
            cert: fs.readFileSync(path.join(__dirname, "/secrets/cert/localhost/" + getCommonSecret().localhost_pem_filename), "utf8"),
            requestCert: false,
        };
        https.createServer(options, application).listen(app.get("secPort"), () => {
            console.log("SERVER", " started at https://localhost:", app.get("secPort"));
        });
    } catch (err) {
        console.error(err.message);
        console.error(err.stack);
    }

};

const enableInsecureServerRedirect = () => {
    const httpApp = express();
    // force https
    httpApp.all("*", (req, res, next) => {
        if (req.secure) return next();

        else if (req.hostname === "localhost") return res.redirect(307, "https://" + req.hostname + ":8200" + req.url);
        else return res.redirect(307, "https://" + req.hostname + req.url);

    });
    http.createServer({}, httpApp).listen(getConfig().httpPort, () => {
        console.log("SERVER", " started at https://localhost:" + getConfig().httpPort);
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
    console.log("Connected successfully to Mongodb server");

    let gfs = new GridFS(mongoClient);

    enableRoute(app, mongoClient, gfs);
    startServer(app);

    enableInsecureServerRedirect();
});


