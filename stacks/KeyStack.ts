import * as sst from "@serverless-stack/resources"
import * as kms from "aws-cdk-lib/aws-kms"
import * as iam from "aws-cdk-lib/aws-iam"

export class KeyStack extends sst.Stack {
    public readonly walletKey: kms.IKey
    public readonly userHuman: iam.User
    public readonly userMachine: iam.User
    public readonly keyAccessRole: iam.Role

    constructor(scope: sst.App, id: string, props?: sst.StackProps) {
        super(scope, id, props)

        if (!process.env.KEY_PAIR_ARN) {
            throw new Error("Require process.env.KEY_PAIR_ARN")
        }

        this.walletKey = kms.Key.fromKeyArn(this, "HotWalletKey", process.env.KEY_PAIR_ARN)

        this.keyAccessRole = new iam.Role(this, "KeyAccessRole", {
            description: "Permissions to access hot wallet keys",
            roleName: `HotWalletAccessRole${this.stage}`,
            assumedBy: new iam.AccountPrincipal(scope.account),
        })

        this.userMachine = new iam.User(this, "Machine", {})
        this.userHuman = new iam.User(this, "Admin")
        this.keyAccessRole.grant(this.userHuman, "kms:*")

        this.walletKey.grantEncryptDecrypt(this.userHuman)
        this.walletKey.grantEncryptDecrypt(this.keyAccessRole)
        this.walletKey.grant(this.keyAccessRole, "kms:GetPublicKey", "kms:Sign")
    }
}
