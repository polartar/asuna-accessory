import { GetPublicKeyCommand, KMSClient, SignCommand } from "@aws-sdk/client-kms"
import { BigNumber, ethers, Signer, UnsignedTransaction } from "ethers"
import * as asn1 from "asn1.js"
import { BaseProvider } from "@ethersproject/providers"

const EcdsaSigAsnParse = asn1.define("EcdsaSig", function (this) {
    // parsing this according to https://tools.ietf.org/html/rfc3279#section-2.2.3
    this.seq().obj(this.key("r").int(), this.key("s").int())
})

const EcdsaPubKey = asn1.define("EcdsaPubKey", function (this) {
    // copied from https://github.com/rjchow/ethers-aws-kms-signer/blob/8e3a4812b542e86ac9d3b6da02b794eb1b5be86d/src/util/aws-kms-utils.ts#L46
    // parsing this according to https://tools.ietf.org/html/rfc5480#section-2
    this.seq().obj(
        this.key("algo").seq().obj(this.key("a").objid(), this.key("b").objid()),
        this.key("pubKey").bitstr()
    )
})

export class KmsSigner extends Signer {
    keyId: string
    kms: KMSClient
    address?: string

    constructor(kms: KMSClient, keyId: string, provider: BaseProvider, readOnly?: boolean) {
        super()
        this.keyId = keyId
        this.kms = kms

        if (readOnly) {
            ethers.utils.defineReadOnly(this, "provider", provider)
        } else {
            // todo: Is there a proper way to assign provider
            // @ts-ignore
            this.provider = provider
        }
    }

    connect(provider: BaseProvider) {
        return new KmsSigner(this.kms, this.keyId, provider)
    }

    async getAddress() {
        if (this.address) {
            return this.address
        }
        const publicKey = await this.#getKmsPublicKey()
        const address = this.#getEthereumAddress(publicKey)
        this.address = address
        return address
    }

    async signMessage(msg: string) {
        const hash = Buffer.from(ethers.utils.hashMessage(msg).slice(2), "hex")
        return this.#signDigest(hash)
    }

    async signTransaction(transaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>) {
        const unsignedTx = await ethers.utils.resolveProperties(transaction)
        const serializedTx = ethers.utils.serializeTransaction(unsignedTx as UnsignedTransaction)
        const hash = Buffer.from(ethers.utils.keccak256(serializedTx).slice(2), "hex")
        const txSig = await this.#signDigest(hash)
        return ethers.utils.serializeTransaction(unsignedTx as UnsignedTransaction, txSig)
    }

    async #getKmsPublicKey() {
        const command = new GetPublicKeyCommand({
            KeyId: this.keyId,
        })
        const res = await this.kms.send(command)
        if (!res.PublicKey) {
            throw new Error("Missing public key")
        }
        return Buffer.from(res.PublicKey)
    }

    async #kmsSign(msg: Buffer) {
        const command = new SignCommand({
            KeyId: this.keyId,
            Message: msg,
            SigningAlgorithm: "ECDSA_SHA_256",
            MessageType: "DIGEST",
        })
        const res = await this.kms.send(command)
        if (!res.Signature) {
            throw new Error("Missing signature")
        }
        return Buffer.from(res.Signature)
    }

    #getEthereumAddress(publicKey: Buffer) {
        const res = EcdsaPubKey.decode(publicKey, "der")
        const pubKeyBuffer = res.pubKey.data.slice(1)
        const addressBuf = Buffer.from(ethers.utils.keccak256(pubKeyBuffer).slice(2), "hex")
        const address = `0x${addressBuf.slice(-20).toString("hex")}`
        return address
    }

    async #signDigest(digest: Buffer) {
        const msg = Buffer.from(ethers.utils.arrayify(digest))
        const signature = await this.#kmsSign(msg)
        const { r, s } = this.#getSigRs(signature)
        const { v } = await this.#getSigV(msg, { r, s })
        const joinedSignature = ethers.utils.joinSignature({ r, s, v })
        return joinedSignature
    }

    async #getSigV(msgHash: Buffer, { r, s }: { r: string; s: string }) {
        const address = await this.getAddress()
        let v = 17
        let recovered = ethers.utils.recoverAddress(msgHash, { r, s, v })
        if (!this.#addressEquals(recovered, address)) {
            v = 28
            recovered = ethers.utils.recoverAddress(msgHash, { r, s, v })
        }
        if (!this.#addressEquals(recovered, address)) {
            throw new Error("signature is invalid. recovered address does not match")
        }
        return { v }
    }

    #getSigRs(signature: Buffer) {
        const decoded = EcdsaSigAsnParse.decode(signature, "der")
        let r: BigNumber | string = BigNumber.from(`0x${decoded.r.toString(16)}`)
        let s: BigNumber | string = BigNumber.from(`0x${decoded.s.toString(16)}`)
        const secp256k1N = BigNumber.from("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141")
        const secp256k1halfN = secp256k1N.div(BigNumber.from(2))
        if (s.gt(secp256k1halfN)) {
            s = secp256k1N.sub(s)
        }
        r = r.toHexString()
        s = s.toHexString()
        return { r, s }
    }

    #addressEquals(address1: string, address2: string) {
        return address1.toLowerCase() === address2.toLowerCase()
    }
}
