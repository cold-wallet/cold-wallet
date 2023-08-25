import useInterval from "../utils/useInterval";
import UserData from "../domain/UserData";
import {Dispatch, SetStateAction, useState} from "react";

const DELAY_BEFORE_RELOGIN = 5 * 60_000;

export default function LoginWatcher(
    {userData, setUserData}: {
        userData: UserData, setUserData: Dispatch<SetStateAction<UserData>>
    }
) {

    let shouldEnterPinCode = (!!(userData.settings.pinCode)
        && (Date.now() > ((userData.lastOnline || 0) + DELAY_BEFORE_RELOGIN)))

    const [pinCodeEnteredSuccessfully,
        setPinCodeEnteredSuccessfully] = useState(!shouldEnterPinCode);

    const delay = 60_000;
    const checkOnlineTimeToSave = () => {
        const now = Date.now();
        if ((((userData.lastOnline || 0) + delay) <= now)
            && (pinCodeEnteredSuccessfully || !userData.settings.pinCode)) {
            const newUserData = {...userData}
            newUserData.lastOnline = now
            setUserData(newUserData)
        }
    };
    checkOnlineTimeToSave()
    useInterval(checkOnlineTimeToSave, delay);

    return {
        shouldEnterPinCode,
        pinCodeEnteredSuccessfully, setPinCodeEnteredSuccessfully,
    }
}
