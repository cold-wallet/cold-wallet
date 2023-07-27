import './index.css';
import NeutralButton from "./NeutralButton";

export default function EditButton({onClick}) {
    return (
        <NeutralButton className={"asset-row-controls-button"}
                       onClick={onClick}
                       text={"✎"}
        />
    )
}
