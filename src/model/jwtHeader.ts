import { ObjectId } from "mongodb";
/**
 * JWT token claim following iana: https://www.iana.org/assignments/jwt/jwt.xhtml#claims
 */

export interface JWTHeader {
    alg: string;
    typ: string;
}