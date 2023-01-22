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
const {
    type
} = require('os');
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
        title: 'Padang Juara | Register',
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
        title: 'Padang Juara | Login',
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
                title: 'Padang Juara | Login',
                message: login
            });
        }
    });
});

route.get('/', (req, res) => {
    if (req.session.email == null) {
        client.query(`SELECT * FROM product`, (err, result) => {
            res.render("home", {
                email: null,
                user: null,
                data: result.rows,
                title: 'Padang Juara | Home'
            });
        })
    } else {
        client.query(`select * from users WHERE email = '${req.session.email}'`, (err, result1) => {
            if (!err) {
                client.query(`SELECT * FROM product`, (err, result2) => {
                    const users = result1.rows[0];
                    console.log(result2.rows);
                    client.query(`SELECT SUM(total) FROM transaction WHERE user_id = ${users.id} AND status_transaction = ${false}`, (err, result3) => {
                        client.query(`SELECT * FROM transaction WHERE user_id = ${users.id}  AND status_transaction = ${false}`, (err, result) => {

                            res.render("home", {
                                email: req.session.email,
                                user: users,
                                countData: result.rowCount,
                                count: result3.rows[0].sum,
                                data: result2.rows,
                                title: 'Padang Juara | Home'
                            });
                        })
                    });

                })
            }
        });
    }
});
route.get('/home/admin', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/')
    } else {
        client.query(`SELECT * FROM users WHERE role_id = '${2}' FETCH FIRST 3 ROW ONLY`, (err, result) => {
            const custumer = result.rows;
            console.log(custumer);
            client.query('SELECT * FROM product', (err, result) => {
                const ProductCount = result.rowCount;
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
                                dataUsers: custumer,
                                CountProduct: ProductCount,
                                email: req.session.email
                            })
                        }
                    }
                });
            });
        });
    }
});
// transaction
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
route.get('/transaction/user', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/')
    } else {
        client.query(`SELECT * FROM users WHERE email = '${req.session.email}'`, (err, result) => {
            const user = result.rows[0]
        client.query(`select  t.id ,  t.user_id, t.total , s.name, p.nama_product, p.harga_product,p.img, t.jumlah from  transaction t 
                        INNER JOIN  product p ON t.product_id = p.id 
                        INNER JOIN users s ON t.user_id = s.id
                        WHERE t.status_transaction = ${true} AND  s.email = '${req.session.email}'`, (err, result) => {

            const data = result.rows
            res.render('transaction-user', {
                title: 'Padang Juara | Transaction',
                data: data,
                user: user,
                email: req.session.email,
            });
        });
    })
    }
});
// cart
route.get('/cart', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/');
    }
    client.query(`select  t.id , t.user_id, t.total , s.name, p.nama_product, p.harga_product,p.img, t.jumlah from  transaction t 
                INNER JOIN  product p ON t.product_id = p.id 
                INNER JOIN users s ON t.user_id = s.id
                WHERE t.status_transaction = ${false} AND  s.email = '${req.session.email}'`, (err, result) => {
        if (err) {
            console.log(err);
        }
        if (!err) {
            const data = result.rows
            const count = result.rowCount
            client.query(`SELECT * FROM users WHERE email = '${req.session.email}'`, (err, result) => {
                const users = result.rows[0];
                client.query(`SELECT SUM(total) FROM transaction WHERE user_id = ${result.rows[0].id} AND status_transaction = ${false}`, (err, result) => {
                    const msg = req.query.success;
                    res.render('cart', {
                        title: 'Padang Juara | Cart',
                        data: data,
                        msg: msg,
                        subs: result.rows[0].sum,
                        email: req.session.email,
                        user: users,
                        count: count
                    });
                })
            });
        }
    })
});

route.get('/cart/update', (req, res) => {
    // const { user_id }  = req.body;
    client.query(`SELECT * FROM users WHERE email = '${req.session.email}'`, (err, result) => {
        const user_id = result.rows[0].id
        client.query(`UPDATE transaction SET status_transaction = ${true} WHERE user_id = '${user_id}'`, (err, result) => {
            if (err) {
                console.log(err);
            }
            if (!err) {
                const success = encodeURIComponent(1);
                res.redirect('/cart/?success=' + success)
            }
        });
    })
});

route.get('/deleted/cart/:id', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/');
    }
    const id = req.params.id;
    client.query(`DELETE FROM transaction WHERE id = ${id}`, (err, result) => {
        if (!err) {
            res.redirect('/cart')
        }
        if (err) {
            console.log(err);
        }
    });
});

route.post('/transaction/add/user', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/login')
    } else {
        const {
            id,
            jumlah,
            harga
        } = req.body;
        console.log(
            id,
            jumlah,
            harga
        );
        const total = harga * jumlah
        console.log(total);
        console.log(req.session.email);
        client.query(`SELECT * FROM users WHERE email = '${req.session.email}'`, (err, result) => {
            const Userid = result.rows[0].id;
            var date = new Date();
            var current_date = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
            console.log(
                date,
                Userid
            );
            client.query(`INSERT INTO transaction
                            (user_id, product_id, tanggal_transaction,status_transaction, total, jumlah)
                            VALUES (${Userid}, ${id}, '${current_date}', ${false}, ${total}, ${jumlah})`, (err, result) => {
                if (!err) {
                    console.log("success");
                    res.redirect('/')
                }
                if (err) {
                    console.log(err)
                }
            });

        })
    }
});

// contact
route.get('/contact', (req, res) => {
    res.render('contact', {
        title: 'Padang Juara | Contact',
        email: req.session.email,
        user: null
    })
});


// product route
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
                res.redirect(`/product/form/update/${id}/?success=` + msg)
                console.log(err);
            }
            if (!err) {
                const msg = encodeURIComponent(1)
                res.redirect(`/product/form/update/${id}/?success=` + msg)
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
                res.redirect(`/product/form/update/${id}/?success=` + msg)
                console.log(err);
            }
            if (!err) {
                const msg = encodeURIComponent(1)
                res.redirect(`/product/form/update/${id}/?success=` + msg)
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
        client.query(`DELETE FROM transaction WHERE product_id = ${id}`, (err, result) => {
            if (err) {
                console.log(err);
            }
            if (!err) {

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

// custumer
route.get('/custumer', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/')
    } else {
        client.query(`SELECT * FROM users WHERE role_id = 2`, (err, result) => {
            const data = result.rows
            const msg = req.query.success;
            console.log(msg);
            res.render('customer', {
                title: 'Padang Juara | Custumers',
                data: data,
                msg: msg
            })
        })
    }
});
route.get('/custumer/form/add', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/')
    } else {
        const msg = req.query.success;
        res.render('from-add-custumer', {
            title: 'Padang Juara | Custumers',
            msg: msg
        })
    }
});

route.post('/custemer/add', (req, res) => {
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
        res.render('from-add-custumer', {
            title: 'Padang Juara | Custumers',
            msg: 0
        })
    }
    client.query(`SELECT * FROM users WHERE email = '${email}'`, (err, result) => {
        if (err) {
            console.log(err);
        }
        if (result.rowCount > 0) {
            res.render('from-add-custumer', {
                title: 'Padang Juara | Custumers',
                msg: 0
            })
        } else {
            let hash = bcrypt.hashSync(password, 10);
            console.log(hash);
            client.query(`INSERT INTO users(name , email, password) VALUES ('${name}','${email}','${hash}') `, (err, result) => {
                if (!err) {
                    console.log(result.rows[0]);
                    const msg = encodeURIComponent(1);
                    res.redirect('/custumer/form/add/?success=' + msg)
                }
            });
        }
    });
});
route.get('/custumer/delete/:id', (req, res) => {
    const id = req.params.id;

    client.query(`DELETE FROM users WHERE id = ${id}`, (err, result) => {
        if (err) {
            console.log(err)
        }
        if (!err) {
            const msg = encodeURIComponent(1);
            res.redirect('/custumer/?success=' + msg)
        }

    });
});
route.get('/customer/form/update/:id', (req, res) => {
    const id = req.params.id;
    client.query(`SELECT * FROM users WHERE id = ${id}`, (err, result) => {
        if (!err) {
            const msg = req.query.success;
            res.render('form-update-custumer', {
                data: result.rows[0],
                title: 'Padang Juara | Form Update',
                msg: msg
            })
        }
        if (err) {
            console.log(err);
        }
    });
});
route.post('/customer/update', (req, res) => {
    const {
        id,
        name,
        email,
        password,
        password2
    } = req.body;
    console.log(
        id,
        name,
        email,
        password,
        password2
    );
});

route.get('/logout', function (req, res, next) {
    if (req.session.email) {
        req.session.destroy();
        res.redirect('/');
    }
});


module.exports = route;