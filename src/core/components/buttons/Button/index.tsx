import './index.css';
import {JSX} from "react";

export default function Button(
    {className, onClick, children,}: {
        className: string,
        onClick: () => void,
        children: JSX.Element[] | JSX.Element | string | null,
    }
) {
    return (
        <div className={("button " + className).trim()}
             onClick={onClick}
        >{children}</div>
    )
}
