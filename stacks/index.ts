import * as sst from "@serverless-stack/resources"
import { KeyStack } from "./KeyStack"
import { EventStack } from "./EventStack"

export default function main(app: sst.App): void {
    new KeyStack(app, "KeyStack")
    new EventStack(app, "EventStack")
}
