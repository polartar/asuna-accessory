// npx ts-node scripts/read_kms_key.ts
import { AwsKmsSigner } from "ethers-aws-kms-signer"
// import { MumbaiProvider, RinkebyProvider } from "../app/libs/providers.server"

// Replace key pair id
// const KEY_PAIR_ARN = "arn:aws:kms:us-east-1:932385572887:key/cde899c9-2d5b-4cb1-b6b4-52b58f8b320b"

// const rinkebySigner = new AwsKmsSigner(
//     {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID, // credentials for your IAM user with KMS access
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // credentials for your IAM user with KMS access
//         region: "us-east-1",
//         keyId: KEY_PAIR_ARN,
//     },
//     RinkebyProvider
// )

// const mumbaiSigner = new AwsKmsSigner(
//     {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID, // credentials for your IAM user with KMS access
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // credentials for your IAM user with KMS access
//         region: "us-east-1",
//         keyId: KEY_PAIR_ARN,
//     },
//     MumbaiProvider
// )

async function run() {
    console.log("KMS Key")
    // console.log(`Address - ${await mumbaiSigner.getAddress()}`)
}

run()
