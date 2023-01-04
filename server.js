const port = 8000;
const client = require('./model/connection')
const express = require('express');
const cors = require('cors');
const bodyPaser = require('body-parser');
const path = require('path');
const { hashpass } = require('./model/model');
const app = express();
const bcryp = require('bcrypt');
const Swal = require('sweetalert');
const Swal2 = require('sweetalert2');

app.use(bodyPaser.json());
app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'ejs');
app.use(cors());
app.use(bodyPaser.urlencoded({ extended: false }))

const Toast = Swal2.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal2.stopTimer)
      toast.addEventListener('mouseleave', Swal2.resumeTimer)
    }
})
  


app.get('/' , (req, res) => {
    res.render('index');    
});

app.get('/regist', (req, res) => {
    res.render('register');
});

app.post('/register',async (req, res) => {
    const {name ,email, password } = req.body;
    // console.log(user);
    const hasedPassword = await bcryp.hash(password, 10)
    console.log(password);
    console.log(hasedPassword);
    try{
        client.query((`INSERT INTO users(name, email, password) 
        values('${name}', '${email}', '${hasedPassword}')`), 
        (err , result) => {
            if (!err) {
                res.redirect('/regist?=success=true&message=add In Successfully')
            }else{
                 res.redirect('/regist?=failed=true&message=add In failed')
            }
        });
    }catch{
        res.send("insert failed");
    }
});

// connection 
app.listen(port, (err) => {
    if (!err) {
        console.log("runing app in port *" + port);
    }else{
        console.log(err);
    }
});
client.connect(err => {
    if (!err) {
        console.log("connected : seles-app");
    }else{
        console.log(err.message);
    }
});


