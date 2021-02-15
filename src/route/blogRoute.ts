/* eslint-disable @typescript-eslint/no-empty-function */
import { Request, Response, Router } from 'express';
import { BlogDataAccess } from '../dataAccess/blogDataAccess';
import { Util } from '../util/util';

export class BlogRoute {

    _blogDA: BlogDataAccess;

    constructor(blogDA: BlogDataAccess) {
        this._blogDA = blogDA;
    }

    public getRoutes(): unknown {
        const router = Router();

        router.get('/api/posts', (req: Request, res: Response) => {
            this._blogDA.getAllBlog()
                .then((data) => {
                    return res.send(data);
                })
                .catch((err) => {
                    return res.status(403).send(err);
                });

        });
        router.get('/api/post/:id', (req: Request, res: Response) => {

        });


        router.get('/api/drafts', (req: Request, res: Response) => {

        });
        router.get('/api/draft/:id', (req: Request, res: Response) => {

        });


        router.post('/api/draft', (req: Request, res: Response) => {

        });
        router.post('/api/post/:id', (req: Request, res: Response) => {

        });

        router.get('/api/comments/:blogId', (req: Request, res: Response) => {

            const [err, blogId] = Util.parseObjectId(req.params.blogId);
            if (blogId && req.params.blogId) return this._blogDA.getAllComments(blogId);


            return res.status(403).send('No BlogID For comments retrieval.');
        });

        router.get('/api/comment', (req: Request, res: Response) => {

        });
        router.get('/api/comment/:id', (req: Request, res: Response) => {

        });

        router.post('/api/comment', (req: Request, res: Response) => {

        });

        router.post('/api/comment/:id', (req: Request, res: Response) => {

        });


        return router;
    }
}