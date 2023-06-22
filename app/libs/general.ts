export function formatWalletAddress(address: string | undefined): string {
    if (address === undefined) {
        return ""
    }
    const length = address.length
    return `${address.substring(0, 8)}....${address.substring(length - 5, length)}`
}
