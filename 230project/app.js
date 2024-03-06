var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require("dotenv").config();

const options = require('./knexfile.js'); 
const knex = require('knex')(options);

const helmet = require('helmet');
const cors = require('cors');
const { normalize } = require('path');

var app = express();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/user');

const swaggerUI = require('swagger-ui-express');  
const swaggerDocument =  require('./docs/swagger.json'); 

app.use(logger('common'));
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

logger.token('req', (req, res ) => JSON  .stringify(req .headers)) 
logger.token('res', (req, res ) => {   
  const headers = {}   
  res.getHeaderNames().map(h => headers[h] = res.getHeader(h))   
  return JSON  .stringify(headers) 
})

app.use((req, res, next) => {
  req.db = knex   
  next() 
})
app.get('/knex', function(req,res,next) {
  req.db.raw("SELECT VERSION()").then(
    (version) => console.log((version[0][0]))
  ). catch((err) => {console.log(err); throw err })
  res.send("Version Logged successfully");  
});
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument)) 



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(443));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');



module.exports = app;