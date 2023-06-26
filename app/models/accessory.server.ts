import { Accessory, ActionRequest } from "@prisma/client"
import { BigNumber } from "ethers"
import { prisma } from "~/db.server"
import { AccessoryContract, ACCESSORY_SUBGRAPH } from "~/libs/providers.server"
import { AccessoryDTO, Metadata } from "./types"
import { request as gqlRequest, gql } from "graphql-request"

export async function getUnequippedAccessories(input: { ownerAddress: string }): Promise<AccessoryDTO[]> {
    const ownerAccessories = await getOwnAccessories(AccessoryContract, input.ownerAddress, {
        readOnly: false,
    })

    const accToAsunas = await prisma.accessory.findMany({
        where: {
            id: {
                in: ownerAccessories.map(a => a.token_id),
            },
            AccessoryToAsuna: {
                every: {
                    asuna_id: null,
                },
            },
        },
    })

    return accToAsunas.map(a => fromAccessoryDB(a))
}

export async function getAccessoryBalance(contract: typeof AccessoryContract, address: string): Promise<number> {
    const balance: BigNumber = await contract.balanceOf(address)
    if (balance._isBigNumber) {
        return balance.toNumber()
    }

    return 0
}

export async function getOwnAccessories(
    contract: typeof AccessoryContract,
    ownerAddr: string,
    opts?: { readOnly: boolean }
): Promise<AccessoryDTO[]> {
    const data = await gqlRequest<
        {
            owner: {
                accessories: {
                    amount: string
                    accessory: {
                        id: string
                        token_id: string
                        metadata_uri: string
                    }
                }[]
            } | null
        },
        {
            ownerId: string
        }
    >(
        ACCESSORY_SUBGRAPH,
        gql`
            query getOwnAccessories($ownerId: String!) {
                owner(id: $ownerId) {
                    id
                    address
                    accessories {
                        amount
                        accessory {
                            id
                            token_id
                            metadata_uri
                        }
                    }
                }
            }
        `,
        {
            ownerId: `owner-${ownerAddr.toLowerCase()}`,
        }
    )
    if (!data.owner) {
        return []
    }

    const ownTokenIds = data.owner.accessories.map(a => parseInt(a.accessory.token_id))

    const accessoriesDb = await prisma.accessory.findMany({
        where: {
            id: {
                in: ownTokenIds,
            },
        },
    })

    const ownedAccessories: AccessoryDTO[] = accessoriesDb.map((a, i) => {
        return fromAccessoryDB(a, {
            amount: parseInt(data.owner?.accessories[i].amount ?? "0"),
        })
    })

    if (!opts?.readOnly) {
        const uncachedIds = ownTokenIds.filter(id => {
            if (accessoriesDb.find(a => a.id === id)) {
                return false
            }
            return true
        })

        await fetchAndCacheAccessories(contract, uncachedIds)
    }

    return ownedAccessories
}

export function fromAccessoryDB(
    accessory: Accessory,
    opts?: {
        // Current implementation doesn't store the accessory balance in the db.
        // We optionally fetch and collect the accessory amount from the subgraph and add it to our dto.
        amount?: number
    }
): AccessoryDTO {
    return {
        amount: opts?.amount,
        token_id: accessory.id,
        token_uri: accessory.token_uri,
        metadata: JSON.parse(accessory.metadata?.toString() ?? "{}"),
    }
}

export async function fetchAndCacheAccessories(
    contract: typeof AccessoryContract,
    uncachedIds: number[]
): Promise<void> {
    const tokenUriPromises: Promise<string>[] = []
    for (const tokenId of uncachedIds) {
        tokenUriPromises.push(contract.uri(tokenId))
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
        await prisma.accessory.upsert({
            create: {
                id: tokenId,
                metadata: JSON.stringify(metadata),
                token_uri: tokenUri,
            },
            update: {},
            where: {
                id: tokenId,
            },
        })
    }
}
