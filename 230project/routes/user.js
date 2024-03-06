var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");


router.post("/register", function(req, res, next) {
  const email = req.body.email
  const password = req.body.password

  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed"
    })
    return
  } else if(email.length == 0 || password.length == 0){
    res.status(401).json({
      error: true,
      message: "Incorrect email or password"
    })
    return;
  }  

  
  const queryUser = req.db.from("user").select("*").where("email", "=", email)
  queryUser
    .then((user) => {
      if (user.length > 0){
        res.status(409).json({ success: true, message: "User already exists"})
        return
      } else if (user.length <= 0){
        res.status(201).json({ success: true, message: "User created"})
      }
      
      const saltRounds = 10
      const hash = bcrypt.hashSync(password, saltRounds)
      return req.db.from("user").insert({ email, hash })
    })
    
})
router.post("/login", function(req, res, next) {
  const email = req.body.email
  const password = req.body.password

  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete, both email and password are required"
    })
    return
  }
  
  const queryUser = req.db.from("user").select('*').where("email", "=", email)
  queryUser
    .then((user) => {
      if (user.length == 0){
        res.status(401).json({
          error: true,
          message: "Incorrect email or pa111ssword"
        })
        return;
      }

      const user1 = user[0]
      return bcrypt.compare(password, user1.hash)
      
    })
    .then((match) => {
      if (!match) {
        res.status(401).json({
          error: true,
          message: "Incorrect email or password"
        })
        return
      }else if(match){
        const secretKey = "secret key"
        const expires_in = 60 * 60 * 24
        const exp = Date.now() + expires_in * 1000
        const token = jwt.sign({ email, exp }, secretKey)
        return res.status(200).json({ token_type : "Bearer", token, expires_in})
      }
    })
})


router.post("/:email/profile", function(req, res) {
  const email = {email: req.params.email}
  const firstName = { firstName: req.body.firstName }
  const lastName = { lastName: req.body.lastName }
  const dob = { dob: req.body.dob }
  const address = { address: req.body.address }
  req.db.from("user").where(email).update(firstName, lastName, dob, address)
  
  .then(function()  {
      // res.status(201).json({ email: req.params.email })
      req.db.from('user').select('*').where('email', '=', email)
      .then((rows) => {res.json(rows)})
  })
  .catch((err) => {
    console.log(err)
    res.status(500).json({ Message: 'Database error - not updated' })
  })
})
module.exports = router;