const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Ivan Prokhorov <${process.env.EMAIL_FROM}>`


    }

    newTransport(){
        if(process.env.NODE_ENV === 'production'){
            //sendgrid
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
                }

            });
        };
        
        //1) Create transporter
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
        //activate in gmail "less secure app" option

    })
    }
    //send the actual email
    async send(template, subject) {
        //1)Render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject: subject
        })
        const from = process.env.NODE_ENV === 'development'? this.from : process.env.SENDGRID_EMAIL_FROM;
        //2)Define email options
        const mailOptions = {
            
            from: from,
            to: this.to,
            subject: subject,
            html: html,
            text: htmlToText.fromString(html),

    
        };
        //3) Create a transport and send email
        const transporter = this.newTransport();
        await transporter.sendMail(mailOptions);
    }

    async sendWelcome(){
       await this.send('welcome', 'Welcome to the magic project!')
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token. Valid only 10 minutes')
    }
}


