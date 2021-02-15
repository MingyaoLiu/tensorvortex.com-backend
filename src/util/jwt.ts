/**
 * @file jwt.ts
 * @author Mingyao Liu <tensorvortex@gmail.com>
 * @version 1.0
 * @license tensorvortex@2020
 */

import { Buffer } from 'buffer';
import { createHmac, sign } from 'crypto';
import { ObjectId } from 'mongodb';
import { JWTHeader } from '../model/jwtHeader';
import { JWTPayload } from '../model/jwtPayload';
import { getConfig } from './config';
import { ServerError } from './constants';



export interface JWTInterface {
    header: JWTHeader;
    payload: JWTPayload;
    signature: string;
}

export type JWTToken = { value: string };

export class JWT {

    _jwt: JWTInterface;

    constructor(jwt: JWTInterface) {
        this._jwt = jwt;
    }

    public verifyToken(): [TypeError?, boolean?] {
        try {
            const headerData = this._jwt.header;
            const payloadData = this._jwt.payload;
            const [headErr, headerToken] = JWT.encodeBase64(headerData);
            const [payloErr, payloadToken] = JWT.encodeBase64(payloadData);
            if (headErr || payloErr || !headerToken || !payloadToken) return [TypeError(String(headErr?.message) + String(payloErr?.message))];
            const [err, sig] = JWT.encodeSigWithToken(headerToken, payloadToken);
            if (err) return [err];
            if (!sig || sig !== this._jwt.signature) return [ServerError.JWT_SIG_VERI_FAILED];
            return [, true];
        } catch (err) {
            return [err]
        }

    }

    public generateJWTToken(): JWTToken {
        const [headErr, headerToken] = JWT.encodeBase64(this._jwt.header);
        const [payloErr, payloadToken] = JWT.encodeBase64(this._jwt.payload);
        const jwtToken = headerToken + '.' + payloadToken + '.' + this._jwt.signature;
        return { value: jwtToken };
    }

    // static genJSONFromData(data: JWTHeader | JWTPayload): object {
    //     return JSON.parse(JSON.stringify(data));
    // }

    static initHeaderFromJSON(json: any): JWTHeader {
        const header: JWTHeader = {
            alg: json.alg,
            typ: json.typ,
        };
        return header;
    }

    static initPayloadFromJSON(json: any): JWTPayload {
        const payload: JWTPayload = {
            clientId: new ObjectId(json.clientId),
            exp: Number(json.exp),
            iat: json.iat,
        };
        return payload;
    }

    static initJWTFromData(header: JWTHeader, payload: JWTPayload, signature: string): JWTInterface {
        const jwtData: JWTInterface = {
            header: header,
            payload: payload,
            signature: signature,
        };
        return jwtData;
    }

    /**
    * @method fromData
    * @description generate new JWT from json object
    * @param header object
    * @param payload object
    * @returns Tuple(TypeError?, JWT?)
    */
    static fromData(header: object, payload: object): [TypeError?, JWT?] {
        const [heaErr, headerToken] = this.encodeBase64(header);
        const [payloErr, payloadToken] = this.encodeBase64(payload);
        if (heaErr || payloErr || !headerToken || !payloadToken) return [TypeError(String(heaErr?.message) + String(payloErr?.message))];
        const [sigErr, sigToken] = this.encodeSigWithToken(headerToken, payloadToken);
        if (sigErr || !sigToken) return [sigErr];
        const headerData = this.initHeaderFromJSON(header);
        const payloadData = this.initPayloadFromJSON(payload);
        return [, new JWT(this.initJWTFromData(headerData, payloadData, sigToken))];
    }

    /**
    * @method fromToken
    * @description generate a new JWT from token.
    * @param token JWTToken
    * @returns Tuple(TypeError?, JWT?)
    */
    static fromToken(token: JWTToken): [TypeError?, JWT?] {
        const [veriErr, isValid] = this.sigIntegrityCheck(token);
        if (veriErr || !isValid) return [veriErr];
        const lst = token.value.split('.');
        if (lst.length < 2 || lst.length > 3) return [ServerError.JWT_TOKEN_INVALID];
        const [heaErr, header] = this.decodeBase64(lst[0]);
        const [payloErr, payload] = this.decodeBase64(lst[1]);
        if (heaErr || payloErr || !header || !payload) return [TypeError(String(heaErr?.message) + String(payloErr?.message))];
        const headerData = this.initHeaderFromJSON(header);
        const payloadData = this.initPayloadFromJSON(payload);
        return [, new JWT(this.initJWTFromData(headerData, payloadData, lst[2]))];
    }

    /**
    * @method encodeBase64
    * @description Encode obj to base64 string.
    * @param data Buffer Object
    * @returns Tuple(TypeError?, string?)
    */
    static encodeBase64(data: Buffer): string {
        const str = JSON.stringify(data);
        return Buffer.from(str)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * @method decodeBase64
     * @description Decode base64 encoded string
     * @param str string
     * @returns Tuple(TypeError?, object?)
     */
    static decodeBase64(str: string): [TypeError?, object?] {
        try {
            const buf = Buffer.from(str, 'base64').toString('binary');
            const de = JSON.parse(buf);
            return [, de];
        } catch (err) { return [ServerError.JWT_BASE64_DEC_FAILED]; }
    }

    /**
     * @method encodeSigWithToken
     * @description Encode signature with token string
     * @param header string
     * @param payload string
     * @returns Tuple(TypeError?, string?)
     */
    static encodeSigWithToken(header: string, payload: string): [TypeError?, string?] {
        try {
            const sig: string = createHmac('SHA256', getConfig().app_secret)
                .update(header + '.' + payload)
                .digest('base64')
                .replace(/=/g, '')
                .replace(/\+/g, '-')
                .replace(/\//g, '_');
            if (!sig) return [ServerError.JWT_SIG_ENC_ERROR];
            return [, sig];
        } catch (err) { return [TypeError(String(err))]; }
    }

    /**
     * @method encodeSignature
     * @description Encode signature based on header and payload data.
     * @param header JWTHeader
     * @param payload JWTPayload
     * @returns Tuple(TypeError?, string?)
     */
    static encodeSignature(header: JWTHeader, payload: JWTPayload): [TypeError?, string?] {
        try {
            const [headerErr, headerToken] = JWT.encodeBase64(header);
            const [payloadErr, payloadToken] = JWT.encodeBase64(payload);
            if (headerErr || payloadErr || !headerToken || !payloadToken) return [TypeError(String(headerErr?.message) + String(payloadErr?.message))];
            return this.encodeSigWithToken(headerToken, payloadToken);
        } catch (err) { return [TypeError(String(err))]; }
    }

    /**
     * @method tokenCheck
     * @description Full token validity check.
     * @param token JWTToken
     * @returns Tuple(TypeError?, JWTPayload?)
     */
    static tokenCheck(token: JWTToken): [TypeError?, JWTPayload?] {
        const [err, jwt] = JWT.fromToken(token);
        if (err || !jwt) return [err];
        const payload = jwt._jwt.payload;
        const [expErr, isValid] = JWT.verifyExpiration(payload);
        if (expErr || !isValid) return [expErr];
        return [, payload];
    }

    /**
    * @method verifyTokenExpiration
    * @description verify if token has expired based on the token's iat and exp time.
    * @param payload JWTPayload
    * @returns Tuple(TypeError?, Boolean?)
    */
    static verifyExpiration(payloadData: JWTPayload): [TypeError?, boolean?] {
        const iatDate: Date = new Date(payloadData.iat);
        const expDate = new Date(iatDate.setTime(iatDate.getTime() + payloadData.exp));
        if (expDate <= new Date()) {
            return [ServerError.JWT_TOKEN_EXPIRED, false];
        }
        return [, true];
    }

    /**
    * @method sigIntegrityCheck
    * @description token signature integrity check
    * @param token JWTToken
    * @returns Tuple(TypeError?, Boolean?)
    */
    static sigIntegrityCheck(token: JWTToken): [TypeError?, boolean?] {
        const lst = token.value.split('.');
        if (lst.length < 2 || lst.length > 3) return [ServerError.JWT_TOKEN_INVALID];
        const [err, sig] = this.encodeSigWithToken(lst[0], lst[1]);
        if (err) return [err];
        if (!sig || sig !== lst[2]) return [ServerError.JWT_SIG_VERI_FAILED];
        return [, true];
    }

}