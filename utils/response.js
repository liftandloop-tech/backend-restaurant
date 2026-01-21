// const sendResponse = (res, status, message, data = null) => {
//   const response = {
//     success: status >= 200 && status < 300,
//     message,
//     ...(data !== null && { data })
//   };
const sendResponse = (res, status,message,data =null) =>{
  const response ={
    success: status >= 200 && status < 300,
    message, 
    ...(data !== null && {data})
  }

  
res.status(status).json(response);
}
const sendSuccess = (res, message, data = null, status = 200) => {
  sendResponse(res,status,message, data);
}

 const sendError = (res, message, status = 400, errors = null) => {
  const response = {
    success:false,
    message,
    ...(errors && {errors})
  };
 
  
res.status(status).json(response);
}

const response = {
  success: sendSuccess,
  error: sendError,
  send: sendResponse
}

module.exports = {sendSuccess,sendError,sendResponse,success: sendSuccess,
  error: sendError,
 send: sendResponse};
