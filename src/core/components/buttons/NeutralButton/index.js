import './index.css';
import Button from "../Button";

export default function NeutralButton({className, onClick, children,}) {
    return (
        <Button className={("neutral-button " + className).trim()}
                onClick={onClick}
        >{children}</Button>
    )
}
