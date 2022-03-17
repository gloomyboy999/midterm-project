const express = require('express');

const router = express.Router();

router.get('/user/:p1?/:p2?', (req, res)=>{
    res.json({
        params: req.params,
        url: req.url,
        baseUrl: req.baseUrl,
        originalUrl: req.originalUrl,
    });
});

module.exports = router;
