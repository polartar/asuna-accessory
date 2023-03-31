import { createCookie } from "@remix-run/node"

export const WEEK = 60 * 60 * 24 * 7

export const EthAddressCookie = createCookie("eth-address", {
    // todo: Please turn this into an actual environment secret.
    secrets: ["lives-of-asuna-secret-eth-address-key"],
    maxAge: WEEK,
    sameSite: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    httpOnly: true,
})

export async function getAddressCookie(request: Request): Promise<string | null> {
    const cookies = request.headers.get("Cookie")
    const address = (await EthAddressCookie.parse(cookies)) ?? null
    return address ?? getEthAddressCookie2(cookies)
}

export const getEthAddressCookie2 = (cookies: string | null) => {
    return getCookie(cookies, "eth-address-2")
}

function getCookie(cookieHeader: string | null, key: string): string | null {
    if (!cookieHeader) {
        return null
    }

    const parts = cookieHeader.split(";").map(kv => {
        let t = kv.trim()
        return t.split("=")
    })

    return parts.find(([k, v]) => k === key)?.[1] ?? null
}
