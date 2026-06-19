import { useState } from 'react';
import axios from 'axios';

function ChangePassword({ userId }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleChangePassword = async () => {
    try {
      const res = await axios.put(`/api/user/${userId}/password`, { oldPassword, newPassword });
      setMessage(res.data.message);
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div>
      <h3>Ubah Password</h3>
      <input type="password" placeholder="Password lama" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
      <input type="password" placeholder="Password baru" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
      <button onClick={handleChangePassword}>Ubah Password</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default ChangePassword;