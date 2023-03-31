# Asuna Accessories Demo

We demonstrate a simple but secure system that serves a frontend for the accessories while securely handling custody of accessories ownership with the help of AWS KMS. Integrations and infrastructure used: AWS, Fly, Coinbase Commerce, The Graph network.

An accessories contract deployed on Polygon houses our new nfts. When users equip or unequip an accessory, they request our system to initiate a txn. To provide a fee-less experience for users, the contract has a set of "manager" private keys housed within AWS KMS that will execute the transactions. The cold wallet is responsible for deploying the contract and setting managers.

The dapp queries general data from our subgraph hosted on [The Graph Hosted Service](https://thegraph.com/hosted-service/). Subgraphs index all blockchain data into a graphql schema we ourselves define. Our [accessory subgraph](https://thegraph.com/hosted-service/subgraph/dangdennis/accessory?selected=playground) stores relationships between asunas, their accessories, and owners (user addresses), and action requests (to be explained). See the `/subgraph`/ directory for details. The subgraph's data serves as the source of truth short of querying from a contract directly. We chose this solution over manually indexing the data into our database.

Because transactions may take an unpredictable amount of time to finalize, we handle have an AWS lambda cron job running every minute that will resolve equipment actions. When users request an equipment change, our server sends but does not wait for the transaction to complete. The server records the transaction hash as an `action_request`. The cron job is responsible for periodically querying our for all pending items from the database, check whether subgraph has a corresponding finalized `Request` entity, and updates the original request to a `Success` state on finding a `Request`. 

AWS Eventbridge serves as an additional store for all request attempts.

We use Remix as a server-side web framework with Prisma (ORM) and Planetscale (mysql database service). The technology can be easily swapped out so long as the patterns are replicated:

1. [Subgraphs](https://thegraph.com/)
1. Use of AWS infrastructure: KMS, Lambdas, Eventbridge.
2. Database to the actual nfts' metadata to avoid unnecessary fetches to IPFS.
3. Session-based authentication initialized with a user-signed message.

Asuna `0x12D35409f526D54FaDef3C79E009CB3Fb9a8044E`
https://rinkeby.etherscan.io/address/0x12D35409f526D54FaDef3C79E009CB3Fb9a8044E

Accessories `0xB43c8A75A8869fAA8F111facb16E7f1514aAd894`
https://mumbai.polygonscan.com/address/0xB43c8A75A8869fAA8F111facb16E7f1514aAd894

Accessory Holder `0xfdC1f085a3bf0DbE115650633d7A163953C49327`
https://mumbai.polygonscan.com/address/0xfdC1f085a3bf0DbE115650633d7A163953C49327

Example KMS hot wallet
https://rinkeby.etherscan.io/address/0x7be7fe9baeb8cb42ce5f39698355d26c7509ef85
https://mumbai.polygonscan.com/address/0x7be7fe9baeb8cb42ce5f39698355d26c7509ef85

-   [Remix Docs](https://remix.run/docs)

## Fly Setup

1. [Install `flyctl`](https://fly.io/docs/getting-started/installing-flyctl/)

2. Sign up and log in to Fly

```sh
flyctl auth signup
```

3. Setup Fly. It might ask if you want to deploy, say no since you haven't built the app yet.

```sh
flyctl launch
```

## Development

From your terminal:

```sh
npm run dev
```

This starts your app in development mode, rebuilding assets on file changes.

## First Time Deployment and Development Setups

1. Assuming accessory and holder contracts + subgraphs are deployed: update contract addresses and abis used in `providers.server.ts` as necessary.
1. See `.env.example`. Create a new `.env` file. Fill env vars for AWS.
1. Create asymmetric, sign-and-verify, ECC_SECG_P256K1 KMS key(s). Get key arn id from AWS KMS console. Set `KEY_PAIR_ARN` in `.env`.
1. Deploy CDK infra first: `npm run cdk:deploy`.
1. Fill env vars in `.env.` for server.
1. Set Fly secrets: `fly secrets set <list all the key:pairs here>`.
1. Deploy Remix server to Fly: `fly deploy`.

**CDK**

```sh
asuna_app % npm run cdk:deploy --stage <stage-name>
```

**Fly**

If you've followed the setup instructions already, all you need to do is run this:

```sh
asuna_app % npm run deploy
```

You can run `flyctl info` to get the url and ip address of your server.

Check out the [fly docs](https://fly.io/docs/getting-started/node/) for more information.
