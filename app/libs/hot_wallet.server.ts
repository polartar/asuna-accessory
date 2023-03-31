import { ethers, Wallet } from "ethers"
import { AccessoriesHolderAbi, ACCESSORY_HOLDER_ADDR, MumbaiProvider } from "./providers.server"
import { AwsKmsSigner } from "ethers-aws-kms-signer"

if (!process.env.KEY_PAIR_ARN) {
    throw new Error("Missing KEY_PAIR_ARN")
}

// const HotWalletMumbaiSigner = new AwsKmsSigner(
//     {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID, // credentials for your IAM user with KMS access
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // credentials for your IAM user with KMS access
//         region: "us-east-1",
//         keyId: process.env.KEY_PAIR_ARN,
//     },
//     MumbaiProvider
// )
const HotWalletMumbaiSigner = new Wallet(process.env.PRIVATE_KEY || "", MumbaiProvider)

export const AccessoriesHolderHotContract = new ethers.Contract(
    ACCESSORY_HOLDER_ADDR,
    AccessoriesHolderAbi,
    HotWalletMumbaiSigner
)
