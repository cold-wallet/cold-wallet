import './index.css'
import Select from "react-select";
import React from "react";
import thirdPartyIntegrations from "../ThirdPartyIntegrations";


export interface Option {
    label: string,
    value: string,
}

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
                className={"new-asset-choose-select"}
                defaultValue={null}
                onChange={e => onSelect(e?.value || null)}
                options={integrationOptions}/>
        </div>
    )
}
