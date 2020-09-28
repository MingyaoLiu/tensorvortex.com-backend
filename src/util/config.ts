import fs from "fs";
import path from "path";
import { common_secret, dev_secret, prod_secret, SecretInterface } from "../secrets/serverSecret";

export function getConfig(): SecretInterface {
    const isDev = fs.existsSync(path.join(__dirname + "/thisIsDevEnvironment"));
    if (isDev) {
        return dev_secret;
    }
    return prod_secret;
}

export function getCommonSecret() {
    return common_secret;
}