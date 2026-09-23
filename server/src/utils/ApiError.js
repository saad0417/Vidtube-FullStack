// Error is the built-in class in Node.js that provides a standard way to create and handle errors.
class ApiError extends Error
{
    constructor(
        statusCode,
        message = "Something went wrong!",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors


        if(stack)
        {
            this.stack = stack
        }
        else
        {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}