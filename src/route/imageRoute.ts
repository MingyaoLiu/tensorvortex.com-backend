import { Request, Response, Router } from 'express';
import { ObjectId } from 'mongodb';
import { ImageDataAccess } from '../dataAccess/imageDataAccess';
import { Util } from '../util/util';

export class ImageRoute {

    _imageDA: ImageDataAccess;

    constructor(imageDA: ImageDataAccess) {
        this._imageDA = imageDA;
    }

    public getRoutes(): Router {
        const router = Router();

        router.get('/api/image', (req: Request, res: Response) => {
            const [err, objId] = Util.parseObjectId(req.body.id);
            if (req.body.id && objId) return this._imageDA.getImageById(new ObjectId(req.body.id), res);
            if (req.body.filename) return this._imageDA.getImageByName(req.body.filename, res);
            return res.status(403).send('No image id or filename requested.');
        });

        router.get('/api/image/:id', (req: Request, res: Response) => {
            const [err, objId] = Util.parseObjectId(req.params.id);
            if (err || !objId) return res.status(403).send(String(err));
            return this._imageDA.getImageById(objId, res);
        });

        router.post('/api/image', (req: Request, res: Response) => {
            if (req.headers['content-type'] !== 'application/octet-stream') return res.status(403).send('Header not octet stream, not binary');
            if (!req.body) return res.status(403).send('Req Body is empty');
            this._imageDA.addOneImage(req)
                .then((data) => {
                    return res.send(data);
                })
                .catch((err) => {
                    return res.status(403).send(err);
                });
        });

        router.post('/api/image/:id', (req: Request, res: Response) => {
            if (req.headers['content-type'] !== 'application/octet-stream') return res.status(403).send('Header not octet stream, not binary');
            if (!req.body) return res.status(403).send('Req Body is empty');
            if (!req.params.id && req.body) {
                this._imageDA.addOneImage(req)
                    .then((data) => {
                        return res.send(data);
                    })
                    .catch((err) => {
                        return res.status(403).send(err);
                    });
            } else {
                const [err, objId] = Util.parseObjectId(req.params.id);
                if (err || !objId) return res.status(403).send(String(err));
                this._imageDA.updateImageById(objId, req)
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