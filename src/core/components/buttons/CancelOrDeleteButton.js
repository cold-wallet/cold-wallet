import './index.css';
import NegativeButton from "./NegativeButton";

export default function CancelOrDeleteButton({onClick}) {
    return (
        <NegativeButton className={"asset-row-controls-button"}
                        onClick={onClick}
                        text={"✖"}
        />
    )
}
