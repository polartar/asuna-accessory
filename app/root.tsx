import type { LinksFunction, MetaFunction } from "@remix-run/node"
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react"
import tailwindStylesheetUrl from "~/styles/tailwind.css"
import { Header } from "./features/header"

export const links: LinksFunction = () => {
    return [{ rel: "stylesheet", href: tailwindStylesheetUrl }]
}

export const meta: MetaFunction = () => ({
    charset: "utf-8",
    title: "Lives of Asuna",
    viewport: "width=device-width,initial-scale=1",
})

export default function App() {
    return (
        <html lang="en">
            <head>
                <Meta />
                <Links />
            </head>
            <body className="bg-[url('/bg.png')] h-screen text-white">
                <Header />
                <Outlet />
                <ScrollRestoration />
                <Scripts />
                <LiveReload />
            </body>
        </html>
    )
}

declare global {
    interface Window {
        ethereum: any
    }
}
