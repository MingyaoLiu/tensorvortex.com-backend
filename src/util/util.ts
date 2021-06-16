import { ObjectId } from 'mongodb';


export class Util {

    static parseObjectId(str: string): [TypeError?, ObjectId?] {
        try {
            if (!str) return [TypeError('No String to Parse Object ID')];
            return [, new ObjectId(str)];
        } catch (err) {
            return [TypeError(String(err))];
        }
    }
}