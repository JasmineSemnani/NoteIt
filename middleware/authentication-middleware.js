
async function checkAuthenticated(req, res, next){ 
  if (req.session.user.email) {
       return next()
    }
  
    return res.redirect('/api/SignUp')
  }
  
  async function checkNotAuthenticated(req, res, next) {
    if ( req.isAuthenticated()) {
       return res.redirect('/api/HomePage')
    }
    return next()
  }
  
module.exports = {checkAuthenticated,checkNotAuthenticated}
