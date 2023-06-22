export function Button(
    props: React.PropsWithChildren<{
        onClick?(): void
        name?: string
        value?: string
        type?: "button" | "submit" | "reset" | undefined
    }>
) {
    return (
        <button
            type={props.type}
            onClick={() => props.onClick?.()}
            className="inline-flex items-center px-4 py-2   text-sm font-medium rounded-3xl bg-[#818cf8] hover:bg-[#6366f1] shadow-sm"
        >
            {props.children}
        </button>
    )
}
