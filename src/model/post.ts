import { ObjectId } from "mongodb";
import { prod_secret } from "../tensorvortex.com-secrets/serverSecret";


export interface SentenceInterface {

    tag: string;
    classes: string[];
    txt?: string;
    img?: string;
    quote?: string;
    newLine?: boolean;
}

export class Sentence implements SentenceInterface {

    tag: string;
    classes: string[];
    txt?: string;
    img?: string;
    quote?: string;
    newLine?: boolean;

    constructor(tag: string, classes?: string[], txt?: string, img?: string, quote?: string, newLine?: boolean) {
        this.tag = tag;
        this.classes = classes ?? [];
        this.txt = txt;
        this.img = img;
        this.quote = quote;
        this.newLine = newLine;
    }

    static initJson(json: SentenceInterface) {
        return new Sentence(json.tag, json.classes, json.txt, json.img, json.quote, json.newLine);
    }

    static initList(json: SentenceInterface[]) {
        return json.map((sentence) => {
            return Sentence.initJson(sentence);
        });
    }
}

export interface PostInterface {
    _id?: ObjectId;
    createdAt: Date;
    published: boolean;
    draft: boolean;
    author: string;
    title: string;
    subTitle: string;
    article: Sentence[];
}

export class Post implements PostInterface {

    _id?: ObjectId;
    createdAt: Date;
    published: boolean;
    draft: boolean;
    author: string;
    title: string;
    subTitle: string;
    article: Sentence[];

    constructor(_id?: ObjectId, createdAt?: Date, published?: boolean, draft?: boolean, author?: string, title?: string, subTitle?: string, article?: Sentence[]) {
        this._id = _id;
        this.createdAt = createdAt ?? new Date();
        this.published = published ?? false;
        this.draft = draft ?? true;
        this.author = author ?? "";
        this.title = title ?? "";
        this.subTitle = subTitle ?? "";
        this.article = article ?? [];
    }

    static initJson(json: PostInterface): Post {
        let sentences = Sentence.initList(json.article);
        return new Post(
            json._id,
            json.createdAt,
            json.published,
            json.draft,
            json.author,
            json.title,
            json.subTitle,
            sentences,
        );
    }

    static initList(list: PostInterface[]): Post[] {
        return list.map((usr) => {
            return this.initJson(usr);
        });
    }

}