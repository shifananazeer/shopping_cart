const express = require('express');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const session = require('express-session');
const flash = require('connect-flash');
const helpers = require('./hbsHelpers')
const path = require('path');
const passport = require('./config/passport');
const connectDB = require('./config/db');
const MongoStore = require('connect-mongo');



const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');



require('dotenv').config();

// Initialize Express app
const app = express();

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const MONGODB_URI = process.env.MONGODB_URL

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret', 
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    collectionName: 'sessions',
  }),
  cookie: {
    maxAge: 72 * 60 * 60 * 1000, // 72 hours
    httpOnly: true,
    sameSite: 'strict',
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());



// View engine setup
app.engine('hbs', exphbs.engine({
  extname: '.hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views', 'layout'), 
  partialsDir: path.join(__dirname, 'views', 'partials'), 
  helpers: helpers ,
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
// Static files
app.use(express.static('public'));

// Connect to MongoDB
connectDB();

// Routes
app.use('/', userRouter);
app.use('/admin', adminRouter);


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
