import './index.css';
import Button from "../Button";
import {JSX} from "react";

export default function NegativeButton(
    {className, onClick, children,}: {
        className: string,
        onClick: () => void,
        children: JSX.Element[] | JSX.Element | string | null,
    }
) {
    return (
        <Button className={("negative-button " + className).trim()}
                onClick={onClick}
        >{children}</Button>
    )
}
