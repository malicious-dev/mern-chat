import { useContext, useState } from 'react';
import axios from 'axios';
import { UserContext } from './UserContext';

const RegisterAndLoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginOrRegister, setIsLoginOrRegister] = useState('register');

  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

  async function handleSubmit(e) {
    e.preventDefault();
    const url = isLoginOrRegister === 'login' ? `login` : `register`;
    const { data } = await axios.post(url, {
      username,
      password,
    });

    setLoggedInUsername(username);
    setId(data.id);
  }

  return (
    <div className="bg-blue-50 h-screen flex items-center">
      <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          type="text"
          placeholder="username"
          className="block w-full rounded-sm p-2 mb-2 border "
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="password"
          className="block w-full rounded-sm p-2 mb-2 border "
        />
        <button className="bg-blue-500 text-white block w-full rounded-sm p-2">
          {isLoginOrRegister === 'login' ? 'login' : 'register'}
        </button>
        <div className="text-center mt-2">
          {isLoginOrRegister === 'register' ? (
            <div onClick={() => setIsLoginOrRegister('login')}>
              Already a member ?<button>Login Here</button>
            </div>
          ) : (
            <div onClick={() => setIsLoginOrRegister('register')}>
              Not a member ?<button>Register Here</button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default RegisterAndLoginForm;
