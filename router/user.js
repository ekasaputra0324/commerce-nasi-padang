
const express = require('express');
const route = express.Router();
// const session = require('express-session')
const client = require('../connection/conn');
const bcrypt = require('bcrypt');
const flash = require('connect-flash');

route.get('/resgiter', (req,res) => { 
    const register = '';
    res.render('register', {title: 'SELES-APP | Register', message: register})
});
route.post('/resgiter' , (req, res) =>{
    const {name , email, password} = req.body;
    console.log(
        name,
        email,
        password
    );
    
    client.query(`SELECT * FROM users WHERE email = '${email}'`, (err, result) => {
        if (err) { throw err }
        if (result.rowCount > 0) {
            const register = 'failed';
            res.render('register', {title: 'SELES-APP | Register', message: register})
        }else{
            let hash = bcrypt.hashSync(password, 10);
            console.log(hash);
            client.query(`INSERT INTO users(name , email, password) VALUES ('${name}','${email}','${hash}') ` , (err, result) => {
            if (!err) {
                const register = 'success'
                res.render("register", {title: 'SELES-APP | Register', message: register})
            }else{
                res.redirect('/resgiter')
            }
        });
    }
    });

    
});

// login
route.get('/', (req, res) => {
    if (req.session.email != null) {
        res.redirect('/home/users')
     }
    const login = []
    res.render('login',  {title: 'SELES-APP | Login', message: login });
});

route.post('/auth' , (req, res) => {
    const email = req.body.email;
    client.query(`select * from users WHERE email = '${email}'`, (err, result) =>{
        if(err) throw err;
            if( result.rows.length && bcrypt.compareSync(req.body.password, result.rows[0].password)){
                req.session.email = email;
                client.query(`select role.name from  users JOIN role ON users.role_id = role.id WHERE users.email = '${req.session.email}'`, (err, result) => {
                    if (!err) {
                        const role = result.rows[0].name;
                        if (role == 'user') {
                            res.redirect('/home/users')
                        }else if (role == 'admin') {
                            res.redirect('/home/admin')
                        }
                    }
                });
              }else{
                req.session.destroy();
                const login = 'failed'
                res.render("login", {title: 'SELES-APP | Login', message: login });    
              } 
        });  
});

route.get('/home/users' , (req, res) =>{
    if (req.session.email == null ) {
        res.redirect('/')
    }
    client.query(`select * from users WHERE email = '${req.session.email}'` , (err, result) => {
        if (!err) {
            const users = result.rows[0];
            console.log(users);
            res.render("home", {message: req.session.email, user: users , title: 'SELES-APP | Home'});
        }else{
            console.log(err);
        }
    });
});
route.get('/home/admin' , (req, res) => {
    if (req.session.email == null) {
        res.redirect('/')
    }
    client.query(`select role.name from  users JOIN role ON users.role_id = role.id WHERE users.email = '${req.session.email}'`, (err, result) => {
        if (!err) {
            const role = result.rows[0].name;
            if (role == 'user') {
                res.redirect('/home/users')
            }
            if (role == 'admin') {
                const users = result.rows[0]
                res.render("admin" , {title: 'SELES-APP | Dashboard', user: users , email: req.session.email})
            }
        } 
    });
});

route.get('/logout', function(req, res, next){
    if(req.session.email){
      req.session.destroy();
      res.redirect('/');
    }
})

module.exports = route;
