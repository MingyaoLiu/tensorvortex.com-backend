/**
 * @file ImageDataAccess.ts
 * @author Mingyao Liu <tensorvortex@gmail.com>
 * @version 1.0
 * @license tensorvortex@2020
 */

import { Request, Response } from 'express';
import { Collection, Db, MongoCallback, MongoClient, ObjectId } from 'mongodb';
import { getConfig } from '../util/config';
import { GridFS } from '../util/gridfs';


export class ImageDataAccess {

    private _mongo: MongoClient;
    private _gfs: GridFS;

    constructor(mongo: MongoClient, gfs: GridFS) {

        this._mongo = mongo;
        this._gfs = gfs;
    }

    getImageByName = (filename: string, res: Response) => {
        this._gfs.getFileByName(filename)
            .then((readable) => {
                readable.pipe(res);
            })
            .catch((err) => {
                res.send(err);
            });
    }

    getImageById = (imageId: ObjectId, res: Response) => {
        this._gfs.getFileById(imageId)
            .then((readable) => {
                readable.pipe(res);
            })
            .catch((err) => {
                res.send(err);
            });
    }

    addOneImage = (req: Request) => {
        const promise = new Promise((resolve, reject) => {
            this._gfs.addNewFile(req)
                .then((data) => {
                    return resolve(data);
                })
                .catch((err) => {
                    return reject(err);
                });
        });
        return promise;
    }

    updateImageById(imageId: ObjectId, req: Request) {
        const promise = new Promise((resolve, reject) => {
            this._gfs.removeOneFileById(imageId)
                .then(() => {
                    return this._gfs.addNewFile(req);
                })
                .then((data) => {
                    return resolve(data);
                })
                .catch((err) => {
                    console.log(err);
                    return reject(err);
                });
        });
        return promise;
    }

}