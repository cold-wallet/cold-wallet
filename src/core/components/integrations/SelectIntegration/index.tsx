import './index.css'
import Select from "react-select";
import React from "react";
import thirdPartyIntegrations from "../ThirdPartyIntegrations";
import Option from "./Option";

const integrationOptions: Option[] = thirdPartyIntegrations.map(({name}) => ({
    value: name,
    label: name,
}))

export default function SelectIntegration(
    {onSelect}: {
        onSelect:
            (value: string | null) => void
    }
) {
    return (
        <div className="new-asset-choose-select-box flex-box-centered">
            <Select
                placeholder="Select integration..."
                className={"new-asset-choose-select"}
                defaultValue={null}
                onChange={e => onSelect(e?.value || null)}
                options={integrationOptions}/>
        </div>
    )
}
