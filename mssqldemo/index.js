import express, { response } from 'express'
import ejs from 'ejs'
import sql from 'mssql'
import session from 'express-session'
import { randomUUID } from 'crypto'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import fileUpload from 'express-fileupload';

import region from './public/assets/region.json' assert { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json())
app.use(express.urlencoded())
app.use(session({
  secret: 'test-cert',
  saveUninitialized: false,
  resave: true,
}))
app.use(fileUpload());
app.use('/public', express.static(__dirname + '/public'))
app.use('/upload', express.static(__dirname + '/upload'))

// view engine setup
// app.engine('ejs', ejs.__express);
app.set('views', './view')
app.set('view engine', 'ejs')

const PORT = process.env.PORT || 3000
// set this flag to true to skip user authentication
const DEBUG = false

const sqlConfig = {
  user: 'sa',
  password: 'bdi89uwe31gdi121uy@7!#!@',
  database: 'project',
  server: 'localhost',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false, // for azure
    trustServerCertificate: false // change to true for local dev / self-signed certs
  }
}

sql.on('error', err => {
  console.log(err)
})

const auth = (req, res, next) => {
  if (DEBUG) {
    next()
  } else {
    // check for user credential...
    if (req.session.user || req.session.rId) {
      console.log('authenticated', req.url)
      next()
    } else {
      console.log('not authenticated')
      return res.redirect('/login')
    }
  }
}

const authAPI = (req, res, next) => {
  if (DEBUG) {
    next()
  } else {
    // check for user credential...
    if (req.session.user || req.session.rId) {
      console.log('authenticated', req.url)
      next()
    } else {
      console.log('not authenticated')
      return res.json({ error: 'not authenticated' })
    }
  }
}

const authManager = (req, res, next) => {
  if (DEBUG) {
    next()
  } else {
    // check for user credential...
    if (req.session.rId) {
      console.log('manager authenticated', req.url)
      next()
    } else {
      console.log('not authenticated')
      return res.redirect('/login')
    }
  }
}

app.use((req, res, next) => {
  // req.con = sql
  next()
})

app.get('/login', async (req, res) => {
  if (req.session.user) {
    res.redirect('/product')
    return
  }
  if (req.session.rId) {
    res.redirect('/manager')
    return
  }
  res.render('login')
})
app.post('/login', async (req, res) => {

  const username = req.body.email
  const password = req.body.password
  console.log(username, password)

  try {
    let pool = await sql.connect(sqlConfig)

    let result = await pool.request()
      .input('username', sql.VarChar, username)
      .input('password', sql.VarChar, password)
      .query('SELECT * FROM [Member] WHERE mEmail = @username AND mPassword = @password')

    console.log(result.recordset)
    if (result.recordset.length > 0) {
      req.session.user = username
      //req.session.region = result.recordset[0].mRegion
      res.redirect('/product')
      return
    } else {

      let manager = await pool.request()
        .input('email', sql.VarChar, username)
        .input('password', sql.VarChar, password)
        .query('SELECT rId FROM Restaurant WHERE email = @email AND password = @password')
      console.log(manager)
      if (manager.recordset.length > 0) {
        req.session.rId = manager.recordset[0].rId
        res.redirect('/manager')
        return
      }

      // to pass data to ejs file, add the second parameter: { data: result.recordset }
      res.render('login', { loginSuccess: false })
      return
    }
  } catch (err) {
    console.log(err)
  }
})
app.get('/logout', auth, (req, res) => {
  req.session.destroy(() => {
    console.log('session destroyed')
    res.redirect('/login')
  })
})
app.get('/register', async (req, res) => {
  res.render('register', { data: {}, invaild: {} }) //拿掉region: region,
})
app.post('/register', async (req, res) => {
  try {
    const body = req.body
    console.log(body)

    let pool = await sql.connect(sqlConfig)
    const members = await pool.request()
      .input('email', sql.VarChar, body.email)
      .query('SELECT mEmail FROM Member WHERE mEmail = @email')
    console.log(members)

    // member already existed
    if (members.recordset.length > 0) {
      res.render('register', { data: body, invaild: { email: 'email' } })
      return
    }

    // member need add to db
    const birthday = (body.birthday == '') ? null : body.birthday

    const newMember = await pool.request()
      .input('mEmail', sql.VarChar, body.email)
      .input('mPassword', sql.VarChar, body.password)
      .input('birthday', sql.Date, birthday)
      //.input('mRegion', sql.NVarChar, body.region)
      .input('mName', sql.NVarChar, body.name)
      .input('mAddress', sql.VarChar, body.address) //加住址
      .query('INSERT INTO Member(mEmail, mPassword, birthday, mName, mAddress)' +
        ' VALUES(@mEmail, @mPassword, @birthday, @mName, @mAddress);')

    console.log("result: ", newMember)

    if (newMember.rowsAffected[0] > 0) {
      // insert ok
      req.session.user = body.email
      //req.session.region = body.region

      res.redirect('/product')
      return
    } else {
      res.render('register', { data: body, invaild: {} })
    }

  } catch (err) {
    res.send('ERROR: ' + err)
  }
})

// HTTP request handler
// For front-end
app.get('/member', auth, async (req, res) => {
  const email = req.session.user

  res.render('member/member')
})

// restaurant
app.get('/', auth, async (req, res) => {
  const body = req.body

  try {
    const pool = await sql.connect(sqlConfig)
    var result

    if (body.q) {
      result = await pool.request()
        .input('region', req.session.region)
        .input('query', body.q)
        .query("SELECT * FROM Restaurant WHERE rRegion = @region AND rName LIKE '%@query%'")
    } else {
      result = await pool.query(`SELECT * FROM Restaurant WHERE rRegion = '${req.session.region}'`)
    }

    res.render('restaurant/restaurant', { data: result.recordset })
  } catch (err) {
    res.send(err)
  }
})

//product
app.get('/product', auth, async (req, res) => {
  const body = req.body

  try {
    //const { rId } = req.params
    const pool = await sql.connect(sqlConfig)
    const result = await pool.request()
      .query('SELECT * FROM Product WHERE pCount IS NULL OR pCount >= 0')
    res.render('product', { data: result.recordset })
  } catch (err) {
    res.send('ERROR: ' + err)
  }
})

app.get('/checkout', async (req, res) => {
  const oId = randomUUID()
  const mId = req.session.user
  const date = new Date()

  try {
    const pool = await sql.connect(sqlConfig)

    const cart = await pool.request()
      .input('mId', sql.VarChar, mId)
      .query("SELECT c.price, c.unitPrice, c.count, c.pId, p.pName, m.mAddress FROM Cart c, Product p, Member m WHERE c.mId = @mId AND m.mEmail = @mId AND c.pId = p.pId AND c.oId IS NULL")
    
    //// no product inside cart
    // if (cart.recordset.length == 0) {
    //   res.render('error', { message: "Your cart is empty." });
    //   return
    // }
    if (cart.recordset.length == 0) {
      const pool = await sql.connect(sqlConfig)
      const result = await pool.request()
        .query('SELECT * FROM Product WHERE pCount IS NULL OR pCount >= 0')
      res.render('product', { 
          data: result.recordset,
          message: "Your cart is empty.", 
          errorType: "emptyCart" 
      });
      return;
    }

    let total = 0
    for (const item of cart.recordset) {
      total += item.price
    }

    const product = await pool.request()
      .input('pId', sql.Char, cart.recordset[0].pId)
      .query('SELECT unitPrice, rId FROM Product WHERE pId = @pId')
    
    const rId = product.recordset[0].rId

    const order = await pool.request()
      .input('oId', sql.Char, oId)
      .input('oDate', sql.Date, date)
      .input('total', sql.Int, total)
      .input('mId', sql.VarChar, mId)
      .input('rId', sql.Char, rId)
      .query("INSERT INTO [Order](oId, oDate, total, mId, rId) VALUES(@oId, @oDate, @total, @mId, @rId)")

    const cart_update = await pool.request()
      .input('oId', sql.Char, oId)
      .input('mId', sql.VarChar, mId)
      .query("UPDATE Cart SET oId = @oId WHERE mId = @mId AND oId IS NULL")
    
    if (cart_update.rowsAffected[0] > 0) {
      //res.send("RESULT: OK")
      //return
      console.log(123)
      res.render('checkout', { data: cart.recordset, oId: oId, total: total } )
    }

  } catch (err) {
    console.log(err)
    res.json({error: err})
  }
})

// API

app.get('/api/email_validation/:email', async (req, res) => {
  const { email } = req.params

  try {
    let pool = await sql.connect(sqlConfig)
    const members = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT mEmail FROM Member WHERE mEmail = @email')
    console.log(members)

    // member already existed
    if (members.recordset.length > 0) {
      res.json({ result: 'account-existed' })
      return
    } else {
      res.json({ result: 'ok' })
      return
    }
  } catch (err) {
    res.send('ERROR: ' + err)
  }
})

// app.get('switch_region/:r', authAPI, async (req, res) => {
//   const region = req.params.r
//   req.session.region = region


// })

app.get('/api/restaurant/:q?', authAPI, async (req, res) => {
  const { q } = req.params

  try {
    const pool = await sql.connect(sqlConfig)

    let query = ''
    let request = pool.request()
    // request.input('region', req.session.region)
    // if (req.params.q) {
    //   request.input('q', req.params.q)
    //   query = "SELECT * FROM Restaurant WHERE rRegion = @region AND rName LIKE '%' +@q + '%'"
    // } else {
    //   query = "SELECT * FROM Restaurant WHERE rRegion = @region"
    // }

    const result = await request.query(query)
    res.json(result.recordset)
  } catch (err) {
    res.json({ error: err })
  }
})
app.get('/api/product/:q?', authAPI, async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig)

    let query = ''
    let request = pool.request()
    //request.input('rId', req.params.rId)
    if (req.params.q) {
      request.input('q', req.params.q)
      query = "SELECT * FROM Product WHERE pName LIKE '%' + @q + '%' AND (pCount IS NULL OR pCount >= 0)"
    } else {
      query = "SELECT * FROM Product WHERE pCount IS NULL OR pCount >= 0"
    }

    const result = await request.query(query)
    res.json(result.recordset)
  } catch (err) {
    res.json({ error: err })
  }
})

//**** */select cart
app.get('/api/cart', authAPI, async (req, res) => {
  const mId = req.session.user
  console.log(mId)
  try {
    const pool = await sql.connect(sqlConfig)
    const result = await pool.request()
      .input('mId', sql.VarChar, mId)
      .query("SELECT * FROM Cart, Product WHERE mId = @mId AND oId IS NULL AND Cart.pId = Product.pId")
    console.log(result)
    if (result.recordset.length == 0) {
      res.json({ cart: [], total: 0 })
      return
    }

    let total = 0
    for (const row of result.recordset)
      total += row.price

    console.log("show cart:", result)
    res.json({ cart: result.recordset, total: total })
    return
  } catch (err) {
    console.log(err)
  }
  // res.render('cart', {cartData : result})

})
// select (update) cart
app.get('/api/cart/add/:pId/:count', authAPI, async (req, res) => {
  const { pId, count } = req.params
  const mId = req.session.user
  const cTime = new Date()

  try {
    const pool = await sql.connect(sqlConfig)

    const c = await pool.request()
      .input('pId', sql.Char, pId)
      .query('SELECT unitPrice, rId FROM Product WHERE pId = @pId AND (pCount >= 0 OR pCount IS NULL)') //pCount = NULL?
    
    if (c.recordset.length == 0) {
      res.json({error: "商品不存在"})
      return
    }

    const product = c.recordset[0]
    const unitPrice = product.unitPrice
    const price = count * unitPrice

    // // check products in cart is from the same restaurant
    // const check = await pool.request()
    //   .input('rId', sql.Char, product.rId)
    //   .query(`SELECT rId FROM Cart, Product WHERE Cart.mId = '${mId}' AND oId IS NULL AND Cart.pId = Product.pId`)

    // console.log(check.recordset)
    
    // if (check.recordset.length > 0 && check.recordset[0].rId != product.rId) {
    //   res.json({error: "購物車中有來自其他餐廳的商品，請先刪除。"})
    //   return
    // }

    //
    const result = await pool.request()
      .input('pId', sql.Char, pId)
      .input('count', sql.Int, count)
      .input('mId', sql.VarChar, mId)
      .input('cTime', sql.DateTime, cTime)
      .input('unitPrice' , sql.Int , unitPrice)
      .input('price', sql.Int, price)
      .query("INSERT INTO Cart(mId,cTime,count,unitPrice,price,pId) VALUES(@mId,@cTime,@count,@unitPrice,@price,@pId)")
    res.json({ result: 'ok', count: count })
  } catch (err) {
    console.log(err)
    res.json({ error: err })
  }
})

app.get('/api/cart/delete/:cTime', authAPI, async (req, res) => {
  const { cTime } = req.params
  const mId = req.session.user

  try {
    const pool = await sql.connect(sqlConfig)

    const result = await pool.request()
      .input('mId', sql.VarChar, mId)
      .input('cTime', sql.DateTime, cTime)
      .query(`DELETE Cart WHERE mId = '${mId}' AND cTime = @cTime`)

    console.log(result)
    if (result.rowsAffected[0] > 0) {
      res.json({ result: 'ok' })
      return
    }

  } catch (err) {
    console.log(err)
    res.json({ error: err })
  }
})

//根據分類名稱獲取產品
app.get('/api/products/:category?', authAPI, async (req, res) => {
  const category = req.params.category;

  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('category', sql.VarChar, category)
      .query('SELECT * FROM Product WHERE Category = @category');
      res.json(result.recordset)
  } catch (err) {
    res.status(500).send('Error fetching products: ' + err.message);
  }
});


// For Manager use only

app.get('/manager', authManager, async (req, res) => {
  try {
    const { rId } = req.session
    const pool = await sql.connect(sqlConfig)
    const result = await pool.request()
      .input('rId', rId)
      .query('SELECT * FROM Product WHERE rId = @rId AND (pCount >= 0 OR pCount IS NULL)')
    res.render('manager', { data: result.recordset, rId: rId })
  } catch (err) {
    res.send('ERROR: ' + err)
  }
})

app.get("/manager/order", authManager, async (req, res) => {
  const rId = req.session.rId

  try {
    const pool = await sql.connect(sqlConfig)
    const result = await pool.request()
      .input('rId', sql.Char, rId)
      .query(`
        SELECT * FROM [Order]
        INNER JOIN Member ON [Order].mId = Member.mEmail
        WHERE [Order].rId = @rId
        `
      )
    const data = result.recordset.map(x => ({
      ...x,
      oDate: x.oDate.toISOString().split('T')[0]
    }))

    res.render('manager/manager', { data, rId })
  } catch (err) {
    res.send('ERROR: ' + err)
  }
})

app.get('/manager/product/add', authManager, async (req, res) => {
  try {
    const rId = req.session.rId
    res.render('manager/product/add', { data: {}, invaild: {} })
  } catch (err) {
    res.send('ERROR: ' + err)
  }
})

app.post('/manager/product/add', authManager, async (req, res) => {
  const { rId } = req.session
  const body = req.body
  console.log(body)
  const count = (body.count == '') ? null : body.count
  const pId = randomUUID();

  const image = req.files.image;
  let filename = null;

  if (image) {
    const ext = image.name.split('.').pop();
    filename = `${pId}.${ext}`;
    const uploadPath = `${__dirname}/upload/${filename}`;  
    image.mv(uploadPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }

  try {
    const pool = await sql.connect(sqlConfig)
    const result = await pool.request()
      .input('pId', sql.Char, pId)
      .input('count', sql.Int, count)
      .input('unitPrice', sql.VarChar, body.unitPrice)
      .input('name', sql.NVarChar, body.name)
      .input('rId', sql.Char, rId)
      .input('image', sql.Text, filename)
      .query('INSERT INTO Product(pId, pCount, unitPrice, pName, rId, image) ' + 'VALUES(@pId, @count, @unitPrice, @name, @rId, @image)')
    if (result.rowsAffected[0] > 0) {
      // insert ok
      res.redirect('/manager')
      return
    } else {
      res.render('manager/product/add', { data: body, invaild: {} })
    }

  } catch (err) {
    res.send('ERROR: ' + err)
  }
})

app.get('/manager/product/edit/:pId', authManager, async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig)
    const pId = req.params.pId
    const result = await pool.request()
      .input('pId', sql.Char, pId)
      .query('SELECT * FROM Product WHERE pId=@pId AND pCount >= 0')

    res.render('manager/product/edit', { data: result.recordset[0] })

  } catch (err) {
    res.json({ result: err })
  }
})

app.post('/manager/product/edit', authManager, async (req, res) => {
  const body = req.body
  const rId = req.session.rId
  const count = (body.count == '') ? null : body.count

  const image = req?.files?.image;
  let filename = req.body.prevImage || null;

  if (image) {
    const ext = image.name.split('.').pop();
    filename = `${body.pId}.${ext}`;
    const uploadPath = `${__dirname}/upload/${filename}`;  
    image.mv(uploadPath, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }

  try {
    const pool = await sql.connect(sqlConfig)
    const result = await pool.request()
      .input('pId', sql.Char, body.pId)
      .input('count', sql.Int, count)
      .input('unitPrice', sql.VarChar, body.unitPrice)
      .input('name', sql.NVarChar, body.name)
      .input('rId', sql.Char, req.session.rId)
      .input('image', sql.Text, filename)
      .query('UPDATE Product SET pCount=@count, unitPrice=@unitPrice, pName=@name, image=@image WHERE pId=@pId AND rId=@rId')

    if (result.rowsAffected[0] > 0) {
      res.redirect('/manager')
      return
    } else {
      res.redirect('/manager')
      return
    }
  } catch (err) {
    res.json({ result: err })
  }
})

app.get('/manager/product/delete/:pId', authManager, async (req, res) => {
  const pId = req.params.pId
  const rId = req.session.rId

  try {
    if (!pId || !rId) throw new Error('Invalid product or restaurant')

    const pool = await sql.connect(sqlConfig)
    const result = await pool.request()
      .input('pId', sql.Char, pId)
      .input('rId', sql.Char, rId)
      .query(`UPDATE Product SET pCount = -2 WHERE pId = @pId AND rId = @rId`)
      
    if (result.rowsAffected[0] > 0) {
      res.redirect('/manager')
      return
    } else {
      res.redirect('/manager')
      return
    }
  } catch (err) {
    res.send('Error' + err)
  }
})

app.get("/api/manager/order/detail/:oId", authManager, async (req, res) => {
  const oId = req.params.oId

  try {
    const pool = await sql.connect(sqlConfig)
    const result = await pool.request()
      .input('oId', oId)
      .query(`
        SELECT 
          [Order].oId,
          Cart.cTime,
          Product.pName,
          Cart.unitPrice,
          Cart.count,
          Cart.price
        FROM [Order]
        INNER JOIN Cart ON [Order].oId = Cart.oId
        INNER JOIN Product ON Cart.pId = Product.pId
        WHERE [Order].oId = @oId 
      `)
    res.json(result.recordset)

  } catch (err) {
    res.json({ error: err })
  }
})

app.get("/api/manager/order/complete/:oId", authManager, async (req, res) => {
  const oId = req.params.oId
  try {
    const pool = await sql.connect(sqlConfig)
    const result = await pool.request()
      .input('oId', oId)
      .query(`UPDATE [Order] SET status = 'Completed' WHERE oId = @oId`)
    
    res.json({
      result: result.rowsAffected[0] > 0 ? 'ok' : 'error'
    })

  } catch (err) {
    res.json({ error: err })
  }
})

app.get("/api/manager/order/cancel/:oId", authManager, async (req, res) => {
  const oId = req.params.oId
  try {
    const pool = await sql.connect(sqlConfig)
    const result = await pool.request()
      .input('oId', oId)
      .query(`UPDATE [Order] SET status = 'Cancelled' WHERE oId = @oId`)
    
    res.json({
      result: result.rowsAffected[0] > 0 ? 'ok' : 'error'
    })

  } catch (err) {
    res.json({ error: err })
  }
})


// Mark Start
/* 0601 test */
app.get('/dbData', async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig)
    const productData = await pool.request()
      .query('SELECT * FROM Product')
    const memberData = await pool.request()
      .query('SELECT * FROM Member')
    const restaurantData = await pool.request()
      .query('SELECT * FROM Restaurant')
    const cartData = await pool.request()
      .query('SELECT * FROM Cart')
    const orderData = await pool.request()
      .query('SELECT * FROM "Order"')
    res.render('dbData', {
      pdata: productData.recordset,
      mdata: memberData.recordset,
      rdata: restaurantData.recordset,
      cdata: cartData.recordset,
      odata: orderData.recordset,
      test1: "just a test"
    })
  } catch (err) {
    res.send('ERROR: ' + err)
  }
})
// Mark End


// start the server
app.listen(PORT, function () {
  console.log(`Running on pid ${process.pid}`)
  console.log(`Listening on PORT ${PORT}`)
})
// on abort
process.on('SIGINT', function () {
  process.exit()
})

