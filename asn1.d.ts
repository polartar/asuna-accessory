// These types are entirely wrong but makes Typescript happy.
declare module "asn1.js" {
    type Entity = {
        seq(): Entity
        obj(arg1: any, arg2: any): Entity
        key(arg: any): Entity
        objid(): Entity
        bitstr(): string
        int(): Entity
        decode(
            key: Buffer,
            mode: string
        ): {
            r: any
            s: any
            pubKey: {
                data: string
            }
        }
    }

    function define(name: string, cb: (this: Entity) => void): Entity
}
