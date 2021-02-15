
/**
 * @file BlogDataAccess.ts
 * @author Mingyao Liu <tensorvortex@gmail.com>
 * @version 1.0
 * @license tensorvortex@2020
 */

import { Request, Response } from 'express';
import { Collection, Db, MongoCallback, MongoClient, ObjectId } from 'mongodb';
import { Post } from '../model/post';
import { getConfig } from '../util/config';


export class BlogDataAccess {

    private _mongo: MongoClient;
    private _db: Db;
    private _postCol: Collection;
    private _commentCol: Collection;

    constructor(mongo: MongoClient) {
        this._mongo = mongo;
        this._db = mongo.db(getConfig().mongodb_db);
        this._postCol = this._db.collection(getConfig().mongodb_col_posts);
        this._commentCol = this._db.collection(getConfig().mongodb_col_comments);
    }

    public getAllBlog = () => {
        const promise = new Promise((resolve, reject) => {
            this._postCol
                .find({})
                .sort({ date: -1 })
                .limit(100)
                .toArray((err, blogs) => {
                    if (err) return reject(err);
                    return resolve(blogs);
                });
        });
        return promise;
    }

    public getAllComments = (postId: ObjectId) => {
        const promise = new Promise((resolve, reject) => {
            this._postCol
                .findOne({ _id: postId }, (err, purchase) => {
                    if (err) return reject(err);
                    return resolve(new Post(purchase));
                });
        });
        return promise;
    }


}