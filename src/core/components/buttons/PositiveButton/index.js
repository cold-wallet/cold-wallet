import './index.css';
import Button from "../Button";

export default function PositiveButton({className, onClick, children,}) {
    return (
        <Button className={("positive-button " + className).trim()}
                onClick={onClick}
        >{children}</Button>
    )
}
