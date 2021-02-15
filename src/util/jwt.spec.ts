
import { JWT } from './jwt';
import { JWTHeader } from '../model/jwtHeader';
import { JWTPayload } from '../model/jwtPayload';
import { ObjectId } from 'mongodb';

describe('JWT', () => {
    const header: JWTHeader = {
        alg: 'HS256',
        typ: 'JWT',
    };
    const payload: JWTPayload = {
        clientId: new ObjectId('5e3e2afee57d69835b949a26'),
        exp: 15552000000,
        iat: '2020-01-24T16:59:17.762Z',
    };
    it('should generate correct header Base64', () => {
        const [, headerToken] = JWT.encodeBase64(header);
        expect(headerToken).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should generate correct payload Base64', () => {
        const [, payloadToken] = JWT.encodeBase64(payload);
        expect(payloadToken).toBe('eyJjbGllbnRfaWQiOiI1ZTNlMmFmZWU1N2Q2OTgzNWI5NDlhMjYiLCJleHAiOjE1NTUyMDAwMDAwLCJpYXQiOiIyMDIwLTAxLTI0VDE2OjU5OjE3Ljc2MloifQ');
    });

    it('should generate correct signature from header and payload base64 string', () => {
        const [headerErr, headerToken] = JWT.encodeBase64(header);
        const [payloadErr, payloadToken] = JWT.encodeBase64(payload);
        const [sigErr, sig] = JWT.encodeSigWithToken(headerToken!, payloadToken!);
        expect(sig).toBe('5NKm4Ca7HOJiZ8ur66VoPpCvhzq-xMho9-mxC9uDRTs');
    });

    it('should generate correct signature from header and payload data', () => {
        const [sigErr, sig] = JWT.encodeSignature(JSON.parse(JSON.stringify(header)), JSON.parse(JSON.stringify(payload)));
        expect(sig).toBe('5NKm4Ca7HOJiZ8ur66VoPpCvhzq-xMho9-mxC9uDRTs');
    });

    it('should generate correct jwt', () => {
        const [jwtErr, jwt] = JWT.fromData(header, payload);
        const result = jwt?.generateJWTToken().value;
        expect(result).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiI1ZTNlMmFmZWU1N2Q2OTgzNWI5NDlhMjYiLCJleHAiOjE1NTUyMDAwMDAwLCJpYXQiOiIyMDIwLTAxLTI0VDE2OjU5OjE3Ljc2MloifQ.5NKm4Ca7HOJiZ8ur66VoPpCvhzq-xMho9-mxC9uDRTs');
    });

});