
export const Constant = {

};

export const ServerError = {

    JWT_BASE64_DEC_FAILED: TypeError("Base64 Decode Failed."),
    JWT_SIG_VERI_FAILED: TypeError("Token Signature verification failed."),
    JWT_SIG_ENC_ERROR: TypeError("Token Signature Encoding Failed."),
    JWT_TOKEN_INVALID: TypeError("Token is invalid"),
    JWT_VERIFICATION_FAILED: TypeError("JWT Signature Verification Failed."),
    JWT_TOKEN_EXPIRED: TypeError("Token has expired"),
};