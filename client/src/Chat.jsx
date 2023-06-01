import { useContext, useEffect, useState, useRef } from 'react';
import { Avatar } from './Avatar';
import { UserContext } from './UserContext';
import { uniqBy } from 'lodash';

export default function Chat() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selectUserId, setSelectUserId] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const divUnderMessages = useRef();
  const { username, id } = useContext(UserContext);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000');
    setWs(ws);
    ws.addEventListener('message', handleMessage);
  }, []);

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }

  function handleMessage(event) {
    const messageData = JSON.parse(event.data);
    if (messageData.online) {
      showOnlinePeople(messageData?.online);
    } else if ('text' in messageData) {
      console.log(messageData.text);
      setNewMessageText('');

      setMessages((prev) => [
        ...prev,
        {
          text: messageData.text,
          isOur: false,
          recipient: selectUserId,
          id: Date.now(),
        },
      ]);
    }
  }

  function sendMessage(e) {
    e.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectUserId,
        text: newMessageText,
      })
    );
    setNewMessageText('');
    setMessages((prev) => [
      ...prev,
      {
        text: newMessageText,
        isOur: true,
        recipient: selectUserId,
        id: Date.now(),
      },
    ]);
  }

  useEffect(() => {
    const div = divUnderMessages.current;
    div?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const messagesWithoutDupes = uniqBy(messages, 'id');

  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3">
        <div className="text-blue-600 font-bold flex gap-2 p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
          </svg>
          MernChat
        </div>
        {Object.entries(onlinePeople)
          .filter(([userId]) => onlinePeople[userId] !== username)
          .map(([userId, username]) => (
            <div
              onClick={() => setSelectUserId(userId)}
              className={`border-b border-gray-100 flex gap-2 cursor-pointer ${
                selectUserId === userId ? 'bg-blue-100' : ''
              }`}
              key={userId}
            >
              {userId === selectUserId && (
                <div className="w-1 bg-blue-500 h-12 rounded-r-md"></div>
              )}
              <div className="flex gap-2 py-2 pl-4 items-center">
                <Avatar userId={userId} username={username} />
                <span className="text-gray-800">{username}</span>
              </div>
            </div>
          ))}
      </div>
      <div className="flex flex-col bg-blue-50 w-2/3 p-2">
        <div className="flex-grow">
          {!selectUserId ? (
            <div className="flex flex-col justify-center items-center h-full">
              <div className="text-4xl text-gray-400">MernChat</div>
              <div className="text-gray-400">&larr; Select a user to chat</div>
            </div>
          ) : (
            <div className="relative h-full ">
              <div className="flex flex-col gap-2 h-full overflow-y-scroll absolute top-0 right-0 left-0 bottom-2">
                {messagesWithoutDupes?.map(({ text, isOur }, index) => (
                  <div
                    key={index}
                    className={`flex flex-col gap-1 ${
                      isOur ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-md ${
                        isOur ? 'bg-blue-500 text-white' : 'bg-white'
                      }`}
                    >
                      {text}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isOur ? 'You' : username}
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessages}></div>
              </div>
            </div>
          )}
        </div>
        {!!selectUserId && (
          <form className="flex gap-2" onSubmit={sendMessage}>
            <input
              value={newMessageText}
              onChange={(event) => setNewMessageText(event.target.value)}
              type="text"
              className="bg-white flex-grow border p-2 rounded-sm"
              placeholder="type a message"
            />
            <button className="bg-blue-500 text-white p-2 rounded-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
