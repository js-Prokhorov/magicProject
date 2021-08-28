import axios from 'axios';
import { showAlert } from './alerts';
export const login = async (email, password) => {
    console.log(email, password);
    try {
        const result = await axios({
            method: 'POST',
            url: 'http://127.0.0.1:3000/api/v1/users/login',
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
        console.log(result); 
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
    
};

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET', 
            url: 'http://127.0.0.1:3000/api/v1/users/logout'
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