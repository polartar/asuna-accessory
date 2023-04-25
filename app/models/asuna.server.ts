import { Accessory, Asuna } from "@prisma/client"
import { BigNumber } from "ethers"
import { request as gqlRequest, gql } from "graphql-request"
import { prisma } from "~/db.server"
import { AccessoryContract, AsunaContract, ACCESSORY_SUBGRAPH } from "~/libs/providers.server"
import { fetchAndCacheAccessories, fromAccessoryDB } from "./accessory.server"
import { AccessoryDTO, AsunaDTO, Metadata } from "./types"

export async function getAsuna(asunaId: number): Promise<{ asuna: AsunaDTO; accessories: AccessoryDTO[] } | null> {
    const data = await gqlRequest<
        {
            asuna: {
                token_id: string
                accessories: {
                    accessory: {
                        token_id: string
                    }
                }[]
            } | null
        },
        {
            asunaId: string
        }
    >(
        ACCESSORY_SUBGRAPH,
        gql`
            query getToken($asunaId: String!) {
                asuna(id: $asunaId) {
                    token_id
                    accessories {
                        accessory {
                            token_id
                        }
                    }
                }
            }
        `,
        {
            asunaId: `asuna-${asunaId}`,
        }
    )

    const accessoryIds = data.asuna?.accessories.map(a => parseInt(a.accessory.token_id)) ?? []

    const accessories = await prisma.accessory.findMany({
        where: {
            id: {
                in: accessoryIds,
            },
        },
    })

    const accessoriesIdMap =
        accessories.reduce((acc, next) => {
            acc[next.id] = next
            return acc
        }, {} as Record<number, Accessory>) ?? {}

    const uncachedIds = accessoryIds.filter(a => {
        return !accessoriesIdMap[a]
    })

    await fetchAndCacheAccessories(AccessoryContract, uncachedIds)

    let asuna = await prisma.asuna.findUnique({
        where: {
            id: asunaId,
        },
    })

    if (!asuna) {
        return null
    }

    return {
        asuna: fromAsunaDB(asuna),
        accessories: accessories.map(a => fromAccessoryDB(a)),
    }
}

export async function getAsunaBalance(contract: typeof AsunaContract, address: string): Promise<number> {
    const balance: BigNumber = await contract.balanceOf(address)
    if (balance._isBigNumber) {
        return balance.toNumber()
    }

    return 0
}

export async function getOwnAsunas(
    contract: typeof AsunaContract,
    ownerAddr: string,
    opts?: { readOnly: boolean }
): Promise<AsunaDTO[]> {
    const ownedAsunas: AsunaDTO[] = []
    const ownTokenIds = await getOwnerAsunaTokenIds(contract, ownerAddr)

    const asunasDb = await prisma.asuna.findMany({
        where: {
            id: {
                in: ownTokenIds,
            },
        },
    })

    for (const asuna of asunasDb) {
        ownedAsunas.push(fromAsunaDB(asuna))
    }

    const uncachedIds = ownTokenIds.filter(id => {
        if (asunasDb.find(a => a.id === id)) {
            return false
        }
        return true
    })

    if (!opts?.readOnly) {
        await fetchAndCacheAsunas(contract, ownerAddr, uncachedIds)
    }

    return ownedAsunas
}

export function fromAsunaDB(asuna: Asuna): AsunaDTO {
    return {
        token_id: asuna.id,
        token_uri: asuna.token_uri,
        metadata: JSON.parse(asuna.metadata?.toString() ?? "{}"),
    }
}

async function getOwnerAsunaTokenIds(contract: typeof AsunaContract, ownerAddr: string): Promise<number[]> {
    const bal = await getAsunaBalance(contract, ownerAddr)

    const tokenIdPromises: Promise<BigNumber>[] = []
    for (let i = 0; i < bal; i++) {
        tokenIdPromises.push(contract.tokenOfOwnerByIndex(ownerAddr, i))
    }
    return (await Promise.all(tokenIdPromises)).map(i => i.toNumber())
}

async function fetchAndCacheAsunas(
    contract: typeof AsunaContract,
    ownerAddr: string,
    uncachedIds: number[]
): Promise<void> {
    const tokenUriPromises: Promise<string>[] = []
    for (const tokenId of uncachedIds) {
        tokenUriPromises.push(contract.tokenURI(tokenId))
    }
    const tokenUris = await Promise.all(tokenUriPromises)

    const metadataPromises: Promise<Metadata>[] = []
    for (const uri of tokenUris) {
        metadataPromises.push(fetch(uri).then(r => r.json()))
    }
    const metadatas = await Promise.all(metadataPromises)

    for (let i = 0; i < uncachedIds.length; i++) {
        const tokenId = uncachedIds[i]
        const tokenUri = tokenUris[i]
        const metadata = metadatas[i]
        await prisma.asuna.upsert({
            create: {
                id: tokenId,
                metadata: JSON.stringify(metadata),
                token_uri: tokenUri,
            },
            update: {
                id: tokenId,
                metadata: JSON.stringify(metadata),
                token_uri: tokenUri,
            },
            where: {
                id: tokenId,
            },
        })
    }
}
