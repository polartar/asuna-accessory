import { createSessionStorage, CookieOptions, redirect, Session } from "@remix-run/node" // or "@remix-run/cloudflare"
import { prisma } from "~/db.server"
import { WEEK } from "~/libs/cookies.server"

const storage = createDatabaseSessionStorage({
    cookie: {
        // todo: Please turn this into an actual environment secret.
        secrets: ["lives-of-asuna-secret-session-key"],
        maxAge: WEEK,
        sameSite: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        httpOnly: true,
    },
})

const USER_SESSION_KEY = "userId"

function getUserSession(request: Request): Promise<Session> {
    return storage.getSession(request.headers.get("Cookie"))
}

export async function getUserId(request: Request): Promise<string | null> {
    const session = await getUserSession(request)
    const userId = session.get(USER_SESSION_KEY)
    if (!userId || typeof userId !== "string") {
        return null
    }
    return userId
}

export async function requireUserId(
    request: Request,
    redirectTo: string = new URL(request.url).pathname
): Promise<string> {
    const session = await getUserSession(request)
    const userId = session.get(USER_SESSION_KEY)
    if (!userId || typeof userId !== "string") {
        const searchParams = new URLSearchParams([["redirectTo", redirectTo]])
        throw redirect(`/login?${searchParams}`, {
            headers: {
                "Set-Cookie": await storage.destroySession(session),
            },
        })
    }
    return userId
}

export async function createUserSession(userId: string, redirectTo: string): Promise<Response> {
    const session = await storage.getSession()
    session.set(USER_SESSION_KEY, userId)
    return redirect(redirectTo, {
        headers: {
            "Set-Cookie": await storage.commitSession(session),
        },
    })
}

export async function logout(request: Request) {
    const session = await getUserSession(request)
    return redirect("/", {
        headers: {
            "Set-Cookie": await storage.destroySession(session),
        },
    })
}

function createDatabaseSessionStorage({ cookie }: { cookie: CookieOptions }) {
    return createSessionStorage({
        cookie,
        async createData(data, expires) {
            // `expires` is a Date after which the data should be considered
            // invalid. You could use it to invalidate the data somehow or
            // automatically purge this record from your database.
            const session = await prisma.session.create({
                data: {
                    expires,
                    data: JSON.stringify(data),
                },
            })
            return session.id
        },
        async readData(id) {
            const session = await prisma.session.findUnique({
                where: {
                    id,
                },
            })

            if (session?.data) {
                return JSON.parse(session.data.toString())
            }

            return null
        },
        async updateData(id, data, expires) {
            await prisma.session.update({
                data: {
                    data: JSON.stringify(data),
                    expires,
                },
                where: {
                    id,
                },
            })
        },
        async deleteData(id) {
            console.log("delete session id", id)
            if (!id) {
                return
            }
            try {
                await prisma.session.delete({
                    where: {
                        id,
                    },
                })
            } catch (err) {
                console.error("failed to delete session", err)
            }
        },
    })
}
