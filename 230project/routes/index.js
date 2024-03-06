const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");

router.get("/rankings", function (req, res, next) {
  let year = req.query.year;
  let country = req.query.country;
  let name = req.query.name;
  a = req.db.select('rank', 'country', 'score', 'year').from('rankings').orderBy('year', 'desc')
  if (country != null && /\d/.test(country)) {
    res.status(400).json({ error: true, message: "Invalid country format. Country query parameter cannot contain numbers." })
  }else if (name != null) {
    res.status(400).send({ "error": true, "message": "Bad Request" })
  } else if (year == null && country == null) {
    a.then((rows) => {res.json(rows)})
    .catch((err) => {res.json({ "error": true, "message": "Error in MySQL query" })})

  } else if (year != null && country != null) {
    a.where('year','=', year).where('country','=', country)
    .then((rows) => {
      if (rows.length == 0) {
        res.status(400).json({ error: true, message: "Bad Request" })
      } else{
        {res.json(rows)}
      }
    })
  } else if (year != null) {
    a.where('year', year)
    .then((rows) => {
      if (isNaN(year)) {
        res.status(400).json({ error: true, message: "Bad Request" })
      } else {
        res.json(rows)
      }
    })
  } else if (country != null) {
    a.where('country', country)
    .then((rows) => {res.json(rows)})
  }
});

router.get ("/countries",function(req, res, next) {
  req.db.from('rankings').select('country').distinct('country').pluck('country').orderBy('country')
    .then((rows) => {res.json(rows)})
    .catch((err) => {res.json({"Error": true, "message": "Invalid query parameters. Query parameters are not permitted."})})
});

const authorize = (req, res, next) => {
  const authorization = req.headers.authorization
  let token = null

  if (authorization && authorization.split(" ").length == 2) {
    token = authorization.split(" ")[1]
    console.log("Token: ", token)
  } else {
    console.log("Unauthorized user")
    res.status(401).json({error: true, Message: "Authorization header ('Bearer token') not found"}) 
    return
  }

  try {
    const secretKey = "secret key"
    const decoded = jwt.verify(token, secretKey)

    if (decoded.exp < Date.now()){
      console.log("Token has expired")
      res.status(401).json({error: true, Message: "Token has expired"}) 
      return
    }

    next()
  } catch (err) {
    console.log("Token is not valid: ", err)
    res.status(401).json({error: true, Message: "Token is not valid: "}) 
  }
}

router.get("/factors/:year", authorize, function (req, res, next) {
  let year = req.params.year;
  let limit = req.query.limit;
  let country = req.query.country;
  a = req.db.from('rankings').select('rank', 'country', 'score', 'economy', 'family', 'health', 'freedom', 'generosity', 'trust').where('year', '=', year)
  if (year.length != 4) {
    res.status(401).json({ error: true, message: "Invalid year format. Format must be yyyy" })
  } 
  else if (limit == null && country == null) {
    a.then((rows) => {
      if (/\d/.test(year)) {
        res.status(401).json({ error: true, message: "Bad Request" })
      } else {
        res.json(rows)
      }
    })
  } else if (limit != null && country != null) {
    a.where('country', '=',country).limit(limit)
    a.then((rows) => {
      if (/\d/.test(limit) || (!(/\d/.test(country)))) {
        res.status(401).json({ error: true, message: "Bad Request" })
      } else {
        res.json(rows)
      }
    })
  } else if (limit == null && country != null) {
    a.where('country', '=',country)
    a.then((rows) => {
      if (!(/\d/.test(country))) {
        res.status(401).json({ error: true, message: "Bad Request" })
      } else {
        res.json(rows)
      }
    })
  } else if (limit != null && country == null) {
    a.limit(limit)
    a.then((rows) => {
      if (/\d/.test(limit)) {
        res.status(401).json({ error: true, message: "Bad Request" })
      } else {
        res.json(rows)
      }
    })
  }
});




module.exports = router;