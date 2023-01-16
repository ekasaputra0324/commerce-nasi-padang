
const express = require('express');
const route = express.Router();
const client = require('../connection/conn');
const bcrypt = require('bcrypt');
const flash = require('connect-flash');
const path = require('path');
// const app = express();
// const fileupload = require('express-fileupload');



// app.use(fileupload());
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images')
    },
    filename: (req,file , cb ) => {
            console.log(file);
            cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({storage: storage});


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
route.get('/login', (req, res) => {
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
                            res.redirect('/')
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

route.get('/' , (req, res) =>{
    if (req.session.email == null) {
        res.render("home", {email: null , user: null , title: 'Padang Juara | Home'});
    }else{
        client.query(`select * from users WHERE email = '${req.session.email}'` , (err, result) => {
            if (!err) {
                const users = result.rows[0];
                res.render("home", {email:req.session.email , user: users , title: 'Padang Juara | Home'});
            }
        });
    }
});
route.get('/home/admin' , (req, res) => {
    if (req.session.email == null) {
        res.redirect('/') 
    }else{ 
        client.query(`select role.name from  users JOIN role ON users.role_id = role.id WHERE users.email = '${req.session.email}'`, (err, result) => {
            if (!err) {
                const role = result.rows[0].name;
                if (role == 'user') {
                    res.redirect('/home/users')
                }
                if (role == 'admin') {
                    const users = result.rows[0]
                    res.render("admin" , {title: 'Padang Juara | Dashboard', user: users , email: req.session.email})
                }
            } 
        });
    }
});

route.get('/transaction',(req, res) =>{
    if (req.session.email == null) {
        res.redirect('/') 
    }else{ 
        client.query(`select role.name from  users JOIN role ON users.role_id = role.id WHERE users.email = '${req.session.email}'`, (err, result) => {
            if (!err) {
                const role = result.rows[0].name;
                if (role == 'user') {
                    res.redirect('/')
                }
                if (role == 'admin') {
                    res.render('transaction', {title: 'Padang Juara | Transaction'})
                }
            } 
        });
    }
   
});

route.get('/product', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/') 
    }else{ 
        client.query(`select role.name from  users JOIN role ON users.role_id = role.id WHERE users.email = '${req.session.email}'`, (err, result) => {
            if (!err) {
                const role = result.rows[0].name;
                if (role == 'user') {
                    res.redirect('/')
                }
                if (role == 'admin') {
                    res.render('product', {title: 'Padang Juara | Product'});
                }
            } 
        });
    }
});

route.post('/product/add' , upload.single('img'), (req, res) => {    
    const imageName =  req.file.filename; 
    const {name , harga, kategori, description} = req.body;
    console.log(name, harga, kategori);
        client.query(`INSERT INTO product (nama_product, harga_product, description, img,kategori) 
        VALUES('${name}', '${harga}', '${description}', '${imageName}','${kategori}')`, (err, result) => {
            if(err){
                const msg = encodeURIComponent(1);
                res.redirect('/from/?success=' + msg)
            };
            if (!err) {
                const msg = encodeURIComponent(1);
                res.redirect('/from/?success=' + msg)
            }
        });
}); 

route.get('/from', (req, res) => {
    const msg = req.query.success;
    console.log(msg);
    res.render('from', {title: 'Padang Juara | Form' , msg: msg});
});

route.get('/logout', function(req, res, next){
    if(req.session.email){
      req.session.destroy();
      res.redirect('/');
    }
});



module.exports = route;
