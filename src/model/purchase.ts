import { create } from "domain";
import { ObjectId } from "mongodb";
import { Util } from "../util/util";

export interface PurchaseInterface {
    _id?: ObjectId;
    createdAt: Date;
    title: string;
    place: string;
    payer: string;
    date: Date;
    total: number;
    _imageId?: ObjectId;
    detail: {
        mingyao: {
            amount: number,
            exclude: boolean,
            paid: boolean,
        };
        rosy: {
            amount: number,
            exclude: boolean,
            paid: boolean,
        };
        zelena: {
            amount: number,
            exclude: boolean,
            paid: boolean,
        };
        liam: {
            amount: number,
            exclude: boolean,
            paid: boolean,
        };
        others: {
            amount: number,
            exclude: boolean,
            paid: boolean,
        }
    };
}

export class Purchase {

    _data: PurchaseInterface;

    constructor(obj: any) {
        this._data = this.parse(obj);
    }

    parse = (json: any) => {
        let a: PurchaseInterface = {
            _id: Util.parseObjectId(json._id)[1],
            createdAt: new Date(json.createdAt),
            title: json.title,
            place: json.place,
            payer: json.payer,
            date: new Date(json.date),
            total: json.total,
            _imageId: Util.parseObjectId(json._imageId)[1],
            detail: {
                mingyao: {
                    amount: json.detail.mingyao.amount,
                    exclude: json.detail.mingyao.exclude,
                    paid: json.detail.mingyao.paid,
                },
                rosy: {
                    amount: json.detail.rosy.amount,
                    exclude: json.detail.rosy.exclude,
                    paid: json.detail.rosy.paid,
                },
                zelena: {
                    amount: json.detail.zelena.amount,
                    exclude: json.detail.zelena.exclude,
                    paid: json.detail.zelena.paid,
                },
                liam: {
                    amount: json.detail.liam.amount,
                    exclude: json.detail.liam.exclude,
                    paid: json.detail.liam.paid,
                },
                others: {
                    amount: json.detail.others.amount,
                    exclude: json.detail.others.exclude,
                    paid: json.detail.others.paid,
                },
            },
        };
        return a;
    }

}