import './index.css';

export default function Button({className, onClick, text,}) {
    return (
        <div className={("button " + className).trim()}
             onClick={onClick}
        >{text}</div>
    )
}
