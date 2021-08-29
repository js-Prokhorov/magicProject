import axios from 'axios';
import { showAlert } from './alerts';


export const bookTour = async tourId => {
    const stripe = Stripe('pk_test_51JT61tGVu2nLM0L5XDaj0Kno07DQpTRGfCBFxnhdAQTRhbtnvuPrf8hrx7uHPwIfNCN8VC5Cnlu7Xs3rUWjy8scO00ZFP0UNMN');
    try {

        //1) Получить сессию с бэкэнда
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`)
        // console.log(session);
        //2) Создать checkout form + списать деньги с карты
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });

    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }
}