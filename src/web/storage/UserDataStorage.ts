import {useEffect, useState} from "react";
import UserData from "../../core/domain/UserData";

const key: string = "userData";

export default function UserDataStorage() {

    const item = localStorage.getItem(key);
    const initialState: UserData = item ? JSON.parse(item) : new UserData();
    const [userData, setUserData] = useState(initialState);

    useEffect(() => {
        userData && localStorage.setItem(key, JSON.stringify(userData));
    }, [userData]);

    return {
        userData, setUserData
    }
}
