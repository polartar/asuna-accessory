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
            className="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm"
        >
            {props.children}
        </button>
    )
}
