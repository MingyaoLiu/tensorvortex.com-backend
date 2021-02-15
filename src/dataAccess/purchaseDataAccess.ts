

import { Request } from 'express';
import { Collection, MongoClient, ObjectId } from 'mongodb';
import { Purchase, PurchaseInterface } from '../model/purchase';
import { getConfig } from '../util/config';


export class PurchaseDataAccess {


    private _purchaseCol: Collection;

    constructor(mongo: MongoClient) {
        const db = mongo.db(getConfig().mongodb_db);
        this._purchaseCol = db.collection(getConfig().mongodb_col_purchases);
    }

    public getAllPurchase = () => {
        const promise = new Promise((resolve, reject) => {
            this._purchaseCol
                .find({})
                .sort({ date: -1 })
                .limit(100)
                .toArray((err, leaders) => {
                    if (err) return reject(err);
                    return resolve(leaders);
                });
        });
        return promise;
    }

    public getPurchaseById = (id: ObjectId) => {
        const promise: Promise<PurchaseInterface> = new Promise((resolve, reject) => {
            this._purchaseCol
                .findOne({ _id: id }, (err, purchase) => {
                    if (err) return reject(err);
                    return resolve(new Purchase(purchase)._data);
                });
        });
        return promise;
    }

    public updatePurchaseWithId = (purchaseId: ObjectId, req: Request) => {
        console.log(purchaseId);

        const promise: Promise<PurchaseInterface> = new Promise((resolve, reject) => {
            const purchase = new Purchase(req.body);
            this._purchaseCol.findOneAndUpdate({ _id: purchaseId }, { $set: purchase._data }, (err, purchase2: any) => {
                if (err) return reject(err);
                return resolve(new Purchase(purchase2.value)._data);
            });
        });
        return promise;
    }

    public addOnePurchase(req: Request) {

        const promise = new Promise((resolve, reject) => {

            const purchase = new Purchase(req.body);
            this._purchaseCol.insertOne(purchase._data, (err, insertOneResult) => {
                if (err) return reject(err);
                return resolve(insertOneResult);
            });
        });
        return promise;



    }
}