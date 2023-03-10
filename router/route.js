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
        title: 'PS Store | Register',
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
        title: 'PS Store | Login',
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
                        var date = new Date();
                        var current_date = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
                        client.query(`UPDATE users SET tanggal_login = '${current_date}' WHERE email = '${req.session.email}'`, (err, result) => {
                            if (!err) {
                                res.redirect('/')
                            }
                            if (err) {
                                console.log(err);
                            }
                        })
                    } else if (role == 'admin') {
                        res.redirect('/home/admin')
                    }
                }
            });
        } else {
            req.session.destroy();
            const login = 'failed'
            res.render("login", {
                title: 'PS Store | Login',
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
                title: 'PS Store | Home'
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
                                count: result1.rows[0].saldo,
                                data: result2.rows,
                                title: 'PS Store | Home'
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
        client.query(`select  t.id ,  t.user_id, t.total , t.status_making , s.name, p.nama_product, p.harga_product,p.img, t.jumlah from  transaction t 
        INNER JOIN  product p ON t.product_id = p.id 
        INNER JOIN users s ON t.user_id = s.id
        WHERE t.status_transaction = ${true}  AND status_making = ${false}  LIMIT ${5}`, (err, result) => {
            const dataTransaction = result.rows;
            client.query(`SELECT * FROM users WHERE role_id = ${2}`, (err, result) => {
                const countUser = result.rowCount;
                client.query(`SELECT * FROM transaction WHERE status_transaction = ${true} AND status_making = ${false}`, (err, result) => {
                    const countTransaction = result.rowCount;
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
                                            title: 'PS Store | Dashboard',
                                            user: users,
                                            dataUsers: custumer,
                                            countUser: countUser,
                                            data: dataTransaction,
                                            countTran: countTransaction,
                                            CountProduct: ProductCount,
                                            email: req.session.email
                                        })
                                    }
                                }
                            });
                        });
                    });
                })
            })
        })
    }
});
// transaction
route.get('/transaction', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/')
    } else {
        client.query('SELECT * FROM product', (err, result) => {
            const product = result.rows;
            client.query(`SELECT * FROM users WHERE role_id = ${2}`, (err, result) => {
                const users = result.rows;
                client.query(`select  t.id ,  t.user_id, t.total , t.status_making , s.name, p.nama_product, p.harga_product,p.img, t.jumlah from  transaction t 
        INNER JOIN  product p ON t.product_id = p.id 
        INNER JOIN users s ON t.user_id = s.id
        WHERE t.status_transaction = ${true}  AND status_making = ${false}`, (err, result) => {
                    const data = result.rows;
                    console.log(data);
                    client.query(`select role.name from  users JOIN role ON users.role_id = role.id WHERE users.email = '${req.session.email}'`, (err, result) => {
                        if (!err) {
                            const role = result.rows[0].name;
                            if (role == 'user') {
                                res.redirect('/')
                            }
                            if (role == 'admin') {
                                const success = req.query.success;
                                res.render('transaction', {
                                    title: 'PS Store | Transaction',
                                    data: data,
                                    product: product,
                                    users: users,
                                    msg: success
                                })
                            }
                        }
                    });
                });
            });
        })
    }

});
route.post('/transaction/admin/add', (req, res) => {
    const {
        nama_pelangan,
        nama_produk,
        jumlah_produk
    } = req.body;
    console.log(
        nama_pelangan,
        nama_produk,
        jumlah_produk
    );
    var date = new Date();
    var current_date = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

    client.query(`SELECT harga_product FROM product WHERE id = ${nama_produk}`, (err, result) => {
        const harga = result.rows[0].harga_product;
        const jumlah = parseInt(jumlah_produk)
        console.log(harga);
        const total = harga * jumlah;
        console.log(total);
        client.query(`INSERT INTO transaction
                    (user_id, product_id, tanggal_transaction,status_transaction, total, jumlah)
                     VALUES (${nama_pelangan}, ${nama_produk}, '${current_date}', ${true}, ${total}, ${jumlah})`, (err, result) => {
            if (!err) {
                const success = encodeURIComponent(1);
                res.redirect('/transaction/?success=' + success)
            }
            if (err) {
                const success = encodeURIComponent(0);
                res.redirect('/transaction/?success=' + success)
            }
        });
    });

});

route.get('/role', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/')
    } else {
        client.query(`SELECT * FROM role`, (err, result) => {
            res.render('role', {
                title: 'PS Store | Role',
                data: result.rows
            });
        });
    }
});

route.get('/transaction/delete/:id', (req, res) => {
    const id = req.params.id;
    client.query(`DELETE FROM transaction WHERE id = ${id}`, (err, result) => {
        if (!err) {
            const success = encodeURIComponent(2);
            res.redirect('/transaction/?success=' + success)
        }
        if (err) {
            console.log(err);
        }
    });
});

route.get('/transaction/status/making/:id', (req, res) => {
    const id = req.params.id;
    client.query(`UPDATE transaction SET status_making = ${true} WHERE id = ${id}`, (err, result) => {
        if (!err) {
            const success = encodeURIComponent(3);
            res.redirect('/transaction/?success=' + success)
        } else {
            res.send(err)
        }
    });
});
route.get('/transaction/histori', (req, res) => {
    if (req.session.email == null) {
        res.redirect('/')
    } else {
        client.query('SELECT * FROM product', (err, result) => {
            const product = result.rows;
            client.query(`SELECT * FROM users WHERE role_id = ${2}`, (err, result) => {
                const users = result.rows;
                client.query(`select  t.id ,  t.user_id, t.total , t.status_making , s.name, p.nama_product, p.harga_product,p.img, t.jumlah from  transaction t 
                    INNER JOIN  product p ON t.product_id = p.id 
                    INNER JOIN users s ON t.user_id = s.id
                    WHERE t.status_transaction = ${true} AND status_making = ${true}`, (err, result) => {
                    const data = result.rows;
                    console.log(data);
                    client.query(`select role.name from  users JOIN role ON users.role_id = role.id WHERE users.email = '${req.session.email}'`, (err, result) => {
                        if (!err) {
                            const role = result.rows[0].name;
                            if (role == 'user') {
                                res.redirect('/')
                            }
                            if (role == 'admin') {
                                res.render('histori-transaction', {
                                    title: 'PS Store | Histori Transaksi',
                                    data: data,
                                })
                            }
                        }
                    });
                });
            });
        })
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
                    title: 'PS Store | Transaction',
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
                        title: 'PS Store | Cart', 
                        data: data,
                        msg: msg,
                        subs: result.rows[0].sum,
                        email: users.email,
                        user: users,
                        count: count
                    });
                })
            });
        }
    })
});
 

route.get('/cart/update', (req, res) => {
    
    client.query(`SELECT * FROM users WHERE email = '${req.session.email}'`, (err, result) => {
        const user_id = result.rows[0].id
        const saldo = result.rows[0].saldo
        client.query(`SELECT SUM(total) FROM transaction WHERE user_id = ${result.rows[0].id} AND status_transaction = ${false}`, (err, result) => {
            console.log(result);
            if (result.rows[0].sum === null) {  
                const msg = encodeURIComponent(0)
                res.redirect('/cart/?success=' + msg);
            }
            if (result.rows[0].sum > saldo) {
                const msg = encodeURIComponent(1)
                res.redirect('/cart/?success=' + msg);
            }else{

                var total = saldo - result.rows[0].sum
                client.query(`UPDATE transaction SET status_transaction = ${true} WHERE user_id = '${user_id}'`, (err, result) => {
                    client.query(`UPDATE users SET saldo = ${total} WHERE id = ${user_id}`, (err, result) => {
                    if (err) {
                        console.log(err);
                    }
                    if (!err) {
                        res.redirect('/cart')
                    }
                });
            })
            }
    })
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
    if (req.session.eamil == null) {
        client.query(`SELECT * FROM users WHERE email = '${req.session.eamil}'`, (err, result) => {
            res.render('contact', {
                title: 'PS Store | Contact',
                email: req.session.email,
                user: 'login'
            }) 
        });
    } else {
        client.query(`SELECT * FROM users WHERE email = '${req.session.eamil}'`, (err, result) => {
            res.render('contact', {
                title: 'PS Store | Contact',
                email: req.session.email,
                user: result.rows[0].name
            })
        });
    }
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
                                title: 'PS Store | Product',
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
                    title: "PS Store | Form Update",
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
            title: 'PS Store | Form',
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
                title: 'PS Store | Custumers',
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
            title: 'PS Store | Custumers',
            msg: msg
        })
    }
});

route.post('/custumer/saldo', function (req, res) {
    const id = req.body.id;
    const saldo = req.body.saldo;
    console.log(
        id,
        saldo
    );
    client.query(`UPDATE users SET saldo = ${saldo} WHERE id = ${id}`, (err, result) => {
        if (!err) {
            // const msg = encodeURIComponent(1);
            res.redirect('/custumer')
        }
        if (err) {
            console.log(err);
            // const msg = encodeURIComponent(0);
            res.redirect('/custumer')
        }
    });
});

route.get('/custemer/getdata/:id', (req, res) =>{
    client.query(`SELECT * FROM users WHERE id= ${req.params.id}`, (err, result) =>{
        if (!err) {
            res.send(result.rows[0]);
        }
        if (err) {
            console.log(err);
        }
    });
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
            title: 'PS Store | Custumers',
            msg: 0
        })
    }
    client.query(`SELECT * FROM users WHERE email = '${email}'`, (err, result) => {
        if (err) {
            console.log(err);
        }
        if (result.rowCount > 0) {
            res.render('from-add-custumer', {
                title: 'PS Store | Custumers',
                msg: 0
            });
        } else {
            let hash = bcrypt.hashSync(password, 10);
            console.log(hash);
            client.query(`INSERT INTO users(name , email, password) VALUES ('${name}','${email}','${hash}') `, (err, result) => {
                if (err) {
                    console.log(err);
                }
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
    client.query(`DELETE FROM transaction WHERE user_id = ${id}`, (err, result) => {  
    client.query(`DELETE FROM users WHERE id = ${id}`, (err, result) => {
        if (err) {
            console.log(err)
        }
        if (!err) {
            const msg = encodeURIComponent(1);
            res.redirect('/custumer/?success=' + msg)
        }

    });
  })
});
route.get('/customer/form/update/:id', (req, res) => {
    const id = req.params.id;
    client.query(`SELECT * FROM users WHERE id = ${id}`, (err, result) => {
        if (!err) {
            const msg = req.query.success;
            res.render('form-update-custumer', {
                data: result.rows[0],
                title: 'PS Store | Form Update',
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