import './index.css';
import Button from "../Button";

export default function NegativeButton({className, onClick, text,}) {
    return (
        <Button className={("negative-button " + className).trim()}
                onClick={onClick}
                text={text}
        />
    )
}
