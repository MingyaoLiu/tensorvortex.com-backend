import { randomBytes } from "crypto";
import { EventEmitter } from "events";
import { Request, Response } from "express";
import { Collection, Db, GridFSBucket, GridFSBucketReadStream, MongoClient, ObjectId } from "mongodb";
import { pipeline, Readable, Writable, WritableOptions } from "stream";
import { getConfig } from "./config";

export class GridReadStream {


    _id: ObjectId;
    _filename?: string;

    _bucketReadStream: GridFSBucketReadStream;

    _buffer?: Buffer;

    _eventEmitter: EventEmitter;


    _writableStream: Writable;

    constructor(bucket: GridFSBucket, id: ObjectId, readEventEmitter: EventEmitter) {
        this._id = id;

        this._writableStream = new Writable();
        this._writableStream._write = (chunk, encode, done) => {
            if (!this._buffer) this._buffer = chunk;
            else {
                this._buffer = Buffer.concat([this._buffer, chunk]);
                // this._writableStream.destroy()
                if (this._writableStream.writableFinished) {
                    console.log("writable is finished in data");
                }
            }
            done();
        };
        this._eventEmitter = readEventEmitter;
        this._bucketReadStream = bucket.openDownloadStream(id);
        this.addReadStreamEventListener();
        this.startPipeBuffer();
    }

    addReadStreamEventListener = () => {
        this._bucketReadStream
            .on("file", (file) => {
                console.log(file);
            })
            .on("end", () => {
                console.log("Read End");
                console.log("read end is write stream ended? ", this._writableStream.writableEnded);
                console.log("read end is write stream finished? ", this._writableStream.writableFinished);
            })
            .on("close", () => {
                console.log("Read Close");
                console.log("read close is write stream ended? ", this._writableStream.writableEnded);
                console.log("read close is write stream finished? ", this._writableStream.writableFinished);
            })
            .on("error", (err) => {
                console.log("Read Error", err);
            });
    }

    startPipeBuffer = () => {
        this._bucketReadStream.pipe(this._writableStream)
            .once("finish", () => {
                console.log("Pipe Finished");
                console.log("p finish is write stream ended? ", this._writableStream.writableEnded);
                console.log("p finish is write stream finished? ", this._writableStream.writableFinished);
            })
            .on("error", (err) => {
                console.log("Pipe Error", err);
            })
            .on("close", () => {

                console.log("Pipe Close");
                console.log("p close is write stream ended? ", this._writableStream.writableEnded);
                console.log("p close is write stream finished? ", this._writableStream.writableFinished);
            })
            .on("pipe", () => {
                console.log("Pipe Piping");
            })
            .on("drain", () => {
                console.log("Pipe Drain");
            })
            .on("unpipe", () => {
                console.log("Pipe unpipe");
                console.log("p unpipe is write stream ended? ", this._writableStream.writableEnded);
                console.log("p unpipe is write stream finished? ", this._writableStream.writableFinished);
            });
    }
}

export class GridFS {

    _mongo: MongoClient;
    _db: Db;
    _bucket: GridFSBucket;

    constructor(mongo: MongoClient) {
        this._mongo = mongo;

        this._db = mongo.db(getConfig().mongodb_db);


        this._bucket = new GridFSBucket(this._db);
    }

    checkExistById(id: ObjectId): Promise<ObjectId> {
        let promise: Promise<ObjectId> = new Promise((resolve, reject) => {
            this._bucket.find({ _id: id }).toArray((mongoErr, items) => {
                if (mongoErr) return reject(mongoErr);
                if (items.length === 0) return reject(TypeError("No item found with this id."));
                if (items.length > 1) return reject(">1 items with same id!");
                return resolve(id);
            });
        });
        return promise;
    }

    checkExistByName(filename: string): Promise<ObjectId> {
        let promise: Promise<ObjectId> = new Promise((resolve, reject) => {
            this._bucket.find({ filename: filename }).toArray((mongoErr, items) => {
                if (mongoErr) return reject(mongoErr);
                if (items.length === 0) return reject(TypeError("No item found with this id."));
                if (items.length > 1) return reject(">1 items with same id!");
                return resolve(items[0]._id);
            });
        });
        return promise;
    }

    getFileById(id: ObjectId): Promise<Readable> {
        let promise: Promise<Readable> = new Promise((resolve, reject) => {
            this.checkExistById(id)
                .then((sameId) => {
                    return resolve(this._bucket.openDownloadStream(id));
                })
                .catch((err) => {
                    return reject(err);
                });
        });
        return promise;
    }

    getFileByName(filename: string): Promise<Readable> {
        let promise: Promise<Readable> = new Promise((resolve, reject) => {
            this.checkExistByName(filename)
                .then((id) => {
                    return resolve(this._bucket.openDownloadStream(id));
                })
                .catch((err) => {
                    return reject(err);
                });
        });
        return promise;
    }

    addNewFile = (req: Request) => {
        let promise = new Promise((resolve, reject) => {
            console.log(req.headers);
            const filename = String(new Date().toISOString().split("T")[0]) + "." + String(req.headers["file-name"]).substring(0, 12) + "." + String(randomBytes(4).toString("hex") + ".png");
            const writeStream = this._bucket.openUploadStream(filename);
            req.pipe(writeStream)
                .once("finish", (id: any) => {
                    console.log("write finish", id);
                    return resolve(id);
                });
        });
        return promise;
    }

    removeOneFileById = (imageId: ObjectId) => {
        let promise = new Promise((resolve, reject) => {
            this.checkExistById(imageId)
                .then((sameId) => {
                    this._bucket.delete(imageId, (err) => {
                        if (err) return reject(err);
                        return resolve();
                    });
                })
                .catch((err) => {
                    return resolve();
                });
        });
        return promise;
    }

}