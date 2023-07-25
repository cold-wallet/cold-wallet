import {useEffect, useState} from "react";

export default function UserData() {
    const [userData, setUserData] = useState(JSON.parse(localStorage.getItem('userData')));
    useEffect(() => {
        userData && localStorage.setItem('userData', JSON.stringify(userData));
    }, [userData]);

    return {
        userData, setUserData
    }
}
