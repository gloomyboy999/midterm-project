require('dotenv').config();

const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const session = require('express-session');
const MysqlStore = require('express-mysql-session')(session);
const saltRounds = 10
const db = require('./modules/db_connect2');
const sessionStore = new MysqlStore({}, db);

process.env.MODE = process.env.MODE || 'development';
console.log('process.env.MODE:', process.env.MODE);

const app = express();

app.set('view engine', 'ejs');

// Top level middlewares
app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: 'sdfgdsf456456456YIOIUOIUOf',
    // store: sessionStore,
    cookie: {
        maxAge: 1800000
    }
}));

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static('public'));

app.use((req, res, next)=>{
    res.locals.title = '我的網站';
    res.locals.member = req.session.member || {};
    res.locals.user = req.session.user || '';
    res.locals.pageName = '';
    // 處理 navbar count function
    let cart = req.session.cart || [];
    let cartTotal = 0;
    cart.forEach(item => { 
        cartTotal += item.qty;
    });
    res.locals.cartTotal = cartTotal;
    // 此功能目前尚未用到
    // res.locals.toDateString = d => moment(d).format('YYYY-MM-DD');

    next();
});

app.get('/', (req, res)=>{
    res.locals.pageName = 'home';

    res.locals.title = res.locals.title ? ('首頁 - ' + res.locals.title) : '首頁';
    res.render('home', { name: 'Welcome'});
    // res.sendFile('./public/index_html');
});


app.get('/product-list', async (req, res)=>{
    res.locals.pageName = 'product-list';

    const perPage = 5; // 每頁有幾筆
    let rows = []; // 該頁的資料, 預設為空陣列

    let page = req.query.page ? parseInt(req.query.page) : 1;

    // 處理 page 超出範圍
    if(page<1 || !page){
        return res.redirect('?page=1');
    }

    const [rs] = await db.query(`SELECT COUNT(1) num FROM products`);
    const totalRows = rs[0].num; // 總筆數

    let totalPages = 0; // 總頁數預設值
    if(totalRows) {
        totalPages = Math.ceil(totalRows/perPage); // 計算總頁數

        // 處理 page 超出範圍
        if(page > totalPages){
            return res.redirect('?page='+totalPages);
        }


        const sql = `SELECT * FROM products ORDER BY id DESC LIMIT ${(page-1)*perPage}, ${perPage}`;

        [rows] = await db.query(sql);
    }

    const output = {
        perPage,
        page,
        totalRows,
        totalPages,
        rows,
    };

    res.render('product-list', output);

});


app.get('/login', (req, res)=>{
    // console.log('come_from:', req.session.come_from);
    // console.log('referer:', req.get('Referer'));
    res.render('login');
});


app.post('/login', async (req, res)=>{
    const output = {
        success : false,
        error: '帳號或密碼錯誤',
    };
    if(!req.body.account || !req.body.password){
        output.error = '沒有帳號或密碼';
        return res.json(output);
    }
    const sql = "SELECT * FROM users WHERE account=?";
    const [rs] = await db.query(sql, [req.body.account]);
    if(! rs.length){
        return res.json(output);
    }

    const pr = await bcrypt.compare(req.body.password, rs[0].password);
    if(pr){
        output.success = true;
        output.error = '';
        req.session.user = req.body.account;
    }
    res.json(output);
});

app.get('/logout', async (req, res)=>{
    delete req.session.user;
    // await req.session.destroy();
    res.redirect('/');  // 頁面轉向
});

app.get('/register', (req, res)=>{
    res.render('register');
});

app.post('/register', async (req, res)=>{
    const output = {
        success: true, // 原本為false
        error: '',
        results: null,
        body: req.body, 
    };

    // TODO: 欄位資料的檢查

    const pass_hash = await bcrypt.hash(req.body.password,saltRounds)
    const sql = "INSERT INTO `users`(`account`, `password`) VALUES (?, ?)";
    const [results] = await db.query(sql, [
        req.body.account,
        pass_hash,
    ]);

    output.results = results;

    // if(results.affectedRows){
    //     output.success = true;
    //     output.insertId = results.insertId;
    // }

    res.json(output);
});


app.use('/cart', require('./routes/cart'));


// 放在所有路由的後面
app.use((req, res)=>{
    res.status(404).send('<h1>找不到頁面</h1>');
});


app.listen(3003, ()=>{
    console.log('server started:', new Date().toString());
});
