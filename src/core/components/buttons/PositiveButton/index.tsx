import './index.css';
import Button from "../Button";
import {JSX} from "react";

export default function PositiveButton(
    {className, onClick, children,}: {
        className: string,
        onClick: () => void,
        children: JSX.Element[] | JSX.Element | string | null,
    }
) {
    return (
        <Button className={("positive-button " + className).trim()}
                onClick={onClick}
        >{children}</Button>
    )
}
