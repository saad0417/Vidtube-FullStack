const asyncHandler = (requestHandler) => (req, res, next) => {
        Promise.resolve(requestHandler(req,res,next))
        .catch((err) => next(err));
};

export {asyncHandler}

// A higher-order function is a function that accepts another function as an argument
// or returns another function.

// const asyncHandler = (fn) => async (req, res, next) => {
//     try 
//     {
//         await fn(req, res, next)
//     } 
//     catch(error) 
//     {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }