const express = require('express')
const {logger} = require('./middleware/logger.js')
const Joi = require('joi')
const { default: mongoose } = require('mongoose')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const initializePassport = require('./passport/passport-config.js')
const {checkAuthenticated,checkNotAuthenticated} = require('./middleware/authentication-middleware.js')
require('dotenv').config()


// data base setup
mongoose.connect(process.env.DATABASE_URL) 
  .then(() => console.log('💽 Database connected'))
  .catch(error => console.error(error))

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password:{ type: String, required: true },
})
const User = mongoose.model('User', userSchema)

const TodoTask = require("./models/TodoTask");
const ContactForm = require("./models/ContactForm")
const { name } = require('ejs')

// app and express setup
app.set('view engine', 'ejs')
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(logger)
app.use(express.static('public'))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())



initializePassport(
  passport,
  email => User.find(user => user.email === email),
    id => User.find(user => user.id === id)
)

function validateTask(task) {
  const schema = {
    name: Joi.string().min(5).required()
  };

  return Joi.Validate(task, schema)
}

// routes
app.get('/',(req,res)=>{
  res.render('index')
});

app.get('/api/LogIn',checkNotAuthenticated, (req, res) => {
  res.render('LogIn/index')
});

app.get('/api/SignUp',checkNotAuthenticated, (req, res) => {
  res.render('SignUp/index')
});

app.get('/api/Error', (req, res) => {
  res.render('Error/index')
});

app.get('/api/AboutMe', (req, res) => {
  res.render('AboutMe/index')
});

app.get('/api/ContactForm', (req, res) => {
  res.render('ContactForm/index')
});

app.get('/api/ContactFormError', (req, res) => {
  res.render('ContactFormError/index')
});

app.get('/api/Success', (req, res) => {
  res.render('Success/index')
});

app.post('/api/ContactForm',async (req, res) => {
  const contactForm = new ContactForm({
  firstname: req.body.name,
  email: req.body.email,
  message: req.body.message
  });
  try { await contactForm.save();
  res.redirect("/api/Success");
  } 
  catch (err) {
  console.error("Error saving form data:", err);
  res.redirect("/api/ContactFormError");
  }
  });


app.get('/api/Homepage', checkAuthenticated, async (req, res) => {
 const email = req.session.user.email
 const tasks = await TodoTask.find({email: email})
  if (tasks.length>0) {
    res.render('HomePage/index', {name: req.session.user.name, todoTasks: tasks } )
  }
  else{

    res.render('HomePage/index', {name: req.session.user.name, todoTasks: [{content: 'you did not post any tasks yet! create ONE'}] } )
  }


});

// app.get('/api/search', (req,res)=> {
//   const tasks= res.send(req.query);
// })

app.post('/api/SignUp',checkNotAuthenticated, async (request, response) => {
  try {
    const hashedPassword = await bcrypt.hash(request.body.password, 10)
    const user = new User({
      name: request.body.name,
      email: request.body.email,
      password: hashedPassword
    })
    user.save()
    response.render('LogIn/index')
  }catch (error) {
    console.error(error)
    response.render('Error/index')
  }
})

app.post('/api/Logout', (req,res)=> {
  req.session.destroy()
  // req.logOut()
  res.redirect('/')
})


app.post('/api/LogIn',checkNotAuthenticated, async (req, res) => {
  const {email} = req.body
  var result
  var data
  
  try{
    data = await User.find({email : email})
    result = await bcrypt.compare(req.body.password, data[0].password)
  }
  catch(e){
    console.log(e)
  }

  if(result){
    req.session.user = {
      id: req.body.id,
      email: req.body.email,
      name:data[0].name
    };
    res.redirect('/api/HomePage')
  }
  else{
    res.redirect('/api/LogIn')
  }
})

app.post('/api/HomePage',async (req, res) => {
  const todoTask = new TodoTask({
  content: req.body.content,
  email: req.session.user.email
  });
  try { 
    await todoTask.save();
    res.redirect("/api/HomePage");
  } 
  catch (err) {
    res.redirect("/api/HomePage");
  }
  });


  //app.route("/edit/:id").get(async (req, res) => {
    //const id = req.params.id;
    //try {
      //const tasks = await TodoTask.find({});
      //res.render("HomePage/indexEdit", { todoTasks: tasks, idTask: id , name: content});
    //} catch (err) {
      //console.error(err);
      //res.status(500).send(err);
    //}
  //});


app.route("/remove/:id").get(async(req, res) => {
  const id = req.params.id;
  try {
    await TodoTask.findByIdAndDelete(id);
    res.redirect("/api/HomePage");
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});



app.listen(process.env.PORT, () => {
  console.log(`👋 Started server on port ${process.env.PORT}`)
});