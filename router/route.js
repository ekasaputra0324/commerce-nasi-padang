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
const {
    urlencoded
} = require('express');
const {
    json
} = require('body-parser');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images')
    },
    filename: (req, file, cb) => {
        console.log(file);
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage
});


route.get('/resgiter', (req, res) => {
    const register = req.query.register;
    res.render('register', {
        title: 'SELES-APP | Register',
        message: register
    })
});
route.post('/resgiter', (req, res) => {
    const {
        name,
        email,
        password,
        password2
    } = req.body;
    console.log(
        name,
        email,
        password,
        password2
    );
    if (password != password2) {
        const register = encodeURIComponent('dontMacht');
        res.redirect('/resgiter/?register=' + register)
    }
    client.query(`SELECT * FROM users WHERE email = '${email}'`, (err, result) => {
        if (err) {
            console.log(err);
        }
        if (result.rowCount > 0) {
            const register = encodeURIComponent('failed');
            res.redirect('/resgiter/?register=' + register)
        } else {
            let hash = bcrypt.hashSync(password, 10);
            console.log(hash);
            client.query(`INSERT INTO users(name , email, password) VALUES ('${name}','${email}','${hash}') `, (err, result) => {
                if (!err) {
                    console.log(result.rows[0]);
                    const register = encodeURIComponent('success');
                    res.redirect('/resgiter/?register=' + register)
                } else {
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
    res.render('login', {
        title: 'SELES-APP | Login',
        message: login
    });
});

route.post('/auth', (req, res) => {
    const email = req.body.email;
    client.query(`select * from users WHERE email = '${email}'`, (err, result) => {
        if (err) throw err;
        if (result.rows.length && bcrypt.compareSync(req.body.password, result.rows[0].password)) {
            req.session.email = email;
            client.query(`select role.name from  users JOIN role ON users.role_id = role.id WHERE users.email = '${req.session.email}'`, (err, result) => {
                if (!err) {
                    const role = result.rows[0].name;
                    if (role == 'user') {
                        res.redirect('/')
                    } else if (role == 'admin') {
                        res.redirect('/home/admin')
                    }
                }
            });
        } else {
            req.session.destroy();
            const login = 'failed'
            res.render("login", {
                title: 'SELES-APP | Login',
                message: login
            });
        }
    });
});

route.get('/', (req, res) => {
    if (req.session.email == null) {
        res.render("home", {
            email: null,
            user: null,
            title: 'Padang Juara | Home'
        });
    } else {
        client.query(`select * from users WHERE email = '${req.session.email}'`, (err, result) => {
            if (!err) {
                const users = result.rows[0];
                res.render("home", {
                    email: req.session.email,
                    user: users,
                    title: 'Padang Juara | Home'
                });
            }
        });
    }
});
route.get('/home/admin', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/')
    } else {
        client.query(`select role.name from  users JOIN role ON users.role_id = role.id WHERE users.email = '${req.session.email}'`, (err, result) => {
            if (!err) {
                const role = result.rows[0].name;
                if (role == 'user') {
                    res.redirect('/home/users')
                }
                if (role == 'admin') {
                    const users = result.rows[0]
                    res.render("admin", {
                        title: 'Padang Juara | Dashboard',
                        user: users,
                        email: req.session.email
                    })
                }
            }
        });
    }
});

route.get('/transaction', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/')
    } else {
        client.query(`select role.name from  users JOIN role ON users.role_id = role.id WHERE users.email = '${req.session.email}'`, (err, result) => {
            if (!err) {
                const role = result.rows[0].name;
                if (role == 'user') {
                    res.redirect('/')
                }
                if (role == 'admin') {
                    res.render('transaction', {
                        title: 'Padang Juara | Transaction'
                    })
                }
            }
        });
    }

});

route.get('/product', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/')
    } else {
        client.query(`select role.name from  users JOIN role ON users.role_id = role.id WHERE users.email = '${req.session.email}'`, (err, result) => {
            if (!err) {
                const role = result.rows[0].name;
                if (role == 'user') {
                    res.redirect('/')
                }
                if (role == 'admin') {
                    client.query(`SELECT * FROM product`, (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                        if (!err) {
                            const count = result.rowCount;
                            console.log(result.rows);
                            const msg = req.query.success;
                            res.render('product', {
                                title: 'Padang Juara | Product',
                                data: result.rows,
                                msg: msg
                            });

                        }
                    });
                }
            }
        });
    }
});

route.get('/product/getdata/:id', (req, res) => {
    const id = req.params.id;
    client.query(`SELECT * FROM product WHERE id = ${id}`, (err, result) => {
        if (err) {
            throw err
        }
        res.send(result.rows[0])
    });
});

route.get('/product/form/update/:id', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/')
    } else {
        const id = req.params.id;
        client.query(`SELECT * FROM product WHERE id = ${id}`, (err, result) => {
            if (err) {
                throw err
            }
            if (!err) {
                const msg = req.query.success;
                res.render("form-update", {
                    title: "Padang Juara | Form Update",
                    data: result.rows[0],
                    msg: msg
                });
            }
        });
    }
});


route.post('/product/update', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/')
    } else {

        const {
            name,
            id,
            harga,
            kategori,
            description
        } = req.body;
        console.log(
            id,
            name,
            description,
            harga,
            kategori
        );
        client.query(`UPDATE product SET
            nama_product = '${name}', 
            harga_product = '${harga}',
            description = '${description}', 
            kategori = '${kategori}' WHERE id = ${id}`, (err, result) => {
            if (err) {
                const msg = encodeURIComponent(0);
                res.redirect('/product/form/update/7/?success=' + msg)
                console.log(err);
            }
            if (!err) {
                const msg = encodeURIComponent(1)
                res.redirect('/product/form/update/7/?success=' + msg)
            }
        });
    }
});
route.post('/product/update/image', upload.single('img'), (req, res) => {
    if (req.session.email == null) {
        res.redirect('/')
    } else {
        const {
            id
        } = req.body;
        const fileName = req.file.filename;
        console.log(id, fileName);
        client.query(`UPDATE product SET img = '${fileName}' WHERE id = ${id}`, (err, result) => {
            if (err) {
                const msg = encodeURIComponent(0);
                res.redirect('/product/form/update/7/?success=' + msg)
                console.log(err);
            }
            if (!err) {
                const msg = encodeURIComponent(1)
                res.redirect('/product/form/update/7/?success=' + msg)
            }
        });
    }
});

route.get('/from', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/')
    } else {
        const msg = req.query.success;
        res.render('from', {
            title: 'Padang Juara | Form',
            msg: msg
        });
    }
});
route.get('/product/deleted/:id', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/')
    } else {
        const id = req.params.id;
        client.query(`DELETE FROM product WHERE id = ${id}`, (err, result) => {
            if (err) {
                throw err
            }
            if (!err) {
                const msg = 1;
                res.redirect('/product/?success=' + msg)
            }
        });
    }
})

route.post('/product/add', upload.single('img'), (req, res) => {
    if (req.session.email == null) {
        res.redirect('/')
    } else {
        const imageName = req.file.filename;
        const {
            name,
            harga,
            kategori,
            description
        } = req.body;
        console.log(name, harga, kategori);
        client.query(`INSERT INTO product (nama_product, harga_product, description, img,kategori) 
                VALUES('${name}', '${harga}', '${description}', '${imageName}','${kategori}')`, (err, result) => {
            if (err) {
                const msg = encodeURIComponent(0);
                res.redirect('/from/?success=' + msg)
                console.log(err);
            };
            if (!err) {
                const msg = encodeURIComponent(1);
                res.redirect('/from/?success=' + msg)
            }
        });
    }
});

route.get('/logout', function (req, res, next) {
    if (req.session.email) {
        req.session.destroy();
        res.redirect('/');
    }
});



module.exports = route;