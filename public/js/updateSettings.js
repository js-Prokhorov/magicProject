import axios from 'axios';
import {showAlert} from './alerts';
//И для смены пароля, и для смены другой информации пользователя. type - или 'password' или 'data'
export const updateSettings = async (data, type) => {
    try {
        const url =
          type === 'password'
            ? '/api/v1/users/updateMyPassword'
            : '/api/v1/users/updateMe';
        const result = await axios({
            method: 'PATCH',
            url: url,
            data: data
        })
        const msg = type === 'password' ? 'Пароль успешно обновлён' : 'Данные успешно обновлены!';
        if (result.data.status === 'success') {
            showAlert('success', msg)
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}