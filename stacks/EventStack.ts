import * as sst from "@serverless-stack/resources"

export class EventStack extends sst.Stack {
    eventBus: sst.EventBus
    reconcilerWorker: sst.Cron
    coinbaseQueue: sst.Queue
    coinbaseDlq: sst.Queue
    coinbaseEventReader: sst.Function

    constructor(scope: sst.App, id: string, props?: sst.StackProps) {
        super(scope, id, props)

        if (!process.env.DATABASE_URL && !process.env.DATABASE_URL) {
            throw new Error("Require process.env.DATABASE_URL")
        }

        this.reconcilerWorker = new sst.Cron(this, "Cron", {
            schedule: "rate(1 minute)",
            job: {
                function: {
                    handler: "app/functions/txn_reconciler_worker.main",
                    runtime: "nodejs14.x",
                    environment: {
                        DATABASE_URL: process.env.DATABASE_URL_LAMBDA || process.env.DATABASE_URL,
                        STAGE_NAME: this.stage,
                    },
                },
            },
        })

        this.coinbaseEventReader = new sst.Function(this, "CoinbaseEventReader", {
            handler: "app/functions/coinbase_event_reader.main",
            runtime: "nodejs14.x",
            timeout: "30 seconds",
            environment: {
                AWS_ACCOUNT: this.account,
                DATABASE_URL: process.env.DATABASE_URL_LAMBDA || process.env.DATABASE_URL,
                STAGE_NAME: this.stage,
            },
        })

        this.coinbaseDlq = new sst.Queue(this, "CoinbaseEventDLQ")

        this.coinbaseQueue = new sst.Queue(this, "CoinbaseEventQueue", {
            consumer: this.coinbaseEventReader,
            cdk: {
                queue: {
                    deadLetterQueue: {
                        queue: this.coinbaseDlq.cdk.queue,
                        maxReceiveCount: 3,
                    },
                },
            },
        })

        this.coinbaseEventReader.addEnvironment("QUEUE_URL", this.coinbaseQueue.cdk.queue.queueUrl)

        this.eventBus = new sst.EventBus(this, "Bus", {
            rules: {
                coinbase_event: {
                    pattern: {
                        source: ["asuna.remix"],
                        detailType: ["Coinbase Event"],
                    },
                    targets: {
                        coinbaseEventQueue: {
                            queue: this.coinbaseQueue,
                            type: "queue",
                        },
                    },
                },
                equipment: {
                    pattern: {
                        source: ["asuna.remix"],
                        detail: {
                            id: [{ exists: true }],
                            accessory_id: [{ exists: true }],
                            asuna_id: [{ exists: true }],
                            req_address: [{ exists: true }],
                            action_type: [{ exists: true }, "Equip", "Unequip"],
                            txn_hash: [{ exists: true }],
                        },
                        detailType: ["Equipment Transaction Request"],
                    },
                },
            },
        })
    }
}
