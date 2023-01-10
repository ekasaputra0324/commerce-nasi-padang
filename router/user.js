
var express = require('express');
var router = express.Router();
const client = require('../connection/conn');
var bcrypt = require('bcrypt');




router.get('/resgiter', (req,res) => {
    res.render('register', {title: 'SELES-APP | Login'})
});
router.post('/resgiter' , (req, res) =>{
    const {name , email, password} = req.body;
    console.log(
        name,
        email,
        password
    );
    
    client.query(`SELECT * FROM users WHERE email = '${email}'`, (err, result) => {
        if (err) { throw err }
        if (result.rowCount > 0) {
           res.redirect('/resgiter')
        }else{
            let hash = bcrypt.hashSync(password, 10);
            console.log(hash);
            client.query(`INSERT INTO users(name , email, password) VALUES ('${name}','${email}','${hash}') ` , (err, result) => {
            if (!err) {
                res.redirect('/')
            }else{
                res.redirect('/resgiter')
            }
        });
    }
    });

    
});

// login
router.get('/', (req, res) => {
    if (req.session.email != null) {
        res.redirect('/home')
    }
    const message = 'sasa';
    res.render("login", {title: 'SELES-APP | Login', message: message });
});
router.post('/auth' , (req, res) => {
    const email = req.body.email;
    
    client.query(`select * from users WHERE email = '${email}'`, (err, result) =>{
        if(err) throw err;
            if( result.rows.length && bcrypt.compareSync(req.body.password, result.rows[0].password)){
                req.session.email = email;
                res.redirect('/home');
              }else{
                res.redirect('/')    
              } 
        });  
});

router.get('/home' , (req, res) =>{
    if (req.session.email == null ) {
        res.redirect('/')
    }
    res.render("home", {message: req.session.email})
});

router.get('/logout', function(req, res, next){
    if(req.session.email){
      req.session.destroy();
      res.redirect('/');
    }
})

module.exports = router;
