import {PublicKey} from "@solana/web3.js";
import {PROGRAM_ID} from "../constants/config";

export const getFaucetUserPDA=  (mint:PublicKey,user:PublicKey): [PublicKey,number] =>{
    return PublicKey.findProgramAddressSync(
        [Buffer.from("user"),mint.toBuffer(),user.toBuffer()],
        PROGRAM_ID
    );
};

export const getFaucetAuthorityPDA =():[PublicKey,number]=>{
    return PublicKey.findProgramAddressSync(
        [Buffer.from("authority")],
        PROGRAM_ID
    );
};