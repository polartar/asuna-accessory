import cookies from "js-cookie"

export const setEthAddressCookie2 = (address: string) => {
    cookies.set("eth-address-2", address, {
        path: "/",
        secure: true,
        sameSite: "strict",
    })
}
