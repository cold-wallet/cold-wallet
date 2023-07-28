import './index.css';
import Button from "../Button";

export default function NegativeButton({className, onClick, children,}) {
    return (
        <Button className={("negative-button " + className).trim()}
                onClick={onClick}
        >{children}</Button>
    )
}
