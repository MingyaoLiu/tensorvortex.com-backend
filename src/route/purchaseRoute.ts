import { Request, Response, Router } from "express";
import { ObjectId } from "mongodb";
import { PurchaseDataAccess } from "../dataAccess/purchaseDataAccess";
import { PurchaseInterface } from "../model/purchase";
import { Util } from "../util/util";

export class PurchaseRoute {

    _purchaseDA: PurchaseDataAccess;

    constructor(purchaseDA: PurchaseDataAccess) {
        this._purchaseDA = purchaseDA;
    }

    public getRoutes() {
        const router = Router();

        router.get("/api/purchases", (req, res) => {

            this._purchaseDA.getAllPurchase()
                .then((data) => {
                    return res.send(data);
                })
                .catch((err) => {
                    return res.status(403).send(err);
                });

        });

        router.get("/api/purchase/:id", (req, res) => {
            let [err, objId] = Util.parseObjectId(req.params.id);
            if (err || !objId) return res.status(403).send(String(err));
            this._purchaseDA.getPurchaseById(objId)
                .then((data) => {
                    return res.send(data);
                })
                .catch((err) => {
                    return res.status(403).send(err);
                });
        });

        router.post("/api/purchase", (req: Request, res: Response) => {
            if (!req.body) return res.status(403).send("Req Body is empty");
            if (!req.body._id) {
                this._purchaseDA.addOnePurchase(req)
                    .then((data) => {
                        return res.send(data);
                    })
                    .catch((err) => {
                        return res.status(403).send(err);
                    });
            } else {
                let [err, objId] = Util.parseObjectId(req.body._id);
                if (err || !objId) return res.status(403).send(String(err));
                console.log("Start update purchase flow");
                this._purchaseDA.updatePurchaseWithId(objId, req)
                    .then((data) => {
                        return res.send(data);
                    })
                    .catch((err) => {
                        return res.status(403).send(err);
                    });
            }
        });

        router.post("/api/purchase/:id", (req: Request, res: Response) => {
            if (!req.body) return res.status(403).send("Req Body is empty");
            if ((!req.params.id && !req.body._id) ||
                (req.body._id && (req.body._id !== req.params.id)) ||
                (req.params.id && (req.params.id !== req.body._id))
            ) {
                this._purchaseDA.addOnePurchase(req)
                    .then((data) => {
                        return res.send(data);
                    })
                    .catch((err) => {
                        return res.status(403).send(err);
                    });
            } else {
                let [err, objId] = Util.parseObjectId(req.params.id);
                if (err || !objId) return res.status(403).send(String(err));
                this._purchaseDA.updatePurchaseWithId(objId, req)
                    .then((data) => {
                        return res.send(data);
                    })
                    .catch((err) => {
                        return res.status(403).send(err);
                    });
            }
        });

        return router;
    }
}