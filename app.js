const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const port = 7000;
const path = require('path');
const  {flash} = require('express-flash-message');
const app = express();
const indexRoute = require('./router/user')
const expressLayouts = require('express-ejs-layouts');



app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));
// app.use(expressLayouts);
app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, './view'))
app.set('view engine' , 'ejs');
app.use(express.json())
app.use(bodyParser.urlencoded({extended: false}));



app.use('/', indexRoute);


app.listen(port,(err) => {
    if (err) {
     throw err;
    }else{
        console.log("app listen in port " + port);
    }
});

    



