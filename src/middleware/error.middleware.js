/* 
  This is an Express.js error-handling middleware. Express identifies it as an error handler because 
  it takes 4 parameters (err, req, res, next).
*/
const errorMiddleware = (err, req, res, next) => {
    try {
        /*
          Object spreading — it unpacks all the own enumerable properties of err into a new 
          plain object
        */
        let error = { ...err };

        // Since message is a non-enumerable property so spread operator misses it, therefore 
        // it needs to manually copied
        error.message = err.message;

        console.log(err);

        // A CastError happens when Mongoose can't cast a value to the expected type — most commonly when 
        // an invalid MongoDB ObjectId is passed in a URL (e.g. /users/not-a-valid-id). This converts that 
        // low-level DB error into a clean 404 response.
        if (err.name === 'CastError') {
            const message = 'Resource not found';
            error = new Error(message);
            error.statusCode = 404;
        }

        // Mongoose duplicate key
        if (err.code === 11000) {
            const message = 'Duplicate field value entered';
            error = new Error(message);
            error.statusCode = 400;
        }

        res.status(error.statusCode || 500).json({ success: false, error: error.message || 'Server Error ' });
    }
    catch (error) {
        next(error);
    }
};

module.exports = errorMiddleware;