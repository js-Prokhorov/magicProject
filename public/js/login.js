import axios from 'axios';
import { showAlert } from './alerts';
export const login = async (email, password) => {
    
    try {
        const result = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data: {
                email: email,
                password: password
            }
        });
        if (result.data.status === 'success'){
            showAlert('success', 'Logged in successfuly!');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500)
        }
         
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
    
};

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET', 
            url: '/api/v1/users/logout'
        });
        if(res.data.status === 'success') location.reload();
        
    } catch (err) {
        showAlert('error', 'Ошибка при выходе из аккаунта! Попробуйте снова')
    }
}







// document.querySelector('.form').addEventListener('submit', e => {
//     e.preventDefault();
//     const email = document.getElementById('email').value;
//     const password = document.getElementById('password').value;
//     login(email, password);
// })