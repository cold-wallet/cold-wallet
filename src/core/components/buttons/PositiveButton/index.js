import './index.css';
import Button from "../Button";

export default function PositiveButton({className, onClick, text,}) {
    return (
        <Button className={("positive-button " + className).trim()}
                onClick={onClick}
                text={text}
        />
    )
}
