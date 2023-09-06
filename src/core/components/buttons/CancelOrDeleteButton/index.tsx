import '../index.css';
import NegativeButton from "../NegativeButton";

export default function CancelOrDeleteButton({onClick}: { onClick: () => void }) {
    return (
        <NegativeButton className={"asset-row-controls-button"}
                        onClick={onClick}
        >✖</NegativeButton>
    )
}
