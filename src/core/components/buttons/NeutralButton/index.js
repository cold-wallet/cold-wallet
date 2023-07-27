import './index.css';
import Button from "../Button";

export default function NeutralButton({className, onClick, text,}) {
    return (
        <Button className={("neutral-button " + className).trim()}
                onClick={onClick}
                text={text}
        />
    )
}
