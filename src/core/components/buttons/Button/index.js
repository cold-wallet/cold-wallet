import './index.css';

export default function Button({className, onClick, children,}) {
    return (
        <div className={("button " + className).trim()}
             onClick={onClick}
        >{children}</div>
    )
}
