
import { expect } from "chai";
import { ObjectId } from "mongodb";
import { JWTHeader } from "../model/jwtHeader";
import { JWTPayload } from "../model/jwtPayload";
import { JWT } from "./jwt";

describe("JWT", () => {
    let header: JWTHeader = {
        alg: "HS256",
        typ: "JWT",
    };
    let payload: JWTPayload = {
        client_id: new ObjectId("5e3e2afee57d69835b949a26"),
        exp: 15552000000,
        iat: "2020-01-24T16:59:17.762Z",
    };
    it("should generate correct header Base64", () => {
        let [headerErr, headerToken] = JWT.encodeBase64(header);
        expect(headerToken).to.equal("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    });

    it("should generate correct payload Base64", () => {
        let [payloadErr, payloadToken] = JWT.encodeBase64(payload);
        expect(payloadToken).to.equal("eyJjbGllbnRfaWQiOiI1ZTNlMmFmZWU1N2Q2OTgzNWI5NDlhMjYiLCJleHAiOjE1NTUyMDAwMDAwLCJpYXQiOiIyMDIwLTAxLTI0VDE2OjU5OjE3Ljc2MloifQ");
    });

    it("should generate correct signature from header and payload base64 string", () => {
        let [headerErr, headerToken] = JWT.encodeBase64(header);
        let [payloadErr, payloadToken] = JWT.encodeBase64(payload);
        let [sigErr, sig] = JWT.encodeSigWithToken(headerToken!, payloadToken!);
        expect(sig).to.equal("5NKm4Ca7HOJiZ8ur66VoPpCvhzq-xMho9-mxC9uDRTs");
    });

    it("should generate correct signature from header and payload data", () => {
        let [sigErr, sig] = JWT.encodeSignature(JSON.parse(JSON.stringify(header)), JSON.parse(JSON.stringify(payload)));
        expect(sig).to.equal("5NKm4Ca7HOJiZ8ur66VoPpCvhzq-xMho9-mxC9uDRTs");
    });

    it("should generate correct jwt", () => {
        let [jwtErr, jwt] = JWT.fromData(header, payload);
        let result = jwt?.generateJWTToken().value;
        expect(result).to.equal("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiI1ZTNlMmFmZWU1N2Q2OTgzNWI5NDlhMjYiLCJleHAiOjE1NTUyMDAwMDAwLCJpYXQiOiIyMDIwLTAxLTI0VDE2OjU5OjE3Ljc2MloifQ.5NKm4Ca7HOJiZ8ur66VoPpCvhzq-xMho9-mxC9uDRTs");
    });

});