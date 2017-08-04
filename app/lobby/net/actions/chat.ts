import { actionCreator } from "utils/redux";

/** Test action to add a chat message */
export const addChat = actionCreator<string>('ADD_CHAT');
