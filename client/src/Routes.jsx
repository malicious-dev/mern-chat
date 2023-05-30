import Register from './Register';
import { useContext } from 'react';
import { UserContext } from './UserContext';

export default function Routes() {
  const { username, id } = useContext(UserContext);

  if (username) {
    return 'logged in!';
  }

  return <Register />;
}
