import '../index.css';
import NeutralButton from "../NeutralButton";

export default function EditButton({onClick}: { onClick: () => void }) {
    return (
        <NeutralButton className={"asset-row-controls-button"}
                       onClick={onClick}
        >✎</NeutralButton>
    )
}
