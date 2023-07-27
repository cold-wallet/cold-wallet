import './index.css';
import PositiveButton from "./PositiveButton";

export default function AcceptButton({onClick}) {
    return (
        <PositiveButton className={"asset-row-controls-button asset-row-button-accept"}
                        onClick={onClick}
                        text={"✔"}
        />
    )
}
