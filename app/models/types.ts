import { Accessory, AccessoryToAsuna, ActionRequest, Asuna } from "@prisma/client"

export type Metadata = {
    name: string
    description: string
    image: string
    external_url: string
    attributes: { trait_type: string; value: string }[]
}

export type AsunaDTO = {
    token_id: number
    token_uri: string
    metadata: Metadata
}

export type AccessoryDTO = {
    amount?: number
    token_id: number
    token_uri: string
    metadata: Metadata
    action_request?: ActionRequest
}

export type AccessoryToAsunaComplexDB = AccessoryToAsuna & {
    Accessory: Accessory
    ActionRequest?: ActionRequest[]
}

export type ChargeType = "charge:confirmed" | "charge:created" | "charge:delayed" | "charge:failed" | "charge:pending"
export type ChargeStatus = "NEW" | "PENDING" | "COMPLETED" | "UNRESOLVED" | "RESOLVED"

export type CoinbaseCharge = {
    id: string
    scheduled_for: string
    attempt_number: number
    event: {
        id: string
        resource: "event"
        type: ChargeType
        api_version: string
        created_at: string
        data: {
            code: string
            id: string
            resource: "charge"
            name: string
            description: string
            hosted_url: string
            created_at: string
            expires_at: string
            support_email: string
            timeline: {
                time: string
                status: ChargeStatus
            }[]
            metadata: object
            payment_threshold: any[]
            pricing: {
                [k: string]: { amount: string; current: string }
            }
            pricing_type: "fixed_price"
            payments: any[]
            addresses: object
            exchange_rates: any[]
            local_exchange_rates: any[]
            pwcb_only: boolean
            offchain_eligible: boolean
            fee_rate: number
        }
    }
}
