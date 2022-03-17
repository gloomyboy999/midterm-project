const express = require('express');
const db = require('./../modules/db_connect2');

const router = express.Router();


router.post('/add', async (req, res) => {
    req.session.cart = req.session.cart || [];
    // req.body.id // 產品的 PK
    // req.body.qty // 數量

    const { id, sel1, sel2, qty } = req.body;
    // console.log(req.body);

    // 先判斷之前有沒有加過
    let addedBefore = false;
    req.session.cart.forEach(item => {
        if (item.id == id && item.sel1 == sel1 && item.sel2 == sel2) {
            addedBefore = true;
            item.qty += +qty;
        }
    });
    if (!addedBefore) {
        req.session.cart.push({ id: id, sel1, sel2, qty: +qty })
    }

    res.json(req.session.cart);

});

// 將select中 index 的值轉換成字串
const toSel1String = sel1 => {
    switch (sel1) {
        case '1':
            return '正常';
        case '2':
            return '半糖';
        case '3':
            return '微糖';
        case '4':
            return '一分糖';
        case '5':
            return '無糖';
        // 沒有選擇的話, 顯示為預設值
        default:
            return '正常';
    }
};
const toSel2String = sel2 => {
    switch (sel2) {
        case '1':
            return '正常';
        case '2':
            return '少冰';
        case '3':
            return '微冰';
        case '3':
            return '去冰';
        case '4':
            return '溫熱';
        // 沒有選擇的話, 顯示為預設值
        default:
            return '正常';
    }
};
// 購物車
router.get('/', async (req, res) => {
    res.locals.pageName = 'cart';
    let cart = []; // 將 name, price, 糖度選項(sel1) & 冰量選項(sel2)加入 cart 的空清單裡
    let rows = []; // 以各id 為值, 抓取出資料庫中 name & price 的資料
    let ids = []; // 要以各品項 id 作為判斷依據, 所以先將各品項中的 id 加入到空清單中
    for (let i of req.session.cart || []) {
        if (!ids.includes(`${i.id}`))
            ids.push(`${i.id}`)
    };
    console.log(ids);

    // 判斷如果 ids 清單中有值的話才會從資料庫中抓取資料
    if (ids.length > 0) {
        // 原本 ${ids} 的值為 D007,A001,B004,C002
        // 要轉換成 'D007','A001','B004','C002'

        // 方法一:
        // const inid = ids.map(id=>`'${id}'`);
        //const sql = `SELECT * FROM products where id in ( ${inid} )`;

        // 透過 sql 語法, 值給 ? 系統會自動加入'', 再用[] 即可變成字串
        const sql = `SELECT * FROM products where id in ( ? )`;
        // console.log(sql);
        [rows] = await db.query(sql, [ids]);

        for (let i of req.session.cart) {
            console.log(i);
            // let row = rows.find(r=>r.id==i.id);
            let row = null;
            for (r of rows) {
                if (r.id == i.id) {
                    row = r;
                    break;
                }
            };
            console.log(row);
            cart.push({
                id: row.id,
                name: row.name,
                price: row.price,
                qty: i.qty,
                sel1: i.sel1,
                sel2: i.sel2,
                sel1Text: toSel1String(i.sel1),
                sel2Text: toSel2String(i.sel2)
            });
        };
    };
    // console.log({ rows: cart });
    res.render('cart', { rows: cart });
});


router.post('/del', async (req, res)=>{
    req.session.cart = req.session.cart || [];
    // req.body.id // 產品的 PK

    const {id, sel1, sel2, qty} = req.body;
    
    const ar = [...req.session.cart];
    // 把項目裡 id 和傳入的 id 相同時, 代表是不要的項目
    req.session.cart = ar.filter(el=> !(el.id==id && el.sel1==sel1 && el.sel2==sel2));

    res.json(req.session.cart);

});

router.post('/set', async (req, res)=>{
    req.session.cart = req.session.cart || [];
    // req.body.id // 產品的 PK
    // req.body.qty // 數量

    const {id, sel1, sel2, qty} = req.body;
    // TODO: 檢查有沒有這個產品

    // 先判斷之前有沒有加過
    let addedBefore = false;
    req.session.cart.forEach(item=>{
        if(item.id == id && item.sel1 == sel1 && item.sel2 == sel2){
            addedBefore = true;
            item.qty = +qty;
        }
    });
    if(!addedBefore){
        req.session.cart.push({ id: id, sel1, sel2, qty: +qty })
    }
    
    res.json(req.session.cart);

});

// 清空購物車
router.get('/clear', (req, res) => {
    req.session.cart = [];
    res.json(req.session.cart);
});


module.exports = router;
